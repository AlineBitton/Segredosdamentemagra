/**
 * Monta o pacote de upload direto para o Cloudflare Pages.
 *
 * O caminho normal de publicação é conectar o repositório: a Cloudflare roda
 * `npm run build` e depois `npx wrangler deploy`, que sobe o Worker de
 * `worker/index.js` junto com o dist/ inteiro. Este script existe para o outro
 * caminho — arrastar um .zip no painel, sem Git.
 *
 * A saída é o modo avançado do Pages: o mesmo `worker/index.js`, empacotado
 * como `_worker.js` na raiz do site. Os dois caminhos rodam o mesmo código e
 * buscam os estáticos pela mesma ligação ASSETS. Sem ele o zip subiria
 * congelado no lote vigente na hora do build: a página mostraria R$27 depois
 * da virada e a hub.la cobraria R$47.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const dist = path.join(raiz, 'dist');
const saida = path.join(raiz, 'pacote');
const zip = path.join(saida, 'segredos-mente-magra-cloudflare.zip');

const bin = (nome) => path.join(raiz, 'node_modules', '.bin', nome);
const rodar = (cmd, args, opcoes = {}) =>
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'], ...opcoes });
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

// 1. build limpo — o zip nunca sai de um dist velho
rodar(process.execPath, [path.join('scripts', 'build.mjs')]);

// 2. o Worker vira um módulo só, com o config embutido
fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(saida, { recursive: true });
rodar(bin('esbuild'), [
  path.join('worker', 'index.js'),
  '--bundle', '--format=esm', '--platform=neutral',
  `--outfile=${path.join(dist, '_worker.js')}`,
]);

// 3. zip com os arquivos na raiz: a Cloudflare publica o conteúdo do zip como
//    está, então `index.html` precisa ficar no primeiro nível
rodar('zip', ['-r', '-q', '-X', zip, '.', '-x', '.DS_Store', '__MACOSX/*'], { cwd: dist });

// o bundle sai do dist depois de entrar no zip: um `_worker.js` esquecido ali
// seria enviado como asset no `wrangler deploy`, duplicando o Worker dentro
// dos próprios arquivos estáticos
fs.rmSync(path.join(dist, '_worker.js'));

// 4. confere que o pacote tem o que precisa ter
const dentro = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const obrigatorios = ['index.html', 'nos-vemos-no-evento.html', '_worker.js', '_headers'];
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
