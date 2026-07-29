/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, Question, QuizResult, MistakeItem, UserStats } from './types';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { Header } from './components/Header';
import { QuizRunner } from './components/QuizRunner';
import { AiQuizGenerator } from './components/AiQuizGenerator';
import { AiTutorModal } from './components/AiTutorModal';
import { FlashcardsView } from './components/FlashcardsView';
import { GrammarView } from './components/GrammarView';
import { MistakesView } from './components/MistakesView';
import { AchievementsView } from './components/AchievementsView';
import { Sparkles, Loader2, X, Volume2, BookOpen } from 'lucide-react';
import { playSpeech } from './utils/speech';

export default function App() {
  const [grade, setGrade] = useState<GradeLevel>(() => {
    const saved = localStorage.getItem('elem_eng_grade');
    return (saved as GradeLevel) || 'mid';
  });

  const [activeTab, setActiveTab] = useState<string>('quiz');
  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('elem_eng_speed');
    return saved ? parseFloat(saved) : 0.85;
  });

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('國小英語綜合練習題');

  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => {
    try {
      const saved = localStorage.getItem('elem_eng_mistakes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('elem_eng_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      streakDays: 1,
      lastActiveDate: new Date().toDateString(),
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      unlockedBadges: ['badge-1']
    };
  });

  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => {
    try {
      const saved = localStorage.getItem('elem_eng_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [aiExplainModal, setAiExplainModal] = useState<{
    isOpen: boolean;
    question: Question | null;
    selectedOption: number;
    explanationText: string;
    loading: boolean;
  }>({
    isOpen: false,
    question: null,
    selectedOption: -1,
    explanationText: '',
    loading: false
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem('elem_eng_grade', grade);
  }, [grade]);

  useEffect(() => {
    localStorage.setItem('elem_eng_speed', speechSpeed.toString());
  }, [speechSpeed]);

  useEffect(() => {
    localStorage.setItem('elem_eng_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem('elem_eng_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('elem_eng_results', JSON.stringify(quizResults));
  }, [quizResults]);

  // Load questions according to selected grade
  useEffect(() => {
    const filtered = DEFAULT_QUESTIONS.filter((q) => q.grade === grade);
    setQuizQuestions(filtered.length > 0 ? filtered : DEFAULT_QUESTIONS);
    setQuizTitle(
      `國小${grade === 'low' ? '低年級 (1-2)' : grade === 'mid' ? '中年級 (3-4)' : '高年級 (5-6)'}英語綜合測驗`
    );
  }, [grade]);

  // Handle Quiz Completion
  const handleFinishQuiz = (result: QuizResult) => {
    setQuizResults((prev) => [result, ...prev]);

    setStats((prev) => {
      const todayStr = new Date().toDateString();
      let streak = prev.streakDays;
      if (prev.lastActiveDate !== todayStr) {
        streak += 1;
      }

      return {
        ...prev,
        streakDays: streak,
        lastActiveDate: todayStr,
        totalQuizzesTaken: prev.totalQuizzesTaken + 1,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + result.totalQuestions,
        totalCorrect: prev.totalCorrect + result.correctCount
      };
    });
  };

  // Add Mistake
  const handleAddMistake = (question: Question, selectedOption: number) => {
    setMistakes((prev) => {
      if (prev.some((m) => m.question.id === question.id)) return prev;
      const newItem: MistakeItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        question,
        selectedOption,
        timestamp: new Date().toISOString()
      };
      return [newItem, ...prev];
    });
  };

  // Remove Mistake
  const handleRemoveMistake = (id: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMistakes = () => {
    if (window.confirm('確定要清空錯題本嗎？')) {
      setMistakes([]);
    }
  };

  // Start Retest
  const handleStartRetest = (questions: Question[]) => {
    setQuizQuestions(questions);
    setQuizTitle('錯題重點重測');
    setActiveTab('quiz');
  };

  // Handle Generated AI Quiz
  const handleAiQuestionsGenerated = (questions: Question[], title: string) => {
    setQuizQuestions(questions);
    setQuizTitle(title);
    setActiveTab('quiz');
  };

  // Request AI Question Explanation
  const handleRequestAiExplanation = async (question: Question, selectedOption: number) => {
    setAiExplainModal({
      isOpen: true,
      question,
      selectedOption,
      explanationText: '',
      loading: true
    });

    try {
      const response = await fetch('/api/gemini/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          correctAnswer: question.options[question.answerIndex],
          userAnswer: selectedOption >= 0 ? question.options[selectedOption] : '未選擇',
          grade
        })
      });

      const data = await response.json();
      if (data.success && data.explanation) {
        setAiExplainModal((prev) => ({
          ...prev,
          explanationText: data.explanation,
          loading: false
        }));
      } else {
        setAiExplainModal((prev) => ({
          ...prev,
          explanationText: '無法取得 AI 詳細解析，請稍後重試。',
          loading: false
        }));
      }
    } catch (err) {
      console.error(err);
      setAiExplainModal((prev) => ({
        ...prev,
        explanationText: '連線發生問題，請檢查網路設定。',
        loading: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-200">
      {/* Top Header & Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        grade={grade}
        setGrade={setGrade}
        streakDays={stats.streakDays}
        speechSpeed={speechSpeed}
        setSpeechSpeed={setSpeechSpeed}
        openAiTutor={() => setAiTutorOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6">
        {activeTab === 'quiz' && (
          <QuizRunner
            questions={quizQuestions}
            grade={grade}
            quizTitle={quizTitle}
            speechSpeed={speechSpeed}
            onFinishQuiz={handleFinishQuiz}
            onAddMistake={handleAddMistake}
            onRequestAiExplanation={handleRequestAiExplanation}
            onRestartQuiz={() => {
              const filtered = DEFAULT_QUESTIONS.filter((q) => q.grade === grade);
              setQuizQuestions(filtered.length > 0 ? filtered : DEFAULT_QUESTIONS);
              setQuizTitle(`國小${grade === 'low' ? '低年級' : grade === 'mid' ? '中年級' : '高年級'}英語綜合測驗`);
            }}
          />
        )}

        {activeTab === 'ai-generator' && (
          <AiQuizGenerator grade={grade} onQuestionsGenerated={handleAiQuestionsGenerated} />
        )}

        {activeTab === 'flashcards' && <FlashcardsView grade={grade} speechSpeed={speechSpeed} />}

        {activeTab === 'grammar' && (
          <GrammarView
            grade={grade}
            speechSpeed={speechSpeed}
            onRequestAiExplanation={handleRequestAiExplanation}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakesView
            mistakes={mistakes}
            speechSpeed={speechSpeed}
            onRemoveMistake={handleRemoveMistake}
            onClearAllMistakes={handleClearAllMistakes}
            onStartRetest={handleStartRetest}
            onRequestAiExplanation={handleRequestAiExplanation}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView stats={stats} quizResults={quizResults} />
        )}
      </main>

      {/* AI Tutor Floating Chat Modal */}
      <AiTutorModal
        isOpen={aiTutorOpen}
        onClose={() => setAiTutorOpen(false)}
        grade={grade}
        speechSpeed={speechSpeed}
      />

      {/* AI Explanation Dialog */}
      {aiExplainModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-indigo-100 shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => setAiExplainModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800">AI 老師題旨診斷解析</h3>
                <p className="text-xs text-slate-500">深入淺出的思考邏輯與記憶竅門</p>
              </div>
            </div>

            {aiExplainModal.question && (
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 mb-4 text-xs font-bold text-indigo-950">
                題目：{aiExplainModal.question.question}
              </div>
            )}

            {aiExplainModal.loading ? (
              <div className="py-12 text-center text-xs font-bold text-indigo-600 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>AI 老師正在為你整理最生動易懂的觀念說明...</span>
              </div>
            ) : (
              <div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                  {aiExplainModal.explanationText}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => playSpeech(aiExplainModal.explanationText, { rate: speechSpeed })}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl"
                  >
                    <Volume2 className="w-4 h-4" /> 朗讀解析
                  </button>

                  <button
                    onClick={() => setAiExplainModal((prev) => ({ ...prev, isOpen: false }))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs"
                  >
                    我知道了！
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
        國小線上英語練習測驗平台 ・ 專為國小英語學習設計 ・ 結合 Gemini AI 智慧輔導發音與文法
      </footer>
    </div>
  );
}
