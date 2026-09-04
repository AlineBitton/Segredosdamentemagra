/**
 * Otimiza as imagens de src/img-originais/ para public/img/.
 *
 * Gera AVIF e WebP em duas larguras. Roda so quando as imagens mudam —
 * os arquivos gerados sao versionados, entao o build do dia a dia nao
 * depende do sharp nem de rede.
 *
 * Para trocar por versoes em alta: substitua os arquivos em
 * src/img-originais/provas/ pelos exports de 1080px do Canva e rode
 * `npm run imagens` de novo. O resto da pagina nao muda.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIG = path.join(RAIZ, 'src/img-originais');
const DEST = path.join(RAIZ, 'public/img');

const LARGURAS = [400, 800];
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function pasta(nome) {
  const de = path.join(ORIG, nome);
  const para = path.join(DEST, nome);
  if (!existsSync(de)) return null;
  await mkdir(para, { recursive: true });

  const arquivos = (await readdir(de)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  let entrada = 0, saida = 0;

  for (const f of arquivos) {
    const base = path.parse(f).name;
    const src = path.join(de, f);
    entrada += (await stat(src)).size;
    const meta = await sharp(src).metadata();

    for (const w of LARGURAS) {
      if (w > meta.width) continue;              // nunca ampliar
      for (const [fmt, opts] of [
        ['avif', { quality: 48, effort: 9 }],
        ['webp', { quality: 68, effort: 6 }],
      ]) {
        const out = path.join(para, `${base}-${w}.${fmt}`);
        await sharp(src).resize({ width: w, withoutEnlargement: true })[fmt](opts).toFile(out);
        saida += (await stat(out)).size;
      }
    }
  }
  return { nome, arquivos: arquivos.length, entrada, saida, largura: (await sharp(path.join(de, arquivos[0])).metadata()).width };
}

const alvos = existsSync(ORIG) ? (await readdir(ORIG, { withFileTypes: true }))
  .filter((d) => d.isDirectory()).map((d) => d.name) : [];

console.log('\n  otimizacao de imagens');
console.log('  ' + '-'.repeat(62));
for (const a of alvos) {
  const r = await pasta(a);
  if (!r) continue;
  console.log(`  ${r.nome.padEnd(10)} ${String(r.arquivos).padStart(3)} imagens  ` +
              `origem ${r.largura}px  ${kb(r.entrada).padStart(9)} -> ${kb(r.saida).padStart(9)} (avif+webp, 2 larguras)`);
  if (r.largura < 800) {
    console.log(`  ${''.padEnd(10)} AVISO: origem com ${r.largura}px. Para nitidez em tela retina,`);
    console.log(`  ${''.padEnd(10)} exporte em 1080px e rode este script de novo.`);
  }
}
console.log();
