import { buildStudySession, defaultMaterials, generateFlashcards, generateQuiz } from './studyEngine.js';

const typeLabels = {
  notes: 'Notes',
  slides: 'Slide show',
  docs: 'Document',
  link: 'Link / source',
};

let materials = [...defaultMaterials];
let answers = {};
let flippedCard = null;

const elements = {
  form: document.querySelector('#material-form'),
  title: document.querySelector('#material-title'),
  type: document.querySelector('#material-type'),
  content: document.querySelector('#material-content'),
  fileInput: document.querySelector('#file-input'),
  materialList: document.querySelector('#materials-list'),
  flashcards: document.querySelector('#flashcards'),
  minutes: document.querySelector('#minutes'),
  minutesLabel: document.querySelector('#minutes-label'),
  sessionList: document.querySelector('#session-list'),
  quizList: document.querySelector('#quiz-list'),
  scoreLine: document.querySelector('#score-line'),
  voiceButton: document.querySelector('#voice-button'),
  teacherScript: document.querySelector('#teacher-script'),
  statsMaterials: document.querySelector('#stats-materials'),
  statsGenerated: document.querySelector('#stats-generated'),
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function resetGeneratedState() {
  answers = {};
  flippedCard = null;
}

function renderMaterials() {
  elements.materialList.replaceChildren();
  materials.forEach((item) => {
    const card = createElement('article', 'material-card');
    const body = createElement('div');
    body.append(createElement('span', 'pill', typeLabels[item.type] || 'Material'));
    body.append(createElement('h3', '', item.title));
    body.append(createElement('p', '', item.content));

    const remove = createElement('button', '', '🗑');
    remove.setAttribute('aria-label', `Remove ${item.title}`);
    remove.addEventListener('click', () => {
      materials = materials.filter((material) => material.id !== item.id);
      resetGeneratedState();
      render();
    });

    card.append(body, remove);
    elements.materialList.append(card);
  });
}

function renderFlashcards(flashcards) {
  elements.flashcards.replaceChildren();
  if (!flashcards.length) {
    elements.flashcards.append(createElement('p', 'muted', 'Add more detailed notes to generate flashcards.'));
    return;
  }

  flashcards.forEach((card) => {
    const button = createElement('button', 'flashcard');
    button.innerHTML = `
      <span>${flippedCard === card.id ? 'Answer' : 'Question'}</span>
      <strong></strong>
      <em>#${card.tag}</em>
    `;
    button.querySelector('strong').textContent = flippedCard === card.id ? card.back : card.front;
    button.addEventListener('click', () => {
      flippedCard = flippedCard === card.id ? null : card.id;
      render();
    });
    elements.flashcards.append(button);
  });
}

function renderSession(session) {
  elements.minutesLabel.textContent = `Session length: ${elements.minutes.value} minutes`;
  elements.sessionList.replaceChildren();
  session.forEach((phase) => {
    const item = createElement('li');
    item.append(createElement('strong', '', `${phase.phase} · ${phase.minutes} min`));
    item.append(createElement('span', '', phase.prompt));
    elements.sessionList.append(item);
  });
}

function renderQuiz(quiz) {
  const score = quiz.reduce((total, question) => total + (answers[question.id] === question.answer ? 1 : 0), 0);
  elements.scoreLine.textContent = `Use these questions as a quick quiz or assign the full set as a practice test. Score: ${score}/${quiz.length}`;
  elements.quizList.replaceChildren();

  quiz.forEach((question, index) => {
    const card = createElement('article', 'quiz-card');
    card.append(createElement('h3', '', `${index + 1}. ${question.question}`));

    const choices = createElement('div', 'choices');
    question.choices.forEach((choice) => {
      const button = createElement('button', '', choice);
      if (answers[question.id] === choice) {
        button.className = choice === question.answer ? 'correct' : 'incorrect';
      }
      button.addEventListener('click', () => {
        answers = { ...answers, [question.id]: choice };
        render();
      });
      choices.append(button);
    });

    card.append(choices);
    if (answers[question.id]) card.append(createElement('p', 'explanation', question.explanation));
    elements.quizList.append(card);
  });
}

function speakTeacherLesson(flashcards, quiz) {
  const script = `Welcome to your AI voice teacher session. Today we are studying ${materials
    .map((item) => item.title)
    .join(', ')}. Start with this idea: ${flashcards[0]?.back || 'add notes to create a lesson'}. Next, test yourself with ${quiz.length} quiz questions. Pause after each answer and explain why it is correct.`;

  elements.teacherScript.hidden = false;
  elements.teacherScript.textContent = script;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }
}

function render() {
  const flashcards = generateFlashcards(materials);
  const quiz = generateQuiz(materials);
  const session = buildStudySession(materials, Number(elements.minutes.value));

  elements.statsMaterials.textContent = `${materials.length} materials loaded`;
  elements.statsGenerated.textContent = `${flashcards.length} flashcards · ${quiz.length} quiz questions · ${session.length} session phases`;

  renderMaterials();
  renderFlashcards(flashcards);
  renderSession(session);
  renderQuiz(quiz);
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!elements.title.value.trim() || !elements.content.value.trim()) return;

  materials = [
    {
      id: crypto.randomUUID(),
      title: elements.title.value.trim(),
      type: elements.type.value,
      content: elements.content.value.trim(),
    },
    ...materials,
  ];

  elements.form.reset();
  resetGeneratedState();
  render();
});

elements.fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const content = await file.text();
  materials = [
    {
      id: crypto.randomUUID(),
      title: file.name,
      type: file.name.match(/\.(ppt|pptx|key)$/i) ? 'slides' : 'docs',
      content: content.slice(0, 12000) || 'Imported file placeholder. Paste key text for better AI generation.',
    },
    ...materials,
  ];
  elements.fileInput.value = '';
  resetGeneratedState();
  render();
});

elements.minutes.addEventListener('input', render);
elements.voiceButton.addEventListener('click', () => speakTeacherLesson(generateFlashcards(materials), generateQuiz(materials)));

render();
