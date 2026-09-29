// Surfaces all three minors the catalog data models (Economics, Business
// Administration, Environmental Science) — the original toolbar button only
// advertised "Economics," which NOTES-original-behavior.md flags as copy that fell
// behind the data. Fixed here per the redesign plan.

import { MINORS } from '../data/agribusiness-catalog.js';
import { openModal } from './modal.js';

function requirementRowHtml(req) {
  const optionsHtml = req.options?.length
    ? `<details class="minor-req-options"><summary>${req.options.length} eligible courses</summary><p>${req.options.join(', ')}</p></details>`
    : '';
  return `
    <li class="minor-req minor-req-${req.status}">
      <div class="minor-req-main">
        <span class="minor-req-code">${escapeHtml(req.code)}</span>
        <span class="minor-req-cr">${req.cr} cr</span>
        <span class="minor-req-status-badge">${req.status === 'major' ? 'Already in your major' : 'Extra course'}</span>
      </div>
      <p class="minor-req-note">${escapeHtml(req.note)}</p>
      <p class="minor-req-major-note">${escapeHtml(req.majorNote)}</p>
      ${optionsHtml}
    </li>`;
}

function minorSectionHtml(name, minor) {
  return `
    <section class="minor-card">
      <h3>${escapeHtml(name)} Minor <span class="minor-total-cr">${minor.totalCr} cr total · ${minor.extraCr} cr beyond your major</span></h3>
      <p class="minor-description">${escapeHtml(minor.description)}</p>
      <ul class="minor-req-list">${minor.requirements.map(requirementRowHtml).join('')}</ul>
      <p class="minor-gpa">GPA requirement: ${escapeHtml(minor.gpaReq)}</p>
      <p class="minor-notes">${escapeHtml(minor.notes)}</p>
    </section>`;
}

export function openMinorExplorer() {
  const body = document.createElement('div');
  body.className = 'minor-explorer';
  body.innerHTML = Object.entries(MINORS).map(([name, minor]) => minorSectionHtml(name, minor)).join('');
  openModal({ title: 'Minor Explorer', bodyEl: body });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
