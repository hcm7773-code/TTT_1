import { Question } from '../types';

export function generateBlankQuestion(question: Question): {
  sentenceWithBlank: string;
  targetAnswer: string;
  hint: string;
} {
  const targetAnswer = (question.options[question.answerIndex] || '').trim();
  const qText = question.question || '';
  const audioText = question.audioText || '';

  let sentenceWithBlank = '';

  // Safely check if targetAnswer appears in question or audioText
  if (targetAnswer) {
    const escapedTarget = targetAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTarget}\\b`, 'gi');

    if (regex.test(qText)) {
      sentenceWithBlank = qText.replace(regex, '______');
    } else if (audioText && new RegExp(`\\b${escapedTarget}\\b`, 'gi').test(audioText)) {
      sentenceWithBlank = audioText.replace(new RegExp(`\\b${escapedTarget}\\b`, 'gi'), '______');
    }
  }

  if (!sentenceWithBlank) {
    sentenceWithBlank = `${qText} ➔ 請填入正確英文單字或句型：______`;
  }

  const firstChar = targetAnswer ? targetAnswer[0].toUpperCase() : '';
  const hint = question.explanation || `提示：答案長度為 ${targetAnswer.length} 個字元，開頭為「${firstChar}」`;

  return {
    sentenceWithBlank,
    targetAnswer,
    hint
  };
}
