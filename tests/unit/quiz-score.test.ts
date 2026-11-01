import { describe, it, expect } from 'vitest';

interface QuestionMock {
  id: string;
  type: 'single_choice' | 'free_text' | 'rating';
  scored: boolean;
  required: boolean;
  correctAlternativeId?: string;
}

function calculateScore(
  questions: QuestionMock[],
  answers: Record<string, { alternativeId?: string; text?: string }>
): {
  correctCount: number;
  scoredQuestionCount: number;
  percentage: number;
  perfectScore: boolean;
} {
  let correctCount = 0;
  let scoredQuestionCount = 0;

  for (const q of questions) {
    if (q.scored && q.type === 'single_choice') {
      scoredQuestionCount++;
      if (answers[q.id]?.alternativeId === q.correctAlternativeId) {
        correctCount++;
      }
    }
  }

  const percentage = scoredQuestionCount > 0 ? Math.round((correctCount / scoredQuestionCount) * 100) : 100;
  const perfectScore = scoredQuestionCount > 0 && correctCount === scoredQuestionCount;

  return { correctCount, scoredQuestionCount, percentage, perfectScore };
}

describe('Regras de Correção e Cálculo de Score SIPAT', () => {
  const sampleQuestions: QuestionMock[] = [
    { id: 'q1', type: 'single_choice', scored: true, required: true, correctAlternativeId: 'alt-a' },
    { id: 'q2', type: 'single_choice', scored: true, required: true, correctAlternativeId: 'alt-b' },
    { id: 'q3', type: 'rating', scored: false, required: true }, // Pesquisa não avaliativa
    { id: 'q4', type: 'free_text', scored: false, required: false }, // Sugestão não avaliativa
  ];

  it('deve ignorar perguntas não avaliativas no denominador da nota', () => {
    const answers = {
      q1: { alternativeId: 'alt-a' },
      q2: { alternativeId: 'alt-b' },
      q3: { alternativeId: 'rate-4' },
      q4: { text: 'Ótima palestra!' },
    };

    const result = calculateScore(sampleQuestions, answers);
    expect(result.scoredQuestionCount).toBe(2);
    expect(result.correctCount).toBe(2);
    expect(result.percentage).toBe(100);
    expect(result.perfectScore).toBe(true);
  });

  it('deve marcar perfectScore=true APENAS quando todas as avaliativas estiverem corretas', () => {
    const answers = {
      q1: { alternativeId: 'alt-a' },
      q2: { alternativeId: 'alt-wrong' }, // Errou uma questão
      q3: { alternativeId: 'rate-4' },
    };

    const result = calculateScore(sampleQuestions, answers);
    expect(result.correctCount).toBe(1);
    expect(result.scoredQuestionCount).toBe(2);
    expect(result.percentage).toBe(50);
    expect(result.perfectScore).toBe(false);
  });
});
