/**
 * Prepara os retratos da Aline para os quatro espaços da página.
 *
 * O que ele faz, em ordem:
 *   1. recorta o fundo, quando a foto foi feita contra parede lisa;
 *   2. assenta a pessoa sobre o campo da marca daquele espaço;
 *   3. corta na proporção do espaço, com o ponto focal onde o olhar cai;
 *   4. iguala a temperatura ao papel cru — a página inteira é quente,
 *      e foto fria dentro dela lê como colada de outro lugar;
 *   5. exporta AVIF e WebP nas larguras que a página pede.
 *
 * Uso:  node scripts/retratos.mjs
 * Entrada:  src/img-originais/retratos/<nome>.jpg
 * Saída:    public/img/<nome>-<largura>.{avif,webp}
 */
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIG = path.join(RAIZ, 'src/img-originais/retratos');
const DEST = path.join(RAIZ, 'public/img');

const CAMPO = { papel: '#F2EDE5', linho: '#E7DED0', cacau: '#3A322C', ameixa: '#5E3A46' };

/** Os quatro espaços, com a proporção e o ponto focal de cada um. */
const ESPACOS = {
  // camisa de linho papel cru contra fundo cinza liso → campo de cacau
  // Sem recorte: o cinza do estúdio é próximo demais do linho papel cru e do
  // tom de pele, e o preenchimento por semelhança comia o rosto. O fundo
  // cinza já é neutro e assenta bem contra o campo de cacau.
  'aline-abertura': { campo: 'cacau', prop: 4 / 5, focoY: 0.30, larguras: [700, 1400], recorta: false },
  // camisa de linho ameixa na mesa de madeira, mãos à vista
  'aline-mentora':  { campo: 'papel', prop: 4 / 5, focoY: 0.34, larguras: [600, 1200], recorta: false },
  // camisa de linho cacau no sofá, falando — página de agradecimento
  'aline-obrigado': { campo: 'papel', prop: 4 / 5, focoY: 0.34, larguras: [600, 1200], recorta: false },
  // a calça larga: o antes e o depois dentro da mesma foto
  'aline-percurso': { campo: 'papel', prop: 4 / 5, focoY: 0.26, larguras: [440, 880],  recorta: false },
};

const hex = (h) => ({
  r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16),
});

/**
 * Recorta o fundo por semelhança com a cor das bordas.
 *
 * Só funciona com parede lisa, e é para isso que serve: as fotos da Aline
 * são contra parede clara. O preenchimento parte das bordas para dentro,
 * então nada que esteja no meio da imagem — pele, roupa — some por acaso,
 * mesmo tendo cor parecida com a da parede.
 */
async function recortarFundo(entrada, tolerancia = 42) {
  const img = sharp(entrada).ensureAlpha();
  const { width: L, height: A } = await img.metadata();
  const px = await img.raw().toBuffer();

  // cor do fundo: mediana dos quatro cantos, para um canto sujo não decidir sozinho
  const cantos = [[2, 2], [L - 3, 2], [2, A - 3], [L - 3, A - 3]].map(([x, y]) => {
    const i = (y * L + x) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  });
  const med = (n) => cantos.map((c) => c[n]).sort((a, b) => a - b)[1];
  const F = [med(0), med(1), med(2)];

  const dentro = new Uint8Array(L * A);          // 1 = é fundo
  const fila = new Int32Array(L * A);
  let cabeca = 0, cauda = 0;
  const parecido = (i) =>
    Math.abs(px[i * 4] - F[0]) + Math.abs(px[i * 4 + 1] - F[1]) + Math.abs(px[i * 4 + 2] - F[2]) < tolerancia * 3;

  for (let x = 0; x < L; x++) for (const y of [0, A - 1]) {
    const i = y * L + x;
    if (!dentro[i] && parecido(i)) { dentro[i] = 1; fila[cauda++] = i; }
  }
  for (let y = 0; y < A; y++) for (const x of [0, L - 1]) {
    const i = y * L + x;
    if (!dentro[i] && parecido(i)) { dentro[i] = 1; fila[cauda++] = i; }
  }
  while (cabeca < cauda) {
    const i = fila[cabeca++], x = i % L, y = (i / L) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= L || ny >= A) continue;
      const j = ny * L + nx;
      if (!dentro[j] && parecido(j)) { dentro[j] = 1; fila[cauda++] = j; }
    }
  }

  const alfa = Buffer.alloc(L * A);
  for (let i = 0; i < L * A; i++) alfa[i] = dentro[i] ? 0 : 255;
  // Um borrão de meio pixel na máscara tira o serrilhado da silhueta.
  // O toColourspace é obrigatório: .blur() devolve 3 canais mesmo com
  // entrada de 1, e sem ele a máscara é lida a um terço da escala.
  const suave = await sharp(alfa, { raw: { width: L, height: A, channels: 1 } })
    .blur(0.8).toColourspace('b-w').raw().toBuffer();

  const saida = Buffer.from(px);
  for (let i = 0; i < L * A; i++) saida[i * 4 + 3] = suave[i];
  const cobertura = dentro.reduce((s, v) => s + v, 0) / (L * A);
  return { buffer: saida, L, A, cobertura };
}

/** Corte na proporção do espaço, ancorado no ponto focal vertical. */
function janela(L, A, prop, focoY) {
  let l = L, a = Math.round(L / prop);
  if (a > A) { a = A; l = Math.round(A * prop); }
  const x = Math.round((L - l) / 2);
  const y = Math.min(Math.max(0, Math.round(A * focoY - a * 0.38)), A - a);
  return { left: x, top: y, width: l, height: a };
}

async function main() {
  if (!existsSync(ORIG)) {
    console.log(`\n  Nada a fazer: ${path.relative(RAIZ, ORIG)}/ não existe.`);
    console.log('  Coloque os originais lá com estes nomes e rode de novo:\n');
    for (const n of Object.keys(ESPACOS)) console.log(`    ${n}.jpg`);
    console.log('');
    return;
  }
  await mkdir(DEST, { recursive: true });
  const arquivos = (await readdir(ORIG)).filter((f) => /^aline-[\w-]+\.(png|jpe?g|webp)$/i.test(f));
  if (!arquivos.length) return console.log(`\n  ${path.relative(RAIZ, ORIG)}/ está vazio.\n`);

  for (const arq of arquivos) {
    const nome = arq.replace(/\.[^.]+$/, '');
    const esp = ESPACOS[nome];
    if (!esp) { console.log(`  ?  ${arq} — nome fora da lista, ignorado`); continue; }

    const entrada = path.join(ORIG, arq);
    const fundo = hex(CAMPO[esp.campo]);
    let base, L, A;

    if (esp.recorta) {
      const r = await recortarFundo(entrada);
      if (r.cobertura < 0.06 || r.cobertura > 0.85) {
        console.log(`  !  ${arq} — recorte suspeito (${(r.cobertura * 100).toFixed(0)}% de fundo). Usando a foto inteira.`);
        base = sharp(entrada); ({ width: L, height: A } = await base.metadata());
      } else {
        L = r.L; A = r.A;
        base = sharp(r.buffer, { raw: { width: L, height: A, channels: 4 } })
          .flatten({ background: fundo });
      }
    } else {
      base = sharp(entrada); ({ width: L, height: A } = await base.metadata());
    }

    const corte = janela(L, A, esp.prop, esp.focoY);
    const png = await base
      .extract(corte)
      // Temperatura da página: um toque de vermelho, um toque a menos de
      // azul. Feito por canal, com .linear() — .tint() do sharp deixa a
      // imagem monocromática e apaga o tom de pele.
      .modulate({ saturation: 0.94 })
      .linear([1.03, 1.0, 0.95], [-2, 0, 6])
      .png().toBuffer();

    for (const largura of esp.larguras) {
      const redim = sharp(png).resize({ width: largura, fit: 'cover' });
      for (const [fmt, opc] of [['avif', { quality: 62 }], ['webp', { quality: 80 }]]) {
        const destino = path.join(DEST, `${nome}-${largura}.${fmt}`);
        await redim.clone().toFormat(fmt, opc).toFile(destino);
      }
    }
    const kb = (f) => `${(statSync(path.join(DEST, f)).size / 1024).toFixed(1)} KB`;
    const maior = esp.larguras.at(-1);
    console.log(`  ok ${nome}  campo ${esp.campo}  ${corte.width}x${corte.height}` +
                `  →  ${maior}px: ${kb(`${nome}-${maior}.avif`)} avif · ${kb(`${nome}-${maior}.webp`)} webp`);
  }
  console.log('');
}

await main();
