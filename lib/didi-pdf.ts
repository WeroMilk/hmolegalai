/**
 * Genera PDF del plan nutricional DIDI: tamaño oficio, rosa/morado pastel,
 * tabla organizada (Día | Desayuno | Comida | Cena | Colación | Aprox. calorías).
 * Estilo profesional como de nutrióloga con reputación.
 */

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/** Tamaño oficio México: 216 x 340 mm. Horizontal (apaisado): 340 ancho x 216 alto para ver todo el contenido */
const OFICIO_LANDSCAPE_WIDTH = 340;
const OFICIO_LANDSCAPE_HEIGHT = 216;

/** Colores morado pastel (RGB 0-255) — todo legible y organizado */
const PASTEL = {
  purpleHead: [200, 180, 220] as [number, number, number],   // encabezado tabla
  purpleLight: [230, 220, 245] as [number, number, number], // título / bloques
  purpleRow: [240, 232, 248] as [number, number, number],    // filas tabla
  purpleRowAlt: [225, 215, 240] as [number, number, number], // filas alternas
  textDark: [45, 40, 55] as [number, number, number],
  lineLight: [200, 185, 215] as [number, number, number],
};

export interface ParsedDay {
  day: string;
  desayuno: string;
  comida: string;
  cena: string;
  colacion: string;
  totalKcal: string;
}

export interface ParsedPlan {
  patientBlock: string;
  days: ParsedDay[];
  recommendations: string;
}

const DAY_HEADERS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

function extractMeal(block: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    "[-*]\\s*\\*\\*" + escaped + "\\s*:?\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*[-*]\\s*\\*\\*|\\n##|$)",
    "i"
  );
  const m = block.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function extractTotalKcal(block: string): string {
  const m = block.match(/\*\*Total del día:\*\*\s*([^\n*]+)/i) || block.match(/Total del día:\s*([^\n]+)/i);
  return m ? m[1].trim() : "";
}

/**
 * Parsea el markdown del plan (## LUNES, - **Desayuno:**, etc.) a estructura para la tabla.
 */
/** Quita líneas de markdown (# PLAN NUTRICIONAL, ## L.N.H. ...) del bloque de paciente */
function stripMarkdownFromPatientBlock(block: string): string {
  return block
    .split("\n")
    .filter((line) => !/^\s*#+\s*/.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Etiquetas que van en negrita en datos del paciente (orden: más largas primero) */
const PATIENT_LABELS = [
  "Datos del Paciente",
  "Calorías objetivo",
  "Tipo de dieta",
  "Fecha del plan",
  "Consideraciones",
  "Nombre",
  "Estatura",
  "Sexo",
  "Peso",
  "Edad",
];

/** Parsea el bloque de paciente en pares label: valor para dibujar con etiquetas en negrita */
function parsePatientBlockToPairs(block: string): { label: string; value: string }[] {
  const text = stripMarkdownFromPatientBlock(block);
  if (!text) return [];
  const escaped = PATIENT_LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(
    "(" + escaped + "):\\s*([\\s\\S]*?)(?=\\s*(?:" + escaped + "):|$)",
    "gi"
  );
  const pairs: { label: string; value: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = m[1].trim();
    const value = (m[2] || "").trim();
    pairs.push({ label, value });
  }
  return pairs;
}

export function parsePlanContent(markdown: string): ParsedPlan {
  const raw = (markdown || "").trim();
  const patientEnd = raw.search(/\n##\s*(LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO|DOMINGO)/i);
  const patientBlock = patientEnd >= 0 ? raw.slice(0, patientEnd).trim() : raw.slice(0, 800);
  const daysSection = patientEnd >= 0 ? raw.slice(patientEnd) : "";
  const recIndex = raw.search(/\n(Recomendaciones generales|RECOMENDACIONES GENERALES)/i);
  const recommendations = recIndex >= 0 ? raw.slice(recIndex).replace(/^[^\n]+\n?/, "").trim() : "";

  const days: ParsedDay[] = [];
  const dayPattern = DAY_HEADERS.join("|").replace("Í", "Í");
  for (const dayName of DAY_HEADERS) {
    const re = new RegExp("##\\s*" + dayName.replace(/Í/g, "Í") + "\\s*\\n([\\s\\S]*?)(?=\\n##\\s*(?:" + dayPattern + ")|$)", "i");
    const m = daysSection.match(re);
    const block = m ? m[1] : "";
    const dayLabel = dayName === "MIÉRCOLES" ? "Miércoles" : dayName.charAt(0) + dayName.slice(1).toLowerCase();
    days.push({
      day: dayLabel,
      desayuno: extractMeal(block, "Desayuno") || "—",
      comida: extractMeal(block, "Comida") || "—",
      cena: extractMeal(block, "Cena") || "—",
      colacion: extractMeal(block, "Colación") || "—",
      totalKcal: extractTotalKcal(block) || "—",
    });
  }

  return { patientBlock, days, recommendations };
}

/** En modo una sola hoja no se añaden páginas; el contenido se dibuja en la única página. */
function ensureSpace(
  doc: jsPDF,
  y: number,
  pageHeight: number,
  needMm: number,
  _shortPageHeight?: number,
  singlePage?: boolean
): number {
  if (singlePage) return y;
  if (y + needMm > pageHeight - 10) {
    const h = _shortPageHeight ?? pageHeight;
    doc.addPage([OFICIO_WIDTH, h], "p");
    return 10;
  }
  return y;
}

/** Márgenes y espaciado compactos para minimizar espacio en blanco */
const MARGIN = 6;
const PAD_H = 6;
const SECTION_GAP = 2;
const CELL_PAD = 1;
const LINE_HEIGHT = 1.5;

/**
 * Dibuja todo el contenido en el doc. Hoja horizontal (oficio apaisado): pageWidth x pageHeight en mm.
 */
function drawPlanContent(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  lnh: string,
  patientBlock: string,
  days: ParsedDay[],
  recommendations: string,
  nombrePacienteForm: string,
  singlePage: boolean
): number {
  const tableWidth = pageWidth - 2 * (MARGIN + PAD_H);
  const tableMargin = (pageWidth - tableWidth) / 2;
  let y = MARGIN;

  // Encabezado compacto
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(0, 0, pageWidth, 10, "F");
  doc.setTextColor(...PASTEL.textDark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", pageWidth / 2, 5.5, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(lnh, pageWidth / 2, 9, { align: "center" });
  y = 12;

  // Cuadro de información del paciente: nombre en el título (del formulario), tabla sin Nombre ni "Datos del Paciente"
  const patientPairs = parsePatientBlockToPairs(patientBlock);
  const nombreParaTitulo = (nombrePacienteForm || "").trim() || patientPairs.find((p) => p.label.toLowerCase() === "nombre")?.value?.trim() || "";
  const pairsParaTabla = patientPairs.filter(
    (p) => p.label.toLowerCase() !== "nombre" && p.label.toLowerCase() !== "datos del paciente"
  );
  const maxPatientRows = 12;
  const patientHead = [["Dato", "Valor"]];
  const patientBody = pairsParaTabla
    .slice(0, maxPatientRows)
    .map(({ label, value }) => [label, value || "—"]);

  const tituloPaciente = nombreParaTitulo ? `Información del paciente: ${nombreParaTitulo}` : "Información del paciente";
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(tableMargin, y - 0.5, tableWidth, 2.8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(tituloPaciente, tableMargin + tableWidth / 2, y + 1.8, { align: "center" });
  y += 2.8 + SECTION_GAP;

  if (patientBody.length > 0) {
    y = ensureSpace(doc, y, pageHeight, 30, undefined, singlePage);
    autoTable(doc, {
      head: patientHead,
      body: patientBody,
      startY: y,
      margin: { left: tableMargin, right: tableMargin },
      tableWidth,
      theme: "plain",
      pageBreak: singlePage ? "avoid" : "auto",
      styles: {
        fontSize: 5,
        cellPadding: CELL_PAD,
        overflow: "linebreak",
        textColor: PASTEL.textDark,
        minCellHeight: 3,
      },
      headStyles: {
        fillColor: PASTEL.purpleHead,
        textColor: PASTEL.textDark,
        fontStyle: "bold",
        fontSize: 5,
        cellPadding: CELL_PAD,
      },
      bodyStyles: {
        fillColor: PASTEL.purpleRow,
        textColor: PASTEL.textDark,
        fontSize: 5,
        cellPadding: CELL_PAD,
        overflow: "linebreak",
        minCellHeight: 3,
      },
      alternateRowStyles: {
        fillColor: PASTEL.purpleRowAlt,
      },
      columnStyles: {
        0: { cellWidth: tableWidth * 0.35, fontStyle: "bold" },
        1: { cellWidth: tableWidth * 0.65, fontStyle: "normal" },
      },
      tableLineColor: PASTEL.lineLight,
      tableLineWidth: 0.06,
    });
    const patientTbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (patientTbl?.finalY ?? y + 20) + SECTION_GAP;
  }

  // Plan de Alimentación Semanal
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(tableMargin, y - 0.5, tableWidth, 2.8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Plan de Alimentación Semanal", tableMargin + tableWidth / 2, y + 1.8, { align: "center" });
  y += 2.8 + SECTION_GAP;

  y = ensureSpace(doc, y, pageHeight, 50, undefined, singlePage);
  const head = [["Día", "Desayuno", "Comida", "Cena", "Colación", "Aprox. kcal"]];
  const body = days.map((d) => [
    d.day,
    d.desayuno,
    d.comida,
    d.cena,
    d.colacion,
    d.totalKcal,
  ]);

  // Anchos: Día 14mm, Aprox. kcal 16mm, resto repartido entre Desayuno/Comida/Cena/Colación
  const diaWidth = 14;
  const kcalWidth = 16;
  const mealColWidth = (tableWidth - diaWidth - kcalWidth) / 4;
  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: { left: tableMargin, right: tableMargin },
    tableWidth,
    theme: "plain",
    pageBreak: singlePage ? "avoid" : "auto",
    styles: {
      fontSize: 5,
      cellPadding: CELL_PAD,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
      minCellHeight: 3,
    },
    headStyles: {
      fillColor: PASTEL.purpleHead,
      textColor: PASTEL.textDark,
      fontStyle: "bold",
      fontSize: 5,
      cellPadding: CELL_PAD,
    },
    bodyStyles: {
      fillColor: PASTEL.purpleRow,
      textColor: PASTEL.textDark,
      fontSize: 5,
      cellPadding: CELL_PAD,
      overflow: "linebreak",
      minCellHeight: 3,
    },
    alternateRowStyles: {
      fillColor: PASTEL.purpleRowAlt,
    },
    columnStyles: {
      0: { cellWidth: diaWidth },
      1: { cellWidth: mealColWidth },
      2: { cellWidth: mealColWidth },
      3: { cellWidth: mealColWidth },
      4: { cellWidth: mealColWidth },
      5: { cellWidth: kcalWidth },
    },
    tableLineColor: PASTEL.lineLight,
    tableLineWidth: 0.06,
  });

  const tbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (tbl?.finalY ?? y + 40) + SECTION_GAP;

  if (recommendations) {
    y = ensureSpace(doc, y, pageHeight, 15, undefined, singlePage);
    if (y < pageHeight - 12) {
      doc.setFillColor(...PASTEL.purpleLight);
      doc.rect(tableMargin, y - 0.5, tableWidth, 2.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("Recomendaciones generales", tableMargin + tableWidth / 2, y + 1.7, { align: "center" });
      y += 2.5 + SECTION_GAP;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      const recLines = doc.splitTextToSize(recommendations, tableWidth);
      const maxRecLines = singlePage ? 999 : 999;
      for (let i = 0; i < recLines.length && i < maxRecLines; i++) {
        if (y > pageHeight - 10) break;
        doc.text(recLines[i], tableMargin, y);
        y += LINE_HEIGHT;
      }
    }
  }

  // Firma al final, margen inferior mínimo
  if (singlePage) {
    if (y > pageHeight - 8) y = pageHeight - 8;
    y += 2;
  } else {
    const footerPageHeight = 24;
    doc.addPage([pageWidth, footerPageHeight], "p");
    y = 8;
    y += 2;
  }
  doc.setFontSize(6);
  doc.setTextColor(100, 80, 130);
  doc.text(lnh, pageWidth / 2, y, { align: "center" });
  y += 5;
  return y;
}

/** Altura muy grande solo para medir dónde termina el contenido (hoja horizontal) */
const MEASURE_PAGE_HEIGHT = 400;

/**
 * Genera el PDF en hoja tamaño oficio horizontal (apaisada): 340 mm ancho x 216 mm alto.
 * Una sola hoja con altura ajustada al contenido para evitar espacio en blanco.
 * nombreLnh: nombre del nutriólogo (LNH); por defecto "L.N.H. Diana Gallardo".
 */
export function generateDidiPdf(planContent: string, nombrePaciente: string, nombreLnh?: string): void {
  const lnh = nombreLnh?.trim() || "L.N.H. Diana Gallardo";
  const { patientBlock, days, recommendations } = parsePlanContent(planContent);

  // Pasada 1: medir altura del contenido en una hoja horizontal muy alta (340 mm ancho x 400 mm alto)
  const docMeasure = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [OFICIO_LANDSCAPE_WIDTH, MEASURE_PAGE_HEIGHT],
    hotfixes: ["px_scaling"],
  });
  const contentEndY = drawPlanContent(
    docMeasure,
    OFICIO_LANDSCAPE_WIDTH,
    MEASURE_PAGE_HEIGHT,
    lnh,
    patientBlock,
    days,
    recommendations,
    nombrePaciente,
    true
  );

  // Altura final = contenido + margen inferior; máximo 216 mm (oficio horizontal)
  const pageHeight = Math.min(OFICIO_LANDSCAPE_HEIGHT, contentEndY + 5);

  // Pasada 2: documento horizontal con altura justa (340 mm ancho x pageHeight alto)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [OFICIO_LANDSCAPE_WIDTH, pageHeight],
    hotfixes: ["px_scaling"],
  });
  drawPlanContent(
    doc,
    OFICIO_LANDSCAPE_WIDTH,
    pageHeight,
    lnh,
    patientBlock,
    days,
    recommendations,
    nombrePaciente,
    true
  );

  const filename = `Plan-Nutricional-${(nombrePaciente || "Paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
