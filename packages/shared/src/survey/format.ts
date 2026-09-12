/** Collapses inner whitespace and trims, keeping the respondent's own casing. */
export function tidyRawText(raw: string): string {
  return raw.trim().replace(/\s+/gu, ' ');
}

export function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}
