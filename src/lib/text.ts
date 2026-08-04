/**
 * Normalizes a literal "<br>"/"<br/>"/"<br />" (e.g. pasted from a source's
 * raw HTML) into a real newline, so it renders a line break the same way a
 * real newline (from pressing Enter in a <textarea>) does when paired with
 * CSS `white-space: pre-line`. Never touches innerHTML -- this only ever
 * inserts a plain newline character, never arbitrary markup.
 */
export function formatLineBreaks(text: string): string {
  return text.replace(/<br\s*\/?>/gi, "\n");
}
