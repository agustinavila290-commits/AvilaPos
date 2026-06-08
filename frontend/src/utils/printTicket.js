/**
 * Utilidad compartida para impresión de tickets térmicos.
 * Centraliza el CSS de impresión y la gestión de la ventana de impresión.
 */

const TICKET_CSS = (ancho) => `
  @media print {
    @page { size: ${ancho} auto; margin: 0; }
    body { margin: 0; padding: 0; }
  }
  body {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.35;
    margin: 0;
    padding: 4mm;
    width: ${ancho === '80mm' ? '76mm' : '70mm'};
    max-width: 76mm;
  }
  .line        { border-bottom: 1px dashed #000; margin: 6px 0; }
  .line-double { border-bottom: 2px solid #000; margin: 8px 0; }
  .center      { text-align: center; }
  .bold        { font-weight: bold; }
  .small       { font-size: 10px; }
  .row         { display: flex; justify-content: space-between; margin: 2px 0; }
  .row-items   { display: flex; justify-content: space-between; align-items: flex-start; margin: 4px 0; gap: 4px; }
  .item-cod    { font-size: 10px; color: #333; }
  .item-desc   { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-nums   { white-space: nowrap; text-align: right; }
  .total-line  { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
  .total-final { font-size: 13px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
`;

const DEFAULT_CONFIG = { anchoTicket: '72mm', nombreImpresora: '', autoImprimir: false };

export const getPrintConfig = () => {
  try {
    const s = localStorage.getItem('avilapos_impresora');
    if (s) return { ...DEFAULT_CONFIG, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULT_CONFIG };
};

export const savePrintConfig = (cfg) => {
  try { localStorage.setItem('avilapos_impresora', JSON.stringify(cfg)); } catch {}
};

/**
 * Abre una ventana emergente con el HTML del ticket e imprime.
 * @param {string} htmlContent - innerHTML del ref del ticket
 * @param {string} titulo - título de la ventana
 */
export function imprimirTicket(htmlContent, titulo = 'Ticket') {
  const { anchoTicket } = getPrintConfig();
  const w = window.open('', '', 'width=340,height=720');
  if (!w) return; // bloqueador de popups
  w.document.write(
    `<html><head><title>${titulo}</title><style>${TICKET_CSS(anchoTicket)}</style></head>` +
    `<body>${htmlContent}</body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 280);
}
