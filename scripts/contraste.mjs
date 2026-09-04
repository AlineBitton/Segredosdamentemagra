/** Verifica, por cálculo WCAG 2.1, todo par de cores do sistema de design. */
const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const L = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const razao = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Lê a paleta de tokens.css: nenhum valor fica escrito duas vezes, então
// trocar uma cor no sistema quebra este teste em vez de passar despercebido.
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const cor = (nome) => {
  const m = css.match(new RegExp(`--${nome}\\s*:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token --${nome} nao encontrado em tokens.css`);
  return m[1].toUpperCase();
};
const PAPEL  = cor('papel'),  LINHO   = cor('linho');
const CACAU  = cor('cacau'),  CACAU2  = cor('cacau-2');
const AMEIXA = cor('ameixa'), BARRO   = cor('barro'), BARRO_CLARO = cor('barro-claro');
const VERDE  = cor('verde'),  VERDE2  = cor('verde-2'), ANEL = cor('verde-anel');
const CLARO  = cor('sobre-claro'),  CLARO2  = cor('sobre-claro-2');
const ESCURO = cor('sobre-escuro'), ESCURO2 = cor('sobre-escuro-2');

const pares = [
  // ── ação: o verde só existe dentro do botão ──
  [VERDE,  '#FFFFFF', 'texto',  'rótulo do CTA'],
  [VERDE2, '#FFFFFF', 'texto',  'rótulo do CTA em hover'],
  [ANEL,   CACAU,     'objeto', 'fio do botão sobre campo de cacau'],
  [VERDE,  PAPEL,     'objeto', 'botão sobre campo de papel cru'],
  [VERDE,  LINHO,     'objeto', 'botão sobre campo de linho'],
  [ANEL,   CACAU,     'objeto', 'anel de foco sobre cacau'],
  [VERDE,  PAPEL,     'objeto', 'anel de foco sobre papel cru'],
  [VERDE,  LINHO,     'objeto', 'anel de foco sobre linho'],

  // ── leitura sobre os dois campos de respiro ──
  [CLARO,   PAPEL, 'texto', 'texto de leitura (cacau) sobre papel cru'],
  [CLARO,   LINHO, 'texto', 'texto de leitura (cacau) sobre linho'],
  [CLARO2,  PAPEL, 'texto', 'texto secundário (ameixa) sobre papel cru'],
  [CLARO2,  LINHO, 'texto', 'texto secundário (ameixa) sobre linho'],
  [AMEIXA,  PAPEL, 'texto', 'título de força em ameixa sobre papel cru'],
  [AMEIXA,  LINHO, 'texto', 'título de força em ameixa sobre linho'],

  // ── leitura sobre a âncora escura ──
  [ESCURO,  CACAU,  'texto', 'texto principal sobre cacau'],
  [ESCURO2, CACAU,  'texto', 'texto secundário sobre cacau'],
  [ESCURO,  CACAU2, 'texto', 'texto principal sobre cacau profundo'],
  [ESCURO2, CACAU2, 'texto', 'texto secundário sobre cacau profundo'],
  [BARRO_CLARO, CACAU,  'texto', 'etiqueta em barro clareado sobre cacau'],
  [BARRO_CLARO, CACAU2, 'texto', 'etiqueta em barro clareado sobre cacau profundo'],

  // ── barro: traço e etiqueta, nunca parágrafo ──
  [BARRO, PAPEL, 'objeto', 'fio de barro sobre papel cru'],
  [BARRO, LINHO, 'objeto', 'fio de barro sobre linho'],

  [AMEIXA, PAPEL, 'texto', 'etiqueta em ameixa sobre papel cru'],
  [AMEIXA, LINHO, 'texto', 'etiqueta em ameixa sobre linho'],

  // ── selo do VIP ──
  [PAPEL, AMEIXA, 'texto', 'texto do selo sobre ameixa'],
];

let falhas = 0;
console.log('\n  razão   mín   veredito    par');
console.log('  ' + '─'.repeat(72));
for (const [fg, bg, tipo, nota] of pares) {
  const r = razao(fg, bg);
  const min = tipo === 'texto' ? 4.5 : 3;
  const passa = r >= min;
  if (!passa) falhas++;
  console.log(
    `  ${r.toFixed(2).padStart(5)}:1  ${min.toFixed(1)}   ${(passa ? 'passa' : 'FALHA').padEnd(10)}  ${fg} sobre ${bg} — ${nota}`
  );
}
console.log(`\n  ${falhas === 0 ? '✔ paleta inteira em conformidade' : `✘ ${falhas} par(es) reprovado(s)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
