/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GradeLevel, Question, QuizResult, MistakeItem, UserStats, LearningStyle } from './types';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { Header } from './components/Header';
import { QuizRunner } from './components/QuizRunner';
import { AiQuizGenerator } from './components/AiQuizGenerator';
import { AiTutorModal } from './components/AiTutorModal';
import { FlashcardsView } from './components/FlashcardsView';
import { GrammarView } from './components/GrammarView';
import { MistakesView } from './components/MistakesView';
import { AchievementsView } from './components/AchievementsView';
import { DailyChallengeCard } from './components/DailyChallengeCard';
import { TodayFocusCard } from './components/TodayFocusCard';
import { AiLearningPathCard } from './components/AiLearningPathCard';
import { BlindSpotCard } from './components/BlindSpotCard';
import { QuickAskBar } from './components/QuickAskBar';
import { PronunciationAnalysisModal } from './components/PronunciationAnalysisModal';
import { Sparkles, Loader2, X, Volume2, BookOpen, Clock, Brain, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSpeech } from './utils/speech';
import { generateBlankQuestion } from './utils/blankQuestionGenerator';

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

  const [learningStyle, setLearningStyle] = useState<LearningStyle>(() => {
    const saved = localStorage.getItem('elem_eng_learning_style');
    return (saved as LearningStyle) || 'fun';
  });

  // Dark/Light Theme Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('elem_eng_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('elem_eng_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('elem_eng_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSetLearningStyle = (style: LearningStyle) => {
    setLearningStyle(style);
    localStorage.setItem('elem_eng_learning_style', style);
  };

  // Learning Topic Preference (e.g. 動物, 太空, 運動, 食物)
  const [topicPreference, setTopicPreference] = useState<string>(() => {
    return localStorage.getItem('elem_eng_topic_pref') || '🐶 動物與寵物';
  });

  const handleSetTopicPreference = (pref: string) => {
    setTopicPreference(pref);
    localStorage.setItem('elem_eng_topic_pref', pref);
  };

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
  const [pronunciationModal, setPronunciationModal] = useState<{
    isOpen: boolean;
    question?: Question;
    selectedOptionIndex?: number;
  }>({ isOpen: false });

  const handleOpenPronunciationModal = (question?: Question, selectedOptionIndex?: number) => {
    setPronunciationModal({
      isOpen: true,
      question,
      selectedOptionIndex
    });
  };

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

  const [spacedReviewModalOpen, setSpacedReviewModalOpen] = useState(false);

  // Spaced Repetition Review check (> 5 mistakes & > 24h since last review)
  useEffect(() => {
    if (mistakes.length >= 5) {
      const lastReview = localStorage.getItem('elem_eng_last_review_time');
      const lastReviewTime = lastReview ? parseInt(lastReview, 10) : 0;
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      if (!lastReviewTime || now - lastReviewTime > TWENTY_FOUR_HOURS) {
        const timer = setTimeout(() => {
          setSpacedReviewModalOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [mistakes.length]);

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

    // Check if this was a daily challenge
    if (result.title.includes('今日')) {
      const todayIso = new Date().toISOString().split('T')[0];
      localStorage.setItem(
        `elem_eng_daily_${todayIso}`,
        JSON.stringify({
          completed: true,
          score: result.score,
          completedAt: new Date().toISOString()
        })
      );
    }

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

  // Add Mistake with auto-reinforcement tracking
  const handleAddMistake = (question: Question, selectedOption: number) => {
    setMistakes((prev) => {
      const existingIndex = prev.findIndex((m) => m.question.id === question.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newWrongCount = (existing.wrongCount || 1) + 1;
        const autoReinforced = newWrongCount >= 2 || existing.autoReinforced || false;
        const blankQ = existing.blankQuestion || generateBlankQuestion(question);

        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          selectedOption,
          timestamp: new Date().toISOString(),
          wrongCount: newWrongCount,
          autoReinforced,
          blankQuestion: blankQ
        };
        return updated;
      }

      // New mistake
      const blankQ = generateBlankQuestion(question);
      const newItem: MistakeItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        question,
        selectedOption,
        timestamp: new Date().toISOString(),
        wrongCount: 1,
        fillInBlankPracticeCount: 0,
        autoReinforced: false,
        blankQuestion: blankQ
      };
      return [newItem, ...prev];
    });
  };

  // Update Mistake Item state
  const handleUpdateMistake = (updatedMistake: MistakeItem) => {
    setMistakes((prev) =>
      prev.map((m) => (m.id === updatedMistake.id ? updatedMistake : m))
    );
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

  // Record Mood Interaction
  const handleRecordMood = (moodId: string) => {
    setStats((prev) => {
      const currentMoodCounts = prev.moodCounts || {};
      const updatedCounts = {
        ...currentMoodCounts,
        [moodId]: (currentMoodCounts[moodId] || 0) + 1
      };
      const updatedStats = { ...prev, moodCounts: updatedCounts };
      localStorage.setItem('elem_eng_user_stats', JSON.stringify(updatedStats));
      return updatedStats;
    });
  };

  // Start Retest
  const handleStartRetest = (questions: Question[]) => {
    localStorage.setItem('elem_eng_last_review_time', Date.now().toString());
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

  const handleStartUnitPractice = (questions: Question[], title: string) => {
    setQuizQuestions(questions);
    setQuizTitle(title);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          grade,
          learningStyle
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-sky-200 transition-colors duration-300">
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
        stats={stats}
        quizResults={quizResults}
        learningStyle={learningStyle}
        setLearningStyle={handleSetLearningStyle}
        topicPreference={topicPreference}
        setTopicPreference={handleSetTopicPreference}
        mistakes={mistakes}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6 pb-24">
        {activeTab === 'quiz' && (
          <div>
            {/* AI Learning Path Recommendations Component */}
            <AiLearningPathCard
              grade={grade}
              quizResults={quizResults}
              mistakes={mistakes}
              onStartUnitPractice={handleStartUnitPractice}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            <TodayFocusCard
              grade={grade}
              mistakes={mistakes}
              speechSpeed={speechSpeed}
            />

            <DailyChallengeCard
              grade={grade}
              mistakes={mistakes}
              streakDays={stats.streakDays}
              onStartDailyChallenge={(questions, title) => {
                setQuizQuestions(questions);
                setQuizTitle(title);
              }}
            />

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
              onOpenPronunciationModal={handleOpenPronunciationModal}
            />
          </div>
        )}

        {activeTab === 'ai-generator' && (
          <AiQuizGenerator
            grade={grade}
            quizResults={quizResults}
            topicPreference={topicPreference}
            onQuestionsGenerated={handleAiQuestionsGenerated}
          />
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
          <div>
            <BlindSpotCard
              grade={grade}
              mistakes={mistakes}
              onStartTargetedPractice={handleStartRetest}
              onOpenFlashcardFocus={() => setActiveTab('flashcards')}
            />

            <MistakesView
              mistakes={mistakes}
              speechSpeed={speechSpeed}
              onRemoveMistake={handleRemoveMistake}
              onUpdateMistake={handleUpdateMistake}
              onClearAllMistakes={handleClearAllMistakes}
              onStartRetest={handleStartRetest}
              onRequestAiExplanation={handleRequestAiExplanation}
              onOpenPronunciationModal={handleOpenPronunciationModal}
            />
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            stats={stats}
            quizResults={quizResults}
            grade={grade}
            mistakes={mistakes}
            speechSpeed={speechSpeed}
            learningStyle={learningStyle}
            setLearningStyle={handleSetLearningStyle}
          />
        )}
      </main>

      {/* AI Tutor Floating Chat Modal */}
      <AiTutorModal
        isOpen={aiTutorOpen}
        onClose={() => setAiTutorOpen(false)}
        grade={grade}
        speechSpeed={speechSpeed}
        mistakes={mistakes}
        quizResults={quizResults}
        onRecordMood={handleRecordMood}
        learningStyle={learningStyle}
        setLearningStyle={handleSetLearningStyle}
        onOpenPronunciationModal={handleOpenPronunciationModal}
      />

      {/* AI Pronunciation Problem Analysis Modal */}
      <PronunciationAnalysisModal
        isOpen={pronunciationModal.isOpen}
        onClose={() => setPronunciationModal((prev) => ({ ...prev, isOpen: false }))}
        grade={grade}
        speechSpeed={speechSpeed}
        question={pronunciationModal.question}
        selectedOptionIndex={pronunciationModal.selectedOptionIndex}
        listeningMistakes={mistakes.filter((m) => {
          const cat = (m.question.category || '').toLowerCase();
          const qText = (m.question.question || '').toLowerCase();
          return (
            cat.includes('聽力') ||
            cat.includes('listening') ||
            cat.includes('audio') ||
            cat.includes('發音') ||
            cat.includes('phonics') ||
            qText.includes('聽') ||
            !!m.question.audioText
          );
        })}
        learningStyle={learningStyle}
        setLearningStyle={handleSetLearningStyle}
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-800">AI 老師題旨診斷解析</h3>
                  <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold px-2 py-0.5 rounded-full">
                    {learningStyle === 'fun'
                      ? '🎭 強調趣味風格'
                      : learningStyle === 'precise'
                      ? '🎯 強調精準風格'
                      : '⚡ 快速複習風格'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">根據你選擇的 AI 學習風格產生的獨家解題說明</p>
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

      {/* Spaced Repetition Reminder Modal */}
      <AnimatePresence>
        {spacedReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-rose-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden"
            >
              <button
                onClick={() => setSpacedReviewModalOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    艾賓浩斯記憶法 ⏰
                  </span>
                  <h3 className="font-black text-xl text-slate-800 mt-1">間隔複習黃金時間到囉！</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                你的錯題本目前累積了 <strong className="text-rose-600 font-black">{mistakes.length} 道題</strong>，距離上次溫習已超過 <strong>24 小時</strong>。此時進行快速重測，能發揮最高效率將短期記憶轉化為長期記憶！加油！💪
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSpacedReviewModalOpen(false);
                    handleStartRetest(mistakes.map((m) => m.question));
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black py-3 px-5 rounded-2xl shadow-md transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>立刻開始錯題重測 ({mistakes.length} 題)</span>
                </motion.button>

                <button
                  onClick={() => setSpacedReviewModalOpen(false)}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  稍微再等等
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Quick Ask Bar */}
      <QuickAskBar
        grade={grade}
        learningStyle={learningStyle}
        speechSpeed={speechSpeed}
        openAiTutor={() => setAiTutorOpen(true)}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400 dark:text-slate-500 mt-auto pb-20 sm:pb-4 transition-colors">
        國小線上英語練習測驗平台 ・ 專為國小英語學習設計 ・ 結合 Gemini AI 智慧輔導發音與文法
      </footer>
    </div>
  );
}
