/**
 * Genera PDF del plan nutricional DIDI: tamaño oficio, rosa/morado pastel,
 * tabla organizada (Día | Desayuno | Comida | Cena | Colación | Aprox. calorías).
 * Estilo profesional como de nutrióloga con reputación.
 */

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/** Tamaño oficio México: 216 x 340 mm */
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

/**
 * Genera el PDF y dispara la descarga. Usa contenido ya editado por el usuario.
 */
export function generateDidiPdf(planContent: string, nombrePaciente: string): void {
  const { patientBlock, days, recommendations } = parsePlanContent(planContent);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [OFICIO_WIDTH, OFICIO_HEIGHT],
    hotfixes: ["px_scaling"],
  });

  const margin = 10;
  const pageWidth = OFICIO_WIDTH - margin * 2;
  let y = margin;

  // Título (estructura como referencia, compacto para una sola hoja)
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(0, 0, OFICIO_WIDTH, 14, "F");
  doc.setTextColor(...PASTEL.textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", OFICIO_WIDTH / 2, 8, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("L.N.H. Diana Gallardo", OFICIO_WIDTH / 2, 12, { align: "center" });
  y = 18;

  // Datos del paciente: etiquetas en negrita, sin markdown, compacto
  doc.setFontSize(6);
  doc.setTextColor(...PASTEL.textDark);
  const patientPairs = parsePatientBlockToPairs(patientBlock);
  const lineH = 2.8;
  const maxPatientLines = 8;
  for (let i = 0; i < Math.min(patientPairs.length, maxPatientLines); i++) {
    const { label, value } = patientPairs[i];
    if (y > OFICIO_HEIGHT - 220) break;
    doc.setFont("helvetica", "bold");
    const labelText = label + (value ? ": " : "");
    doc.text(labelText, margin, y);
    if (!value) {
      y += lineH;
      continue;
    }
    const labelW = doc.getTextWidth(labelText);
    doc.setFont("helvetica", "normal");
    const valueLines = doc.splitTextToSize(value, pageWidth - labelW - 2);
    doc.text(valueLines[0], margin + labelW, y);
    let usedY = y;
    for (let j = 1; j < valueLines.length; j++) {
      usedY += lineH;
      doc.text(valueLines[j], margin, usedY);
    }
    y = usedY + lineH;
  }
  y += 4;

  // Plan de Alimentación Semanal: tabla en UNA sola hoja, todo visible sin cortar ni encimar
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(margin, y - 1, pageWidth, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Plan de Alimentación Semanal", margin + 2, y + 3);
  y += 7;

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
    margin: { left: margin, right: margin },
    tableWidth: pageWidth,
    theme: "plain",
    pageBreak: "avoid",
    styles: {
      fontSize: 4,
      cellPadding: 0.5,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
    },
    headStyles: {
      fillColor: PASTEL.purpleHead,
      textColor: PASTEL.textDark,
      fontStyle: "bold",
      fontSize: 4,
      cellPadding: 0.5,
    },
    bodyStyles: {
      fillColor: PASTEL.purpleRow,
      textColor: PASTEL.textDark,
      fontSize: 4,
      cellPadding: 0.5,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: PASTEL.purpleRowAlt,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { cellWidth: 18 },
    },
    tableLineColor: PASTEL.lineLight,
    tableLineWidth: 0.06,
  });

  const tbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (tbl?.finalY ?? y + 40) + 4;

  // Recomendaciones (compactas)
  if (recommendations && y < OFICIO_HEIGHT - 18) {
    doc.setFillColor(...PASTEL.purpleLight);
    doc.rect(margin, y - 1, pageWidth, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("Recomendaciones generales", margin + 2, y + 2.5);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    const recLines = doc.splitTextToSize(recommendations, pageWidth);
    const maxRec = 5;
    recLines.slice(0, maxRec).forEach((line: string) => {
      if (y > OFICIO_HEIGHT - 12) return;
      doc.text(line, margin, y);
      y += 2.5;
    });
  }

  // Pie
  doc.setFontSize(6);
  doc.setTextColor(100, 80, 130);
  doc.text("L.N.H. Diana Gallardo", OFICIO_WIDTH / 2, OFICIO_HEIGHT - 6, { align: "center" });

  const filename = `Plan-Nutricional-${(nombrePaciente || "Paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
