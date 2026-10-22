// Welcome/instructions card (first-time, dismissible — not a fixed blocking header
// like the original), the autosave restore banner, and the flagged-items panel for
// audit rows that need a human look (advisor review / non-degree courses).

import { planStore } from '../state/plan-store.js';

let welcomeDismissed = false;
let pendingRestore = null; // set on boot if an autosave exists and hasn't been resolved yet

export function checkForAutosave() {
  if (planStore.state.uploadedMode) return; // don't clobber a plan already in memory
  const data = planStore.readAutosave();
  if (data) pendingRestore = data;
}

let rerenderFn = () => {};
export function onRerender(fn) {
  rerenderFn = fn;
}

export function renderStatusPanels(container) {
  const { uploadedMode, advisorReview, nonDegree } = planStore.state;
  const parts = [];

  if (pendingRestore) {
    const when = new Date(pendingRestore.savedAt);
    parts.push(`
      <div class="panel panel-restore" role="status">
        <p>You have an autosaved plan from <strong>${when.toLocaleDateString()}</strong> at <strong>${when.toLocaleTimeString()}</strong>.</p>
        <div class="panel-actions">
          <button type="button" class="btn btn-primary" data-action="restore-yes">Restore it</button>
          <button type="button" class="btn btn-secondary" data-action="restore-no">Start fresh</button>
        </div>
      </div>`);
  }

  if (!uploadedMode && !welcomeDismissed) {
    parts.push(`
      <div class="panel panel-welcome">
        <button type="button" class="panel-dismiss" data-action="dismiss-welcome" aria-label="Dismiss">×</button>
        <h2>Plan your path to graduation</h2>
        <p>Upload your MyPack degree audit and Paw Plan lays out a semester-by-semester plan you can drag, adjust, and print for advising meetings. Nothing you upload leaves your browser.</p>
        <details class="panel-details">
          <summary>How it works</summary>
          <ol>
            <li>Upload your Degree Audit PDF (see the Upload button above for exact steps).</li>
            <li>Paw Plan reads it entirely in your browser and fills in what you've already completed.</li>
            <li>Drag courses between semesters, choose electives, and use Transfer Mode for prior/test credit.</li>
            <li>Print an Advising Prep sheet before your next meeting.</li>
          </ol>
        </details>
      </div>`);
  }

  if (uploadedMode && advisorReview?.length) {
    parts.push(`
      <details class="panel panel-flagged" open>
        <summary>${advisorReview.length} item${advisorReview.length === 1 ? '' : 's'} to check with your advisor</summary>
        <ul>
          ${advisorReview
            .map((it) => {
              // Items from older saved plans only have `raw`.
              const label = it.title || it.code ? [it.code, it.title].filter(Boolean).join(' ') : it.raw || 'Unrecognized row';
              return `<li><strong>${escapeHtml(label)}</strong>${it.reason || it.reviewReason ? ` — ${escapeHtml(it.reason || it.reviewReason)}` : ''}</li>`;
            })
            .join('')}
        </ul>
      </details>`);
  }

  if (uploadedMode && nonDegree?.length) {
    const credits = nonDegree.reduce((n, it) => n + (it.units || 0), 0);
    parts.push(`
      <details class="panel panel-nondegree">
        <summary>${nonDegree.length} course${nonDegree.length === 1 ? '' : 's'} on your audit not applied to this degree${credits ? ` (${credits} cr)` : ''}</summary>
        <p class="panel-note">Listed under “Non-degree Courses” on your audit, e.g. duplicates or courses for another program. They don’t count toward Agribusiness Management unless your advisor moves them.</p>
        <ul>
          ${nonDegree.map((it) => `<li>${escapeHtml(it.raw || it.code)}</li>`).join('')}
        </ul>
      </details>`);
  }

  container.innerHTML = parts.join('');
  wire(container);
}

function wire(container) {
  container.querySelector('[data-action="dismiss-welcome"]')?.addEventListener('click', () => {
    welcomeDismissed = true;
    rerenderFn();
  });
  container.querySelector('[data-action="restore-yes"]')?.addEventListener('click', () => {
    planStore.restoreFromAutosave(pendingRestore);
    pendingRestore = null;
    rerenderFn();
  });
  container.querySelector('[data-action="restore-no"]')?.addEventListener('click', () => {
    pendingRestore = null;
    rerenderFn();
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
