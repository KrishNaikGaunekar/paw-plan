// Minimal accessible modal helper: focus trap, Escape to close, click-outside to
// close. Every feature modal (upload instructions, course picker, minor explorer,
// what-if, confirmations) is built on this rather than hand-rolling dialog behavior
// four separate times.

let activeModal = null;

export function openModal({ title, bodyEl, actions = [], onClose, labelledBy } = {}) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
  if (title) {
    const h = document.createElement('h2');
    h.className = 'modal-title';
    h.id = titleId;
    h.textContent = title;
    dialog.appendChild(h);
    dialog.setAttribute('aria-labelledby', labelledBy || titleId);
  }

  const body = document.createElement('div');
  body.className = 'modal-body';
  if (bodyEl) body.appendChild(bodyEl);
  dialog.appendChild(body);

  if (actions.length) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'modal-actions';
    actions.forEach((a) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${a.kind === 'primary' ? 'btn-primary' : a.kind === 'danger' ? 'btn-danger' : 'btn-secondary'}`;
      btn.textContent = a.label;
      btn.addEventListener('click', () => {
        const result = a.onClick?.();
        if (result !== false) closeModal();
      });
      actionsEl.appendChild(btn);
    });
    dialog.appendChild(actionsEl);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => closeModal());
  dialog.appendChild(closeBtn);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeModal();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') trapFocus(e, dialog);
  };
  document.addEventListener('keydown', onKeydown);

  activeModal = { overlay, onClose, onKeydown };

  const focusable = dialog.querySelector('input, select, textarea, button, [tabindex]');
  (focusable || dialog).focus?.();

  return { close: closeModal, dialog };
}

function trapFocus(e, dialog) {
  const focusables = dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function closeModal() {
  if (!activeModal) return;
  const { overlay, onClose, onKeydown } = activeModal;
  document.removeEventListener('keydown', onKeydown);
  overlay.remove();
  activeModal = null;
  onClose?.();
}
