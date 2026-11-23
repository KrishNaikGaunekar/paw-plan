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
import { openDoubleMajorExplorer } from './double-major.js';
import { classifyExtractedAudit, toHistoryChip } from '../audit/upload-flow.js';
import { mergeSecondAudit } from '../state/second-program.js';

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
          <button type="button" class="btn btn-menu" data-action="double-major">Double Major Explorer</button>
          <button type="button" class="btn btn-menu" data-action="second-audit">Add Another Audit…</button>
          ${planStore.state.secondProgram ? `<button type="button" class="btn btn-menu btn-menu-danger" data-action="remove-second">Remove 2nd major (${escapeHtml(planStore.state.secondProgram.name)})</button>` : ''}
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
      <input type="file" accept="application/pdf" class="visually-hidden" data-role="second-file-input" />
    </div>`;

  wire(container);
}

function wire(container) {
  const fileInput = container.querySelector('[data-role="file-input"]');
  const secondInput = container.querySelector('[data-role="second-file-input"]');
  secondInput.addEventListener('change', () => {
    const file = secondInput.files?.[0];
    secondInput.value = ''; // so choosing the same file again still fires
    handleSecondAuditSelected(file);
  });
  container.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Close any open <details> menu after picking an action inside it.
      el.closest('details')?.removeAttribute('open');
      handleAction(e.currentTarget.dataset.action, { fileInput, secondInput });
    });
  });
  fileInput.addEventListener('change', () => handleFileSelected(fileInput.files?.[0]));
}

function handleAction(action, { fileInput, secondInput }) {
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
    case 'double-major':
      openDoubleMajorExplorer(rerenderFn);
      break;
    case 'second-audit':
      openSecondAuditInstructions(secondInput);
      break;
    case 'remove-second':
      planStore.removeSecondProgram();
      showToast('Second major removed from your plan.');
      rerenderFn();
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

  wireDropzone(body, fileInput, handleFileSelected);

  openModal({
    title: 'Upload your Degree Audit',
    bodyEl: body,
    actions: [{ label: 'Cancel', kind: 'secondary' }],
  });
}

function wireDropzone(body, fileInput, onFile) {
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
    onFile(file);
  });
}

// Program name typed in the "Add Another Audit" dialog, read when the file arrives.
let pendingSecondName = '';

function openSecondAuditInstructions(secondInput) {
  const current = planStore.state.secondProgram;
  const body = document.createElement('div');
  body.className = 'upload-instructions';
  body.innerHTML = `
    <p>Adding a second major, or exploring one? Upload its degree audit and Paw Plan adds the
    courses it still needs to your plan, skipping anything your current plan already covers.</p>
    <ol>
      <li>In <strong>MyPack Portal</strong>, open the <strong>Degree Audit</strong> for your second major
        (or run a <strong>What-If</strong> audit for a major you’re considering)</li>
      <li>Press <strong>Ctrl+P</strong> (Cmd+P on Mac) and save it as a PDF</li>
      <li>Name the program below, then drop the file</li>
    </ol>
    <label class="second-name-label">Second major name
      <input type="text" class="second-name-input" data-role="second-name" placeholder="e.g. Economics" value="${escapeHtml(current?.name || '')}" />
    </label>
    <div class="upload-dropzone" tabindex="0" role="button" aria-label="Drop the second degree audit PDF here, or click to browse for a file">
      <p class="upload-dropzone-main">Drag &amp; drop the second Degree Audit PDF here</p>
      <p class="upload-dropzone-sub">or click to browse</p>
    </div>
    ${current ? `<p class="upload-footnote">This replaces the 2nd major currently in your plan (${escapeHtml(current.name)}).</p>` : ''}
  `;
  const nameInput = body.querySelector('[data-role="second-name"]');
  const remember = () => { pendingSecondName = nameInput.value.trim(); };
  nameInput.addEventListener('input', remember);
  remember();
  wireDropzone(body, secondInput, handleSecondAuditSelected);
  openModal({
    title: 'Add Another Degree Audit',
    bodyEl: body,
    actions: [{ label: 'Cancel', kind: 'secondary' }],
  });
}

/** Returns the extracted audit, or null when the PDF has no readable course text. */
async function readAuditFile(file) {
  // Lazy-loaded: pdf.js is a large dependency that only matters once someone
  // actually uploads a file — no reason to ship it in the initial page load.
  const { extractAuditFromPdf } = await import('../audit/pdf-text-extractor.js');
  const extracted = await extractAuditFromPdf(await file.arrayBuffer());
  // A PDF saved as pictures (screenshots, "Microsoft Print to PDF") has no readable text.
  if (extracted.text.replace(/\s/g, '').length < 100 || !/\b[A-Z]{1,4}\s+\d{3}/.test(extracted.text)) return null;
  return extracted;
}

async function handleSecondAuditSelected(file) {
  if (!file) return;
  const name = pendingSecondName || 'Second major';
  closeModal();
  showToast('Reading your second degree audit…');
  try {
    const extracted = await readAuditFile(file);
    if (!extracted) {
      openUnreadablePdfHelp();
      return;
    }
    const { result } = classifyExtractedAudit(extracted);
    const { state } = planStore;
    const merged = mergeSecondAudit(state.plan, state.transferred, result, name, toHistoryChip);
    planStore.setSecondProgram(merged.plan, { name, source: 'audit' });
    if (planStore.state.uploadedMode) planStore.armAutosave();
    showToast(
      `${name} added: ${merged.added} requirement${merged.added === 1 ? '' : 's'} placed in your plan, ${merged.shared} already covered by your current plan.`,
      { kind: 'success', duration: 7000 },
    );
    rerenderFn();
  } catch (err) {
    console.error(err);
    showToast('Could not read that PDF. Make sure it’s a MyPack Degree Audit saved as PDF.', { kind: 'error', duration: 6000 });
  }
}

async function handleFileSelected(file) {
  if (!file) return;
  closeModal();
  showToast('Reading your degree audit…');
  try {
    const extracted = await readAuditFile(file);
    if (!extracted) {
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
