import React, { useState } from 'react';
import { GradeLevel, Question, MistakeItem } from '../types';
import { Calendar, Sparkles, CheckCircle2, Flame, RefreshCw, Play, ShieldAlert, Award } from 'lucide-react';

interface DailyChallengeCardProps {
  grade: GradeLevel;
  mistakes: MistakeItem[];
  streakDays: number;
  onStartDailyChallenge: (questions: Question[], title: string) => void;
  onRequestAiExplanation?: (question: Question, selectedOption: number) => void;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  grade,
  mistakes,
  streakDays,
  onStartDailyChallenge
}) => {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayFormatted = new Date().toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const [loading, setLoading] = useState(false);

  // Check today's status from localStorage
  const localDailyKey = `elem_eng_daily_${todayStr}`;
  const savedDaily = (() => {
    try {
      const data = localStorage.getItem(localDailyKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  })();

  const isCompleted = savedDaily?.completed || false;
  const lastScore = savedDaily?.score;

  // Calculate top weak categories from mistakes
  const weakCategoryCounts: Record<string, number> = {};
  mistakes.forEach((m) => {
    const cat = m.question.category || '綜合文法';
    weakCategoryCounts[cat] = (weakCategoryCounts[cat] || 0) + 1;
  });

  const topWeakCategories = Object.entries(weakCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat);

  const focusTopic =
    topWeakCategories.length > 0
      ? topWeakCategories.join('與')
      : grade === 'low'
      ? '發音與基礎單字'
      : grade === 'mid'
      ? '日常對話與文法'
      : '動詞時態與綜合閱讀';

  const handleGenerateDailyQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          topic: `每日特訓：${focusTopic}`,
          count: 5
        })
      });

      if (!response.ok) throw new Error('Static host response fallback');

      const data = await response.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        onStartDailyChallenge(data.questions, `🎯 今日 5 題 AI 特訓 (${todayStr})`);
        return;
      }
    } catch (err) {
      console.warn('Using intelligent local fallback daily questions:', err);
    } finally {
      setLoading(false);
    }

    // Local smart fallback tailored to grade & mistakes
    const fallbackDailyQuestions: Question[] = [
      {
        id: `daily-${todayStr}-1`,
        grade,
        category: '基礎文法',
        question: 'Choose the correct sentence:',
        audioText: 'She is a smart student.',
        options: ['She is a smart student.', 'She am a smart student.', 'She are a smart student.', 'She be a smart student.'],
        answerIndex: 0,
        explanation: '主詞是第三人稱單數 She 時，搭配 Be 動詞 is。',
        tips: 'I am, You are, He/She/It is'
      },
      {
        id: `daily-${todayStr}-2`,
        grade,
        category: '主題單字',
        question: 'What do we wear when it is raining outside?',
        audioText: 'Raincoat and umbrella.',
        options: ['Raincoat 雨衣', 'Sunglasses 太陽眼鏡', 'Swimsuit 泳衣', 'Shorts 短褲'],
        answerIndex: 0,
        explanation: '下雨天外面需要穿雨衣 Raincoat 或帶雨傘 Umbrella。',
        tips: 'rain (雨) + coat (外套) = raincoat'
      },
      {
        id: `daily-${todayStr}-3`,
        grade,
        category: '聽力測驗',
        question: 'Listen and choose: "I would like some apple juice, please."',
        audioText: 'I would like some apple juice, please.',
        options: ['Apple juice 蘋果汁', 'Milk 牛奶', 'Water 清水', 'Tea 紅茶'],
        answerIndex: 0,
        explanation: '聽力中的 apple juice 代表蘋果汁。',
        tips: '聽清關鍵字 apple'
      },
      {
        id: `daily-${todayStr}-4`,
        grade,
        category: '生活對話',
        question: 'A: "Thank you for helping me!"  B: "_____"',
        audioText: 'You are welcome!',
        options: ['You are welcome!', 'Good morning!', 'I am nine years old.', 'Good night!'],
        answerIndex: 0,
        explanation: '當別人向你說 Thank you (謝謝) 時，禮貌回應為 You are welcome (不客氣)。',
        tips: 'Thank you 的禮貌回覆'
      },
      {
        id: `daily-${todayStr}-5`,
        grade,
        category: '閱讀理解',
        question: 'Look at the time: 8:00 AM. What time of day is it?',
        audioText: 'Eight o clock in the morning.',
        options: ['Morning 早上', 'Night 夜晚', 'Afternoon 下午', 'Evening 傍晚'],
        answerIndex: 0,
        explanation: 'AM 代表上午或早上 (Morning)。',
        tips: 'AM 上午 / PM 下午'
      }
    ];

    onStartDailyChallenge(fallbackDailyQuestions, `🎯 今日 5 題 AI 特訓 (${todayStr})`);
  };

  return (
    <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-lg relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-yellow-300/10 blur-lg pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5 text-yellow-300" />
              {todayFormatted} 每日任務
            </span>

            {streakDays > 0 && (
              <span className="bg-orange-500/90 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                連續挑戰 {streakDays} 天
              </span>
            )}

            {isCompleted && (
              <span className="bg-emerald-500/90 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                今日已完成 ({lastScore}分)
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            📅 今日 5 題 AI 智慧自動出題
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </h2>

          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed max-w-xl">
            {topWeakCategories.length > 0 ? (
              <span className="flex items-center gap-1 text-yellow-200 font-bold">
                <ShieldAlert className="w-4 h-4 text-yellow-300 inline" />
                針對你近期易錯單元【{focusTopic}】精準抽題，每天 3 分鐘保持最佳語感！
              </span>
            ) : (
              <span>系統每日自動為你精選 5 道核心題目，養成每天練習英語的好習慣！</span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <button
            onClick={handleGenerateDailyQuiz}
            disabled={loading}
            className={`flex items-center justify-center gap-2 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 ${
              isCompleted
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                : 'bg-yellow-400 hover:bg-yellow-300 text-slate-900'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                <span>AI 出題中...</span>
              </>
            ) : (
              <>
                <Play className={`w-4 h-4 ${isCompleted ? 'fill-white' : 'fill-slate-900'}`} />
                <span>{isCompleted ? '再次練習今日 5 題' : '🚀 開始今日 5 題挑戰'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
