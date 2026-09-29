// The searchable "Click to choose" modal for a dashed-border picker slot.

import { openModal, closeModal } from './modal.js';
import { resolvePickerOptions } from './picker-options.js';
import { planStore } from '../state/plan-store.js';
import { showToast } from './toast.js';

function flattenGroups(groups) {
  return groups.flatMap((g) => g.courses.map((c) => ({ ...c, group: g.g })));
}

export function openCoursePicker(placeholder) {
  const resolved = resolvePickerOptions(placeholder.picker);
  const allCourses = resolved.mode === 'grouped' ? flattenGroups(resolved.groups) : resolved.mode === 'flat' ? resolved.courses : [];

  const body = document.createElement('div');
  body.className = 'picker-body';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'picker-search';
  search.placeholder = 'Search by course code or title…';
  search.setAttribute('aria-label', 'Search courses');
  body.appendChild(search);

  const list = document.createElement('div');
  list.className = 'picker-list';
  body.appendChild(list);

  const choose = (course) => {
    planStore.armAutosave();
    planStore.pickCourse(placeholder.id, course);
    showToast(`${course.c} added to your plan.`);
    closeModal();
  };

  function renderList(filter) {
    list.innerHTML = '';
    const f = filter.trim().toLowerCase();
    const matches = allCourses.filter((c) => !f || c.c.toLowerCase().includes(f) || c.n.toLowerCase().includes(f));
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'picker-empty';
      empty.textContent = 'No courses match your search.';
      list.appendChild(empty);
      return;
    }
    let lastGroup = null;
    matches.forEach((course) => {
      if (course.group && course.group !== lastGroup) {
        lastGroup = course.group;
        const heading = document.createElement('div');
        heading.className = 'picker-group-heading';
        heading.textContent = course.group;
        list.appendChild(heading);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'picker-option';
      btn.innerHTML = `<span class="picker-option-code">${escapeHtml(course.c)}</span><span class="picker-option-name">${escapeHtml(course.n)}</span>`;
      btn.addEventListener('click', () => choose(course));
      list.appendChild(btn);
    });
  }

  search.addEventListener('input', () => renderList(search.value));
  renderList('');

  const freetextRule = resolved.mode === 'freetext' ? resolved : resolved.freetext;
  if (freetextRule) {
    const wrap = document.createElement('div');
    wrap.className = 'picker-freetext';
    const hint = document.createElement('p');
    hint.className = 'picker-freetext-hint';
    hint.textContent = freetextRule.hint;
    const row = document.createElement('div');
    row.className = 'picker-freetext-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. ARE 495';
    input.className = 'picker-freetext-input';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary';
    addBtn.textContent = 'Use this code';
    addBtn.addEventListener('click', () => {
      const code = input.value.trim().toUpperCase();
      if (!code) return;
      if (!freetextRule.validate(code)) {
        showToast('That course code doesn’t look eligible for this slot — check with your advisor.', { kind: 'error' });
        return;
      }
      choose({ c: code, n: code });
    });
    row.appendChild(input);
    row.appendChild(addBtn);
    wrap.appendChild(hint);
    wrap.appendChild(row);
    body.appendChild(wrap);
  }

  openModal({ title: `Choose: ${placeholder.code}`, bodyEl: body });
  setTimeout(() => search.focus(), 0);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
