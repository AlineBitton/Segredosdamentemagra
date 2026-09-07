import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [arquivo, dir, larg] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await nav.newPage({ viewport: { width: +larg, height: 900 }, deviceScaleFactor: 2 });
await p.goto('file://' + arquivo, { waitUntil: 'load' });
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));} });
await p.waitForTimeout(2000);
const n = await p.$$eval(':is(body, main) > :is(header, section, footer)', (e) => e.length);
for (let i = 0; i < n; i++) {
  const el = (await p.$$(':is(body, main) > :is(header, section, footer)'))[i];
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);
  const b = await el.boundingBox();
  if (!b || b.height < 10) continue;
  await el.screenshot({ path: `${dir}/${String(i + 1).padStart(2, '0')}.png` }).catch(() => {});
}
await nav.close();
console.log(n + ' dobras capturadas em ' + dir);
