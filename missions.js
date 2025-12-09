const missions = [
  {
    id: 'frase-espejo',
    title: 'Frase espejo',
    description: 'Escucha a tu pareja y refleja la idea con tus palabras en italiano.',
    type: 'frase-espejo',
    level: 'A1',
    skill: 'expresion',
    estimatedTime: 5,
    content: {
      phrase: 'Racconta qualcosa che ti rende felice.',
    },
  },
  {
    id: 'palabra-del-dia',
    title: 'Palabra del día',
    description: 'Aprende una palabra nueva y úsala en una frase.',
    type: 'palabra-del-dia',
    level: 'A1',
    skill: 'vocabulario',
    estimatedTime: 5,
    content: {
      word: 'Sole',
      definition: 'Luce naturale che illumina la Terra.',
      example: 'Oggi il sole splende ed è una giornata bellissima.',
    },
  },
  {
    id: 'completa-hueco',
    title: 'Completa el hueco',
    description: 'Elige la mejor palabra para terminar la frase.',
    type: 'completa-hueco',
    level: 'A2',
    skill: 'gramatica',
    estimatedTime: 6,
    content: {
      text: 'Piensa en cómo completarías esta idea en italiano.',
      sentence: 'La mia pizza preferita è quella con ___ e basilico.',
    },
  },
  {
    id: 'elige-escena',
    title: 'Elige la escena',
    description: 'Escoge la situación y explícale a tu pareja cómo actuarías.',
    type: 'elige-escena',
    level: 'A2',
    skill: 'decision',
    estimatedTime: 7,
    content: {
      scenario: 'Estáis en una cafetería en Roma y el camarero pregunta qué queréis tomar.',
      options: [
        'Chiedere un cappuccino e un cornetto.',
        'Ordinare un tè e un panino vegetariano.',
        'Provare una cioccolata calda con panna.',
      ],
    },
  },
  {
    id: 'mini-dialogo',
    title: 'Mini diálogo',
    description: 'Practica un intercambio rápido de frases.',
    type: 'mini-dialogo',
    level: 'A1',
    skill: 'dialogo',
    estimatedTime: 6,
    content: {
      situation: 'Estás conociendo a un compañero de trabajo italiano.',
      characterA: 'Ciao! Sono felice di lavorare con te.',
      characterB: 'Anch’io! Da quanto tempo vivi qui?',
    },
  },
];

function missionForDate(date) {
  const index = date.getDate() + date.getMonth() * 31 + date.getFullYear();
  return missions[index % missions.length];
}
