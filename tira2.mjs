import { chromium } from 'playwright';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto('file://' + process.argv[2], { waitUntil: 'load' });
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));} });
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('Além dos 2 dias'));
  const sec = h.closest('section');
  const r = sec.getBoundingClientRect();
  const cab = h.closest('.trilho__cabeca');
  return { topo: Math.round(r.top + scrollY), alt: Math.round(r.height), pos: getComputedStyle(cab).position };
});
console.log(JSON.stringify(info));
await p.evaluate((i) => window.scrollTo(0, i.topo + Math.round(i.alt * 0.45)), info);
await p.waitForTimeout(500);
await p.screenshot({ path: process.argv[3] });
await nav.close();
