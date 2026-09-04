/**
 * Desenha os dois elementos proprietários da marca como SVG.
 *
 * A LINHA — "linha contínua com variação de amplitude. Lê como afinação de tom
 * e como direção que continua disponível." É uma onda cuja amplitude cresce e
 * cede, nunca um seno perfeito: o guia diz que simetria perfeita demais é a
 * assinatura de imagem gerada por IA. Por isso cada meia-onda recebe um desvio
 * determinístico (semente fixa, mesmo desenho todo build).
 *
 * A ESPIRAL — o símbolo do método. "Cada volta passa pelos mesmos temas num
 * patamar mais alto. Nenhuma volta termina no ponto de partida." É a única
 * geometria que torna "voltei à estaca zero" literalmente falsa.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DEST = path.join(RAIZ, 'src/marca');
await mkdir(DEST, { recursive: true });

/** Ruído determinístico entre -1 e 1. Mesma semente, mesmo traço. */
function ruido(i, semente = 7) {
  const x = Math.sin(i * 12.9898 + semente * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/* ── A LINHA ──────────────────────────────────────────────────────
   Onda horizontal, amplitude crescendo e cedendo, com desvio à mão. */
function linha({ largura = 1200, altura = 120, meiasOndas = 9, semente = 7 } = {}) {
  const meio = altura / 2;
  const passo = largura / meiasOndas;
  const maxAmp = altura / 2 - 8;
  let d = `M 0 ${meio.toFixed(1)}`;
  for (let i = 0; i < meiasOndas; i++) {
    // envelope: cresce até ~2/3 do percurso e cede — "afinação", não metrônomo
    const t = i / (meiasOndas - 1);
    const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.75;
    const amp = maxAmp * (0.35 + 0.65 * env) * (1 + ruido(i, semente) * 0.16);
    const sentido = i % 2 === 0 ? -1 : 1;
    const x0 = i * passo;
    const x1 = (i + 1) * passo;
    const cx1 = x0 + passo * (0.36 + ruido(i + 40, semente) * 0.05);
    const cx2 = x0 + passo * (0.64 + ruido(i + 80, semente) * 0.05);
    const y = meio + sentido * amp;
    d += ` C ${cx1.toFixed(1)} ${y.toFixed(1)}, ${cx2.toFixed(1)} ${y.toFixed(1)}, ${x1.toFixed(1)} ${meio.toFixed(1)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" fill="none" aria-hidden="true">
  <path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
}

/* ── A ESPIRAL ────────────────────────────────────────────────────
   Voltas abertas, raio crescente, desenhada em sentido anti-horário
   para subir. Termina fora, nunca fechando de volta no começo. */
function espiral({ tamanho = 400, voltas = 3.15, semente = 3 } = {}) {
  const c = tamanho / 2;
  const rMax = tamanho / 2 - 14;
  const rMin = tamanho * 0.055;
  const passos = Math.round(voltas * 64);
  const pts = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const ang = -Math.PI / 2 - t * voltas * Math.PI * 2;
    // raio cresce com leve aceleração; o ruído tira a perfeição de compasso
    const r = (rMin + (rMax - rMin) * t ** 1.08) * (1 + ruido(i * 0.09, semente) * 0.012);
    pts.push([c + Math.cos(ang) * r, c + Math.sin(ang) * r]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [fx, fy] = pts.at(-1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tamanho} ${tamanho}" fill="none" aria-hidden="true">
  <path d="${d}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.4" fill="currentColor"/>
</svg>`;
}

const arquivos = {
  'linha.svg': linha(),
  'linha-curta.svg': linha({ largura: 420, altura: 64, meiasOndas: 5, semente: 21 }),
  'espiral.svg': espiral(),
};
for (const [n, s] of Object.entries(arquivos)) {
  await writeFile(path.join(DEST, n), s + '\n');
  console.log(`  ${n.padEnd(18)} ${(Buffer.byteLength(s) / 1024).toFixed(2)} KB`);
}
