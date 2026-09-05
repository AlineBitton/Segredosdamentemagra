# Direção de arte das fotos da Aline

A página tem **quatro espaços de imagem** da Aline. Eles não são quatro versões
da mesma foto: são quatro registros diferentes, e cada um tem um trabalho.

---

## 1. Antes de qualquer coisa: IA ou câmera?

A recomendação é **câmera**, e por um motivo de conversão, não de purismo.

A mulher que compra essa imersão já foi vendida muitas vezes. O mapa da persona
descreve alguém em estado de vigília, que detecta escassez falsa e desconfia de
promessa lisa. Retrato de IA quase certo é pior que foto de celular honesta:
quando ela sente o "quase", o que ela conclui não é "usaram IA" — é "estão
maquiando alguma coisa". E aí a página inteira entra em suspeita.

Quarenta minutos de luz de janela, um celular recente e uma parede lisa
resolvem os quatro espaços. Instruções na seção 4.

**Se for IA mesmo assim**, três regras que não podem ser quebradas:

1. **Condicionar por referência, nunca gerar do texto.** Modelo de texto puro
   não devolve o rosto dela — devolve uma mulher parecida. Use um fluxo com
   referência de identidade (image-to-image / face reference) e alimente com
   4 a 6 fotos reais dela: frontal, três quartos esquerdo, três quartos
   direito, sorrindo, em repouso, e uma de corpo até a cintura.
2. **A melhor referência de rosto que existe hoje é a foto do escritório**
   (camisa azul-marinho, estante ao fundo): luz frontal macia, expressão
   neutra, sem sombra dura. Use ela como âncora.
3. **Nada de IA no percurso corporal.** Ver seção 3.

---

## 2. Os três retratos

### Abertura — presença

| | |
|---|---|
| onde | coluna direita do topo, campo de cacau, sangra no topo e na direita |
| formato | vertical, mínimo 1400 × 1900 px |
| enquadramento | da cintura para cima, ou sentada de três quartos |
| olhar | **na câmera** |
| expressão | serena com sorriso contido. Não é foto de palestra, não é foto de riso aberto |
| roupa | **camisa de linho papel cru** (#F2EDE5 ou próximo). É o contraste que faz ela saltar do campo de cacau |
| fundo | liso, sem móvel, sem estante, sem planta. Cinza-quente ou cru, para eu poder rebater no cacau |
| luz | janela lateral suave, uma fonte só. Sem contraluz, sem ponto de luz colorido |
| espaço | ar do lado esquerdo dela (direita do quadro), porque o título fica à esquerda e o olhar precisa apontar para ele |
| corte | os olhos dela caem a ~30% da altura, na linha de "Mente Magra" |

### Dobra emocional — movimento

Legenda da dobra: *"Emagrecer acontece enquanto a vida acontece."*

| | |
|---|---|
| onde | coluna esquerda, campo de linho, proporção 4:5 |
| formato | vertical, mínimo 1200 × 1500 px |
| enquadramento | meio corpo |
| olhar | **fora da câmera**, para o lado |
| expressão | no meio de uma frase. Mão em gesto, boca falando. É a única foto que não pode estar posada |
| roupa | linho em cacau ou ameixa (o campo aqui é claro, então ela precisa ser a parte escura) |
| fundo | ambiente desfocado, sem leitura de objeto |

### Mentora — confiança

| | |
|---|---|
| onde | coluna esquerda da dobra "Quem vai te conduzir", campo de linho, 4:5 |
| formato | vertical, mínimo 1200 × 1500 px |
| enquadramento | busto, frontal, **mãos à vista** |
| olhar | na câmera |
| expressão | calma, sem sorriso largo. Esta é a foto de credibilidade, não de simpatia |
| roupa | linho cacau ou ameixa |

**Nota:** a foto do escritório que já existe está muito perto de certa para este
espaço. O que falta nela é resolução e um fundo mais quieto — a estante colorida
disputa atenção. Se der para refazer o mesmo enquadramento com a parede lisa,
ela resolve sozinha.

---

## 3. O percurso — dois quadros, não uma foto

A foto de corpo inteiro puxando a calça larga não funciona por três motivos:

1. no celular ela aparece com ~165px de largura, e uma silhueta contra parede
   branca não lê nesse tamanho — um rosto lê;
2. o gesto de segurar o cós exige que a pessoa pare e interprete a imagem, e
   ninguém para;
3. metade do quadro é parede vazia.

A troca é um **díptico**, já implementado na dobra da mentora:

- **duas fotos reais**, mesmo enquadramento de busto, mesmo ângulo, mesma
  distância da câmera, fundo do mesmo tom;
- cada uma com o ano por baixo, em Jost, miúdo;
- uma legenda em primeira pessoa por baixo das duas.

A diferença aparece no rosto e nos ombros, que é onde ela lê pequeno.

### E aqui vai a parte que importa mais que a foto

A legenda **não deve dizer quantos quilos**. Não porque o guia da marca proíbe
número de quilos e antes-e-depois — proíbe, mas o motivo é outro.

O que essa mulher está comprando não é "a Aline emagreceu". Ela conhece dez
mulheres que emagreceram. O que ela nunca viu é alguém que **soube ficar**. A
narrativa do projeto já tem a frase certa:

> "Hoje eu saio da linha igual todo mundo. A diferença é que eu sei voltar."

É essa a legenda. O díptico é só o que dá lastro para ela.

### O que não fazer, em nenhuma hipótese

**Não gerar o percurso corporal com IA.** Retrato dela em camisa de linho é
representação; corpo dela antes e depois é *prova*. Prova gerada é prova
fabricada, e no caso de emagrecimento é fabricação de resultado de saúde. Se as
duas fotos reais não existirem, o díptico sai da página e fica só a frase — que
sozinha já sustenta a dobra.

---

## 4. Os prompts, com o porquê de cada escolha

Se a produção for por IA, estes são os prompts prontos. Cada decisão de
postura, roupa e expressão está justificada — nenhuma é estética por
estética.

### O que a persona precisa ver, e por quê

A Renata do mapa tem 44 anos, usou caneta, pesa-se todo dia e carrega a
pergunta "e quando eu parar?". Três coisas governam como ela lê um rosto:

**1. Ela está em estado de ameaça, não de aspiração.** Quem vive em vigília
processa rosto pelo circuito de perigo antes do de desejo. Rosto de "antes e
depois triunfante", corpo exibido, sorriso de vitória — tudo isso ativa
comparação, e comparação nessa mulher vira vergonha, não vontade. A face que
abre é a face de **regulação**: músculo relaxado em volta dos olhos, boca sem
tensão, ombros baixos. É o rosto de alguém que não está te avaliando.

**2. Sorriso de Duchenne, e só ele.** O sorriso que recruta o orbicular dos
olhos (pé de galinha) é lido como involuntário e, portanto, como verdadeiro;
o que move só a boca é lido como social e aumenta desconfiança em quem já
está desconfiada. Na abertura: sorriso pequeno **com os olhos**, não com os
dentes. Sorriso largo de dentes vende empolgação, e empolgação é exatamente
o que ela já comprou e não sustentou.

**3. Mãos à vista.** Mão visível e aberta é um dos sinais mais antigos de
"não há ameaça aqui" e aumenta confiança percebida de forma mensurável. Mão
escondida, braço cruzado e bolso fazem o contrário. As três fotos mostram as
mãos — e na de mentora elas ficam pousadas, abertas, sem gesticular.

Mais quatro, que decidem o enquadramento:

- **Olhar na câmera abre o circuito de atenção conjunta.** Use nos dois
  momentos em que ela precisa se sentir endereçada: a abertura e a mentora.
  Na dobra emocional, o olhar sai de câmera — ali a Aline está contando, não
  convidando, e olhar fixo em texto longo cansa.
- **Ângulo de câmera na altura dos olhos.** De baixo cria dominância, de cima
  cria condescendência. Ambos custam confiança numa mulher que já se sentiu
  julgada por profissional de saúde.
- **Três quartos de corpo, não frontal rígido.** Corpo ligeiramente virado
  com rosto voltado para a câmera é lido como aberto e não confrontador. O
  frontal perfeito é postura de documento.
- **Espaço acima do ombro.** Fundo com ar em volta do rosto reduz sensação de
  pressão. Enquadramento apertado num rosto grande é agressivo em tela de
  celular.

### O linho, e por que ele não é só bonito

Textura visível ativa resposta tátil mesmo em imagem 2D, e superfície natural
e irregular é lida como honesta — o oposto do brilho de cetim ou do liso
sintético. O linho também **amassa**, e amassado é sinal de alguém que vive
dentro da roupa. Para uma mulher que desconfia de perfeição, esse é o
detalhe que compra mais confiança do que qualquer credencial na legenda.

Camisa de botão aberta no primeiro botão, mangas dobradas até o antebraço:
antebraço à vista é a mesma família de sinal que a mão aberta.

**Nunca:** preto (autoridade e distância), branco puro (estoura no papel cru
e vira clínica), estampa (compete com o texto), decote profundo ou roupa
justa marcando corpo (devolve a atenção para o corpo dela, que é justamente
o assunto que trava a persona).

### Prompt 1 — abertura

> Photograph of a woman in her late forties with very short cropped grey
> hair, seated on a simple chair, turned three-quarters toward the camera,
> looking directly into the lens. She wears an **unstructured oatmeal linen
> shirt**, first button open, sleeves rolled to the forearm; delicate gold
> chain necklaces. **Small closed-lip smile that reaches the eyes** — warm,
> calm, unforced; relaxed jaw, lowered shoulders. One hand rests open on her
> thigh. **Soft single-source window light from the left**, no fill, gentle
> shadow on the right side of the face. **Plain warm mid-grey backdrop**,
> seamless, no furniture, no props. Shot at eye level on an 85mm lens, f/2.8,
> waist-up, generous headroom, negative space on the left of the frame.
> Natural skin texture with visible pores and fine lines, no retouching, no
> beauty filter. Editorial portrait, muted warm palette. Vertical 4:5.

*Negativo:* `no wide smile, no teeth, no crossed arms, no black clothing, no
white background, no studio strobe, no rim light, no neon, no gradient, no
text, no logo, no jewelry on hands, no low angle, no smoothing`

### Prompt 2 — dobra emocional

> Same woman, same short grey hair, **mid-sentence**, speaking, mouth
> slightly open, **eyes looking off-camera to the left**, one hand raised in
> a small natural gesture near chest height. She wears a **deep cocoa-brown
> linen shirt**. Candid documentary feel, as if caught between two frames of
> conversation. Soft daylight from a window, warm interior blurred far
> behind her at f/2. Half-body, eye level. Natural skin texture, no
> retouching. Vertical 4:5.

*Negativo:* mesmo do prompt 1, mais `no posing, no direct eye contact, no
symmetrical composition`

### Prompt 3 — mentora

> Same woman, **seated at a plain wooden table, forearms resting on the
> surface, hands open and visible, fingers relaxed**. Facing the camera,
> body angled slightly, **looking straight into the lens with a calm,
> attentive, closed-lip expression — present, not selling**. She wears a
> **plum-toned linen shirt**. Soft frontal window light, very slight shadow
> under the jaw. **Quiet uncluttered background**, warm neutral wall, one
> soft out-of-focus shape at most. Eye level, 85mm, chest-up. Natural skin
> texture with visible lines, no retouching. Vertical 4:5.

*Negativo:* mesmo do prompt 1, mais `no bookshelf, no colorful objects, no
clutter, no crossed arms`

### Como usar os prompts

Prompt sozinho **não devolve o rosto da Aline** — devolve uma mulher
parecida. Os três textos acima só funcionam num fluxo com **referência de
identidade** (image-to-image, face reference, LoRA — o nome muda por
ferramenta), alimentado com 4 a 6 fotos reais dela. A âncora de rosto é a
foto do escritório: luz frontal macia, expressão neutra, sem sombra dura.

Depois de gerar, confira nesta ordem — é aqui que a IA entrega o "quase":

1. **Mãos.** Conte os dedos. Olhe as unhas e as juntas.
2. **Olhos.** Os dois reflexos de luz têm que estar no mesmo lugar em cada
   olho. Assimetria de catchlight é o tell mais comum e o que mais estraga
   confiança, porque o cérebro lê olhar sem saber que está lendo.
3. **Joias.** Corrente que se funde na pele, brinco que não fecha.
4. **Pele.** Se estiver lisa demais, peça de novo. Poro e linha de expressão
   são o que separam retrato de avatar — e nesta persona, especificamente,
   pele perfeita sinaliza a promessa que ela já não acredita.
5. **Linho.** Tem que ter ruga. Linho liso virou poliéster.

---

## 4. Se for fotografar (o caminho recomendado)

- **Luz:** uma janela grande, ela a 45° dela, sem sol direto. Meio da manhã ou
  meio da tarde. Nada de luz de teto acesa junto — mistura de temperatura.
- **Fundo:** parede lisa, clara, a pelo menos 1,5 m atrás dela, para desfocar.
- **Câmera:** celular no modo retrato, na altura dos olhos dela, na horizontal
  do peito — nunca de baixo.
- **Roupa:** três camisas de linho (papel cru, cacau, ameixa). Trocar de camisa
  é o que separa os três registros.
- **Joias:** as correntes douradas ficam. São da assinatura dela e o dourado
  convive com barro e ameixa.
- **Quantidade:** 30 fotos de cada registro. A boa está entre a décima e a
  vigésima, quando ela esquece a câmera.

---

## 5. O que já não serve, e por quê

| foto | problema |
|---|---|
| estúdio com cérebro de neon | é outra marca. Azul elétrico não está na cartela, e o brilho é degradê — o guia proíbe os dois. Serve para conteúdo de IA, não para esta página |
| escritório, camisa azul-marinho | o rosto está certo e é a melhor referência de identidade que temos. A camisa está fora da cartela e a estante colorida disputa atenção |
| corpo inteiro com a calça larga | ver seção 3 |

---

## 6. O tratamento, já pronto

`npm run retratos` faz o que dá para automatizar, e só isso:

1. **recorta o fundo**, quando a foto foi feita contra parede lisa —
   preenchimento a partir das bordas para dentro, então nada no meio da
   imagem some por ter cor parecida com a da parede;
2. **assenta a pessoa sobre o campo da marca** daquele espaço — cacau na
   abertura, linho nos outros três;
3. **corta na proporção 4:5** com o ponto focal onde o olhar precisa cair;
4. **iguala a temperatura ao papel cru** — a página inteira é quente, e foto
   fria dentro dela lê como colada de outro lugar;
5. **exporta AVIF e WebP** nas larguras que a página pede.

Entrada em `src/img-originais/retratos/`, com os nomes da seção 7. Saída
direto em `public/img/`.

### O que ele não faz

- **Não muda a cor da roupa.** Camisa azul-marinho continua azul-marinho.
- **Não apaga elemento composto** — o cérebro de neon da foto de estúdio sai
  na mão, não no script.
- **Não recorta fundo com estante, móvel ou objeto.** Precisa de parede lisa.
  Para esses, o script deixa a foto inteira e avisa.

---

## 7. Entrega

Formato **JPG ou PNG**, sem tratamento de pele pesado, sem filtro, sem moldura.
Colocar em `public/img/` com estes nomes:

```
aline-abertura.jpg     vertical, ≥ 1400 × 1900
aline-emocional.jpg    vertical, ≥ 1200 × 1500
aline-mentora.jpg      vertical, ≥ 1200 × 1500
aline-percurso-1.jpg   vertical, ≥ 1000 × 1250
aline-percurso-2.jpg   vertical, ≥ 1000 × 1250, mesmo enquadramento da anterior
```

`npm run retratos` gera as versões otimizadas e os tamanhos responsivos. Os
espaços na página já estão reservados com a proporção final, então trocar o
arquivo não mexe no layout nem na CLS.
