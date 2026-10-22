// Runs the full audit pipeline (PDF -> table rows -> classification -> plan) in Node
// and prints what the planner would show. Usage:
//   node scripts/check-audit.mjs "path/to/Degree Audit.pdf" [--rows]
// Degree audits contain student records: never commit them to the repo.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';
import { extractAuditRows } from '../src/audit/audit-rows.js';
import { buildPlanFromAudit } from '../src/audit/upload-flow.js';
import { TAKEN_TERM, IN_PROGRESS_TERM } from '../src/data/agribusiness-catalog.js';

const [path, flag] = process.argv.slice(2);
if (!path) {
  console.error('usage: node scripts/check-audit.mjs <audit.pdf> [--rows]');
  process.exit(1);
}
const doc = await pdfjsLib.getDocument({ data: new Uint8Array(readFileSync(path)) }).promise;
const pages = [];
for (let i = 1; i <= doc.numPages; i++) {
  const content = await (await doc.getPage(i)).getTextContent();
  pages.push({ items: content.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })) });
}

if (flag === '--rows') {
  extractAuditRows(pages).rows.forEach((r) =>
    console.log(r.kind === 'heading' ? `\n## [${r.section}] ${r.text}` : `  ${(r.status || '-').padEnd(8)} ${r.classCode.padEnd(10)} ${r.title.slice(0, 50).padEnd(50)} ${String(r.units).padEnd(3)} ${r.term.padEnd(10)} ${r.grade}`),
  );
}

const { plan, advisorReview, nonDegree, summary } = buildPlanFromAudit({ pages });
const cr = (list) => list.reduce((n, c) => n + (c.units || 0), 0);
const line = (c) => `    ${(c.code || '').padEnd(34)} ${String(c.units).padStart(2)} cr  ${[c.grade, c.termTaken, c.note].filter(Boolean).join(' · ')}`;

console.log(`\n${path}`);
console.log(`  parser: ${summary.usedTableParser ? 'table' : 'legacy text'} · current term: ${summary.currentTerm || '?'} · plan starts: ${summary.startTerm}`);
for (const section of plan) {
  if (section.term !== TAKEN_TERM && section.term !== IN_PROGRESS_TERM) continue;
  console.log(`\n  ${section.term} — ${section.courses.length} courses, ${cr(section.courses)} cr`);
  section.courses.forEach((c) => console.log(line(c)));
}
console.log(`\n  Future plan — ${summary.remainingCredits} cr`);
plan
  .filter((s) => s.term !== TAKEN_TERM && s.term !== IN_PROGRESS_TERM)
  .forEach((s) => {
    console.log(`   ${s.term} (${cr(s.courses)} cr)`);
    s.courses.forEach((c) => console.log(`    ${(c.code || '').padEnd(34)} ${String(c.units).padStart(2)} cr  ${c.auditLabel ? '← ' + c.auditLabel : ''}`));
  });
console.log(`\n  Advisor review (${advisorReview.length})`);
advisorReview.forEach((a) => console.log(`    ${a.code || a.title}: ${a.reason}`));
console.log(`\n  Not applied to this degree (${nonDegree.length}, ${cr(nonDegree)} cr)`);
nonDegree.forEach((c) => console.log(`    ${c.raw}`));
