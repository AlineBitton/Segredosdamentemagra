/**
 * Monta a Ficha de participante inteira no Google Forms.
 *
 * COMO USAR — leva uns dois minutos:
 *
 *   1. Abra  script.google.com  →  Novo projeto
 *   2. Apague o que estiver lá e cole este arquivo inteiro
 *   3. Menu de execução: escolha  montarFicha  →  Executar
 *   4. Autorize (é a sua própria conta criando um formulário seu)
 *   5. O log mostra dois links: o de responder e o de editar.
 *      O de responder é o que vai na página de agradecimento.
 *
 * Ele cria um formulário NOVO, com as 13 perguntas, as 5 seções, os textos
 * de ajuda, a tela de confirmação e a planilha de respostas já ligada.
 *
 * O conteúdo é o de docs/11-formulario.md. Mudou lá, mude aqui.
 */

function montarFicha() {
  const form = FormApp.create('Ficha de participante — Imersão Segredos da Mente Magra');

  form.setDescription(
    'Sua vaga está garantida. Antes da gente se encontrar, quero saber de você.\n\n' +
    'Não é cadastro. É o que me deixa entrar na sexta já sabendo com quem eu estou ' +
    'falando — e é o que faz a imersão ir direto ao ponto no seu caso.\n\n' +
    'Algumas perguntas pedem que você lembre de uma cena específica. Essa parte é a ' +
    'mais importante, e é onde a imersão já começa: quase ninguém para para olhar de ' +
    'perto o que aconteceu naquela hora.\n\n' +
    'São 13 perguntas. Escreva do jeito que vier — ninguém além de mim lê.'
  );

  /* ── Seção 1 · Para eu te encontrar ─────────────────────────────── */

  form.addSectionHeaderItem()
    .setTitle('Para eu te encontrar')
    .setHelpText('O básico, para eu te achar no grupo e te mandar o link.');

  form.addTextItem()
    .setTitle('Como você quer ser chamada?')
    .setRequired(true);

  form.addTextItem()
    .setTitle('O e-mail que você usou na compra')
    .setHelpText('É por ele que a Hub.la reconhece o seu ingresso.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Seu WhatsApp, com DDD')
    .setHelpText('É por aqui que o link do Google Meet chega. Ex.: 61 99860-9818.')
    .setRequired(true);

  /* ── Seção 2 · Onde você está agora ─────────────────────────────── */

  form.addPageBreakItem()
    .setTitle('Onde você está agora')
    .setHelpText(
      'Esta resposta muda o que eu preparo para a sexta. Responda pelo que é hoje, ' +
      'não pelo que você gostaria que fosse.'
    );

  form.addMultipleChoiceItem()
    .setTitle('Qual frase descreve melhor o seu momento?')
    .setChoiceValues([
      'Estou usando a caneta agora, e o resultado está vindo',
      'Estou usando, mas já tenho data para reduzir ou parar',
      'Já parei — e estou vendo o peso voltar',
      'Já parei — e até agora consegui manter',
      'Fiz cirurgia bariátrica',
      'Nunca usei medicação nem fiz cirurgia',
      'Prefiro não dizer',
    ])
    .setRequired(true);

  /* ── Seção 3 · Uma cena, em três camadas ────────────────────────── */

  form.addPageBreakItem()
    .setTitle('Uma cena, em três camadas')
    .setHelpText(
      'Agora a parte que importa de verdade.\n\n' +
      'Pense numa vez específica em que a vontade apareceu forte — de preferência a ' +
      'mais recente. Vou te pedir três coisas sobre ela, uma de cada vez.\n\n' +
      'Não existe resposta errada, e quanto mais concreta, mais eu consigo te ajudar.'
    );

  form.addParagraphTextItem()
    .setTitle('Primeiro, a cena. Que dia era, que horas eram, onde você estava, e o que tinha acontecido antes?')
    .setHelpText(
      'Não precisa ser bonito nem organizado. Quanto mais parecido com o que realmente ' +
      'aconteceu, melhor. Se você não lembra de uma específica, descreva a que mais se repete.'
    )
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Naquela hora, o que você sentiu no corpo?')
    .setChoiceValues([
      'Aperto no peito',
      'Um vazio ou um buraco no estômago',
      'Aceleração, coração disparado',
      'Tensão no maxilar, nos ombros ou nas mãos',
      'Um cansaço que pesa',
      'Inquietação, não conseguia ficar parada',
      'Calor, calorão',
      'Não sei dizer — eu não estava prestando atenção no corpo',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('E o que passou pela sua cabeça?')
    .setHelpText(
      'A frase, do jeito que ela veio. "Eu mereço", "só hoje", "amanhã eu volto", ' +
      '"não aguento mais" — ou qualquer outra. Se vieram várias, escreva todas.'
    )
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('E o que aconteceu depois?')
    .setChoiceValues([
      'Passou, e eu segui o dia normal',
      'Passou, mas fiquei remoendo',
      'Não passou, e eu comi',
      'Comi, e depois veio a culpa',
      'Comi, e o dia seguinte inteiro virou "estraguei tudo"',
    ])
    .setRequired(true);

  /* ── Seção 4 · O que você já carrega ────────────────────────────── */

  form.addPageBreakItem()
    .setTitle('O que você já carrega')
    .setHelpText(
      'Duas perguntas sobre o que você já faz e o que você já pensa. Não tem certo nem ' +
      'errado — eu preciso saber onde a gente está começando.'
    );

  form.addCheckboxItem()
    .setTitle('Naquela hora, o que você já tentou fazer?')
    .setChoiceValues([
      'Esperar passar',
      'Beber água ou tomar chá',
      'Comer algo "permitido" no lugar',
      'Sair de perto, ir para outro cômodo',
      'Me distrair com o celular',
      'Dormir mais cedo',
      'Comer e resolver depois',
      'Nunca cheguei a tentar nada — quando percebo, já aconteceu',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('E a balança: com que frequência você sobe, e o que o número faz com o seu dia?')
    .setHelpText(
      'Se você não sobe, escreva isso — e conte por quê. Se sobe todo dia, também não ' +
      'tem problema nenhum. Eu só preciso saber.'
    )
    .setRequired(true);

  /* ── Seção 5 · O que você veio buscar ───────────────────────────── */

  form.addPageBreakItem()
    .setTitle('O que você veio buscar');

  form.addParagraphTextItem()
    .setTitle('Quando você imagina reduzir ou parar a medicação, o que vem?')
    .setHelpText(
      'Se você não usa, escreva o que vem quando imagina sair do controle que você faz ' +
      'hoje.\n\nPode ser uma frase só. Ninguém nunca te perguntou isso em voz alta, e é ' +
      'justamente por isso que ela costuma vir inteira.'
    )
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Se no domingo à tarde esta imersão tiver valido a pena, o que estará diferente?')
    .setHelpText(
      'Não vale "estar mais magra". Pense no que você vai conseguir fazer que hoje você ' +
      'não consegue.'
    )
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Tem alguma coisa que eu precise saber sobre você antes da sexta?')
    .setHelpText(
      'Acompanhamento médico em andamento, alguma questão de saúde, algo que você não ' +
      'quer que seja falado no grupo. Fica só comigo.'
    )
    .setRequired(false);

  /* ── Configuração ───────────────────────────────────────────────── */

  form.setConfirmationMessage(
    'Recebido. Obrigada por escrever.\n\n' +
    'Eu leio todas antes da sexta. Se a sua cena aparecer na aula de abertura, vai ser ' +
    'sem nome — mas você vai reconhecer.\n\n' +
    'Uma coisa: o que você acabou de escrever sobre a cena, o corpo e a cabeça é a ' +
    'primeira página do seu mapa. Guarde. No sábado a gente continua dali.\n\n' +
    'Sexta, 25 de setembro, 19h. O link chega no grupo do WhatsApp.'
  );

  form.setProgressBar(true);        // são 5 seções; sem barra parece infinito
  form.setCollectEmail(false);      // já é a pergunta 2; ligado, duplica
  form.setLimitOneResponsePerUser(false);  // exigiria conta Google e derrubaria respostas
  form.setAllowResponseEdits(true); // ela pode lembrar de mais coisa depois
  form.setShuffleQuestions(false);
  form.setShowLinkToRespondAgain(false);

  // planilha de respostas, na mesma pasta do formulário
  const planilha = SpreadsheetApp.create('Respostas — Ficha de participante SMM');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());

  Logger.log('———————————————————————————————————————————');
  Logger.log('LINK PARA RESPONDER (é este que vai na página):');
  Logger.log(form.getPublishedUrl());
  Logger.log('');
  Logger.log('Link para editar o formulário:');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('Planilha de respostas:');
  Logger.log(planilha.getUrl());
  Logger.log('———————————————————————————————————————————');
  Logger.log('Falta só a aparência, que a API não define — 4 cliques no editor:');
  Logger.log('  Personalizar tema (pincel, canto superior direito)');
  Logger.log('  Cabeçalho ....... enviar a imagem cabecalho-ficha.png');
  Logger.log('  Cor do tema ..... #5E3A46   (ameixa)');
  Logger.log('  Cor do fundo .... #F2EDE5   (papel cru) — em "Personalizado"');
  Logger.log('  Estilo da fonte . Formal');
}
