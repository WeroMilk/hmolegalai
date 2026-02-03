/**
 * Genera PDF del plan nutricional DIDI: tamaño oficio, rosa/morado pastel,
 * tabla organizada (Día | Desayuno | Comida | Cena | Colación | Aprox. calorías).
 * Estilo profesional como de nutrióloga con reputación.
 */

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/** Tamaño oficio México: 216 mm de ancho, 340 mm de alto por página */
const OFICIO_WIDTH = 216;
const OFICIO_HEIGHT = 340;

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

/**
 * Dibuja todo el contenido en el doc. Si singlePage es true, todo va en una sola hoja (sin añadir páginas).
 * pageHeight: altura de la página en mm (340 oficio).
 */
function drawPlanContent(
  doc: jsPDF,
  pageHeight: number,
  lnh: string,
  patientBlock: string,
  days: ParsedDay[],
  recommendations: string,
  nombrePacienteForm: string,
  singlePage: boolean
): number {
  const margin = 10;
  const paddingHorizontal = 10;
  const tableWidth = OFICIO_WIDTH - 2 * (margin + paddingHorizontal); // 176 mm
  const tableMargin = (OFICIO_WIDTH - tableWidth) / 2; // centrado en la página
  let y = margin;

  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(0, 0, OFICIO_WIDTH, 14, "F");
  doc.setTextColor(...PASTEL.textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", OFICIO_WIDTH / 2, 8, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(lnh, OFICIO_WIDTH / 2, 12, { align: "center" });
  y = 18;

  // Padding en celdas para que el contenido se vea completo (sin recortes)
  const cellPad = 1;

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
  doc.rect(tableMargin, y - 1, tableWidth, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(tituloPaciente, tableMargin + tableWidth / 2, y + 2.2, { align: "center" });
  y += 4;

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
        cellPadding: cellPad,
        overflow: "linebreak",
        textColor: PASTEL.textDark,
        minCellHeight: 3,
      },
      headStyles: {
        fillColor: PASTEL.purpleHead,
        textColor: PASTEL.textDark,
        fontStyle: "bold",
        fontSize: 5,
        cellPadding: cellPad,
      },
      bodyStyles: {
        fillColor: PASTEL.purpleRow,
        textColor: PASTEL.textDark,
        fontSize: 5,
        cellPadding: cellPad,
        overflow: "linebreak",
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
    y = (patientTbl?.finalY ?? y + 20) + 6; // espacio en blanco para separar bien la tabla del paciente del plan semanal
  }

  // Plan de Alimentación Semanal (mismo ancho que información del paciente)
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(tableMargin, y - 1, tableWidth, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Plan de Alimentación Semanal", tableMargin + tableWidth / 2, y + 2.2, { align: "center" });
  y += 4;

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
      cellPadding: cellPad,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
      minCellHeight: 2.5,
    },
    headStyles: {
      fillColor: PASTEL.purpleHead,
      textColor: PASTEL.textDark,
      fontStyle: "bold",
      fontSize: 4,
      cellPadding: cellPad,
    },
    bodyStyles: {
      fillColor: PASTEL.purpleRow,
      textColor: PASTEL.textDark,
      fontSize: 4,
      cellPadding: cellPad,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: PASTEL.purpleRowAlt,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: Math.floor((tableWidth - 12 - 18) / 4) },
      2: { cellWidth: Math.floor((tableWidth - 12 - 18) / 4) },
      3: { cellWidth: Math.floor((tableWidth - 12 - 18) / 4) },
      4: { cellWidth: tableWidth - 12 - 18 - 3 * Math.floor((tableWidth - 12 - 18) / 4) },
      5: { cellWidth: 18 },
    },
    tableLineColor: PASTEL.lineLight,
    tableLineWidth: 0.06,
  });

  const tbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (tbl?.finalY ?? y + 40) + 1;

  if (recommendations) {
    y = ensureSpace(doc, y, pageHeight, 20, undefined, singlePage);
    if (y < pageHeight - 18) {
      doc.setFillColor(...PASTEL.purpleLight);
      doc.rect(tableMargin, y - 1, tableWidth, 3.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("Recomendaciones generales", tableMargin + tableWidth / 2, y + 2.2, { align: "center" });
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      const recLines = doc.splitTextToSize(recommendations, tableWidth);
      const maxRecLines = singlePage ? 6 : 999;
      for (let i = 0; i < recLines.length && i < maxRecLines; i++) {
        if (y > pageHeight - 14) break;
        doc.text(recLines[i], tableMargin, y);
        y += 2;
      }
    }
  }

  // Firma al final de la misma hoja (en una sola hoja) o en página nueva (varias hojas)
  if (singlePage) {
    if (y > pageHeight - 12) y = pageHeight - 12;
    y += 3;
  } else {
    const footerPageHeight = 28;
    doc.addPage([OFICIO_WIDTH, footerPageHeight], "p");
    y = 10;
    y += 3;
  }
  doc.setFontSize(6);
  doc.setTextColor(100, 80, 130);
  doc.text(lnh, OFICIO_WIDTH / 2, y, { align: "center" });
  y += 6;
  return y;
}

/** Altura de página muy grande solo para medir dónde termina el contenido */
const MEASURE_PAGE_HEIGHT = 600;

/**
 * Genera el PDF y dispara la descarga. Una sola hoja con altura ajustada al contenido:
 * se mide el contenido, se crea la página con esa altura + margen inferior y se dibuja,
 * así se elimina el espacio en blanco arriba y abajo.
 * nombreLnh: nombre del nutriólogo (LNH); por defecto "L.N.H. Diana Gallardo".
 */
export function generateDidiPdf(planContent: string, nombrePaciente: string, nombreLnh?: string): void {
  const lnh = nombreLnh?.trim() || "L.N.H. Diana Gallardo";
  const { patientBlock, days, recommendations } = parsePlanContent(planContent);

  // Pasada 1: medir altura del contenido en una página muy alta
  const docMeasure = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [OFICIO_WIDTH, MEASURE_PAGE_HEIGHT],
    hotfixes: ["px_scaling"],
  });
  const contentEndY = drawPlanContent(
    docMeasure,
    MEASURE_PAGE_HEIGHT,
    lnh,
    patientBlock,
    days,
    recommendations,
    nombrePaciente,
    true
  );

  // Altura final = contenido + margen inferior; máximo oficio por si el plan es muy largo
  const pageHeight = Math.min(OFICIO_HEIGHT, contentEndY + 10);

  // Pasada 2: documento con altura justa (sin espacio en blanco)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [OFICIO_WIDTH, pageHeight],
    hotfixes: ["px_scaling"],
  });
  drawPlanContent(doc, pageHeight, lnh, patientBlock, days, recommendations, nombrePaciente, true);

  const filename = `Plan-Nutricional-${(nombrePaciente || "Paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
