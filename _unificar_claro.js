const fs = require('fs');

const files = [
  'c:/Users/Agustin/Documents/Avila/frontend/src/pages/PuntoVenta.jsx',
  'c:/Users/Agustin/Documents/Avila/frontend/src/components/Layout.jsx',
  'c:/Users/Agustin/Documents/Avila/frontend/src/components/PresupuestoPrint.jsx',
  'c:/Users/Agustin/Documents/Avila/frontend/src/components/SeleccionarClienteModal.jsx',
  'c:/Users/Agustin/Documents/Avila/frontend/src/components/TicketTermico.jsx'
];

for (const file of files) {
  let txt = fs.readFileSync(file, 'utf8');

  // Elimina utilidades dark:* dentro de className.
  txt = txt.replace(/\sdark:[^\s"'`]+/g, '');

  // Limpia espacios dobles creados por el reemplazo.
  txt = txt.replace(/\s{2,}/g, ' ');

  // Ajustes de estilo global claro para consistencia.
  txt = txt.replace(/bg-black bg-opacity-50/g, 'bg-slate-900/35');
  txt = txt.replace(/bg-gray-50/g, 'bg-slate-50');
  txt = txt.replace(/text-gray-800/g, 'text-slate-800');
  txt = txt.replace(/text-gray-700/g, 'text-slate-700');
  txt = txt.replace(/text-gray-600/g, 'text-slate-600');
  txt = txt.replace(/text-gray-500/g, 'text-slate-500');
  txt = txt.replace(/border-gray-200/g, 'border-slate-200');
  txt = txt.replace(/border-gray-100/g, 'border-slate-100');

  fs.writeFileSync(file, txt, 'utf8');
}

console.log('Unificación clara aplicada en 5 archivos.');
