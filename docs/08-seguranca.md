# Documento 08 — Segurança e privacidade

> Revisão feita antes de apontar o domínio. Uma vulnerabilidade real corrigida,
> uma política de segurança de conteúdo adicionada e verificada no navegador.
> Reproduza com `npm run csp`.

---

## 1 · A vulnerabilidade que estava lá ⚠️

### O que era

O script de UTM — tanto na borda quanto no cliente — repassava **todos** os
parâmetros da URL para o link de checkout. O destino é uma **página de
pagamento**.

Na prática, qualquer pessoa podia montar e compartilhar um link assim:

```
afinandocorpoemente.com.br/?cupom=GRATIS&email=vitima@exemplo.com&valor=0
```

E o botão de compra passava a apontar para:

```
pay.hub.la/tdO52QluixGZPMu0Oqt7?cupom=GRATIS&email=vitima%40exemplo.com&valor=0
```

Se a plataforma de pagamento honrar **qualquer um** desses parâmetros, isso vira
desconto indevido, compra pré-preenchida no nome de outra pessoa, ou alteração
de valor. Não depende de invadir nada: basta compartilhar um link.

### A correção

Trocada a lista de bloqueio implícita (*"repassa tudo menos `p`"*) por uma
**lista de permissão** explícita, aplicada nos dois lados:

- qualquer `utm_*`;
- identificadores de clique das redes: `fbclid`, `gclid`, `ttclid`, `msclkid`,
  `twclid`, `li_fat_id`, `epik`, `igshid`;
- parâmetros de afiliado: `sck`, `src`, `ref`, `xcod`, `aff`, `affiliate`.

Todo o resto é descartado. O mesmo link malicioso agora produz:

```
pay.hub.la/tdO52QluixGZPMu0Oqt7
```

Coberto por teste — `npm run borda` verifica que `cupom`, `email`, `valor`,
`price` e `admin` **não** chegam ao checkout, e que `utm_source`, `fbclid` e
`gclid` continuam chegando.

---

## 2 · Política de segurança de conteúdo, por hash

A página embute CSS e JavaScript. A saída fácil seria `'unsafe-inline'` — que
desliga exatamente a proteção contra XSS que a CSP existe para dar.

Como o build conhece o conteúdo exato de cada bloco, ele calcula o **hash
SHA-256 de cada um** e escreve na CSP. Só o nosso código roda; qualquer script
injetado é bloqueado pelo navegador.

```
default-src 'self';
script-src  'self' 'sha256-…';
style-src   'self' 'sha256-…';
img-src     'self';
font-src    'self';
connect-src 'self';
form-action 'none';        ← a página não tem formulário
frame-ancestors 'none';    ← ninguém embute esta página num iframe
base-uri 'none';
object-src 'none';
upgrade-insecure-requests
```

Quando o Meta Pixel for ligado, o build acrescenta sozinho o hash do snippet e
libera `connect.facebook.net` — nem um domínio a mais.

Somam-se: `Strict-Transport-Security`, `Cross-Origin-Opener-Policy: same-origin`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
e `Permissions-Policy` desligando geolocalização, microfone e câmera.

### O que a verificação encontrou

Um hash errado não quebra o build nem os testes — quebra a **página da
compradora**, sem estilo e sem JavaScript. Por isso `npm run csp` serve o
`dist/` **aplicando os cabeçalhos de verdade** e abre no Chromium.

E foi assim que apareceu um problema que nenhum outro teste pegaria: a página
usava **35 atributos `style=""` inline** para espaçamento. Hash de CSP não vale
para atributo de estilo — só `'unsafe-hashes'` ou `'unsafe-inline'`, e as duas
saídas enfraquecem a política.

Os 35 viraram classes utilitárias. Agora a página roda inteira sob CSP estrita,
sem nenhuma exceção:

```
  ok  nenhuma violacao de CSP no console
  ok  CSS embutido foi aplicado
  ok  fonte propria carregou
  ok  JavaScript embutido rodou
  ✔ a pagina funciona inteira sob a CSP
```

---

## 3 · Superfície de ataque

**A página não coleta nada.** Não há formulário, campo ou login. O checkout
inteiro acontece na hub.la — quem guarda CPF e dados de pagamento é a
plataforma, não nós.

Tudo o que sai do domínio, no HTML publicado:

| Destino | Para quê |
|---|---|
| `hub.la` · `pay.hub.la` | checkout |
| `wa.me` | suporte |
| `afinandocorpoemente.com.br` | canônico e og:image |

Zero CDN, zero fonte do Google, zero rastreador de terceiro. Enquanto
`META.pixelId` for `null`, **nenhum script de terceiro é carregado** — e é por
isso que a política de privacidade pode dizer o que diz.

### Injeção pela URL

O parâmetro `?p=` só é usado como **chave de busca** num objeto fixo de
promessas. Um valor desconhecido cai no padrão; nada vindo da URL vira HTML.
Verificado por teste: `?p=nao-existe` devolve a promessa padrão.

### Dependências

`npm audit`: **0 vulnerabilidades**. Todas as dependências são de build
(`esbuild`, `lightningcss`, `sharp`, `playwright`, `lighthouse`, `wrangler`) —
**nenhuma vai para o navegador**. O que chega na compradora é HTML, CSS e
2,8 KB de JavaScript próprio.

---

## 4 · Privacidade

- **LGPD:** política publicada em `/privacidade`, com base legal, direitos,
  prazo de resposta e canal de contato. Falta CNPJ e endereço.
- **Referrer-Policy** `strict-origin-when-cross-origin`: a hub.la recebe o
  domínio de origem, nunca a URL completa com os parâmetros da campanha.
- **O `sck`** carrega só valores de UTM — origem, mídia, campanha, público e
  criativo. Nada de dado pessoal.
- **`sessionStorage`** guarda apenas os UTMs da sessão, para sobreviver a uma
  navegação interna. Nada identificável, e some ao fechar a aba.
- **Sem cookies próprios.** Os únicos que existirão são os do Meta Pixel,
  quando ele for ligado — e a política já os descreve.

---

## 5 · O que ainda depende de configuração na Cloudflare

- **SSL/TLS em Full (strict)** — modo "Flexible" faria o tráfego entre a
  Cloudflare e a origem andar sem criptografia.
- **Always Use HTTPS** ligado.
- **Bot Fight Mode** ligado (plano gratuito já tem).
- **HSTS no painel** além do cabeçalho, se quiser entrar na lista de preload.
