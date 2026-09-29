// "What-If" scenario planner. The original's exact slider UI wasn't traceable from
// the DOM (see NOTES-original-behavior.md "What-If scenario planner") — this is a new
// control built on the same underlying credit math: pick a target credits/semester
// load and see the projected number of semesters (and graduation term) needed for
// the credits still remaining.

import { computeWhatIf, TARGET_LOAD, TOTAL_DEGREE_CREDITS } from '../state/credit-rules.js';
import { planStore } from '../state/plan-store.js';
import { openModal } from './modal.js';

function nextTerms(fromCount, count) {
  // Simple Fall/Spring alternation label generator for the projection list.
  const labels = [];
  let season = fromCount % 2 === 0 ? 'Fall' : 'Spring';
  let year = Math.floor(fromCount / 2) + 1;
  for (let i = 0; i < count; i++) {
    labels.push(`${season} — Year ${year}`);
    if (season === 'Fall') {
      season = 'Spring';
    } else {
      season = 'Fall';
      year += 1;
    }
  }
  return labels;
}

export function openWhatIf() {
  const { completed, inProgress, remaining, timeline } = computeWhatIf(planStore.state);

  const body = document.createElement('div');
  body.className = 'whatif';

  const render = (creditsPerSem) => {
    const semestersNeeded = creditsPerSem > 0 ? Math.ceil(remaining / creditsPerSem) : 0;
    const projected = nextTerms(timeline.length, semestersNeeded);
    body.innerHTML = `
      <div class="whatif-summary">
        <div><strong>${completed}</strong><span>credits completed</span></div>
        <div><strong>${inProgress}</strong><span>credits in progress</span></div>
        <div><strong>${remaining}</strong><span>credits remaining</span></div>
        <div><strong>${TOTAL_DEGREE_CREDITS}</strong><span>total required</span></div>
      </div>

      <h3>Current planned load</h3>
      <ul class="whatif-timeline">
        ${timeline.map((t) => `<li><span>${escapeHtml(t.term)}</span><span class="whatif-bar" style="--pct:${Math.min(100, (t.credits / 18) * 100)}%">${t.credits} cr</span></li>`).join('') || '<li>No future semesters planned yet.</li>'}
      </ul>

      <h3>Scenario: take a fixed credit load</h3>
      <label class="whatif-slider-label">
        Credits per semester: <strong>${creditsPerSem}</strong>
        <input type="range" min="3" max="21" step="1" value="${creditsPerSem}" data-role="credits-slider" />
      </label>
      <p class="whatif-result">
        At <strong>${creditsPerSem} cr/semester</strong>, you'd need about <strong>${semestersNeeded}</strong> more semester${semestersNeeded === 1 ? '' : 's'}
        ${projected.length ? `— roughly through <strong>${projected[projected.length - 1]}</strong>.` : '.'}
      </p>
    `;
    body.querySelector('[data-role="credits-slider"]').addEventListener('input', (e) => render(Number(e.target.value)));
  };

  render(TARGET_LOAD);
  openModal({ title: 'What-If Planner', bodyEl: body });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
