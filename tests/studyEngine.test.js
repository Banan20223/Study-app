import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudySession, generateFlashcards, generateQuiz } from '../src/studyEngine.js';

const materials = [
  {
    id: 'm1',
    title: 'Physics notes',
    type: 'notes',
    content: 'Velocity measures speed in a direction. Acceleration is a change in velocity over time. Force equals mass times acceleration. Momentum depends on mass and velocity.',
  },
];

test('generates flashcards from study material keywords', () => {
  const cards = generateFlashcards(materials, 4);
  assert.ok(cards.length > 0);
  assert.ok(cards[0].front.includes('Explain'));
  assert.ok(cards.every((card) => card.back.length > 0));
});

test('generates quizzes with answers in the choices', () => {
  const quiz = generateQuiz(materials, 3);
  assert.equal(quiz.length, 3);
  assert.ok(quiz.every((question) => question.choices.includes(question.answer)));
});

test('builds a timed study session with the requested total minutes', () => {
  const session = buildStudySession(materials, 30);
  assert.equal(session.length, 4);
  assert.equal(session.reduce((sum, phase) => sum + phase.minutes, 0), 30);
});
