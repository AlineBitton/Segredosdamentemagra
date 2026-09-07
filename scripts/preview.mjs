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
const BASE = process.env.SMM_BASE ?? '';
let html = await readFile(path.join(DIST + BASE, PAGINA), 'utf8');

// O visualizador pode não suportar AVIF; para a revisão, fica só o WebP.
html = html.replace(/<source[^>]*type="image\/avif"[^>]*>/g, '');

// srcset e data URI não convivem: o `data:image/webp;base64,` tem uma
// vírgula, e vírgula é o que separa candidatos no srcset. O navegador lê
// metade de uma URL como um candidato inteiro e não carrega imagem nenhuma.
// Na prévia, cada figura fica com um src só — a maior largura.
html = html.replace(/<source\b[^>]*>/g, '');
html = html.replace(/\ssrcset="[^"]*"/g, '').replace(/\ssizes="[^"]*"/g, '');
html = html.replace(/<link rel="preload" as="image"[^>]*>/g, '');

// Fora o Pixel. A prévia circula por e-mail e WhatsApp para revisão, e cada
// abertura contaria como visita na conta de anúncios: PageView inflado,
// público de remarketing sujo e uma taxa de conversão que despenca sem
// motivo. O site publicado continua com o Pixel; a prévia, não.
//
// Só o bloco que carrega o fbevents.js sai, e no lugar dele entra um fbq que
// não faz nada: o JavaScript da própria página também chama fbq, e apagar os
// dois blocos levaria junto o contador e a barra de compra.
html = html.replace(
  /<script>(?:(?!<\/script>)[\s\S])*?connect\.facebook\.net(?:(?!<\/script>)[\s\S])*?<\/script>/g,
  '<script>window.fbq=function(){}</script>',
);
html = html.replace(/<noscript>\s*<img[^>]*facebook\.com\/tr[^>]*>\s*<\/noscript>/g, '');

const cache = new Map();
async function dataUri(rel) {
  if (cache.has(rel)) return cache.get(rel);
  // o build emite caminho relativo na raiz (img/foto.webp) e absoluto com
  // prefixo quando ha subcaminho (/smm/img/foto.webp): os dois viram o mesmo
  // arquivo dentro de dist/
  const f = path.join(DIST, rel.replace(/^\//, ''));
  if (!existsSync(f)) return null;
  const b = await readFile(f);
  const uri = `data:${MIME[path.extname(f)] || 'application/octet-stream'};base64,${b.toString('base64')}`;
  cache.set(rel, uri);
  return uri;
}

const alvos = [...new Set(
  [...html.matchAll(/["'(]((?:\/smm)?\/?(?:fonts|img)\/[^"')\s,]+)["')\s]/g)].map((m) => m[1]),
)];
let trocados = 0;
for (const rel of alvos) {
  const uri = await dataUri(rel);
  if (!uri) { console.log(`  ! nao encontrado: ${rel}`); continue; }
  html = html.split(rel).join(uri);
  trocados++;
}

const nome = PAGINA.replace(/\.html$/, '').replace(/^index$/, 'venda');
const saida = path.join(RAIZ, `previa-${nome}.html`);
await writeFile(saida, html);
const { size } = await stat(saida);
console.log(`\n  ${trocados} arquivos embutidos`);
console.log(`  ${path.basename(saida)}  ${(size / 1024 / 1024).toFixed(2)} MB\n`);
