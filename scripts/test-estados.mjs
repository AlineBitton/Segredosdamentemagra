/**
 * Constroi a pagina como ela ficara em cada data do ciclo e verifica se a
 * copia continua fazendo sentido.
 *
 * Sem isto, so descobriríamos no dia 26 de setembro que a pagina passou a
 * dizer "Lote Especial · — · o valor sobe em encerrado" e a vender um evento
 * que ja aconteceu.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
let falhas = 0;
const ok = (c, m, d = '') => { console.log(`  ${c ? '  ok  ' : ' FALHA'}  ${m}${!c && d ? `\n          ${d}` : ''}`); if (!c) falhas++; };

const CASOS = [
  { data: '2026-09-04 10:00', lote: 'especial', preco: 'R$ 27', proximo: 'R$ 47', aberto: true },
  { data: '2026-09-12 10:00', lote: 'lote2',    preco: 'R$ 47', proximo: 'R$ 67', aberto: true },
  { data: '2026-09-18 10:00', lote: 'lote3',    preco: 'R$ 67', proximo: 'R$ 97', aberto: true },
  { data: '2026-09-24 10:00', lote: 'lote4',    preco: 'R$ 97', proximo: null,    aberto: true },
  { data: '2026-09-26 10:00', lote: 'encerrado', preco: null,   proximo: null,    aberto: false },
];

for (const c of CASOS) {
  console.log(`\n── ${c.data} · ${c.lote} ─────────────────────────────`);
  execFileSync('node', ['scripts/build.mjs'], {
    cwd: RAIZ, env: { ...process.env, SMM_AGORA: c.data }, stdio: 'pipe',
  });
  const html = readFileSync(path.join(RAIZ, 'dist/index.html'), 'utf8');
  const slot = (n) => (html.match(new RegExp(`data-slot="${n}"[^>]*>([^<]*)`)) || [])[1] || '';
  // procurar "data-encerrado" no documento inteiro acha o seletor dentro do
  // CSS embutido; o que importa e o atributo na tag <html>
  const tagHtml = (html.match(/<html[^>]*>/) || [''])[0];

  ok(html.includes(`data-lote="${c.lote}"`), `<html data-lote="${c.lote}">`);

  if (c.aberto) {
    ok(!tagHtml.includes('data-encerrado'), 'pagina NAO marcada como encerrada', tagHtml);
    ok(slot('preco-comum') === c.preco, `preco do Comum = ${c.preco}`, `veio "${slot('preco-comum')}"`);
    ok(/\d+d \d\dh \d\dm \d\ds/.test(html.match(/data-cd>([^<]*)/)?.[1] || ''),
       'contador com tempo de verdade', html.match(/data-cd>([^<]*)/)?.[1]);
    const aviso = slot('proximo-aviso');
    if (c.proximo) {
      ok(aviso.includes(c.proximo), `aviso cita o proximo preco (${c.proximo})`, aviso);
    } else {
      ok(aviso.includes('último lote') && !aviso.includes('passa para'),
         'ultimo lote nao promete um proximo', aviso);
    }
    ok(!/passa para\s*\./.test(html), 'nenhuma frase sobrando sem preco');
    ok(html.includes('hub.la'), 'links de compra presentes');
  } else {
    ok(tagHtml.includes('data-encerrado'), '<html data-encerrado> marcado', tagHtml);
    ok(html.includes('inscrições para esta edição estão encerradas'), 'aviso de encerrado presente');
    ok(!/o valor sobe em[^<]*<[^>]*>encerrado/.test(html), 'nao diz "o valor sobe em encerrado"');
    ok(slot('proximo-aviso').length > 0, 'aviso final continua sendo uma frase');
  }
}

// restaura o build com o relogio real
execFileSync('node', ['scripts/build.mjs'], { cwd: RAIZ, stdio: 'pipe' });
console.log(`\n  ${falhas === 0 ? '✔ os 5 estados do ciclo estao coerentes' : `✘ ${falhas} falha(s)`}\n`);
process.exit(falhas ? 1 : 0);
