/**
 * Missouri Revised Statutes page parsers, used by scripts/bake-sections.mjs (the refresh) and the unit tests.
 * `statuteText` is passed in so the bake script can run under plain Node without resolving the workspace package.
 */
export interface MissouriSection {
  section: string;
  heading: string | null;
  text: string | null;
  effective: string | null;
}

/** Every chapter the home page lists, in page order. */
export function parseMissouriChapterList(html: string): string[] {
  return [...new Set([...html.matchAll(/OneChapter\.aspx\?chapter=([0-9A-Za-z]+)/g)].map((m) => m[1]))];
}

/** Every section number a chapter page lists (a section with several versions is listed once). */
export function parseMissouriToc(html: string): string[] {
  return [...new Set([...html.matchAll(/PageSelect\.aspx\?section=([0-9]+\.[0-9A-Za-z.-]+)&/g)].map((m) => m[1]))];
}

/**
 * One section page. The statute is the block that opens `<div class="norm"` and ends at the "end of effective"
 * rule; everything after it (version table, site furniture) is not law. A page for a citation that does not exist
 * answers 200 with no such block, which returns null here.
 */
export function parseMissouriSection(html: string, section: string, statuteText: (s: string) => string): MissouriSection | null {
  const start = html.indexOf('<div class="norm"');
  if (start === -1) return null;
  const endMark = html.indexOf('end of effective', start);
  const end = endMark === -1 ? html.length : html.lastIndexOf('<hr>', endMark);
  const text = statuteText(html.slice(start, end === -1 || end < start ? undefined : end));
  const esc = section.replace(/\./g, '\\.');
  if (!new RegExp(`^\\s*${esc}\\.`).test(text)) return null;
  const eff = html.match(/id="effdt"[^>]*>\s*Effective -\s*([^<,]+)/);
  const cat = html.slice(start).match(/<span class="bold">([\s\S]*?)<\/span>\s*(?:\d|<)/);
  const head = cat ? statuteText(cat[1]).replace(new RegExp(`^${esc}\\.\\s*`), '').replace(/\s*[—-]\s*$/, '').trim() : '';
  return { section, heading: head || null, text, effective: eff ? eff[1].trim() : null };
}
