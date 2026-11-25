/** decodeURIComponent that returns the input instead of throwing on malformed values like "100%". */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
