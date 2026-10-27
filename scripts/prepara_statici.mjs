import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = [
  "app.js",
  "vt-impianti-speciali-v198a.js",
  "vt-centro-operativo-v199.js",
  "vt-completamento-v1910.js",
  "firma-vimertek-solo-grafica.js",
  "assets/pdf.min.mjs",
  "assets/pdf.worker.min.mjs",
  "assets/logo-vimertek.png",
  "assets/copertina-vimertek-definitiva.png",
  "assets/copertina-vimertek-modello.png",
  "assets/copertina-vimertek-pulita.png"
];

for (const file of files) {
  if (!existsSync(file)) throw new Error(`File mancante: ${file}`);
  const dest = join('public', file);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(file, dest);
}
console.log('OK - File statici preparati per la pubblicazione');
