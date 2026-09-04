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

const pares = [
  ['#0F863B', '#FFFFFF', 'texto', 'rótulo do CTA'],
  ['#0C6E30', '#FFFFFF', 'texto', 'rótulo do CTA em hover'],
  ['#0F863B', '#0C0F0E', 'objeto', 'botão sobre fundo escuro'],
  ['#0F863B', '#FAF8F5', 'objeto', 'botão sobre fundo claro'],
  ['#22C55E', '#0C0F0E', 'objeto', 'anel de foco'],
  ['#F6F4F1', '#0C0F0E', 'texto', 'texto principal sobre escuro'],
  ['#B9C0BB', '#0C0F0E', 'texto', 'texto secundário sobre escuro'],
  ['#14100C', '#FAF8F5', 'texto', 'texto principal sobre claro'],
  ['#4A4741', '#FAF8F5', 'texto', 'texto secundário sobre claro'],
  ['#C9A227', '#0C0F0E', 'texto', 'dourado sobre escuro'],
  ['#14100C', '#C9A227', 'texto', 'texto sobre o badge dourado'],
  ['#A94D29', '#FAF8F5', 'texto', 'terracota do contador'],
  ['#17853F', '#FFFFFF', 'texto', 'rótulo do botão de WhatsApp'],
  ['#126B32', '#FFFFFF', 'texto', 'WhatsApp em hover'],
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
