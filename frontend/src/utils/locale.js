/**
 * Configuración de locale para todo el frontend (español - Argentina)
 */
export const LOCALE = 'es-AR';
export const CURRENCY = 'ARS';

/** Formatea una fecha en español */
export const formatDate = (date, options = { dateStyle: 'short' }) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(LOCALE, options);
};

/** Formatea fecha y hora en español */
export const formatDateTime = (date, options = { dateStyle: 'short', timeStyle: 'short' }) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(LOCALE, options);
};

/** Formatea moneda en pesos argentinos */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
  }).format(value ?? 0);
};

/** Formatea número con separadores de miles en español */
export const formatNumber = (value, options = {}) => {
  return new Intl.NumberFormat(LOCALE, options).format(value ?? 0);
};
