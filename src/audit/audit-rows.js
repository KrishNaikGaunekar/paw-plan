// Rebuilds the MyPack degree-audit table from positioned PDF text fragments.
//
// Why geometry instead of text lines: a printed MyPack audit is a table
// (STATUS · CLASS · TITLE · UNITS · TERM · GRADE · REQUIREMENT), and pdf.js hands back
// its cells in an order that doesn't follow the visual rows — a row's status icon is
// often emitted after the rows below it, and bracketed notes ("[ Course provides excess
// units ]") wrap a few points above/below the row baseline. So we:
//   1. find each table's column positions from its "CLASS TITLE UNITS ..." header row,
//   2. pick row anchors (status icon, a course code in the CLASS column, or a units value),
//   3. snap every nearby fragment onto its anchor and read cells by column.
// Pure (no pdf.js import) so it can be tested in Node.
//
// Status icons are Font Awesome glyphs (private-use code points), matching the legend
// printed at the top of every audit: ✓ Complete, ■ Enrolled, ★ Planned, ✕ Unmet.

export const STATUS_GLYPHS = {
  '': 'complete',
  '': 'enrolled',
  '': 'planned',
  '': 'unmet',
};

// Audit section headings -> the legacy numeric section ids the rest of the app keys on
// (older MyPack exports print them as "4 - Natural Sciences").
const SECTION_NAMES = [
  [/^orientation\b/i, '1'],
  [/^communications?\b/i, '2'],
  [/^mathematical sciences\b/i, '3'],
  [/^natural sciences\b/i, '4'],
  [/^dept\.? course requirements\b/i, '5'],
  [/^restricted electives\b/i, '6'],
  [/^general education program\b/i, '8'],
  [/^free electives\b/i, '20'],
  [/^non-?degree courses\b/i, '99'],
];

export function sectionIdForHeading(text) {
  const t = String(text || '').trim();
  const numbered = t.match(/^(\d+)\s*-\s+\S/);
  if (numbered) return numbered[1];
  for (const [re, id] of SECTION_NAMES) if (re.test(t)) return id;
  return null;
}

const isGlyph = (s) => [...s].every((ch) => {
  const cp = ch.codePointAt(0);
  return (cp >= 0xe000 && cp <= 0xf8ff) || /\s/.test(ch);
});
const UNITS_RE = /^\d{1,2}\.\d{3}$/;
// CLASS cell: "ARE 433", "ACC 2**", "TR ***", "GN 3GEP", "WLSP 100", "ELECT 4".
const CLASS_RE = /^(ELECT\s*\d+|[A-Z]{1,5}\s+(\d{3}[A-Z]?|\d[A-Z*]{1,5}|\*{2,3}))$/;

/**
 * @param {{items: {str: string, x: number, y: number}[]}[]} pages
 * @returns {{rows: object[], headings: string[], hasTable: boolean}}
 *   rows: in reading order; each is either
 *     { kind: 'heading', text, section }  or
 *     { kind: 'row', section, status, classCode, title, units, term, grade, action, page }
 */
export function extractAuditRows(pages) {
  const out = [];
  let cols = null; // carried across pages: a table often continues onto the next page
  let section = '';
  let program = 'main'; // flips to 'other' when a second plan (e.g. an intended major) starts
  let sawSection = false;

  pages.forEach((page, pageIndex) => {
    const items = page.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ str: it.str.trim(), x: it.x, y: it.y }));

    // 1. Column positions from this page's header rows (there may be several).
    const headerYs = new Set();
    items.forEach((it) => {
      if (it.str !== 'CLASS') return;
      const same = items.filter((o) => Math.abs(o.y - it.y) < 3);
      const at = (label) => same.find((o) => o.str === label)?.x;
      if (at('TITLE') === undefined || at('UNITS') === undefined) return;
      headerYs.add(Math.round(it.y));
      cols = { cls: it.x, title: at('TITLE'), units: at('UNITS'), term: at('TERM'), grade: at('GRADE'), req: at('REQUIREMENT') };
    });
    const isHeaderRow = (it) => [...headerYs].some((y) => Math.abs(y - it.y) < 3);

    // 2. Row anchors.
    const anchors = [];
    const addAnchor = (y, glyph) => {
      const near = anchors.find((a) => Math.abs(a.y - y) <= 6);
      if (near) {
        if (glyph && !near.status) near.status = glyph;
        return;
      }
      anchors.push({ y, status: glyph || null, items: [] });
    };
    if (cols) {
      items.forEach((it) => {
        if (isHeaderRow(it)) return;
        if (isGlyph(it.str)) {
          // Row status icons sit in the STATUS column, well left of CLASS; the section
          // heading's own status icon sits just left of the heading text — skip those.
          if (it.x < cols.cls - 12 && it.x > cols.cls - 45) {
            const status = STATUS_GLYPHS[[...it.str].find((ch) => STATUS_GLYPHS[ch])];
            if (status) addAnchor(it.y, status);
          }
          return;
        }
        if (Math.abs(it.x - cols.cls) <= 6 && CLASS_RE.test(it.str)) addAnchor(it.y);
        else if (Math.abs(it.x - cols.units) <= 8 && UNITS_RE.test(it.str)) addAnchor(it.y);
      });
    }

    // 3. Snap fragments to the nearest anchor; leftovers become loose lines (headings,
    //    page furniture, the student header block).
    const loose = [];
    items.forEach((it) => {
      if (isGlyph(it.str) || isHeaderRow(it)) return;
      let best = null;
      if (cols && it.x >= cols.cls - 3) {
        anchors.forEach((a) => {
          const d = Math.abs(a.y - it.y);
          if (d <= 10 && (!best || d < best.d)) best = { a, d };
        });
      }
      if (best) best.a.items.push(it);
      else loose.push(it);
    });

    const looseLines = [];
    loose
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .forEach((it) => {
        const line = looseLines.find((l) => Math.abs(l.y - it.y) < 3);
        if (line) line.items.push(it);
        else looseLines.push({ y: it.y, items: [it] });
      });

    const events = [
      ...anchors.filter((a) => a.items.length).map((a) => ({ y: a.y, anchor: a })),
      ...looseLines.map((l) => ({ y: l.y, line: l })),
    ].sort((a, b) => b.y - a.y);

    events.forEach((ev) => {
      if (ev.line) {
        const text = ev.line.items.sort((a, b) => a.x - b.x).map((i) => i.str).join(' ').replace(/\s+/g, ' ');
        const id = sectionIdForHeading(text);
        if (id) {
          section = id;
          sawSection = true;
          out.push({ kind: 'heading', text, section: id });
        } else if (sawSection && /^\[\s*Intended (Major|Minor)\s*\]/i.test(text)) {
          program = 'other'; // rows after this belong to a different plan
        }
        return;
      }
      if (program !== 'main' || !sawSection) return;
      out.push(rowFromAnchor(ev.anchor, cols, section, pageIndex + 1));
    });
  });

  return { rows: out, hasTable: out.some((r) => r.kind === 'row') };
}

function rowFromAnchor(anchor, cols, section, page) {
  const cell = { cls: [], title: [], units: [], term: [], grade: [], req: [] };
  const edge = (x) => x - 4;
  anchor.items
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .forEach((it) => {
      const x = it.x;
      let key = 'req';
      if (x < edge(cols.title)) key = 'cls';
      else if (x < edge(cols.units)) key = 'title';
      else if (x < edge(cols.term)) key = 'units';
      else if (x < edge(cols.grade)) key = 'term';
      else if (x < edge(cols.req)) key = 'grade';
      cell[key].push(it.str);
    });
  const join = (arr) => arr.join(' ').replace(/\s+/g, ' ').replace(/\[\s+/g, '[ ').replace(/\s+\]/g, ' ]').trim();
  const unitsText = join(cell.units);
  const unitsIsNumber = UNITS_RE.test(unitsText);
  // Unit-less rows ("Found. of American Democracy  Verify") print their grade where the
  // units would be — don't lose it.
  const grade = join(cell.grade) || (!unitsIsNumber ? unitsText : '');
  return {
    kind: 'row',
    section,
    status: anchor.status,
    classCode: join(cell.cls),
    title: join(cell.title),
    units: unitsIsNumber ? parseFloat(unitsText) : 0,
    term: join(cell.term),
    grade,
    action: join(cell.req),
    page,
  };
}
