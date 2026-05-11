export const defaultMaterials = [
  {
    id: 'seed-biology-notes',
    title: 'Biology Notes: Cell Energy',
    type: 'notes',
    content:
      'Photosynthesis converts light energy into chemical energy in glucose. Chloroplasts contain chlorophyll, which absorbs sunlight. Cellular respiration breaks down glucose to make ATP in mitochondria. ATP powers cell work, including active transport, movement, and building molecules.',
  },
  {
    id: 'seed-history-slides',
    title: 'History Slides: Civil Rights',
    type: 'slides',
    content:
      'The Civil Rights Movement used court cases, boycotts, marches, and speeches to challenge segregation. Brown v. Board of Education ruled school segregation unconstitutional. The Montgomery Bus Boycott showed the power of organized nonviolent protest. The Civil Rights Act of 1964 outlawed discrimination in public places and employment.',
  },
];

const STOP_WORDS = new Set([
  'about',
  'above',
  'after',
  'again',
  'because',
  'before',
  'being',
  'between',
  'could',
  'every',
  'from',
  'have',
  'into',
  'more',
  'other',
  'over',
  'that',
  'their',
  'there',
  'these',
  'this',
  'through',
  'used',
  'were',
  'which',
  'with',
  'would',
]);

export function extractSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

export function getKeywords(text, limit = 8) {
  const counts = new Map();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export function combineMaterials(materials) {
  return materials
    .map((item) => `${item.title}: ${item.content}`)
    .join('\n\n')
    .trim();
}

function titleCase(text) {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function generateFlashcards(materials, count = 8) {
  const text = combineMaterials(materials);
  const sentences = extractSentences(text);
  const keywords = getKeywords(text, count);

  return keywords.map((keyword, index) => {
    const supportingSentence =
      sentences.find((sentence) => sentence.toLowerCase().includes(keyword)) ||
      sentences[index % Math.max(sentences.length, 1)] ||
      'Add richer notes, documents, or slides to generate stronger cards.';

    return {
      id: `card-${keyword}-${index}`,
      front: `Explain ${titleCase(keyword)} in your own words.`,
      back: supportingSentence,
      tag: keyword,
    };
  });
}

export function generateQuiz(materials, count = 6) {
  const text = combineMaterials(materials);
  const sentences = extractSentences(text);
  const keywords = getKeywords(text, count + 4);

  return sentences.slice(0, count).map((sentence, index) => {
    const answer = keywords.find((keyword) => sentence.toLowerCase().includes(keyword)) || keywords[index] || 'concept';
    const distractors = keywords.filter((keyword) => keyword !== answer).slice(index, index + 3);
    while (distractors.length < 3) {
      distractors.push(['definition', 'timeline', 'example', 'process'][distractors.length]);
    }

    return {
      id: `quiz-${index}`,
      question: `Which key idea best matches: “${sentence}”`,
      answer,
      choices: [answer, ...distractors].sort((a, b) => a.localeCompare(b)),
      explanation: `This statement is most closely connected to ${answer}.`,
    };
  });
}

export function buildStudySession(materials, minutes = 25) {
  const cards = generateFlashcards(materials, 6);
  const quiz = generateQuiz(materials, 4);
  const safeMinutes = Math.max(15, Number(minutes) || 25);
  const warmupMinutes = Math.max(3, Math.round(safeMinutes * 0.2));
  const cardMinutes = Math.max(5, Math.round(safeMinutes * 0.38));
  const quizMinutes = Math.max(4, Math.round(safeMinutes * 0.24));
  const reviewMinutes = Math.max(3, safeMinutes - warmupMinutes - cardMinutes - quizMinutes);
  const totalPlanned = warmupMinutes + cardMinutes + reviewMinutes + quizMinutes;
  const adjustedQuizMinutes = Math.max(1, quizMinutes + safeMinutes - totalPlanned);

  return [
    {
      phase: 'Warm-up',
      minutes: warmupMinutes,
      prompt: `Skim ${materials.length} uploaded materials and say the main goal out loud.`,
    },
    {
      phase: 'Flashcard sprint',
      minutes: cardMinutes,
      prompt: `Practice ${cards.length} AI-generated cards. Mark anything shaky for review.`,
    },
    {
      phase: 'Teacher mini-lesson',
      minutes: reviewMinutes,
      prompt: `Listen to the voice teacher explain your hardest cards, then summarize without looking.`,
    },
    {
      phase: 'Quiz check',
      minutes: adjustedQuizMinutes,
      prompt: `Answer ${quiz.length} quiz questions and review explanations for missed answers.`,
    },
  ];
}
