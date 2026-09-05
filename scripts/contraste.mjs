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
const ESCURO = cor('sobre-escuro'), ESCURO2 = cor('sobre-escuro-2');

// Os mínimos seguem a WCAG: 4,5:1 para texto de leitura, 3:1 para texto
// grande (>= 24px sem negrito) e para objeto — fronteira de botão, fio,
// ícone, anel de foco. É por isso que barro serve de título grande e
// reprova como parágrafo: o guia da marca e a norma dizem a mesma coisa.
const pares = [
  // ── botão: ameixa nos campos claros, papel cru nos escuros ──
  [PAPEL,  AMEIXA, 'texto',  'rótulo do botão sobre ameixa'],
  [AMEIXA, PAPEL,  'objeto', 'botão de ameixa sobre papel cru'],
  [AMEIXA, LINHO,  'objeto', 'botão de ameixa sobre linho'],
  [PAPEL,  CACAU,  'texto',  'rótulo em papel no hover (fundo cacau)'],
  [CACAU,  PAPEL,  'texto',  'rótulo do botão claro sobre cacau'],
  [PAPEL,  CACAU,  'objeto', 'botão claro sobre campo de cacau'],
  [PAPEL,  AMEIXA, 'objeto', 'botão claro sobre o cartão de ameixa'],

  // ── anel de foco: 3:1 contra o campo em que aparece ──
  [BARRO,       PAPEL,  'objeto', 'anel de foco sobre papel cru'],
  [BARRO,       LINHO,  'objeto', 'anel de foco sobre linho'],
  [BARRO_CLARO, CACAU,  'objeto', 'anel de foco sobre cacau'],
  [BARRO_CLARO, AMEIXA, 'objeto', 'anel de foco sobre ameixa'],

  // ── barro: título grande, ícone e fio. Nunca texto de leitura ──
  [BARRO, PAPEL, 'grande', 'título grande em barro sobre papel cru'],
  [BARRO, LINHO, 'grande', 'título grande em barro sobre linho'],
  [BARRO, PAPEL, 'objeto', 'fio e ícone de barro sobre papel cru'],
  [BARRO, LINHO, 'objeto', 'fio e ícone de barro sobre linho'],
  [BARRO_CLARO, CACAU,  'grande', 'título grande sobre cacau'],
  [BARRO_CLARO, AMEIXA, 'grande', 'título grande sobre o cartão de ameixa'],

  // ── ameixa: destaque, título de força, ênfase ──
  [AMEIXA, PAPEL, 'texto', 'ênfase e etiqueta em ameixa sobre papel cru'],
  [AMEIXA, LINHO, 'texto', 'ênfase e etiqueta em ameixa sobre linho'],

  // ── cacau: o texto de leitura ──
  [CACAU, PAPEL, 'texto', 'texto de leitura sobre papel cru'],
  [CACAU, LINHO, 'texto', 'texto de leitura sobre linho'],

  // ── leitura sobre os campos escuros ──
  [ESCURO,  CACAU,  'texto', 'texto de leitura sobre cacau'],
  [ESCURO2, CACAU,  'texto', 'texto secundário sobre cacau'],
  [ESCURO,  CACAU2, 'texto', 'texto de leitura sobre cacau profundo'],
  [ESCURO2, CACAU2, 'texto', 'texto secundário sobre cacau profundo'],
  [BARRO_CLARO, CACAU,  'texto', 'etiqueta sobre cacau'],
  [BARRO_CLARO, CACAU2, 'texto', 'etiqueta sobre cacau profundo'],

  // ── dentro do cartão de ameixa ──
  [LINHO,       AMEIXA, 'texto', 'texto de leitura sobre ameixa'],
  [PAPEL,       AMEIXA, 'texto', 'ênfase sobre ameixa'],
  [PAPEL,       AMEIXA, 'texto', 'etiqueta sobre ameixa'],
];

let falhas = 0;
console.log('\n  razão   mín   veredito    par');
console.log('  ' + '─'.repeat(72));
for (const [fg, bg, tipo, nota] of pares) {
  const r = razao(fg, bg);
  const min = tipo === 'texto' ? 4.5 : 3;   // grande e objeto: 3:1
  const passa = r >= min;
  if (!passa) falhas++;
  console.log(
    `  ${r.toFixed(2).padStart(5)}:1  ${min.toFixed(1)}   ${(passa ? 'passa' : 'FALHA').padEnd(10)}  ${fg} sobre ${bg} — ${nota}`
  );
}
console.log(`\n  ${falhas === 0 ? '✔ paleta inteira em conformidade' : `✘ ${falhas} par(es) reprovado(s)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
