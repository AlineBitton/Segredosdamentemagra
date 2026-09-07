import { chromium } from 'playwright';
const [arquivo, saida, titulo, frac = '0.5'] = process.argv.slice(2);
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto('file://' + arquivo, { waitUntil: 'load' });
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));} });
await p.waitForTimeout(1500);
const i = await p.evaluate((txt) => {
  const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes(txt));
  const r = h.closest('section').getBoundingClientRect();
  return { topo: Math.round(r.top + scrollY), alt: Math.round(r.height) };
}, titulo);
await p.evaluate((y) => window.scrollTo(0, y), i.topo + Math.round(i.alt * parseFloat(frac)));
await p.waitForTimeout(1200); await p.mouse.move(10, 10); await p.waitForTimeout(400);
await p.screenshot({ path: saida, animations: 'disabled' });
await nav.close(); console.log('ok');
