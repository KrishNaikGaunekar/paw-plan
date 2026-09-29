// The core planner: semester cards, course chips, drag-and-drop + tap-to-move,
// prerequisite enforcement, and the "audit history" buckets (Completed NC State
// Courses / Transfer / In Progress). See NOTES-original-behavior.md "Drag-and-drop
// planner + prerequisite enforcement".

import { planStore } from '../state/plan-store.js';
import { isSchedulableTerm } from '../state/prereq-engine.js';
import { semesterCreditTotal, isSemesterOverLimit } from '../state/credit-rules.js';
import { CATEGORIES } from '../data/agribusiness-catalog.js';
import { openCoursePicker } from './course-picker-modal.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';

const BUCKET_TERMS = ['Completed NC State Courses', 'Transfer / Test / Prior Credit', 'In Progress / Planned from Audit'];

let tapSelectedId = null;
let transferModeOn = false;

export function setTransferMode(on) {
  transferModeOn = on;
}
export function isTransferMode() {
  return transferModeOn;
}

function isInteractive(course, term) {
  if (!isSchedulableTerm(term)) return false;
  if (course.historical || course.synthetic || course.waived) return false;
  if (String(course.name || '').startsWith('Click')) return false;
  return true;
}

function isTransferable(course) {
  return (course.units || 0) > 0 && !String(course.name || '').startsWith('Click');
}

function courseChipHtml(course, term) {
  const cat = CATEGORIES[course.cat] || CATEGORIES.free;
  const isPicker = !!course.picker;
  const classes = ['course'];
  if (isPicker) classes.push('course-picker');
  if (course.synthetic) classes.push('course-synthetic');
  if (course.waived) classes.push('course-waived');
  if (course.historical) classes.push('course-historical');
  if (tapSelectedId === course.id) classes.push('tap-selected');
  const interactive = isInteractive(course, term);
  const draggable = interactive && !transferModeOn;

  const gradeBadge = course.historical && /\(([^()]+)\)/.test(course.name)
    ? `<span class="course-badge">${course.name.match(/\(([^()]+)\)/)[1]}</span>`
    : '';

  return `
    <div class="${classes.join(' ')}"
         data-course-id="${course.id}"
         data-term="${escapeAttr(term)}"
         ${draggable ? 'draggable="true"' : ''}
         tabindex="0"
         role="button"
         aria-pressed="${tapSelectedId === course.id}"
         title="${interactive ? (transferModeOn ? 'Click to mark as transferred' : 'Click or drag to move; Enter/Space to select') : ''}">
      <span class="cat-stripe" style="background:${cat.color}" aria-hidden="true"></span>
      <span class="course-main">
        <span class="course-code">${escapeHtml(course.code || '')}</span>
        <span class="course-name">${escapeHtml(course.name || '')}</span>
      </span>
      <span class="course-meta">
        ${gradeBadge}
        <span class="course-units">${course.units || 0}cr</span>
      </span>
    </div>`;
}

function pendingMoveBarHtml() {
  if (!tapSelectedId) return '';
  const course = findCourseById(tapSelectedId);
  if (!course) return '';
  return `
    <div class="pending-move-bar" role="status">
      <span>Moving <strong>${escapeHtml(course.code)}</strong> — tap a highlighted semester to place it.</span>
      <button type="button" class="btn btn-secondary" data-action="cancel-move">Cancel</button>
    </div>`;
}

function semesterCardHtml(section) {
  const total = semesterCreditTotal(section);
  const over = isSemesterOverLimit(section);
  const schedulable = isSchedulableTerm(section.term);
  return `
    <div class="semester-card ${schedulable ? '' : 'semester-fixed'}" data-term="${escapeAttr(section.term)}">
      <div class="semester-header">
        <h3>${escapeHtml(section.term)}</h3>
        <span class="semester-credits ${over ? 'over' : ''}">${total} cr</span>
      </div>
      <div class="semester-courses">
        ${section.courses.map((c) => courseChipHtml(c, section.term)).join('') || '<p class="semester-empty">No courses yet.</p>'}
      </div>
    </div>`;
}

export function renderSemesterGrid(container) {
  const { plan, transferred } = planStore.state;
  const schedulable = plan.filter((s) => !BUCKET_TERMS.includes(s.term));
  const buckets = plan.filter((s) => BUCKET_TERMS.includes(s.term));

  const transferSection = buckets.find((s) => s.term === 'Transfer / Test / Prior Credit');
  const transferChips = (transferred || []).map((c) => courseChipHtml({ ...c, historical: false }, transferSection?.term || ''));

  container.innerHTML = `
    <div class="semester-grid">
      ${schedulable.map(semesterCardHtml).join('')}
      <div class="semester-card semester-add">
        <button type="button" class="btn btn-secondary" data-action="add-semester">+ Add Semester</button>
      </div>
    </div>
    <details class="audit-history">
      <summary>Audit history (completed, transferred &amp; in-progress courses)</summary>
      <div class="semester-grid semester-grid-buckets">
        ${buckets
          .map((s) => {
            if (s.term !== 'Transfer / Test / Prior Credit') return semesterCardHtml(s);
            const total = semesterCreditTotal(s) + (transferred || []).reduce((n, c) => n + (c.units || 0), 0);
            return `
              <div class="semester-card semester-fixed" data-term="${escapeAttr(s.term)}">
                <div class="semester-header"><h3>${escapeHtml(s.term)}</h3><span class="semester-credits">${total} cr</span></div>
                <div class="semester-courses">
                  ${s.courses.map((c) => courseChipHtml(c, s.term)).join('')}
                  ${transferChips.join('')}
                  ${!s.courses.length && !transferChips.length ? '<p class="semester-empty">Nothing here yet.</p>' : ''}
                </div>
              </div>`;
          })
          .join('')}
      </div>
    </details>
    ${pendingMoveBarHtml()}`;

  wireCardDropTargets(container);
  if (tapSelectedId) applyTapHighlighting(container);
}

const initializedContainers = new WeakSet();

/** Bind container-level (persistent-element) listeners exactly once per container. */
export function initSemesterGrid(container) {
  if (initializedContainers.has(container)) return;
  initializedContainers.add(container);
  container.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="add-semester"]')) return onAddSemester();
    onClick(e);
  });
  container.addEventListener('keydown', onKeydown);
  container.addEventListener('dragstart', onDragStart);
  container.addEventListener('dragend', onDragEnd);
}

// Drop targets (.semester-card elements) are recreated every render, so their
// listeners never accumulate — no need to track/dedupe these.
function wireCardDropTargets(container) {
  container.querySelectorAll('.semester-card[data-term]').forEach((card) => {
    card.addEventListener('dragover', onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop', onDrop);
  });
}

function onClick(e) {
  if (e.target.closest('[data-action="cancel-move"]')) {
    tapSelectedId = null;
    return rerender();
  }
  const chip = e.target.closest('.course');
  if (tapSelectedId && chip?.dataset.courseId === tapSelectedId) {
    return handleChipActivate(chip); // clicking the already-selected chip again deselects it
  }
  const card = e.target.closest('.semester-card[data-term]');
  // A card full of chips fills most of its area, so a tap meant to "drop here"
  // will usually land on one of those chips rather than blank card space —
  // prioritize completing the pending move whenever the click is anywhere
  // inside a semester card while something is selected.
  if (tapSelectedId && card) return handleTargetActivate(card.dataset.term);
  if (chip) return handleChipActivate(chip);
}

function onKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const chip = e.target.closest('.course');
  if (chip) {
    e.preventDefault();
    handleChipActivate(chip);
    return;
  }
  const card = e.target.closest('.semester-card[data-term]');
  if (card && tapSelectedId) {
    e.preventDefault();
    handleTargetActivate(card.dataset.term);
  }
}

function findCourseById(id) {
  return planStore.findCourse(id)?.course || (planStore.state.transferred || []).find((c) => c.id === id) || null;
}

function handleChipActivate(chipEl) {
  const id = chipEl.dataset.courseId;
  const course = findCourseById(id);
  if (!course) return;

  if (course.picker) {
    openCoursePicker(course);
    return;
  }
  if (course.historical || course.synthetic || course.waived) return;

  if (transferModeOn) {
    if (!isTransferable(course)) return;
    const isAlreadyTransferred = (planStore.state.transferred || []).some((c) => c.id === id);
    if (isAlreadyTransferred) {
      planStore.armAutosave();
      planStore.restoreTransferredCourse(id);
      showToast(`${course.code} restored to your plan.`);
    } else {
      planStore.armAutosave();
      planStore.transferCourse(id);
      showToast(`${course.code} marked as transferred.`);
    }
    rerender();
    return;
  }

  if (!isInteractive(course, chipEl.dataset.term)) return;
  tapSelectedId = tapSelectedId === id ? null : id;
  rerender();
}

function handleTargetActivate(term) {
  const id = tapSelectedId;
  const currentTerm = planStore.findCourse(id)?.section.term;
  tapSelectedId = null;
  if (!id) return;
  if (term === currentTerm) {
    rerender(); // clicking the course's own semester just cancels the selection
    return;
  }
  attemptMove(id, term);
}

function attemptMove(courseId, toTerm) {
  const preview = planStore.previewMove(courseId, toTerm);
  if (preview.ok) {
    planStore.armAutosave();
    planStore.moveCourse(courseId, toTerm);
    rerender();
    return;
  }
  if (preview.level === 'block') {
    showToast(preview.messages[0], { kind: 'error', duration: 5000 });
    rerender();
    return;
  }
  // warn: confirm, then move anyway
  const body = document.createElement('div');
  body.innerHTML = preview.messages.map((m) => `<p>${escapeHtml(m)}</p>`).join('');
  openModal({
    title: 'Heads up',
    bodyEl: body,
    actions: [
      { label: 'Cancel', kind: 'secondary' },
      {
        label: 'Move anyway',
        kind: 'primary',
        onClick: () => {
          planStore.armAutosave();
          planStore.moveCourse(courseId, toTerm);
          rerender();
        },
      },
    ],
  });
}

function onDragStart(e) {
  const chip = e.target.closest('.course[draggable="true"]');
  if (!chip) return;
  e.dataTransfer.setData('text/plain', chip.dataset.courseId);
  e.dataTransfer.effectAllowed = 'move';
  chip.classList.add('dragging');
}

function onDragEnd(e) {
  e.target.closest('.course')?.classList.remove('dragging');
  document.querySelectorAll('.drop-hover, .drop-blocked').forEach((el) => el.classList.remove('drop-hover', 'drop-blocked', 'drop-warn'));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const card = e.currentTarget;
  if (!draggingIdHint) return;
  const preview = planStore.previewMove(draggingIdHint, card.dataset.term);
  card.classList.remove('drop-hover', 'drop-blocked', 'drop-warn');
  card.classList.add(preview.ok ? 'drop-hover' : preview.level === 'block' ? 'drop-blocked' : 'drop-warn');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drop-hover', 'drop-blocked', 'drop-warn');
}

let draggingIdHint = null;
function onDrop(e) {
  e.preventDefault();
  const card = e.currentTarget;
  card.classList.remove('drop-hover', 'drop-blocked', 'drop-warn');
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;
  attemptMove(id, card.dataset.term);
}

function applyTapHighlighting(container) {
  const currentTerm = planStore.findCourse(tapSelectedId)?.section.term;
  container.querySelectorAll('.semester-card[data-term]').forEach((card) => {
    const term = card.dataset.term;
    if (!isSchedulableTerm(term) || term === currentTerm) return;
    const preview = planStore.previewMove(tapSelectedId, term);
    card.classList.toggle('tap-eligible', preview.ok);
    card.classList.toggle('tap-review', !preview.ok && preview.level === 'warn');
  });
}

function onAddSemester() {
  const label = window.prompt('Name this semester (e.g. "Summer — Year 5"):');
  if (!label) return;
  const { plan } = planStore.state;
  const lastSchedulable = [...plan].reverse().find((s) => !BUCKET_TERMS.includes(s.term));
  planStore.armAutosave();
  planStore.addSemester(lastSchedulable?.term, label.trim());
  rerender();
}

let rerenderFn = () => {};
export function onRerender(fn) {
  rerenderFn = fn;
}
function rerender() {
  rerenderFn();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

// Track drag id globally so dragover (which only gets dataTransfer types, not data,
// per the HTML5 DnD spec) can still preview the move while hovering.
document.addEventListener('dragstart', (e) => {
  const chip = e.target.closest?.('.course[draggable="true"]');
  draggingIdHint = chip?.dataset.courseId || null;
});
document.addEventListener('dragend', () => {
  draggingIdHint = null;
});
