/**
 * Monta o pacote de upload direto para o Cloudflare Pages.
 *
 * O caminho normal de publicação é conectar o repositório: a Cloudflare roda
 * `npm run build` e lê `functions/` sozinha. Este script existe para o outro
 * caminho — arrastar um .zip no painel, sem Git — e precisa resolver uma
 * diferença: no upload direto a Cloudflare não compila `functions/`.
 *
 * A saída é o modo avançado do Pages: um `_worker.js` único na raiz do site,
 * compilado a partir do mesmo `functions/_middleware.js`. Ele intercepta tudo
 * e devolve os arquivos estáticos por `env.ASSETS.fetch()` — que continua
 * aplicando o `_headers` (CSP, cache das fontes e das imagens). Sem ele o
 * site subiria congelado no lote vigente na hora do build: a página mostraria
 * R$27 depois da virada e a hub.la cobraria R$47.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const dist = path.join(raiz, 'dist');
const saida = path.join(raiz, 'pacote');
const tmp = path.join(saida, '.funcoes');
const zip = path.join(saida, 'segredos-mente-magra-cloudflare.zip');

const bin = (nome) => path.join(raiz, 'node_modules', '.bin', nome);
const rodar = (cmd, args, opcoes = {}) =>
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'], ...opcoes });
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

// 1. build limpo — o zip nunca sai de um dist velho
rodar(process.execPath, [path.join('scripts', 'build.mjs')]);

// 2. functions/ vira um módulo só
fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
rodar(bin('wrangler'), ['pages', 'functions', 'build', `--outdir=${tmp}`]);

const compilado = path.join(tmp, 'index.js');
if (!fs.existsSync(compilado)) {
  throw new Error('wrangler nao gerou index.js — pacote abortado');
}
fs.copyFileSync(compilado, path.join(dist, '_worker.js'));
fs.rmSync(tmp, { recursive: true, force: true });

// 3. zip com os arquivos na raiz: a Cloudflare publica o conteúdo do zip como
//    está, então `index.html` precisa ficar no primeiro nível
rodar('zip', ['-r', '-q', '-X', zip, '.', '-x', '.DS_Store', '__MACOSX/*'], { cwd: dist });

// o worker sai do dist depois de entrar no zip: um `_worker.js` esquecido ali
// passa na frente de `functions/` e o `npm run dev` deixaria de recompilar o
// middleware a cada mudança, testando uma versão velha sem avisar
fs.rmSync(path.join(dist, '_worker.js'));

// 4. confere que o pacote tem o que precisa ter
const dentro = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const obrigatorios = ['index.html', 'obrigado.html', '_worker.js', '_headers'];
const faltando = obrigatorios.filter((f) => !dentro.includes(f));
if (faltando.length) {
  throw new Error('pacote incompleto, faltou: ' + faltando.join(', '));
}

const imagens = dentro.filter((f) => f.startsWith('img/')).length;
console.log(`
  pacote para upload direto
  ----------------------------------------------------------
  ${path.relative(raiz, zip)}
  ${dentro.length} arquivos · ${imagens} imagens · ${kb(fs.statSync(zip).size)}
  ----------------------------------------------------------
  Cloudflare > Workers & Pages > Create > Pages > Upload assets
`);
