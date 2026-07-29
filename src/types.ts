export type GradeLevel = 'low' | 'mid' | 'high'; // low: 1-2年級, mid: 3-4年級, high: 5-6年級

export type QuizCategory =
  | '字母與發音'
  | '主題單字'
  | '基礎文法'
  | '生活對話'
  | '聽力測驗'
  | '閱讀理解';

export interface Question {
  id: string;
  grade: GradeLevel;
  category: QuizCategory;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  audioText?: string; // Optional English sentence for listening
  tips?: string;
  imageUrl?: string;
}

export interface QuizResult {
  id: string;
  date: string;
  grade: GradeLevel;
  title: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  timeSpentSeconds: number;
  userAnswers: {
    questionId: string;
    question: Question;
    selectedOption: number;
    isCorrect: boolean;
  }[];
}

export interface MistakeItem {
  id: string;
  question: Question;
  selectedOption: number;
  timestamp: string;
  notes?: string;
}

export interface Flashcard {
  id: string;
  word: string;
  phonics: string;
  meaning: string;
  exampleEn: string;
  exampleZh: string;
  category: string;
  grade: GradeLevel;
}

export interface GrammarLesson {
  id: string;
  title: string;
  grade: GradeLevel;
  summary: string;
  keyPoints: string[];
  examples: { en: string; zh: string }[];
  quizCheck: Question;
}

export interface UserStats {
  streakDays: number;
  lastActiveDate: string;
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  unlockedBadges: string[];
}
