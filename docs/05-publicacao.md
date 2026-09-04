# Documento 05 — Publicação

> Do repositório ao domínio no ar. Cada passo tem uma verificação:
> se ela falhar, não siga para o próximo.

---

## Antes de começar

```bash
npm run verificar
```

Roda os testes do motor de lotes, a auditoria de contraste, o build com o
orçamento de peso e a **checagem de pré-voo** — que reprova se algum dado
pendente ainda estiver visível na página. Hoje ela aponta 7 bloqueios:

| | Pendência | Onde resolver |
|---|---|---|
| 1 | Número do WhatsApp (está `55DDDNUMERO`) | `src/index.html` |
| 2 | CNPJ e endereço | `src/privacidade.html`, `src/termos.html` |
| 3 | Horário dos 3 dias | `config/oferta.mjs` → `EVENTO.horario` |
| 4 | Plataforma do evento | `config/oferta.mjs` → `EVENTO.plataforma` |
| 5 | **Os 4 links de checkout do Comum** | `config/oferta.mjs` → `CHECKOUT.comumPorLote` |

O item 5 é o mais sério. Como a hub.la não muda o preço sozinha, publicar com
um link único significa que, a partir de 10 de setembro, a página anuncia R$47
e o checkout cobra R$27 — ou o contrário. É devolução, suporte e desconfiança.

---

## Etapa 1 · Cloudflare recebe o domínio

1. Cloudflare → **Add a site** → `afinandocorpoemente.com.br` → plano **Free**.
2. A Cloudflare varre o DNS atual e importa o que encontrar.
   **Confira registro a registro antes de seguir**, especialmente:
   - **MX** — se um se perder, o e-mail do domínio para de funcionar;
   - **TXT** de SPF, DKIM e DMARC — se sumirem, seus e-mails começam a cair em spam;
   - subdomínios que já existam.
3. Anote os dois nameservers que a Cloudflare fornece
   (formato `algo.ns.cloudflare.com`).

> ⚠️ **Se já existe um site nesse domínio**, decida agora onde a imersão vai
> morar. Publicar na raiz substitui o que está lá. Ver Etapa 3.

**Verificação:** a lista de DNS na Cloudflare bate com a da GoDaddy, linha a linha.

---

## Etapa 2 · GoDaddy aponta para a Cloudflare

1. GoDaddy → **Meus Produtos** → o domínio → **DNS** → **Nameservers** → **Alterar**.
2. Escolher **"Usar meus próprios nameservers"**.
3. Colar os dois da Cloudflare. Salvar.

Propagação: normalmente menos de 1 hora, até 24 no pior caso.

**Verificação:**
```bash
dig +short NS afinandocorpoemente.com.br
```
Precisa devolver os dois nameservers da Cloudflare. Enquanto devolver os da
GoDaddy, ainda não propagou — espere, não mexa.

---

## Etapa 3 · Cloudflare Pages

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Repositório: `AlineBitton/Segredosdamentemagra`.
   Branch de produção: `claude/segredos-mente-magra-landing-f2dwfw`
   (ou `main`, depois do merge).
3. Configuração de build:

   | Campo | Valor |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | `22` |

4. **Deploy**. O primeiro sai em `*.pages.dev`.

**Verificação — teste no `.pages.dev` antes de apontar o domínio:**

```bash
# preço e lote vindos da borda
curl -sI https://<seu-projeto>.pages.dev | grep -i x-lote

# troca de promessa
curl -s "https://<seu-projeto>.pages.dev/?p=edepois" | grep -o '<h1[^>]*>[^<]*'

# UTM chegando na hub.la
curl -s "https://<seu-projeto>.pages.dev/?utm_source=meta&utm_medium=cpc" \
  | grep -o 'href="https://hub.la[^"]*"' | head -1
```

Se o `x-lote` não aparecer, a função de borda não subiu — confira se a pasta
`functions/` foi para o repositório.

---

## Etapa 4 · Domínio no Pages

1. No projeto → **Custom domains** → **Set up a custom domain**.
2. Adicionar `afinandocorpoemente.com.br` **e** `www.afinandocorpoemente.com.br`.
   A Cloudflare cria os registros sozinha.
3. **SSL/TLS** → modo **Full (strict)**.
4. **SSL/TLS → Edge Certificates**: ligar **Always Use HTTPS** e
   **Automatic HTTPS Rewrites**.
5. O `www` redireciona para o apex pelo `src/_redirects`, que já está no repositório.

### Se o domínio já tiver um site

Três caminhos, em ordem de preferência:

| | Onde a imersão vive | Como |
|---|---|---|
| **A** | `afinandocorpoemente.com.br/segredosdamentemagra` | No Pages, custom domain com path. Preserva o site atual. |
| **B** | `imersao.afinandocorpoemente.com.br` | Subdomínio próprio. Mais simples de reverter. |
| **C** | Raiz do domínio | Só se o domínio estiver livre. |

Escolhido A ou B, ajustar `SITE` em `scripts/build.mjs` e a `<link rel="canonical">`
em `src/index.html` — senão o SEO e o `og:image` apontam para o lugar errado.

---

## Etapa 5 · Verificação pós-deploy

Percorra esta lista no domínio real, **do celular**, não só do computador.

### Funcional
- [ ] A página abre em `https://afinandocorpoemente.com.br` com cadeado.
- [ ] `www.` redireciona para o apex.
- [ ] O preço do hero, o da barra fixa e o do bloco de oferta são **o mesmo**.
- [ ] O contador está andando, nos **três** lugares (hero, topo da oferta, rodapé da oferta).
- [ ] Clicar em "Quero o ingresso Comum" leva ao checkout **com o preço do lote vigente**.
- [ ] Clicar em "Quero o VIP" leva ao `pay.hub.la` com **R$197**.
- [ ] O botão do WhatsApp abre a conversa certa.
- [ ] `/termos` e `/privacidade` abrem.
- [ ] O acordeão do FAQ abre e fecha pelo teclado (Tab + Enter).

### Campanha
- [ ] Abrir `?p=edepois` — o título vira **"E quando eu parar?"**.
- [ ] Abrir `?p=93` — o título vira **"Você está tentando resolver com 7%…"**.
- [ ] Abrir com `?utm_source=meta&utm_medium=cpc&utm_campaign=teste` e conferir,
      clicando com o botão direito no CTA, que a URL da hub.la carrega os UTMs
      **e o `sck`**.
- [ ] Colar o link no WhatsApp e ver se o cartão aparece com a imagem e o preço.

### Na virada de lote — **anote isto na agenda**
Nas noites de **09, 15 e 22 de setembro**, pouco depois da meia-noite:
- [ ] Recarregar a página e confirmar que o preço subiu.
- [ ] Clicar no CTA e confirmar que **o checkout cobra o novo valor**.

Se página e checkout divergirem, o problema está no `CHECKOUT.comumPorLote` —
e é para tirar a campanha do ar até corrigir.

---

## Depois de publicar

### Trocar dados sem mexer em código
Quase tudo mora em `config/oferta.mjs`: preços, datas, links, variantes de
promessa, Pixel. Alterou lá, `git push`, a Cloudflare reconstrói sozinha.

### Trocar as fotos
Coloque os arquivos em `src/img-originais/provas/` e rode:
```bash
npm run imagens && npm run og && npm run build
```

### Criar uma variante de promessa nova
Um objeto novo em `PROMESSAS`, dentro de `config/oferta.mjs`. O anúncio passa a
usar `?p=<nome>`. Não precisa tocar no HTML.

### Conferir a performance de novo
```bash
npm run medir
```
Com o `npm run dev` **desligado** — ver doc 04.
