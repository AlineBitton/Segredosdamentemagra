/* Gera os caminhos SVG das cinco marcas. Ruído determinístico: mesma
   semente, mesmo traço — assimetria de mão, não de compasso. */
const ru = (i, s = 5) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
const f = (n) => n.toFixed(1);

/* A · ESPIRAL — voltas abertas, termina fora, nunca fecha no começo */
function espiral(t = 200, voltas = 2.85, s = 3) {
  const c = t / 2, rMax = t / 2 - 10, rMin = t * 0.06, n = Math.round(voltas * 60), p = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n, a = -Math.PI / 2 - k * voltas * Math.PI * 2;
    const r = (rMin + (rMax - rMin) * k ** 1.06) * (1 + ru(i * 0.11, s) * 0.014);
    p.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
  }
  return { d: p.map(([x, y], i) => `${i ? 'L' : 'M'} ${f(x)} ${f(y)}`).join(' '), fim: p.at(-1) };
}

/* B · AFINAÇÃO — onda de amplitude crescente e cedente */
function onda(w = 420, h = 56, meias = 7, s = 11, pico = 0.62) {
  const m = h / 2, passo = w / meias, amp = h / 2 - 4;
  let d = `M 0 ${f(m)}`;
  for (let i = 0; i < meias; i++) {
    const k = i / (meias - 1);
    const env = Math.sin(Math.PI * Math.min(1, k / pico)) ** 0.8;
    const a = amp * (0.22 + 0.78 * env) * (1 + ru(i, s) * 0.14);
    const x0 = i * passo, x1 = (i + 1) * passo, y = m + (i % 2 ? 1 : -1) * a;
    d += ` C ${f(x0 + passo * (0.36 + ru(i + 30, s) * 0.05))} ${f(y)}, ${f(x0 + passo * (0.64 + ru(i + 60, s) * 0.05))} ${f(y)}, ${f(x1)} ${f(m)}`;
  }
  return d;
}

/* C · PONTO — linha quase reta, um ponto de posição */
function linhaPonto(w = 320, h = 24, s = 17) {
  const m = h / 2; let d = `M 0 ${f(m)}`;
  const n = 6, passo = w / n;
  for (let i = 0; i < n; i++) {
    const x0 = i * passo, x1 = (i + 1) * passo;
    const y = m + ru(i, s) * 2.2;
    d += ` C ${f(x0 + passo * 0.4)} ${f(y)}, ${f(x0 + passo * 0.6)} ${f(y)}, ${f(x1)} ${f(m + ru(i + 1, s) * 2.2)}`;
  }
  return { d, ponto: [w * 0.66, m + ru(4, s) * 1.2] };
}

/* D · ROTA — sai da linha, desvia, e volta a ela mais adiante */
function rota(w = 360, h = 96, s = 23) {
  const y = h * 0.68, saida = w * 0.30, volta = w * 0.74;
  const principal = `M 0 ${f(y)} L ${f(saida)} ${f(y)}`;
  const cont = `M ${f(volta)} ${f(y)} L ${f(w)} ${f(y)}`;
  const topo = h * 0.20 + ru(1, s) * 3;
  const desvio = `M ${f(saida)} ${f(y)} C ${f(saida + (volta - saida) * 0.16)} ${f(y - 6)}, ${f(saida + (volta - saida) * 0.30)} ${f(topo)}, ${f((saida + volta) / 2 + ru(2, s) * 6)} ${f(topo)} C ${f(volta - (volta - saida) * 0.28)} ${f(topo)}, ${f(volta - (volta - saida) * 0.14)} ${f(y - 8)}, ${f(volta)} ${f(y)}`;
  return { principal, cont, desvio, retorno: [volta, y] };
}

const e = espiral();
/* Variante de tamanho pequeno: menos voltas, para elas não colidirem
   abaixo de ~40 px. Um sistema de marca precisa das duas. */
const ep = espiral(200, 1.75, 3);
const lp = linhaPonto();
const r = rota();
console.log(JSON.stringify({
  espiral: e.d, espiralFim: e.fim.map((n) => +f(n)),
  espiralMini: ep.d, espiralMiniFim: ep.fim.map((n) => +f(n)),
  ondaLarga: onda(420, 56, 7, 11, 0.62),
  ondaBaixa: onda(360, 22, 9, 29, 0.55),
  ondaMini: onda(120, 26, 5, 11, 0.6),
  linha: lp.d, ponto: lp.ponto.map((n) => +f(n)),
  rotaPrincipal: r.principal, rotaCont: r.cont, rotaDesvio: r.desvio, rotaRetorno: r.retorno.map((n) => +f(n)),
}, null, 1));
