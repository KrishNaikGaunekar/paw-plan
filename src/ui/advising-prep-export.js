// Builds the printable "Advising Prep Sheet" as its own standalone HTML document
// (separate stylesheet from the app, opened via blob URL) — see
// NOTES-original-behavior.md "Advising Prep (printable summary)" for the exact
// contents/order this reproduces.

import { planStore } from '../state/plan-store.js';
import { semesterCreditTotal, isSemesterOverLimit, verifyGEP } from '../state/credit-rules.js';

const BUCKET_TERMS = ['Completed NC State Courses', 'Transfer / Test / Prior Credit', 'In Progress / Planned from Audit'];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function openAdvisingPrep() {
  const { plan } = planStore.state;
  const schedulable = plan.filter((s) => !BUCKET_TERMS.includes(s.term));

  const issues = [];
  schedulable.forEach((s) => {
    if (isSemesterOverLimit(s)) issues.push(`${s.term}: ${semesterCreditTotal(s)} credits (over 18 max)`);
  });

  const unfilled = [];
  schedulable.forEach((s) => {
    s.courses.forEach((c) => {
      if (String(c.name || '').startsWith('Click')) unfilled.push({ term: s.term, code: c.code });
    });
  });

  const gep = verifyGEP(planStore.state);

  const semesterHtml = schedulable
    .map(
      (s) => `
      <div class="sheet-sem">
        <h3>${escapeHtml(s.term)} <span>${semesterCreditTotal(s)} cr</span></h3>
        <ul>${s.courses.map((c) => `<li>${escapeHtml(c.code)} — ${escapeHtml(c.name)} (${c.units || 0}cr)</li>`).join('') || '<li class="empty">—</li>'}</ul>
      </div>`
    )
    .join('');

  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Advising Prep Sheet — Paw Plan</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1F1F1F; margin: 0; padding: 24px; }
  .banner { background: #CC0000; color: #fff; padding: 16px 24px; margin: -24px -24px 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .banner h1 { margin: 0; font-size: 1.4rem; }
  .banner p { margin: 4px 0 0; opacity: .9; font-size: .85rem; }
  .sem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .sheet-sem h3 { display: flex; justify-content: space-between; border-bottom: 2px solid #CC0000; padding-bottom: 4px; margin: 0 0 6px; font-size: .95rem; }
  .sheet-sem ul { margin: 0; padding-left: 18px; font-size: .85rem; }
  .sheet-sem .empty { list-style: none; margin-left: -18px; color: #888; }
  .card { border-left: 4px solid; padding: 8px 12px; margin-bottom: 16px; font-size: .9rem; }
  .card-issues { border-color: #CC0000; background: #FEECEC; }
  .card-unfilled { border-color: #2563EB; background: #EFF4FE; font-style: italic; }
  .badges { display: flex; gap: 12px; margin-bottom: 24px; }
  .badge { padding: 6px 12px; border-radius: 4px; font-size: .85rem; font-weight: 600; }
  .badge-met { background: #DCFCE7; color: #15803D; }
  .badge-unmet { background: #FEE2E2; color: #B91C1C; }
  .notes { border: 1px solid #C7C7C7; padding: 12px; }
  .notes .line { border-bottom: 1px solid #C7C7C7; height: 28px; }
  @media print {
    @page { margin: 0.4in; }
    .banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="banner">
    <h1>Advising Prep Sheet — Paw Plan</h1>
    <p>Generated ${new Date().toLocaleString()}</p>
  </div>

  <div class="sem-grid">${semesterHtml}</div>

  ${issues.length ? `<div class="card card-issues"><strong>Issues</strong><ul>${issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>` : ''}
  ${unfilled.length ? `<div class="card card-unfilled"><strong>Unfilled slots</strong><ul>${unfilled.map((u) => `<li>${escapeHtml(u.code)} — ${escapeHtml(u.term)}</li>`).join('')}</ul></div>` : ''}

  <div class="badges">
    <span class="badge ${gep.globalKnowledge ? 'badge-met' : 'badge-unmet'}">GEP Global Knowledge: ${gep.globalKnowledge ? 'met' : 'unmet'}</span>
    <span class="badge ${gep.americanDemocracy ? 'badge-met' : 'badge-unmet'}">American Democracy: ${gep.americanDemocracy ? 'met' : 'unmet'}</span>
  </div>

  <div class="notes">
    <strong>Advisor notes</strong>
    <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
</body>
</html>`;

  const blob = new Blob([doc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
