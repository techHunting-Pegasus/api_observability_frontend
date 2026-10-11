export interface Formatted {
  text: string;
  isJson: boolean;
}

/** Objects are stringified; strings are parsed if they hold JSON objects/arrays, else shown as-is. */
export function formatValue(value: unknown): Formatted | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.trim() === "") return null;
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed !== null && typeof parsed === "object") {
        return { text: JSON.stringify(parsed, null, 2), isJson: true };
      }
    } catch {
      /* not JSON */
    }
    return { text: value, isJson: false };
  }
  if (typeof value === "object" && Object.keys(value as object).length === 0) return null;
  return { text: JSON.stringify(value, null, 2), isJson: true };
}
