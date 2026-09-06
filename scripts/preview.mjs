/**
 * Gera uma cópia da página com TUDO embutido — fontes e imagens viram data URI —
 * para abrir num visualizador que não tem servidor por trás.
 *
 * É só para revisão. O que vai para produção continua sendo o dist/, com os
 * arquivos separados, cacheáveis e sob CSP.
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png' };

const PAGINA = process.env.SMM_PAGINA || 'index.html';
let html = await readFile(path.join(DIST, PAGINA), 'utf8');

// O visualizador pode não suportar AVIF; para a revisão, fica só o WebP.
html = html.replace(/<source[^>]*type="image\/avif"[^>]*>/g, '');

const cache = new Map();
async function dataUri(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const f = path.join(DIST, rel.replace(/^\//, ''));
  if (!existsSync(f)) return null;
  const b = await readFile(f);
  const uri = `data:${MIME[path.extname(f)] || 'application/octet-stream'};base64,${b.toString('base64')}`;
  cache.set(rel, uri);
  return uri;
}

const alvos = [...new Set([...html.matchAll(/["'(](\/(?:fonts|img)\/[^"')\s]+)["')]/g)].map((m) => m[1]))];
let trocados = 0;
for (const rel of alvos) {
  const uri = await dataUri(rel);
  if (!uri) { console.log(`  ! nao encontrado: ${rel}`); continue; }
  html = html.split(rel).join(uri);
  trocados++;
}

// aviso discreto de que isto é uma prévia, não o site publicado
// O selo usa a paleta da marca: ameixa com papel cru. O dourado antigo
// era de outro sistema de cor e aparecia por cima da prévia inteira.
html = html.replace('</body>', `<div style="position:fixed;left:12px;bottom:12px;z-index:200;
  background:#5E3A46;color:#F2EDE5;font:500 12px/1 system-ui,sans-serif;
  padding:8px 12px;border-radius:999px;letter-spacing:.06em">prévia para aprovação</div></body>`);

const nome = PAGINA.replace(/\.html$/, '');
const saida = path.join(RAIZ, `previa-${nome}.html`);
await writeFile(saida, html);
const { size } = await stat(saida);
console.log(`\n  ${trocados} arquivos embutidos`);
console.log(`  ${path.basename(saida)}  ${(size / 1024 / 1024).toFixed(2)} MB\n`);
