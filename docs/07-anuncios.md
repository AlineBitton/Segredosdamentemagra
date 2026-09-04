# Documento 07 — Anúncios no Meta

> Uma peça de anúncio para cada variante de promessa da página.
> O anúncio e a dobra 1 têm que dizer a **mesma coisa** — se ela clica em uma
> promessa e cai em outra, o clique vira rejeição. É isso que o `?p=` resolve.

---

## ⚠️ Antes de escrever: duas regras do Meta que reprovam

### 1 · Atributos pessoais — a que mais derruba anúncio de emagrecimento

O Meta proíbe anúncio que **afirme ou dê a entender que você sabe algo pessoal
sobre quem está lendo** — inclusive peso, saúde e imagem corporal. Na prática,
o gatilho é o **"você" em segunda pessoa afirmando algo sobre o corpo dela**.

Quase toda a copy da landing page cairia nessa regra se fosse copiada para o
anúncio. Compare:

| ❌ Reprova | ✅ Passa |
|---|---|
| "Você sobe na balança todo dia pra confirmar." | "Tem mulher que sobe na balança todo dia só pra confirmar que o número ainda tá lá." |
| "Você tem três tamanhos no armário." | "Existe um armário com três tamanhos de roupa que ninguém consegue doar." |
| "A caneta está mudando o **seu** corpo." | "A caneta muda o corpo. Quem trabalha para o cérebro acompanhar?" |
| "Você emagreceu e não consegue ficar." | "Emagrecer, muita gente já conseguiu. Ficar é outra conversa." |

A regra prática: **na página, fale com ela em "você". No anúncio, fale
sobre a situação em terceira pessoa, ou em primeira pessoa (a Aline contando).**
A identificação acontece igual — e o anúncio roda.

### 2 · Antes e depois é proibido em anúncio

As 14 fotos de prova social **não podem ser criativo de anúncio**. O Meta
proíbe imagens de antes e depois e imagens que sugiram um resultado corporal
"ideal". Elas funcionam **na página**, depois do clique — e é exatamente por
isso que estão lá, e não aqui.

Criativo que funciona nessa faixa: **a Aline falando em vídeo**, texto sobre
fundo limpo, ou uma cena cotidiana sem corpo em foco.

### 3 · Duas coisas do mapa da persona que também valem no anúncio

- **Nada anti-medicação.** "A caneta é atalho", "solução fácil". Ela usa —
  vai embora e não volta.
- **Medo nunca é alavanca.** "Quando você parar, volta tudo" converte no
  scroll e destrói a tese: reforça a crença de que a solução está fora dela.

---

## Estrutura da URL

```
https://afinandocorpoemente.com.br/?p=<variante>
  &utm_source=meta
  &utm_medium=paid
  &utm_campaign=smm-set26
  &utm_content=<id-do-criativo>
  &utm_term=<publico>
```

Tudo isso chega ao checkout da hub.la automaticamente, e os 5 UTMs viram o
`sck` — então a venda é atribuída ao criativo exato.

> ⚠️ **Nomeie o `utm_content` com prefixo** (`crv-balanca-01`, não `balanca`).
> O `utm_content` é o seletor reserva de variante: se ele for exatamente igual
> ao nome de uma variante e o `p=` faltar, a promessa troca sem querer.

---

# As 9 peças

Cada uma traz: texto principal, título, descrição, criativo e a URL.
**Título ≤ 40 caracteres. Descrição ≤ 30.** Acima disso o Meta corta.

---

## 1 · `p=divisao` — a divisão do trabalho
**O ângulo nº 1 do mapa.** Concede tudo à ferramenta, não disputa com o médico,
e abre um espaço vazio que ninguém está ocupando.

**Texto principal**
> A caneta faz o trabalho dela. E faz bem.
>
> Ela silencia a fome, muda a quantidade no prato, e o número na balança desce.
> Isso é real e ninguém aqui vai tirar esse mérito.
>
> Só que existe um segundo trabalho — o que dispara a vontade, o padrão que
> vira comportamento — e esse nunca foi trabalho dela.
>
> Esse trabalho tem dono.
>
> Nos dias 25, 26 e 27 de setembro eu abro 3 dias ao vivo para mostrar
> exatamente como ele se faz. Ninguém vai te pedir para parar nada, e nada
> disso disputa com o seu médico.

**Título** `A caneta muda o corpo. E o cérebro?` (35)
**Descrição** `3 dias ao vivo · a partir de R$27` (33 → cortar para `3 dias ao vivo · desde R$27`)
**Criativo** Aline falando em vídeo, 30–45s, abrindo com *"A caneta faz o trabalho dela — e faz bem."* Legenda queimada.
**URL** `/?p=divisao&utm_source=meta&utm_medium=paid&utm_campaign=smm-set26&utm_content=crv-divisao-01&utm_term=frio`

---

## 2 · `p=93` — a proporção
Ela é analítica, já leu bula. Um número ela respeita.

**Texto principal**
> 93% do que decide o que a gente come acontece no inconsciente.
> 7% é o que a gente decide "racionalmente".
>
> Quase todo mundo está tentando resolver com os 7%.
>
> É por isso que "eu sei o que fazer, eu só não faço" é a frase mais repetida
> na boca de quem tenta emagrecer há vinte anos. Não é falta de disciplina.
> É proporção.
>
> 3 dias ao vivo para trabalhar onde a decisão realmente acontece.

**Título** `Não é disciplina. É proporção.` (30)
**Descrição** `25, 26 e 27 de setembro` (23)
**Criativo** Texto grande sobre fundo escuro: **93% · 7%**. Sem foto. É o criativo mais barato de produzir e o que costuma render mais em público frio analítico.
**URL** `/?p=93&…&utm_content=crv-93-01`

---

## 3 · `p=edepois` — a pergunta que ninguém responde ⭐
**É a variante que vende o VIP.** Use com público morno e retargeting.

**Texto principal**
> "E quando eu parar?"
>
> Essa pergunta chega no consultório e volta inteira. Não porque o médico
> errou — a resposta dele é sobre dose, e está tecnicamente certa.
>
> É que a resposta dessa pergunta não está na dose. Está no que foi construído
> por baixo do resultado.
>
> Nos dias 25, 26 e 27 eu abro 3 dias ao vivo sobre exatamente isso.
> E, para quem quiser, 50 minutos comigo depois — só seu, olhando o seu caso
> inteiro, não uma fatia dele.

**Título** `"E quando eu parar?"` (20)
**Descrição** `A resposta não está na dose` (27)
**Criativo** Aline em vídeo, close, tom baixo. Abrir em silêncio e depois a pergunta. **Não usar música animada.**
**URL** `/?p=edepois&…&utm_content=crv-edepois-01&utm_term=morno`

---

## 4 · `p=bariatrica` — o estômago diminuiu, o padrão não

**Texto principal**
> A cirurgia diminui o estômago. Ela não mexe no padrão.
>
> É por isso que existe tanta mulher que fez bariátrica, chegou no peso que
> queria, e alguns anos depois estava de volta ao ponto de partida — sem
> entender o que tinha acontecido, e se cobrando por isso.
>
> Não foi a cirurgia que falhou. Ela fez o que se propôs.
> É que ninguém cuidou da outra metade.
>
> 3 dias ao vivo, 25, 26 e 27 de setembro.

**Título** `A cirurgia mudou o estômago` (27)
**Descrição** `O padrão continua igual` (23)
**Criativo** Aline em vídeo. Público específico — rodar como conjunto separado, orçamento próprio.
**URL** `/?p=bariatrica&…&utm_content=crv-bariatrica-01`

---

## 5 · `p=balanca` — o sintoma mudou de endereço
A experiência mais vivida e menos nomeada da faixa. Reconhecimento puro.

**Texto principal**
> Tem mulher que sobe na balança todo dia. Descalça, antes de beber água,
> sempre no mesmo ponto do piso. Se o número não agrada, desce e sobe de novo.
>
> E chama isso de disciplina.
>
> Não é. É o mesmo mecanismo de antes, com outra roupa: antes era a comida que
> acalmava, agora é o número. Por dez minutos — e depois cobra de novo.
>
> A saída não é parar de se pesar. É saber exatamente o que fazer quando o
> número sobe. 3 dias ao vivo para construir isso.

**Título** `Isso não é disciplina` (21)
**Descrição** `É o sintoma em outro lugar` (26)
**Criativo** Cena cotidiana sem corpo em foco: pés no piso do banheiro, luz de manhã cedo. Ou só texto.
**URL** `/?p=balanca&…&utm_content=crv-balanca-01`

---

## 6 · `p=roupa` — o teste de identidade que ninguém está fazendo
Ninguém no mercado está falando disso. Melhor custo por clique esperado.

**Texto principal**
> Existe um armário com três coleções que convivem.
>
> A roupa de quando ela era maior — que não se doa, não se vende, não se
> descarta. A roupa que serve hoje, poucas peças, escuras e folgadas.
> E a roupa-meta que ainda não serve, comprada como promessa, guardada com
> etiqueta.
>
> Esvaziar a primeira é o gesto mais adiado de todos. Porque não é sobre roupa:
> é sobre declarar que não vai voltar.
>
> O que você faz com a roupa que não serve mais diz mais sobre o seu processo
> do que a balança. 3 dias ao vivo, 25 a 27 de setembro.

**Título** `Três tamanhos no mesmo armário` (30)
**Descrição** `E nenhum dá para doar` (21)
**Criativo** Foto de armário, roupas em cabides, **sem pessoa**. Zero risco de política.
**URL** `/?p=roupa&…&utm_content=crv-roupa-01`

---

## 7 · `p=sanfona` — desce e volta

**Texto principal**
> A balança desce. E seis meses depois, volta.
>
> Já aconteceu tantas vezes que virou explicação: "eu sou assim mesmo",
> "meu corpo não colabora", "falta disciplina".
>
> Não é nada disso. É que o trabalho foi feito em uma ponta só.
>
> Emagrecer é uma tríade que dança entre pensar, sentir e agir. Mexer em uma
> ponta faz a balança descer. Mexer nas três é o que faz ela ficar.
>
> 25, 26 e 27 de setembro, ao vivo.

**Título** `Desce e volta. Sempre.` (22)
**Descrição** `O trabalho foi feito pela metade` (32 → `O trabalho foi feito só em parte`)
**Criativo** Vídeo da Aline ou motion simples com a tríade.
**URL** `/?p=sanfona&…&utm_content=crv-sanfona-01`

---

## 8 · `p=40mais` — o corpo mudou as regras

**Texto principal**
> Depois dos 40, o corpo muda as regras do jogo. E ninguém avisa.
>
> O que funcionava aos 30 para de funcionar, e a conclusão automática é a mais
> injusta possível: "então o problema sou eu".
>
> Não é. É método antigo aplicado num corpo novo.
>
> 3 dias ao vivo para aprender a trabalhar as três pontas que decidem o
> resultado: pensar, sentir e agir.

**Título** `Depois dos 40 as regras mudam` (29)
**Descrição** `E ninguém avisa` (15)
**Criativo** Aline em vídeo, tom de conversa.
**URL** `/?p=40mais&…&utm_content=crv-40mais-01`

---

## 9 · `p=` *(padrão)* — retargeting e público amplo

**Texto principal**
> Emagrecer, muita gente já conseguiu. Ficar é outra conversa.
>
> O que faz a balança descer não é o que faz ela ficar — e essa é a parte que
> quase nunca é ensinada.
>
> 3 dias ao vivo, 25, 26 e 27 de setembro, com Aline Bitton.
> Garantia incondicional já no primeiro dia.

**Título** `Descer você já sabe` (19)
**Descrição** `Ficar é outra conversa` (22)
**Criativo** O melhor vídeo que já rodou, reaproveitado. Em retargeting, o criativo importa menos que a frequência.
**URL** `/?p=&…&utm_content=crv-padrao-01&utm_term=retargeting`

---

## Plano de teste

**Semana 1 — descoberta (público frio).** Rodar `divisao`, `93` e `roupa` no
mesmo conjunto, orçamento igual. São os três de menor risco de política e maior
poder de reconhecimento. Deixar rodar 3 dias sem mexer.

**Semana 2 — aprofundar.** Manter a vencedora, trocar as duas perdedoras por
`balanca` e `sanfona`.

**Retargeting, o tempo todo.** Quem visitou e não comprou vê `edepois`. É a
variante que vende o VIP, e quem já conhece a página é quem está pronto
para ela.

**`bariatrica` em conjunto separado**, com orçamento próprio: o público é menor
e ela compete mal contra as outras se estiver na mesma disputa.

### Como ler o resultado

O número que decide **não é o custo por clique**. É o **custo por venda de
VIP** — porque o VIP é onde está a margem e é para ele que a página inteira foi
construída. Uma variante com clique caro e muito VIP vale mais que uma barata
que só vende Comum.

O `sck` que chega na hub.la carrega `utm_source|utm_medium|utm_campaign|utm_term|utm_content`,
então dá para ver exatamente qual criativo vendeu qual ingresso.

### Segmentação

- **Idade 38–55.** A narrativa fala de 35 a 60 e o mapa concentra em 42–48.
  38–55 é onde está o dinheiro e a pressa.
- **Não segmentar por interesse em saúde ou peso.** O Meta restringe, e o
  algoritmo acha essa mulher melhor sozinho a partir do criativo.
- **Públicos semelhantes** a partir de quem comprou é o caminho mais rápido
  depois das primeiras vendas.
