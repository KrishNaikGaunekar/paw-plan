// Minor Explorer: one minor at a time, picked from a grouped dropdown (business &
// policy minors, agriculture-related minors), so the list can grow without turning
// into one long scroll. Data: MINORS in agribusiness-catalog.js. Each requirement row
// says whether the AgBus major already covers it ("major") or it's an extra course.

import { MINORS } from '../data/agribusiness-catalog.js';
import { openModal } from './modal.js';

function requirementRowHtml(req) {
  const optionsHtml = req.options?.length
    ? `<details class="minor-req-options"><summary>${req.options.length} eligible courses</summary><p>${req.options.map(escapeHtml).join(', ')}</p></details>`
    : '';
  return `
    <li class="minor-req minor-req-${req.status}">
      <div class="minor-req-main">
        <span class="minor-req-code">${escapeHtml(req.code)}</span>
        <span class="minor-req-cr">${req.cr} cr</span>
        <span class="minor-req-status-badge">${req.status === 'major' ? 'Already in your major' : 'Extra course'}</span>
      </div>
      <p class="minor-req-note">${escapeHtml(req.note)}</p>
      ${req.majorNote ? `<p class="minor-req-major-note">${escapeHtml(req.majorNote)}</p>` : ''}
      ${optionsHtml}
    </li>`;
}

function minorSectionHtml(name, minor) {
  return `
    <section class="minor-card">
      <h3>${escapeHtml(name)} Minor <span class="minor-total-cr">${minor.totalCr} cr total · ${minor.extraCr} cr beyond your major</span></h3>
      <p class="minor-description">${escapeHtml(minor.description)}</p>
      ${minor.verified === false ? `<p class="explorer-unverified">Not yet checked against the live NC State catalog. Confirm these requirements on the official catalog page or with an advisor.</p>` : ''}
      <ul class="minor-req-list">${minor.requirements.map(requirementRowHtml).join('')}</ul>
      <p class="minor-gpa">GPA requirement: ${escapeHtml(minor.gpaReq)}</p>
      <p class="minor-notes">${escapeHtml(minor.notes)}</p>
      ${minor.url ? `<p class="minor-notes"><a href="${escapeHtml(minor.url)}" target="_blank" rel="noopener">Official catalog page</a></p>` : ''}
    </section>`;
}

export function openMinorExplorer() {
  const groups = {};
  Object.entries(MINORS).forEach(([name, m]) => {
    (groups[m.group || 'Business & Policy'] ||= []).push(name);
  });
  let selected = Object.keys(MINORS)[0];

  const body = document.createElement('div');
  body.className = 'minor-explorer';
  const render = () => {
    body.innerHTML = `
      <label class="explorer-select-label">Minor
        <select class="explorer-select" data-role="minor-select">
          ${Object.entries(groups)
            .map(([g, names]) => `<optgroup label="${escapeHtml(g)}">${names
              .map((n) => `<option value="${escapeHtml(n)}" ${n === selected ? 'selected' : ''}>${escapeHtml(n)} (${MINORS[n].extraCr} extra cr)</option>`)
              .join('')}</optgroup>`)
            .join('')}
        </select>
      </label>
      ${minorSectionHtml(selected, MINORS[selected])}`;
    body.querySelector('[data-role="minor-select"]').addEventListener('change', (e) => {
      selected = e.target.value;
      render();
    });
  };
  render();
  openModal({ title: 'Minor Explorer', bodyEl: body });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
