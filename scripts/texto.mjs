/**
 * Gera um documento de aprovação de texto: um HTML autocontido, um por
 * página, com toda a copy na ordem em que ela é lida, numerada.
 *
 * A prévia mostra a página como ela vai ficar — serve para aprovar o
 * conjunto. Este documento serve para a outra coisa: aprovar a palavra.
 * Cada bloco recebe um número estável (3.2, 7.1) para que a revisão volte
 * dizendo "muda o 3.2" em vez de "aquele trecho lá do meio".
 *
 * O texto sai do dist/, não do src/: é o que a página realmente diz, com
 * preço, data e lote já resolvidos, e não o gabarito com {{marcadores}}.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const RAIZ = path.resolve(import.meta.dirname, '..');
const p = (...s) => path.join(RAIZ, ...s);

const PAGINAS = [
  { arquivo: 'index.html',    titulo: 'Página de vendas',       saida: 'texto-venda.html' },
  { arquivo: 'obrigado.html', titulo: 'Página de agradecimento', saida: 'texto-obrigado.html' },
];

/** Os nomes das dobras moram nos comentários do fonte, na ordem de leitura. */
async function nomesDasDobras(arquivo) {
  const src = await readFile(p('src', arquivo), 'utf8');
  return [...src.matchAll(/<!--\s*══\s*(\d+)\s*·\s*([^═\n]+?)\s*═/g)]
    .map((m) => `${m[1]} · ${m[2]}`);
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

for (const pagina of PAGINAS) {
  const nomes = await nomesDasDobras(pagina.arquivo);
  const pg = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto('file://' + p('dist', pagina.arquivo), { waitUntil: 'load' });

  const dobras = await pg.evaluate(() => {
    // Um bloco de aprovação é o menor pedaço que se lê como uma frase inteira.
    // Percorrer os nós de texto e agrupá-los pelo ancestral mais próximo desta
    // lista pega tudo uma vez só: um <span> solto dentro de um <li> entra junto
    // do <strong> ao lado dele, e não some como sumia quando o critério era
    // "pegue o elemento mais interno da lista".
    const DONOS = 'h1,h2,h3,h4,p,li,summary,figcaption,blockquote,dt,dd,a.btn,button,nav';
    const DOBRAS = ':is(body, main) > :is(header, section, footer)';

    // as perguntas frequentes vivem em <details> fechado: a resposta também
    // é texto a aprovar, e fechada ela não teria caixa nenhuma
    for (const d of document.querySelectorAll('details')) d.open = true;

    // a página carrega dois estados, vendas abertas e encerrado, e mostra um
    // por vez. O outro é copy de verdade — vai ao ar no dia 26 — mas precisa
    // vir marcado, senão a leitura parece contraditória.
    const visivel = (el) => el.getClientRects().length > 0;

    return [...document.querySelectorAll(DOBRAS)].map((sec) => {
      const grupos = new Map();
      const ordem = [];
      const passeio = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
      let no;
      while ((no = passeio.nextNode())) {
        if (!no.textContent.trim()) continue;
        const pai = no.parentElement;
        if (!pai || pai.closest('.so-leitor')) continue;
        const dono = pai.closest(DONOS) || pai.closest('div,figure') || sec;
        if (!grupos.has(dono)) { grupos.set(dono, []); ordem.push(dono); }
        grupos.get(dono).push(no.textContent);
      }
      return ordem.map((el) => ({
        tag: el.matches('a.btn, button') ? 'botao' : el.tagName.toLowerCase(),
        // junta com espaço para não colar palavras de <span>s vizinhos, e
        // desfaz o espaço que isso cria antes da pontuação: "às 19h , com"
        texto: grupos.get(el).join(' ').replace(/\s+/g, ' ')
          .replace(/\s+([,.;:!?%])/g, '$1').replace(/\s+—\s+/g, ' — ').trim(),
        oculto: !visivel(el),
      })).filter((b) => b.texto);
    });
  });
  await pg.close();

  // a última dobra é o rodapé, que não tem comentário de nome no fonte
  const rotulos = [...nomes];
  while (rotulos.length < dobras.length) rotulos.push('RODAPÉ');

  const corpo = dobras.map((blocos, i) => {
    if (!blocos.length) return '';
    const n = i + 1;
    const itens = blocos.map((b, j) => `
      <div class="bloco${b.tag === 'botao' ? ' bloco--botao' : ''}${b.oculto ? ' bloco--depois' : ''}">
        <span class="ref">${n}.${j + 1}</span>
        <div class="txt ${b.tag}">
          <span class="conteudo">${escapar(b.texto)}</span>${
            b.oculto ? '<span class="quando">só aparece quando as vendas encerram</span>' : ''
          }
        </div>
      </div>`).join('');
    return `<section class="dobra">
      <h2>${escapar(rotulos[i] || `Dobra ${n}`)}</h2>
      ${itens}
    </section>`;
  }).join('');

  const total = dobras.reduce((s, b) => s + b.length, 0);
  await writeFile(p(pagina.saida), documento(pagina.titulo, corpo, total));
  console.log(`  ${pagina.saida.padEnd(22)} ${dobras.length} dobras · ${total} blocos`);
}

await nav.close();
console.log('');

function documento(titulo, corpo, total) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)} — texto para aprovação</title>
<style>
  :root {
    --papel:#F2EDE5; --linho:#E7DED0; --cacau:#3A322C;
    --ameixa:#5E3A46; --barro:#9E5C42; --linha:#D9CEBE;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--papel); color: var(--cacau);
    font: 400 17px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;
  }
  .folha { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem 6rem; }

  header.capa { padding-bottom: 2.5rem; border-bottom: 1px solid var(--linha); }
  .marca { font-size: .8125rem; letter-spacing: .14em; text-transform: uppercase;
           color: var(--barro); margin: 0 0 .75rem; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400;
       font-size: clamp(1.75rem, 1.3rem + 2vw, 2.5rem); line-height: 1.25; margin: 0 0 1rem; }
  .comofazer { margin: 1.5rem 0 0; padding: 1rem 1.25rem; background: var(--linho);
               font-size: .9375rem; line-height: 1.55; }
  .comofazer strong { font-weight: 600; }

  .dobra { margin-top: 3rem; }
  .dobra h2 { font-size: .8125rem; letter-spacing: .14em; text-transform: uppercase;
              color: var(--ameixa); font-weight: 600; margin: 0 0 1.25rem;
              padding-bottom: .5rem; border-bottom: 1px solid var(--linha); }

  .bloco { display: grid; grid-template-columns: 3.25rem 1fr; gap: .75rem;
           padding: .5rem 0; align-items: baseline; }
  .ref { font-variant-numeric: tabular-nums; font-size: .8125rem; color: var(--barro);
         padding-top: .2em; }
  .txt.h1, .txt.h2 { font-family: Georgia, serif; font-size: 1.375rem; line-height: 1.3; }
  .txt.h3, .txt.h4 { font-weight: 600; }
  .txt.li { padding-left: 0; }
  .txt.li .conteudo::before { content: '· '; color: var(--barro); }
  /* o rótulo de botão é curto e fecha na própria largura: esticado na coluna
     inteira ele deixaria de parecer um botão */
  .bloco--botao .conteudo { display: inline-block; padding: .35rem .9rem;
                            background: var(--ameixa); color: var(--papel);
                            border-radius: 999px; font-size: .9375rem; }

  .bloco--depois .conteudo { opacity: .62; }
  .quando { display: block; margin-top: .2rem; font-size: .75rem; letter-spacing: .08em;
            text-transform: uppercase; color: var(--barro); opacity: 1; }

  footer.fim { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--linha);
               font-size: .875rem; color: var(--barro); }

  @media print {
    body { background: #fff; }
    .dobra { break-inside: avoid; }
    .comofazer { background: none; border: 1px solid var(--linha); }
  }
</style>
</head>
<body>
<div class="folha">
  <header class="capa">
    <p class="marca">Segredos da Mente Magra · 26 e 27 de setembro</p>
    <h1>${escapar(titulo)} — texto para aprovação</h1>
    <div class="comofazer">
      Cada trecho tem um número à esquerda. Para pedir mudança, responda citando
      o número: <strong>“4.2 — trocar ‘disciplina’ por ‘constância’”</strong>.
      A ordem aqui é a ordem em que a pessoa lê na página.
    </div>
  </header>
  ${corpo}
  <footer class="fim">${total} trechos · gerado a partir da página publicada</footer>
</div>
</body>
</html>
`;
}
