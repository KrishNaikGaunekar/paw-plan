// Reads an uploaded degree-audit PDF with pdf.js. The positioned fragments feed the
// table parser in audit-rows.js; the ROW_START_X line-joining below is the older text
// reconstruction, kept only as a fallback for exports without a recognizable table.

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// getTextContent() returns individual text fragments with position info but no
// inherent line breaks. A naive Y-position cluster doesn't work: MyPack's audit PDF
// wraps a row's grade/units/term (plus any bracketed annotation like "[Course
// provides excess units]") onto its own visual line below the course code/title, so
// a tight Y tolerance splits one logical audit row into two. The reliable signal is
// X position instead — every real row starts at the same left-margin column (~76pt,
// the STATUS/CLASS column); wrapped continuation text is always indented well past
// it. Verified against a real MyPack degree-audit PDF export.
const ROW_START_X = 85;

function itemsToLines(items) {
  const lines = [];
  let current = [];
  items.forEach((item) => {
    const text = item.str;
    if (text.trim() && item.transform[4] <= ROW_START_X && current.length) {
      lines.push(current.join(' '));
      current = [];
    }
    current.push(text);
  });
  if (current.length) lines.push(current.join(' '));
  return lines.join('\n');
}

/**
 * Returns both representations of the PDF:
 *   pages - positioned text fragments, read by audit-rows.js (the primary parser)
 *   text  - the older line-joined text, used only when no audit table is recognized
 */
export async function extractAuditFromPdf(arrayBuffer) {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  const textPages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push({ items: content.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })) });
    textPages.push(itemsToLines(content.items));
  }
  return { pages, text: textPages.join('\n') };
}

export async function extractTextFromPdf(arrayBuffer) {
  return (await extractAuditFromPdf(arrayBuffer)).text;
}
