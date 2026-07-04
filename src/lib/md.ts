import { marked } from "marked";

// Question/passage content is trusted (authored via the admin backend), so
// raw HTML like <u data-q="…">, <sup>, and markdown tables pass through.
export function renderMd(md: string): string {
  return marked.parse(md, { async: false, gfm: true, breaks: true });
}

/** Inline variant (no wrapping <p>) for stems and choices. */
export function renderMdInline(md: string): string {
  return marked.parseInline(md, { async: false, gfm: true });
}

/**
 * Mark the underline belonging to the current English question as active
 * (soft yellow highlight in CSS). Runs on rendered HTML.
 */
export function activateUnderline(html: string, activePosition: number | null): string {
  if (activePosition === null) return html;
  return html.replaceAll(
    `<u data-q="${activePosition}"`,
    `<u class="act-active" data-q="${activePosition}"`,
  );
}
