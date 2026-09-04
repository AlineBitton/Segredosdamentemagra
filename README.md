# Segredos da Mente Magra — landing page dos lotes

Página de venda da Imersão **Segredos da Mente Magra** — 25, 26 e 27 de setembro.
Sem framework: HTML, CSS e ~5 KB de JavaScript, servidos por Cloudflare Pages com
uma função de borda que decide o lote e a promessa antes da primeira pintura.

---

## Como rodar

```bash
npm install          # dependências de build
npm run verificar    # testes do motor de lotes + auditoria de contraste
npm run build        # gera dist/
npm run dev          # servidor local com a função de borda ativa (porta 8788)
npm run borda        # testes de integração da borda (precisa do dev rodando)
npm run pronto       # checagem de pré-voo: reprova se algo ainda estiver pendente
npm run medir        # Lighthouse mobile + desktop
npm run a11y         # navegação por teclado, reflow, semântica
npm run cls          # diagnóstico: quais elementos deslocam o layout
npm run render       # capturas de tela em mobile e desktop
```

Geram artefatos versionados, rodam só quando a origem muda:

```bash
npm run fontes       # subset das fontes (precisa de Python + fonttools)
npm run imagens      # AVIF + WebP a partir de src/img-originais/
npm run og           # imagem de compartilhamento 1200×630
```

> **Ao rodar `npm run medir`, desligue o `npm run dev`.** O Lighthouse simula
> CPU 4× mais lenta; qualquer processo competindo por CPU derruba a nota sem
> que nada tenha mudado no código.

`npm run fontes` regera os `.woff2` subsetados. Só é necessário ao trocar de
fonte — os arquivos ficam versionados em `public/fonts/` e exigem Python
(`pip install fonttools brotli`).

---

## Estrutura

```
config/oferta.mjs        Fonte única da verdade: lotes, preços, links, promessas.
                         Alterado aqui, muda na borda, no build e no contador.
functions/_middleware.js Função de borda: lote, troca de promessa e UTM.
src/                     HTML, CSS e JS da página.
public/                  Fontes subsetadas e imagens.
scripts/                 Build, testes, auditoria de contraste, medição.
docs/                    Estratégia, copy, narrativa e sistema de design.
```

### Documentação

| Documento | Conteúdo |
|---|---|
| `docs/00-estrategia.md` | Tese, nome do VIP, motor de lotes, UTM, DNS, pendências |
| `docs/01-copy.md` | Copy final das 17 dobras, palavra por palavra |
| `docs/02-narrativa.md` | Narrativa-mãe e reconciliação com a copy aprovada |
| `docs/03-design-system.md` | Paleta verificada, tipografia, grid, orçamento de performance |
| `docs/04-medicao.md` | Lighthouse, o que foi corrigido e como remedir |
| `docs/05-publicacao.md` | GoDaddy → Cloudflare → Pages, com verificação a cada passo |
| `docs/06-acessibilidade.md` | O que a auditoria manual encontrou além do Lighthouse |

---

## Por que o lote é decidido na borda

Se o preço fosse calculado no navegador com `new Date()`, um relógio errado no
celular da compradora mostraria R$27 enquanto a hub.la cobraria R$47 — fricção,
suporte e chargeback. A função de borda usa o relógio da Cloudflare, que é
autoritativo, e custa aproximadamente zero (HTMLRewriter é streaming).

O HTML estático já sai do build com os valores do lote vigente preenchidos.
Se a função falhar, a página continua correta — apenas congelada naquele lote.

O JavaScript do cliente **só conta o tempo**. Nunca decide preço.

---

## Troca de promessa

`?p=<variante>` troca H1 e subtítulo na borda, antes da primeira pintura:
zero flash, zero CLS, zero JavaScript. As variantes vivem em
`config/oferta.mjs` → `PROMESSAS`. Criar uma nova é acrescentar um objeto.

```
/?p=divisao      A caneta está mudando o seu corpo. Quem está trabalhando…
/?p=93           Você está tentando resolver com 7% o que é decidido em 93%.
/?p=edepois      "E quando eu parar?"           ← a variante que vende o VIP
```

`utm_content` também seleciona, então o Meta pode alternar a promessa sem
mudar a URL do anúncio.

---

## Deploy — Cloudflare Pages

1. Conectar o repositório em Cloudflare Pages.
2. Build command `npm run build`, output directory `dist`.
3. Custom domain: `afinandocorpoemente.com.br` (ver DNS abaixo).

### DNS — GoDaddy → Cloudflare

1. Cloudflare → *Add a site* → `afinandocorpoemente.com.br` → plano Free.
2. **Antes de trocar os nameservers**, conferir registro a registro os
   **MX** e **TXT** (SPF, DKIM, DMARC) importados. Um MX perdido derruba o
   e-mail do domínio.
3. GoDaddy → *Meus Produtos* → domínio → *DNS* → *Nameservers* → *Alterar* →
   *Usar meus próprios nameservers* → colar os dois da Cloudflare.
4. SSL/TLS **Full (strict)**, *Always Use HTTPS* ON, *Automatic HTTPS Rewrites* ON.
5. Canônico: apex; `www` → 301 para o apex.

---

## Antes de publicar

```bash
npm run verificar
```

Roda os testes do motor de lotes, a auditoria de contraste, o build com o
orçamento de peso e a checagem de pré-voo — que **reprova se algum dado
pendente ainda estiver visível na página**. Nada de publicar com placeholder
por distração.

Passo a passo completo de DNS e deploy: `docs/05-publicacao.md`.

## Metas de performance

| Métrica | Meta |
|---|---|
| Lighthouse mobile | 100 / 100 / 100 / 100 |
| LCP | < 1,5s |
| CLS | 0 |
| INP | < 100ms |
| Primeira dobra | ≤ 120 KB |
