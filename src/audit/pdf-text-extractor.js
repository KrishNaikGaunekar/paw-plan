// Turns an uploaded degree-audit PDF into raw text, reconstructed into rows the
// line-oriented audit parser (pawplan-audit-core.js) can read. See the ROW_START_X
// comment below — this is the one part of the pipeline that had to be tuned against
// a real MyPack audit export; the parsing logic itself is untouched.

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

export async function extractTextFromPdf(arrayBuffer) {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(itemsToLines(content.items));
  }
  return pages.join('\n');
}
