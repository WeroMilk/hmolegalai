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

  const margin = 12;
  const pageWidth = OFICIO_WIDTH - margin * 2;
  let y = margin;

  // Título
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(0, 0, OFICIO_WIDTH, 22, "F");
  doc.setTextColor(...PASTEL.textDark);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN NUTRICIONAL", OFICIO_WIDTH / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("L.N.H. Diana Gallardo", OFICIO_WIDTH / 2, 18, { align: "center" });
  y = 26;

  // Bloque de datos del paciente (legible, sin encimar)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const patientLines = doc.splitTextToSize(patientBlock, pageWidth);
  const maxPatientLines = 14;
  patientLines.slice(0, maxPatientLines).forEach((line: string, i: number) => {
    doc.text(line, margin, y + i * 4);
  });
  y += Math.min(patientLines.length, maxPatientLines) * 4 + 8;

  // Subtítulo tipo referencia ChatGPT
  doc.setFillColor(...PASTEL.purpleLight);
  doc.rect(margin, y - 1, pageWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Plan de Alimentación Semanal", margin + 2, y + 4);
  y += 10;

  // Tabla: Día | Desayuno | Comida | Cena | Colación | Aprox. calorías
  const head = [["Día", "Desayuno", "Comida", "Cena", "Colación", "Aprox. calorías"]];
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
    tableWidth: "wrap",
    theme: "plain",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      textColor: PASTEL.textDark,
    },
    headStyles: {
      fillColor: PASTEL.purpleHead,
      textColor: PASTEL.textDark,
      fontStyle: "bold",
      fontSize: 7,
    },
    bodyStyles: {
      fillColor: PASTEL.purpleRow,
      textColor: PASTEL.textDark,
    },
    alternateRowStyles: {
      fillColor: PASTEL.purpleRowAlt,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: "auto" },
      2: { cellWidth: "auto" },
      3: { cellWidth: "auto" },
      4: { cellWidth: "auto" },
      5: { cellWidth: 22 },
    },
    tableLineColor: PASTEL.lineLight,
    tableLineWidth: 0.1,
  });

  const tbl = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (tbl?.finalY ?? y + 40) + 8;

  // Recomendaciones
  if (recommendations) {
    doc.setFillColor(...PASTEL.purpleLight);
    doc.rect(margin, y - 2, pageWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Recomendaciones generales", margin + 2, y + 2);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const recLines = doc.splitTextToSize(recommendations, pageWidth);
    const maxRec = 20;
    recLines.slice(0, maxRec).forEach((line: string) => {
      if (y > OFICIO_HEIGHT - margin - 10) return;
      doc.text(line, margin, y);
      y += 4;
    });
  }

  // Pie
  y = OFICIO_HEIGHT - 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 80, 130);
  doc.text("L.N.H. Diana Gallardo", OFICIO_WIDTH / 2, y, { align: "center" });

  const filename = `Plan-Nutricional-${(nombrePaciente || "Paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
