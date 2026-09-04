/**
 * Auditoria de acessibilidade que o Lighthouse não faz.
 *
 * Ele verifica contraste, alt e rótulos — coisas que dão para checar sozinho.
 * Não verifica se a ordem do Tab faz sentido, se o foco aparece de verdade, se
 * a página sobrevive a 400% de zoom, ou se o contador vira spam no leitor de
 * tela. É isso que este script olha.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = path.resolve(import.meta.dirname, '../dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.txt': 'text/plain', '.xml': 'application/xml' };
const srv = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
await new Promise((r) => srv.listen(4324, r));

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const achados = [];
const erro = (t, d) => achados.push({ nivel: 'ERRO', t, d });
const aviso = (t, d) => achados.push({ nivel: 'AVISO', t, d });
const nota = (t, d) => achados.push({ nivel: 'nota', t, d });

/* ─────────── 1 · ordem do Tab e visibilidade do foco ─────────── */
{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });

  const paradas = [];
  for (let i = 0; i < 60; i++) {
    await pg.keyboard.press('Tab');
    const info = await pg.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const r = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      return {
        tag: a.tagName.toLowerCase(),
        texto: (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44),
        href: a.getAttribute('href') || '',
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width), h: Math.round(r.height),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
      };
    });
    if (!info) break;
    if (paradas.length && JSON.stringify(paradas.at(-1)) === JSON.stringify(info)) break;
    paradas.push(info);
  }

  console.log(`\n  ordem do Tab — ${paradas.length} paradas\n`);
  paradas.forEach((p, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${p.tag.padEnd(8)} y=${String(p.y).padStart(6)} ` +
                `${String(p.w) + 'x' + p.h}`.padEnd(10) + ` ${p.texto}`);
  });

  // o foco tem que subir a página, nunca pular para trás
  let forasDeOrdem = 0;
  for (let i = 1; i < paradas.length; i++) {
    if (paradas[i].y < paradas[i - 1].y - 40) forasDeOrdem++;
  }
  forasDeOrdem
    ? erro('ordem do Tab', `${forasDeOrdem} salto(s) para tras na pagina`)
    : nota('ordem do Tab', 'segue a leitura visual, de cima para baixo');

  const semFoco = paradas.filter((p) => !p.outline);
  semFoco.length
    ? erro('foco invisivel', `${semFoco.length} elemento(s) sem contorno ao receber foco`)
    : nota('foco visivel', `contorno presente nas ${paradas.length} paradas`);

  // primeira parada deve ser o atalho de pular para a oferta
  paradas[0]?.href === '#oferta'
    ? nota('atalho de teclado', 'a primeira tecla Tab leva direto aos ingressos')
    : aviso('atalho de teclado', `primeira parada e "${paradas[0]?.texto}"`);

  // alvos de toque
  const pequenos = paradas.filter((p) => p.h < 24 && p.w < 44);
  pequenos.length
    ? aviso('alvo pequeno', `${pequenos.length} alvo(s) abaixo de 24px de altura`)
    : nota('alvos de toque', 'todos com area suficiente');

  await ctx.close();
}

/* ─────────── 2 · <details> pelo teclado ─────────── */
{
  const ctx = await nav.newContext();
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(async () => {
    const d = document.querySelectorAll('.faq details');
    const s = d[1].querySelector('summary');
    s.focus();
    const antes = d[1].open;
    s.click();
    return { total: d.length, abriu: d[1].open !== antes, focavel: document.activeElement === s };
  });
  r.focavel && r.abriu
    ? nota('FAQ', `${r.total} perguntas em <details> nativo: teclado e leitor de tela funcionam sem JavaScript`)
    : erro('FAQ', 'acordeao nao responde ao teclado');
  await ctx.close();
}

/* ─────────── 3 · reflow a 320px e a 400% de zoom ─────────── */
for (const [nome, w, h] of [['320px (menor celular)', 320, 640], ['400% de zoom', 360, 200]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(() => ({
    estoura: document.documentElement.scrollWidth > window.innerWidth + 1,
    excesso: document.documentElement.scrollWidth - window.innerWidth,
    culpados: [...document.querySelectorAll('*')]
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 4)
      .map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
        ? '.' + e.className.trim().split(/\s+/)[0] : '')),
  }));
  r.estoura
    ? erro(`reflow em ${nome}`, `${r.excesso}px de estouro horizontal — ${r.culpados.join(', ')}`)
    : nota(`reflow em ${nome}`, 'sem rolagem horizontal (WCAG 1.4.10)');
  await ctx.close();
}

/* ─────────── 4 · semântica e leitor de tela ─────────── */
{
  const ctx = await nav.newContext();
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(() => {
    const h = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => +e.tagName[1]);
    const saltos = [];
    for (let i = 1; i < h.length; i++) if (h[i] - h[i - 1] > 1) saltos.push(`${h[i - 1]}→${h[i]}`);
    const imgs = [...document.images];
    return {
      h1: document.querySelectorAll('h1').length,
      saltos,
      semAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      altVazio: imgs.filter((i) => i.getAttribute('alt') === '').length,
      totalImgs: imgs.length,
      lang: document.documentElement.lang,
      landmarks: {
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
        secoesSemNome: [...document.querySelectorAll('section')]
          .filter((s) => !s.getAttribute('aria-label') && !s.querySelector('h1,h2,h3')).length,
      },
      // texto de link repetido apontando para destinos diferentes
      linksAmbiguos: (() => {
        const m = new Map();
        for (const a of document.querySelectorAll('a[href]')) {
          const t = (a.innerText || '').trim().toLowerCase().replace(/\s+/g, ' ');
          if (!t) continue;
          if (!m.has(t)) m.set(t, new Set());
          m.get(t).add(a.getAttribute('href'));
        }
        return [...m.entries()].filter(([, d]) => d.size > 1).map(([t, d]) => `"${t}" → ${d.size} destinos`);
      })(),
      contadorLive: [...document.querySelectorAll('[data-cd]')]
        .map((e) => e.closest('[aria-live]')?.getAttribute('aria-live') || 'nenhum'),
    };
  });

  r.h1 === 1 ? nota('estrutura', 'exatamente um <h1>') : erro('estrutura', `${r.h1} elementos <h1>`);
  r.saltos.length
    ? aviso('hierarquia de titulos', `salto(s): ${r.saltos.join(', ')}`)
    : nota('hierarquia de titulos', 'sem saltos de nivel');
  r.semAlt ? erro('imagens', `${r.semAlt} sem atributo alt`) 
           : nota('imagens', `${r.totalImgs} imagens, todas com alt (${r.altVazio} decorativas)`);
  r.lang === 'pt-BR' ? nota('idioma', 'lang="pt-BR"') : erro('idioma', `lang="${r.lang}"`);
  r.landmarks.main === 1 && r.landmarks.footer === 1
    ? nota('marcos de pagina', '<main> e <footer> presentes e unicos')
    : aviso('marcos de pagina', JSON.stringify(r.landmarks));
  r.landmarks.secoesSemNome
    ? aviso('secoes', `${r.landmarks.secoesSemNome} <section> sem titulo nem aria-label`)
    : nota('secoes', 'toda <section> tem nome acessivel');
  r.linksAmbiguos.length
    ? aviso('texto de link', r.linksAmbiguos.join(' · '))
    : nota('texto de link', 'nenhum texto repetido com destinos diferentes');
  r.contadorLive.every((v) => v === 'nenhum')
    ? nota('contador', 'sem aria-live: nao vira spam no leitor de tela a cada segundo')
    : aviso('contador', `regiao viva detectada: ${r.contadorLive.join(', ')}`);
  await ctx.close();
}

/* ─────────── 5 · movimento reduzido ─────────── */
{
  const ctx = await nav.newContext({ reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:4324/', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(() => {
    const e = document.querySelector('.reveal');
    const cs = getComputedStyle(e);
    return { visivel: +cs.opacity === 1, semTransicao: cs.transitionDuration === '0s' };
  });
  r.visivel && r.semTransicao
    ? nota('movimento reduzido', 'conteudo visivel de imediato, sem animacao')
    : erro('movimento reduzido', 'conteudo depende de animacao mesmo com a preferencia ligada');
  await ctx.close();
}

await nav.close();
srv.close();

console.log('\n  ' + '='.repeat(70));
const erros = achados.filter((a) => a.nivel === 'ERRO');
const avisos = achados.filter((a) => a.nivel === 'AVISO');
for (const a of achados) {
  const marca = a.nivel === 'ERRO' ? 'ERRO ' : a.nivel === 'AVISO' ? 'AVISO' : '  ok ';
  console.log(`  ${marca}  ${a.t.padEnd(24)} ${a.d}`);
}
console.log(`\n  ${erros.length} erro(s), ${avisos.length} aviso(s)\n`);
process.exit(erros.length ? 1 : 0);
