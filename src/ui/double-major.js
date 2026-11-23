// Double Major Explorer: browse second majors Agribusiness students commonly pair with,
// see which of each major's courses the current plan already covers, and add the rest
// to the plan as "2nd Major" chips (see state/second-program.js). Requirement data lives
// in DOUBLE_MAJORS (agribusiness-catalog.js) and is sourced from catalog.ncsu.edu.

import { DOUBLE_MAJORS } from '../data/agribusiness-catalog.js';
import { planStore } from '../state/plan-store.js';
import { planCodes, pickableCodes, placeSlots, slotsForCatalogMajor, stripSecondProgram } from '../state/second-program.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';

function analyze(name) {
  const base = stripSecondProgram(planStore.state.plan);
  const codes = planCodes(base, planStore.state.transferred);
  return { base, ...slotsForCatalogMajor(name, DOUBLE_MAJORS[name], codes, pickableCodes(base)) };
}

function majorHtml(name) {
  const major = DOUBLE_MAJORS[name];
  const { slots, shared, pickInPlan } = analyze(name);
  const pickFor = new Map(pickInPlan.map(({ req, pick }) => [req, pick]));
  const extraCr = slots.reduce((n, s) => n + (s.units || 0), 0);
  const sharedSet = new Set(shared);
  const current = planStore.state.secondProgram;
  const isCurrent = current?.name === name;

  const rows = major.requirements
    .map((req) => {
      const inPlan = sharedSet.has(req);
      const pick = pickFor.get(req);
      const opts = req.options?.length
        ? `<details class="minor-req-options"><summary>${req.options.length} eligible courses</summary><p>${req.options.map(escapeHtml).join(', ')}</p></details>`
        : '';
      return `
        <li class="minor-req minor-req-${inPlan || pick ? 'major' : 'extra'}">
          <div class="minor-req-main">
            <span class="minor-req-code">${escapeHtml(req.code)}</span>
            <span class="minor-req-cr">${req.cr} cr</span>
            <span class="minor-req-status-badge">${inPlan ? 'Already in your plan' : pick ? 'Shared if you pick it' : 'Extra course'}</span>
          </div>
          <p class="minor-req-note">${escapeHtml(req.note)}</p>
          ${pick ? `<p class="minor-req-major-note">Choose ${escapeHtml(pick)} in the matching “Click to choose” slot in your plan and it counts for both majors.</p>` : ''}
          ${opts}
        </li>`;
    })
    .join('');

  return `
    <section class="minor-card">
      <h3>${escapeHtml(name)} <span class="minor-total-cr">${major.degree ? escapeHtml(major.degree) + ' · ' : ''}about ${extraCr} cr beyond your current plan</span></h3>
      <p class="minor-description">${escapeHtml(major.description)}</p>
      ${major.verified === false ? `<p class="explorer-unverified">Not yet checked against the live NC State catalog. Confirm these requirements on the official catalog page or with an advisor.</p>` : ''}
      <ul class="minor-req-list">${rows}</ul>
      <p class="minor-notes">${escapeHtml(major.notes || '')}</p>
      ${major.url ? `<p class="minor-notes"><a href="${escapeHtml(major.url)}" target="_blank" rel="noopener">Official catalog page</a></p>` : ''}
      <div class="double-major-actions">
        <button type="button" class="btn btn-primary" data-action="add-major">${isCurrent ? 'Re-add to my plan' : current ? `Replace ${escapeHtml(current.name)} with this major` : 'Add to my plan'}</button>
      </div>
    </section>`;
}

export function openDoubleMajorExplorer(rerender = () => {}) {
  const names = Object.keys(DOUBLE_MAJORS);
  const body = document.createElement('div');
  body.className = 'minor-explorer';
  const current = planStore.state.secondProgram;
  let selected = current && DOUBLE_MAJORS[current.name] ? current.name : names[0];

  const render = () => {
    body.innerHTML = `
      <p class="minor-description">Majors Agribusiness Management students often pair with. NC State double majors finish
      both programs at the same time; talk with both advisors before declaring. Courses your plan already has count toward both.</p>
      <label class="explorer-select-label">Second major
        <select class="explorer-select" data-role="major-select">
          ${names.map((n) => `<option value="${escapeHtml(n)}" ${n === selected ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}
        </select>
      </label>
      ${majorHtml(selected)}`;
    body.querySelector('[data-role="major-select"]').addEventListener('change', (e) => {
      selected = e.target.value;
      render();
    });
    body.querySelector('[data-action="add-major"]').addEventListener('click', () => {
      const { base, slots, shared, pickInPlan } = analyze(selected);
      planStore.setSecondProgram(placeSlots(base, slots), { name: selected, source: 'catalog' });
      if (planStore.state.uploadedMode) planStore.armAutosave();
      closeModal();
      showToast(
        `${selected} added: ${slots.length} course${slots.length === 1 ? '' : 's'} placed in your plan, ${shared.length + pickInPlan.length} shared with your AgBus plan.`,
        { kind: 'success', duration: 6000 },
      );
      rerender();
    });
  };

  render();
  openModal({ title: 'Double Major Explorer', bodyEl: body });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
