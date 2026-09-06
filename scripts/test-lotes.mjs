/**
 * Prova que as fronteiras gravadas em UTC correspondem, minuto a minuto,
 * às datas que a Aline definiu no horário de Brasília.
 * Roda com: npm test
 */
import { LOTES, checkoutComum, loteAtivo, proximoLote, segundosAteVirada, brl, escolherPromessa } from '../config/oferta.mjs';

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  ok  ' : ' FALHA'}  ${msg}`);
  if (!cond) falhas++;
};

/** Converte "2026-09-09 23:59:59" em Brasília (UTC-3) para ms epoch. */
const brt = (s) => Date.parse(s.replace(' ', 'T') + '-03:00');

/** Como o instante UTC aparece no relógio de São Paulo. */
const emSP = (iso) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  })
    .format(new Date(iso))
    .replace(',', ''); // pt-BR insere vírgula entre data e hora

console.log('\n── fronteiras em horário de Brasília ───────────────────────');
const esperado = ['09/09/2026 23:59:59', '15/09/2026 23:59:59', '22/09/2026 23:59:59', '25/09/2026 23:59:59'];
LOTES.forEach((l, i) => {
  ok(emSP(l.fim) === esperado[i], `${l.nome.padEnd(14)} termina ${emSP(l.fim)} BRT`);
});

console.log('\n── lote ativo por data ─────────────────────────────────────');
const casos = [
  ['2026-09-04 10:00:00', 'especial', 'hoje'],
  ['2026-09-09 23:59:59', 'especial', 'último segundo do Lote Especial'],
  ['2026-09-10 00:00:00', 'lote2',    'o dia 10 inteiro já é o 2º lote'],
  ['2026-09-10 23:59:59', 'lote2',    'fim do dia 10, ainda o 2º lote'],
  ['2026-09-15 23:59:59', 'lote2',    'último segundo do 2º lote'],
  ['2026-09-16 00:00:00', 'lote3',    'virada para o 3º lote'],
  ['2026-09-22 23:59:59', 'lote3',    'último segundo do 3º lote'],
  ['2026-09-23 00:00:00', 'lote4',    'virada para o último lote'],
  ['2026-09-25 23:59:59', 'lote4',    'último segundo de vendas'],
  ['2026-09-26 00:00:00', 'encerrado','vendas encerradas'],
];
for (const [data, id, nota] of casos) {
  const l = loteAtivo(brt(data));
  ok(l.id === id, `${data} BRT → ${l.id.padEnd(10)} (${nota})`);
}

console.log('\n── preços ──────────────────────────────────────────────────');
ok(brl(loteAtivo(brt('2026-09-04 10:00:00')).centavos) === 'R$ 27', 'lote especial = R$ 27');
ok(brl(loteAtivo(brt('2026-09-12 10:00:00')).centavos) === 'R$ 47', '2º lote = R$ 47');
ok(brl(loteAtivo(brt('2026-09-18 10:00:00')).centavos) === 'R$ 67', '3º lote = R$ 67');
ok(brl(loteAtivo(brt('2026-09-24 10:00:00')).centavos) === 'R$ 97', 'último lote = R$ 97');
ok(brl(19700) === 'R$ 197', 'VIP = R$ 197');

console.log('\n── próximo lote e contador ─────────────────────────────────');
ok(proximoLote(brt('2026-09-04 10:00:00')).centavos === 4700, 'depois do especial vem R$ 47');
ok(proximoLote(brt('2026-09-24 10:00:00')) === null, 'o último lote não tem próximo');
const s = segundosAteVirada(brt('2026-09-09 23:59:00'));
ok(s === 60, `faltando 60s para a virada, o motor devolve ${s}`);

console.log('\n── um checkout por lote ────────────────────────────────────');
{
  const links = LOTES.map((l) => checkoutComum(l));
  ok(new Set(links).size === LOTES.length, 'os 4 lotes tem links DIFERENTES');
  LOTES.forEach((l, i) => {
    ok(/^https:\/\/pay\.hub\.la\/[A-Za-z0-9]+$/.test(links[i]),
       `${l.nome.padEnd(14)} ${brl(l.centavos).padEnd(6)} -> ${links[i].split('/').pop()}`);
  });
}

console.log('\n── troca de promessa ───────────────────────────────────────');
const q = (s) => new URLSearchParams(s);
ok(escolherPromessa(q('')).id === 'padrao', 'sem parâmetro → padrão');
ok(escolherPromessa(q('p=edepois')).id === 'edepois', '?p=edepois → variante edepois');
ok(escolherPromessa(q('p=EDEPOIS')).id === 'edepois', 'caixa alta é normalizada');
ok(escolherPromessa(q('p=inexistente')).id === 'padrao', 'variante inválida cai no padrão');
ok(escolherPromessa(q('utm_content=93')).id === '93', 'utm_content também seleciona');

console.log(`\n${falhas === 0 ? '✔ todos os testes passaram' : `✘ ${falhas} falha(s)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
