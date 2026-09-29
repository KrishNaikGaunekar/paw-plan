// Minimal toast notifications (Save/Load/Reset confirmations, errors).

let root = null;
function getRoot() {
  if (root) return root;
  root = document.createElement('div');
  root.className = 'toast-root';
  root.setAttribute('aria-live', 'polite');
  document.body.appendChild(root);
  return root;
}

export function showToast(message, { kind = 'info', duration = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  getRoot().appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-in'));
  setTimeout(() => {
    el.classList.remove('toast-in');
    setTimeout(() => el.remove(), 200);
  }, duration);
}
