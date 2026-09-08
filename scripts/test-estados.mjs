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
import { EVENTO, PAGINA_POS_COMPRA } from '../config/oferta.mjs';

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
  const base = process.env.SMM_BASE ?? '';
  const html = readFileSync(path.join(RAIZ, 'dist' + base, 'index.html'), 'utf8');
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
      ok(aviso.includes('fecham') && !aviso.includes('passa para'),
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

/*
 * Todo data-slot precisa existir nos dois lados.
 *
 * O build preenche o slot com o valor da hora do build; a funcao de borda
 * repreenche com o valor da hora da visita. Se a borda nao conhece um slot,
 * ele nao quebra nem aparece vazio — ele congela, calado, no que era verdade
 * no dia do deploy. Foi assim que a variante B do teste A/B ficou sem a linha
 * de gancho: o slot existia no HTML, o build preenchia, e a borda ignorava.
 */
console.log('\n── slots: build e borda falam do mesmo conjunto ─────────');
const htmlFinal = readFileSync(path.join(RAIZ, 'dist', 'index.html'), 'utf8');
const borda = readFileSync(path.join(RAIZ, 'worker', 'index.js'), 'utf8');

const naPagina = new Set([...htmlFinal.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]));
const naBorda = new Set([
  ...borda.matchAll(/^\s*'([a-z0-9-]+)':/gm),          // chaves do mapa `textos`
  ...borda.matchAll(/textos\['([a-z0-9-]+)'\]/g),       // as adicionadas depois
  ...borda.matchAll(/\[data-slot="([^"]+)"\]/g),        // as com marcacao propria
].map((m) => m[1]));

for (const nome of [...naPagina].sort()) {
  ok(naBorda.has(nome), `a borda repreenche "${nome}"`,
     'o slot existe na pagina e ninguem o atualiza na visita');
}
/*
 * O contador precisa de uma ancora, e da ancora CERTA para cada pagina.
 *
 * O app.js procura UM elemento com data-deadline para saber ate quando
 * contar. Sem ele desiste calado, e os numeros ficam parados no valor do
 * carregamento — foi o que aconteceu com a pagina de venda quando o contador
 * do hero saiu e a ancora foi junto.
 *
 * E a ancora tem de apontar para o alvo daquela pagina: a venda conta ate a
 * virada do lote, a pos-compra ate a aula de abertura. Ja saiu errado uma vez,
 * com o rotulo dizendo "ate a aula de abertura" sobre a contagem do lote.
 */
/*
 * O botao de compra tem de vender mesmo sem a borda.
 *
 * A borda troca o href por /ir/<tipo>, que resolve a campanha no clique. Mas
 * o HTML ESTATICO precisa continuar apontando direto para a hub.la: se o
 * Worker falhar e a pagina for servida crua, perde-se a atribuicao daquela
 * venda — nunca a venda.
 */
console.log('\n── botao de compra: vende mesmo sem a borda ─────────────');
{
  const doc = readFileSync(path.join(RAIZ, 'dist', 'index.html'), 'utf8');
  const botoes = [...doc.matchAll(/<a[^>]*data-checkout="([^"]+)"[^>]*>/g)];
  ok(botoes.length > 0, 'a pagina tem botao de compra', 'nenhum [data-checkout] no HTML');
  for (const [tag, tipo] of botoes) {
    const href = (tag.match(/href="([^"]*)"/) || [])[1] || '';
    ok(href.includes('hub.la'), `${tipo}: href estatico aponta para a hub.la`,
       `veio "${href}" — sem a borda, este botao nao vende`);
  }
  const borda = readFileSync(path.join(RAIZ, 'worker', 'index.js'), 'utf8');
  ok(/\/ir\/\$\{qual\}/.test(borda), 'a borda troca o href pelo desvio /ir/');
  ok(/COOKIE_ATRIB/.test(borda) && /irParaCheckout/.test(borda),
     'o desvio le a campanha do cookie',
     'sem isso a UTM so chega para quem clica na mesma visita em que chegou');
}

console.log('\n── contador: cada pagina com a sua ancora ───────────────');
for (const [arquivo, alvoEsperado] of [
  ['index.html', 'lote'],
  [`${PAGINA_POS_COMPRA}.html`, EVENTO.inicioISO],
]) {
  const doc = readFileSync(path.join(RAIZ, 'dist', arquivo), 'utf8');
  if (!/data-cd/.test(doc)) continue;
  const ancoras = [...doc.matchAll(/data-deadline="([^"]*)"/g)].map((m) => m[1]);
  ok(ancoras.length === 1, `${arquivo}: uma ancora de contador`,
     `encontradas ${ancoras.length} — o app.js usa a primeira e ignora o resto`);
  if (ancoras.length !== 1) continue;
  if (alvoEsperado === 'lote') {
    ok(ancoras[0] !== EVENTO.inicioISO && Number.isFinite(Date.parse(ancoras[0])),
       `${arquivo}: conta ate a virada do lote`, `veio "${ancoras[0]}"`);
  } else {
    ok(ancoras[0] === alvoEsperado, `${arquivo}: conta ate a aula de abertura`,
       `esperado ${alvoEsperado}, veio "${ancoras[0]}"`);
  }
}

console.log(`\n  ${falhas === 0 ? '✔ os 5 estados do ciclo estao coerentes' : `✘ ${falhas} falha(s)`}\n`);
process.exit(falhas ? 1 : 0);
