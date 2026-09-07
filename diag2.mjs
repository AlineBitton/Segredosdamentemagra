import { chromium } from 'playwright';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto('file://' + process.argv[2], { waitUntil: 'load' });
await p.waitForTimeout(500);
console.log(await p.evaluate(() => {
  const f = document.querySelector('.guia__foto');
  const g = f.parentElement;
  const cs = getComputedStyle(f);
  let anc = [], el = f.parentElement;
  while (el && el !== document.documentElement) {
    const c = getComputedStyle(el);
    if (c.overflow !== 'visible' || c.transform !== 'none' || c.contain !== 'none')
      anc.push(`${el.className||el.tagName}: overflow=${c.overflow} transform=${c.transform.slice(0,22)} contain=${c.contain}`);
    el = el.parentElement;
  }
  return JSON.stringify({ pos: cs.position, top: cs.top,
    alignItems: getComputedStyle(g).alignItems,
    alturaFoto: Math.round(f.getBoundingClientRect().height),
    alturaGrade: Math.round(g.getBoundingClientRect().height),
    ancestrais: anc }, null, 1);
}));
await nav.close();
