/**
 * Convierte a mayúsculas el valor de inputs de texto en todo el proyecto.
 * Se ejecuta en fase captura para que React reciba el valor ya en mayúsculas.
 */
const SKIP_TYPES = new Set(['number', 'password', 'date', 'datetime-local', 'time', 'month', 'week']);

function shouldUppercase(el) {
  if (!el || typeof el.value !== 'string') return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  const type = (el.type || 'text').toLowerCase();
  return !SKIP_TYPES.has(type);
}

export function initUppercaseInput() {
  const handler = (e) => {
    const el = e.target;
    if (!shouldUppercase(el)) return;
    const raw = el.value;
    const upper = raw.toUpperCase();
    if (upper !== raw) el.value = upper;
  };
  document.addEventListener('input', handler, true);
  return () => document.removeEventListener('input', handler, true);
}
