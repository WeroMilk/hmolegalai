/**
 * Tokeniza el texto en "unidades" para contar cambios:
 * palabras (con acentos), números, signos de puntuación.
 * Cada unidad cuenta como "1 cosa" que el usuario puede cambiar (máx 5).
 */
export function tokenizeForEditCount(text: string): string[] {
  const normalized = (text || "").trim();
  if (!normalized) return [];
  const tokens: string[] = [];
  const regex = /[\d]+|[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+|[.,;:!?¿¡'""()[\]]|[\s]+/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(normalized)) !== null) {
    const t = m[0];
    if (t.trim().length > 0 || t.length > 0) tokens.push(t);
  }
  return tokens;
}

/**
 * Distancia de edición entre dos listas de tokens (inserciones, eliminaciones, sustituciones = 1 cada una).
 * Usado para contar "cuántas cosas" cambió el usuario respecto al original.
 */
function editDistanceTokens(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[n][m];
}

const MAX_EDITS = 2;

/**
 * Calcula cuántos "cambios" quedan disponibles (0-2).
 * Si el contenido actual es igual al original, devuelve 2.
 */
export function getEditsRemaining(originalContent: string, currentContent: string): number {
  const origTokens = tokenizeForEditCount(originalContent);
  const currTokens = tokenizeForEditCount(currentContent);
  const used = editDistanceTokens(origTokens, currTokens);
  return Math.max(0, MAX_EDITS - used);
}

export const PREVIEW_STORAGE_KEYS = {
  content: "avatar_preview_content",
  original: "avatar_preview_original",
  editsLeft: "avatar_preview_edits_left",
  recreatesLeft: "avatar_preview_recreates_left",
  documentId: "avatar_preview_document_id",
} as const;
