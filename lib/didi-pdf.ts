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

/** Paleta solo tonos pastel: suave, profesional */
const PASTEL = {
  headerBar: [180, 160, 215] as [number, number, number],     // violeta pastel
  sectionBar: [195, 175, 230] as [number, number, number],    // morado pastel
  tableHead: [190, 170, 225] as [number, number, number],     // encabezados pastel
  tableRow: [252, 250, 255] as [number, number, number],     // fila muy clara
  tableRowAlt: [245, 240, 252] as [number, number, number],  // fila alterna pastel
  sectionBg: [248, 246, 253] as [number, number, number],    // fondo títulos pastel
  textDark: [55, 45, 95] as [number, number, number],        // texto principal suave
  textMuted: [100, 90, 140] as [number, number, number],     // texto secundario pastel
  border: [225, 218, 240] as [number, number, number],       // bordes pastel
  signature: [160, 140, 200] as [number, number, number],     // firma pastel
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

/** Fecha de hoy en español: "3 de febrero de 2026" */
function getTodayDateSpanish(): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

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
    let value = (m[2] || "").trim();
    if (label.toLowerCase() === "fecha del plan") {
      value = getTodayDateSpanish();
    }
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

/** Márgenes y espaciado: distribución profesional, todo bien separado */
const MARGIN = 2;
const PAD_H = 2;
const SECTION_GAP = 1.8;
const CELL_PAD = 1.2;
const LINE_HEIGHT = 1.2;

/** Mínimos para que el texto siga legible al escalar */
const MIN_FONT = 2.5;
const MIN_CELL_HEIGHT = 1;

/**
 * Dibuja todo el contenido en el doc.
 * scale: 1 = tamaño normal; <1 comprime para caber en 1 hoja.
 * extraGap: espacio extra (mm) entre secciones cuando sobra espacio.
 * extraCellHeight: altura extra (mm) por fila de tabla para que las tablas llenen toda la hoja.
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
  singlePage: boolean,
  scale: number = 1,
  extraGap: number = 0,
  extraCellHeight: number = 0
): number {
  const s = scale;
  const m = MARGIN * s;
  const padH = PAD_H * s;
  const gap = SECTION_GAP * s + extraGap;
  const cellPad = CELL_PAD * s;
  const lineH = LINE_HEIGHT * s;
  const tableWidth = pageWidth - 2 * (MARGIN + PAD_H);
  const tableMargin = (pageWidth - tableWidth) / 2;
  let y = m;

  const fTitle = Math.max(MIN_FONT, 17.5 * s);
  const fSub = Math.max(MIN_FONT, 9.5 * s);
  const fSectionTitle = Math.max(MIN_FONT, 9.5 * s);
  const fTable = Math.max(MIN_FONT, 6.8 * s);
  const fPatientTable = Math.max(MIN_FONT, 7.8 * s);
  const fRec = Math.max(MIN_FONT, 5.8 * s);
  const fSmall = Math.max(MIN_FONT, 8.2 * s);
  const fSignatureSub = Math.max(MIN_FONT, 6.5 * s);
  const minH = Math.max(MIN_CELL_HEIGHT, 3 * s) + extraCellHeight;
  const headerMarginTop = 8 * s;
  const headerMarginBottom = 3 * s;
  const headerContentH = 8 * s;
  const headerH = headerMarginTop + headerContentH + headerMarginBottom;
  const gapAfterHeader = 3.2 * s;
  const sectionH = 5.8 * s;
  const sectionBarMarginTop = 3.2 * s;
  const sectionMarginBottom = 2.8 * s;
  const gapBetweenPatientAndPlan = 2.8 * s;
  const gapBeforeFooter = 5.5 * s;
  const patientTableWidth = Math.min(tableWidth * 0.52, 140);
  const patientTableMargin = (pageWidth - patientTableWidth) / 2;

  // Encabezado: barra pastel, texto NEGRO, márgenes superior e inferior
  doc.setFillColor(...PASTEL.headerBar);
  doc.rect(0, 0, pageWidth, headerH, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(fTitle);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", pageWidth / 2, headerMarginTop + headerContentH * 0.32, { align: "center" });
  doc.setFontSize(fSub);
  doc.setFont("helvetica", "normal");
  doc.text(lnh, pageWidth / 2, headerMarginTop + headerContentH * 0.78, { align: "center" });
  doc.setDrawColor(...PASTEL.border);
  doc.setLineWidth(0.08);
  doc.line(0, headerH, pageWidth, headerH);
  y = headerH + gapAfterHeader;

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
  y += sectionBarMarginTop;
  doc.setFillColor(...PASTEL.sectionBg);
  doc.setDrawColor(...PASTEL.border);
  doc.setLineWidth(0.06);
  doc.rect(0, y, pageWidth, sectionH, "FD");
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fSectionTitle);
  const sectionTextY = y + sectionH * 0.5 + fSectionTitle * 0.12;
  doc.text(tituloPaciente, pageWidth / 2, sectionTextY, { align: "center" });
  y += sectionH + sectionMarginBottom + gap;

  if (patientBody.length > 0) {
    y = ensureSpace(doc, y, pageHeight, 20 * s, undefined, singlePage);
    autoTable(doc, {
      head: patientHead,
      body: patientBody,
      startY: y,
      margin: { left: patientTableMargin, right: patientTableMargin },
      tableWidth: patientTableWidth,
      theme: "plain",
      pageBreak: singlePage ? "avoid" : "auto",
      styles: {
        fontSize: fPatientTable,
        cellPadding: cellPad,
        overflow: "linebreak",
        textColor: PASTEL.textDark,
        minCellHeight: minH,
      },
      headStyles: {
        fillColor: PASTEL.tableHead,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: fPatientTable,
        cellPadding: cellPad,
        halign: "center",
      },
      bodyStyles: {
        fillColor: PASTEL.tableRow,
        textColor: PASTEL.textDark,
        fontSize: fPatientTable,
        cellPadding: cellPad,
        overflow: "linebreak",
        minCellHeight: minH,
      },
      alternateRowStyles: { fillColor: PASTEL.tableRowAlt },
      columnStyles: {
        0: { cellWidth: patientTableWidth * 0.38, fontStyle: "bold", halign: "center" },
        1: { cellWidth: patientTableWidth * 0.62, fontStyle: "normal", halign: "center" },
      },
      tableLineColor: PASTEL.border,
      tableLineWidth: 0.1,
    });
    const patientTbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (patientTbl?.finalY ?? y + 10 * s) + gap + gapBetweenPatientAndPlan;
  }

  y += sectionBarMarginTop;
  doc.setFillColor(...PASTEL.sectionBg);
  doc.setDrawColor(...PASTEL.border);
  doc.setLineWidth(0.06);
  doc.rect(0, y, pageWidth, sectionH, "FD");
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fSectionTitle);
  const planSectionTextY = y + sectionH * 0.5 + fSectionTitle * 0.12;
  doc.text("Plan de Alimentación Semanal", pageWidth / 2, planSectionTextY, { align: "center" });
  y += sectionH + sectionMarginBottom + gap;

  y = ensureSpace(doc, y, pageHeight, 50 * s, undefined, singlePage);
  const head = [["Día", "Desayuno", "Comida", "Cena", "Colación", "Aprox. kcal"]];
  const body = days.map((d) => [
    d.day,
    d.desayuno,
    d.comida,
    d.cena,
    d.colacion,
    d.totalKcal,
  ]);

  const diaWidth = 15;
  const kcalWidth = 13;
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
      fontSize: fTable,
      cellPadding: cellPad,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
      minCellHeight: minH,
    },
    headStyles: {
      fillColor: PASTEL.tableHead,
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: fTable,
      cellPadding: cellPad,
      halign: "center",
    },
    bodyStyles: {
      fillColor: PASTEL.tableRow,
      textColor: PASTEL.textDark,
      fontSize: fTable,
      cellPadding: cellPad,
      overflow: "linebreak",
      minCellHeight: minH,
    },
    alternateRowStyles: { fillColor: PASTEL.tableRowAlt },
    columnStyles: {
      0: { cellWidth: diaWidth, halign: "center", fontStyle: "bold" },
      1: { cellWidth: mealColWidth, cellPadding: 1.5, halign: "left" },
      2: { cellWidth: mealColWidth, cellPadding: 1.5, halign: "left" },
      3: { cellWidth: mealColWidth, cellPadding: 1.5, halign: "left" },
      4: { cellWidth: mealColWidth, cellPadding: 1.5, halign: "left" },
      5: { cellWidth: kcalWidth, halign: "center" },
    },
    tableLineColor: [255, 255, 255],
    tableLineWidth: 0.2,
  });

  const tbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (tbl?.finalY ?? y + 30 * s) + gap;

  if (recommendations) {
    y = ensureSpace(doc, y, pageHeight, 6 * s, undefined, singlePage);
    if (y < pageHeight - 5 * s) {
      const recTitleH = 2.2 * s;
      doc.setFillColor(...PASTEL.sectionBg);
      doc.setDrawColor(...PASTEL.border);
      doc.setLineWidth(0.06);
      doc.rect(0, y, pageWidth, recTitleH, "FD");
      doc.setTextColor(...PASTEL.textDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(MIN_FONT, 6.2 * s));
      doc.text("Recomendaciones generales", pageWidth / 2, y + recTitleH * 0.5, { align: "center" });
      y += recTitleH + gap;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fRec);
      doc.setTextColor(...PASTEL.textMuted);
      const recLines = doc.splitTextToSize(recommendations, tableWidth);
      for (let i = 0; i < recLines.length; i++) {
        if (y > pageHeight - 4 * s) break;
        doc.text(recLines[i], tableMargin, y);
        y += lineH;
      }
    }
  }

  if (singlePage) {
    if (y > pageHeight - 3 * s) y = pageHeight - 3 * s;
    y += gapBeforeFooter;
  } else {
    doc.addPage([pageWidth, 24], "p");
    y = 8;
    y += 2;
  }
  doc.setDrawColor(...PASTEL.border);
  doc.setLineWidth(0.15);
  doc.line(tableMargin, y, pageWidth - tableMargin, y);
  y += 4 * s;
  doc.setFontSize(fSmall);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PASTEL.signature);
  doc.text(lnh, pageWidth / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fSignatureSub);
  doc.setTextColor(...PASTEL.textMuted);
  doc.text("Nutrióloga", pageWidth / 2, y + 3 * s, { align: "center" });
  y += 4 * s;
  return y;
}

/** Altura muy grande solo para medir dónde termina el contenido */
const MEASURE_PAGE_HEIGHT = 500;

/** Margen inferior mínimo en la hoja final (mm) */
const BOTTOM_MARGIN = 2;

/**
 * Genera el PDF en UNA sola hoja oficio horizontal (340 x 216 mm).
 * Si el contenido medido no cabe, se escala automáticamente para que SIEMPRE quepa en una hoja.
 */
export function generateDidiPdf(planContent: string, nombrePaciente: string, nombreLnh?: string): void {
  const lnh = nombreLnh?.trim() || "L.N.H. Diana Gallardo";
  const { patientBlock, days, recommendations } = parsePlanContent(planContent);

  // Pasada 1: medir altura del contenido con escala 1
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
    true,
    1
  );

  // Calcular escala y distribución: que todo quepa en 216 mm; si sobra espacio, tablas más altas + gaps
  const pageHeight = OFICIO_LANDSCAPE_HEIGHT;
  const availableHeight = pageHeight - BOTTOM_MARGIN;
  const scale = contentEndY <= availableHeight ? 1 : Math.min(1, availableHeight / contentEndY);
  const extraSpace = Math.max(0, availableHeight - contentEndY * scale);
  const numGaps = 6;
  const numTableRows = 8 + 10;
  const extraForGaps = scale === 1 ? extraSpace * 0.35 : 0;
  const extraForCells = scale === 1 ? extraSpace * 0.65 : 0;
  const extraGap = extraForGaps / numGaps;
  const extraCellHeight = extraForCells / numTableRows;

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
    true,
    scale,
    extraGap,
    extraCellHeight
  );

  const filename = `Plan-Nutricional-${(nombrePaciente || "Paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
