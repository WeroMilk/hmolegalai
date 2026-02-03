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
    doc.addPage([OFICIO_LANDSCAPE_WIDTH, h], "p");
    return 10;
  }
  return y;
}

/** Márgenes y espaciado al mínimo para caber todo en UNA sola hoja (216 mm alto) */
const MARGIN = 4;
const PAD_H = 4;
const SECTION_GAP = 1;
const CELL_PAD = 0.5;
const LINE_HEIGHT = 1.2;

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

  // Encabezado muy compacto (1 hoja)
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(0, 0, pageWidth, 7, "F");
  doc.setTextColor(...PASTEL.textDark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", pageWidth / 2, 4.2, { align: "center" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(lnh, pageWidth / 2, 6.2, { align: "center" });
  y = 8;

  // Cuadro de información del paciente
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
  doc.rect(tableMargin, y - 0.3, tableWidth, 2.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(tituloPaciente, tableMargin + tableWidth / 2, y + 1.4, { align: "center" });
  y += 2.2 + SECTION_GAP;

  if (patientBody.length > 0) {
    y = ensureSpace(doc, y, pageHeight, 25, undefined, singlePage);
    autoTable(doc, {
      head: patientHead,
      body: patientBody,
      startY: y,
      margin: { left: tableMargin, right: tableMargin },
      tableWidth,
      theme: "plain",
      pageBreak: singlePage ? "avoid" : "auto",
      styles: {
        fontSize: 4,
        cellPadding: CELL_PAD,
        overflow: "linebreak",
        textColor: PASTEL.textDark,
        minCellHeight: 2,
      },
      headStyles: {
        fillColor: PASTEL.purpleHead,
        textColor: PASTEL.textDark,
        fontStyle: "bold",
        fontSize: 4,
        cellPadding: CELL_PAD,
      },
      bodyStyles: {
        fillColor: PASTEL.purpleRow,
        textColor: PASTEL.textDark,
        fontSize: 4,
        cellPadding: CELL_PAD,
        overflow: "linebreak",
        minCellHeight: 2,
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
    y = (patientTbl?.finalY ?? y + 15) + SECTION_GAP;
  }

  // Plan de Alimentación Semanal
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(tableMargin, y - 0.3, tableWidth, 2.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Plan de Alimentación Semanal", tableMargin + tableWidth / 2, y + 1.4, { align: "center" });
  y += 2.2 + SECTION_GAP;

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

  // Anchos: Día 12mm, Aprox. kcal 14mm, resto para comidas (todo en 1 hoja)
  const diaWidth = 12;
  const kcalWidth = 14;
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
      fontSize: 4,
      cellPadding: CELL_PAD,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
      minCellHeight: 2,
    },
    headStyles: {
      fillColor: PASTEL.purpleHead,
      textColor: PASTEL.textDark,
      fontStyle: "bold",
      fontSize: 4,
      cellPadding: CELL_PAD,
    },
    bodyStyles: {
      fillColor: PASTEL.purpleRow,
      textColor: PASTEL.textDark,
      fontSize: 4,
      cellPadding: CELL_PAD,
      overflow: "linebreak",
      minCellHeight: 2,
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
    y = ensureSpace(doc, y, pageHeight, 10, undefined, singlePage);
    if (y < pageHeight - 8) {
      doc.setFillColor(...PASTEL.purpleLight);
      doc.rect(tableMargin, y - 0.3, tableWidth, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.text("Recomendaciones generales", tableMargin + tableWidth / 2, y + 1.3, { align: "center" });
      y += 2 + SECTION_GAP;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4);
      const recLines = doc.splitTextToSize(recommendations, tableWidth);
      const maxRecLines = singlePage ? 999 : 999;
      for (let i = 0; i < recLines.length && i < maxRecLines; i++) {
        if (y > pageHeight - 6) break;
        doc.text(recLines[i], tableMargin, y);
        y += LINE_HEIGHT;
      }
    }
  }

  // Firma al final (1 hoja)
  if (singlePage) {
    if (y > pageHeight - 5) y = pageHeight - 5;
    y += 1;
  } else {
    const footerPageHeight = 24;
    doc.addPage([pageWidth, footerPageHeight], "p");
    y = 8;
    y += 2;
  }
  doc.setFontSize(5);
  doc.setTextColor(100, 80, 130);
  doc.text(lnh, pageWidth / 2, y, { align: "center" });
  y += 4;
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
  drawPlanContent(
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

  // Siempre UNA sola hoja oficio horizontal (340 x 216 mm). Contenido comprimido para caber.
  const pageHeight = OFICIO_LANDSCAPE_HEIGHT;

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
