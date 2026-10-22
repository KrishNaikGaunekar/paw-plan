// One primary action (Upload) + two grouped menus (Plan tools / Session), instead of
// the original's row of ~8 equal-weight buttons. See NOTES-original-behavior.md
// "Degree audit upload" for the exact 4-step upload instructions copy — it's the
// only guidance students get for finding the right PDF, so it's preserved verbatim.

import { planStore } from '../state/plan-store.js';
import { buildPlanFromAudit } from '../audit/upload-flow.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import { setTransferMode, isTransferMode } from './semester-grid.js';
import { openMinorExplorer } from './minor-explorer.js';
import { openWhatIf } from './whatif-modal.js';
import { openAdvisingPrep } from './advising-prep-export.js';

let rerenderFn = () => {};
export function onRerender(fn) {
  rerenderFn = fn;
}

export function renderToolbar(container) {
  const transferOn = isTransferMode();
  container.innerHTML = `
    <div class="toolbar">
      <button type="button" class="btn btn-primary" data-action="upload">Upload Degree Audit</button>

      <details class="toolbar-menu">
        <summary class="btn btn-secondary">Plan tools ▾</summary>
        <div class="toolbar-menu-panel">
          <button type="button" class="btn btn-menu ${transferOn ? 'btn-menu-active' : ''}" data-action="transfer-mode">
            ${transferOn ? '✓ Transfer Mode (on)' : 'Transfer Mode'}
          </button>
          <button type="button" class="btn btn-menu" data-action="minor-explorer">Minor Explorer</button>
          <button type="button" class="btn btn-menu" data-action="whatif">What-If Planner</button>
          <button type="button" class="btn btn-menu" data-action="advising-prep">Advising Prep (print)</button>
        </div>
      </details>

      <details class="toolbar-menu">
        <summary class="btn btn-secondary">Session ▾</summary>
        <div class="toolbar-menu-panel">
          <button type="button" class="btn btn-menu" data-action="undo" ${planStore.canUndo() ? '' : 'disabled'}>Undo</button>
          <button type="button" class="btn btn-menu" data-action="save">Save Plan…</button>
          <button type="button" class="btn btn-menu" data-action="load">Load Plan…</button>
          <button type="button" class="btn btn-menu btn-menu-danger" data-action="reset">Reset Plan</button>
        </div>
      </details>

      <input type="file" accept="application/pdf" class="visually-hidden" data-role="file-input" />
    </div>`;

  wire(container);
}

function wire(container) {
  const fileInput = container.querySelector('[data-role="file-input"]');
  container.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Close any open <details> menu after picking an action inside it.
      el.closest('details')?.removeAttribute('open');
      handleAction(e.currentTarget.dataset.action, { fileInput });
    });
  });
  fileInput.addEventListener('change', () => handleFileSelected(fileInput.files?.[0]));
}

function handleAction(action, { fileInput }) {
  switch (action) {
    case 'upload':
      openUploadInstructions(fileInput);
      break;
    case 'transfer-mode':
      setTransferMode(!isTransferMode());
      rerenderFn();
      break;
    case 'minor-explorer':
      openMinorExplorer();
      break;
    case 'whatif':
      openWhatIf();
      break;
    case 'advising-prep':
      openAdvisingPrep();
      break;
    case 'undo':
      planStore.undo();
      rerenderFn();
      break;
    case 'save':
      saveToFile();
      break;
    case 'load':
      loadFromFile();
      break;
    case 'reset':
      confirmReset();
      break;
  }
}

function openUploadInstructions(fileInput) {
  const body = document.createElement('div');
  body.className = 'upload-instructions';
  body.innerHTML = `
    <ol>
      <li>Go to <strong>MyPack Portal</strong> → click <strong>Degree Audit</strong></li>
      <li>Press <strong>Ctrl+P</strong> (Cmd+P on Mac) to open Print</li>
      <li>Change destination to <strong>“Save as PDF”</strong></li>
      <li>Click <strong>Save</strong>, then drop the file below</li>
    </ol>
    <p class="upload-footnote">Advanced option: Paw Plan can also attempt to read an unofficial transcript, but the Degree Audit is recommended.</p>
    <div class="upload-dropzone" tabindex="0" role="button" aria-label="Drop your Degree Audit PDF here, or click to browse for a file">
      <p class="upload-dropzone-main">Drag &amp; drop your Degree Audit PDF here</p>
      <p class="upload-dropzone-sub">or click to browse</p>
    </div>
  `;

  const dropzone = body.querySelector('.upload-dropzone');
  const openBrowser = () => fileInput.click();
  dropzone.addEventListener('click', openBrowser);
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBrowser(); }
  });
  ['dragenter', 'dragover'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('upload-dropzone-active'); })
  );
  ['dragleave', 'dragend'].forEach((evt) =>
    dropzone.addEventListener(evt, () => dropzone.classList.remove('upload-dropzone-active'))
  );
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('upload-dropzone-active');
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('That doesn’t look like a PDF — please drop your saved Degree Audit PDF.', { kind: 'error' });
      return;
    }
    handleFileSelected(file);
  });

  openModal({
    title: 'Upload your Degree Audit',
    bodyEl: body,
    actions: [{ label: 'Cancel', kind: 'secondary' }],
  });
}

async function handleFileSelected(file) {
  if (!file) return;
  closeModal();
  showToast('Reading your degree audit…');
  try {
    // Lazy-loaded: pdf.js is a large dependency that only matters once someone
    // actually uploads a file — no reason to ship it in the initial page load.
    const { extractAuditFromPdf } = await import('../audit/pdf-text-extractor.js');
    const buffer = await file.arrayBuffer();
    const extracted = await extractAuditFromPdf(buffer);
    // A PDF saved as pictures (screenshots, "Microsoft Print to PDF") has no readable text.
    if (extracted.text.replace(/\s/g, '').length < 100 || !/\b[A-Z]{1,4}\s+\d{3}/.test(extracted.text)) {
      openUnreadablePdfHelp();
      return;
    }
    const { plan, advisorReview, nonDegree, summary } = buildPlanFromAudit(extracted);
    planStore.loadAuditPlan(plan, { advisorReview, nonDegree });
    planStore.armAutosave();
    showToast(
      `Degree audit loaded: ${summary.takenCredits} cr taken, ${summary.inProgressCredits} cr in progress, ${summary.remainingCredits} cr left to plan.`,
      { kind: 'success', duration: 6000 },
    );
    rerenderFn();
  } catch (err) {
    console.error(err);
    showToast('Could not read that PDF. Make sure it’s a MyPack Degree Audit saved as PDF.', { kind: 'error', duration: 6000 });
  }
}

function openUnreadablePdfHelp() {
  const body = document.createElement('div');
  body.className = 'upload-instructions';
  body.innerHTML = `
    <p>Paw Plan couldn’t find any course information in this PDF. It was probably saved as a picture
    (a screenshot, or printed with “Microsoft Print to PDF”) instead of as text.</p>
    <ol>
      <li>Open your degree audit in <strong>MyPack</strong></li>
      <li>Press <strong>Ctrl+P</strong> (Cmd+P on Mac)</li>
      <li>Set the destination to <strong>“Save as PDF”</strong>, not “Microsoft Print to PDF”</li>
      <li>Upload that PDF to Paw Plan</li>
    </ol>
  `;
  openModal({
    title: 'Could not read this PDF',
    bodyEl: body,
    actions: [{ label: 'OK', kind: 'secondary' }],
  });
}

function saveToFile() {
  const data = planStore.exportSaveData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'agbus-degree-plan.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Plan saved!');
}

function loadFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      planStore.importSaveData(data);
      showToast('Plan loaded successfully!', { kind: 'success' });
      rerenderFn();
    } catch (err) {
      showToast(err.message === 'Invalid plan file' ? 'Invalid plan file' : `Error reading file: ${err.message}`, { kind: 'error' });
    }
  });
  input.click();
}

function confirmReset() {
  const body = document.createElement('p');
  body.textContent = 'This clears your entire working plan, including undo history. This cannot be undone. Continue?';
  openModal({
    title: 'Reset plan?',
    bodyEl: body,
    actions: [
      { label: 'Cancel', kind: 'secondary' },
      {
        label: 'Reset',
        kind: 'danger',
        onClick: () => {
          planStore.reset();
          rerenderFn();
        },
      },
    ],
  });
}
