import React, { useState, useMemo } from 'react';
import { GradeLevel, Question, QuizResult } from '../types';
import { Sparkles, Loader2, Wand2, Zap, TrendingUp, ShieldCheck, ArrowUpRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface AiQuizGeneratorProps {
  grade: GradeLevel;
  quizResults?: QuizResult[];
  topicPreference?: string;
  onQuestionsGenerated: (questions: Question[], title: string) => void;
}

export const AiQuizGenerator: React.FC<AiQuizGeneratorProps> = ({
  grade,
  quizResults = [],
  topicPreference,
  onQuestionsGenerated
}) => {
  const [selectedTopic, setSelectedTopic] = useState('日常單字與基礎句型');
  const [customTopic, setCustomTopic] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate recent accuracy to trigger adaptive difficulty boost (>90%)
  const { recentAccuracy, isAdaptiveBoostActive, totalRecentQuizzes } = useMemo(() => {
    const recent = quizResults.slice(0, 5); // Take last 5 quizzes
    if (recent.length === 0) {
      return { recentAccuracy: 0, isAdaptiveBoostActive: false, totalRecentQuizzes: 0 };
    }

    const totalQuestions = recent.reduce((acc, r) => acc + (r.totalQuestions || 0), 0);
    const totalCorrect = recent.reduce((acc, r) => acc + (r.correctCount || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Check if high performance threshold met
    const isBoost = accuracy >= 90;

    return {
      recentAccuracy: accuracy,
      isAdaptiveBoostActive: isBoost,
      totalRecentQuizzes: recent.length
    };
  }, [quizResults]);

  const PRESET_TOPICS = [
    '日常單字與基礎句型',
    '🐶 動物與寵物 (Animals)',
    '🍏 食物、水果與飲料 (Food)',
    '🏫 學校生活與文具 (School)',
    '👨‍👩‍👧 家人稱謂與打招呼 (Family & Greetings)',
    '🔤 Phonics 自然發音與字母音',
    '⏱️ 時間、星期與天氣 (Time & Weather)',
    '💡 Be動詞與一般動詞文法',
    '📖 英語日常情境對話'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    const topicToUse = customTopic.trim() || selectedTopic;

    try {
      const response = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          topic: topicToUse,
          count,
          adaptiveBoost: isAdaptiveBoostActive,
          recentAccuracy,
          topicPreference
        })
      });

      if (!response.ok) {
        throw new Error('API server not available on static host');
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const titlePrefix = isAdaptiveBoostActive ? '⚡ AI進階出題' : 'AI 智慧出題';
        onQuestionsGenerated(data.questions, `${titlePrefix}：${topicToUse}`);
      } else {
        setErrorMsg(data.error || 'AI 出題發生錯誤，請稍後重試。');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback sample generated questions for static hosting
      const mockQuestions: Question[] = [
        {
          id: `gh-${Date.now()}-1`,
          grade,
          category: topicToUse,
          question: isAdaptiveBoostActive
            ? `[進階句型] Choose the sentence with correct advanced grammar:`
            : `Which word relates to "${topicToUse}"?`,
          audioText: isAdaptiveBoostActive
            ? `She is more diligent than any other student.`
            : `Which word relates to ${topicToUse}?`,
          options: isAdaptiveBoostActive
            ? [
                'She is more diligent than any other student.',
                'She is most diligent than student.',
                'She is more diligent then student.',
                'She is as diligent than others.'
              ]
            : ['Apple 蘋果', 'Book 書本', 'Cat 貓咪', 'Sunny 晴朗'],
          answerIndex: 0,
          explanation: isAdaptiveBoostActive
            ? '這是【比較級】進階句型：「A is + 比較級 + than any other + 單數名詞」。'
            : `在預覽頁面中，這是一道精選的「${topicToUse}」相關練習題！`,
          tips: isAdaptiveBoostActive ? '比較級句型：more ... than' : '觀察選項中的英文名稱對應'
        },
        {
          id: `gh-${Date.now()}-2`,
          grade,
          category: topicToUse,
          question: isAdaptiveBoostActive
            ? 'Complete the clause: "If it rains tomorrow, we _____ stay indoors."'
            : 'What is the correct greeting in the morning?',
          audioText: isAdaptiveBoostActive
            ? 'If it rains tomorrow, we will stay indoors.'
            : 'What is the correct greeting in the morning?',
          options: isAdaptiveBoostActive
            ? ['will', 'would have', 'did', 'were']
            : ['Good morning', 'Good night', 'Goodbye', 'Thank you'],
          answerIndex: 0,
          explanation: isAdaptiveBoostActive
            ? '條件句 If 子句用現在式 (rains)，主要子句用未來式 (will + 原形動詞)。'
            : '早上見面招呼語為 Good morning。',
          tips: isAdaptiveBoostActive ? 'If 現在式, 主要子句 Future (will)' : 'morning 意思是早晨'
        },
        {
          id: `gh-${Date.now()}-3`,
          grade,
          category: topicToUse,
          question: 'Complete the sentence: "I _____ a student."',
          audioText: 'I am a student.',
          options: ['am', 'is', 'are', 'be'],
          answerIndex: 0,
          explanation: '主詞是 第一人稱 I 時，Be動詞搭配 am。',
          tips: 'I am / You are / He is'
        }
      ].slice(0, count);

      onQuestionsGenerated(mockQuestions, `測驗題庫：${topicToUse} (${isAdaptiveBoostActive ? '⚡進階模式' : '標準模式'})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl border border-purple-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">AI 智慧英文出題器</h2>
          <p className="text-xs text-slate-500">Gemini AI 自適應出題，根據你的學習成果自動調節難度與進階句型！</p>
        </div>
      </div>

      {/* Adaptive Difficulty Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isAdaptiveBoostActive
            ? 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-300 text-slate-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isAdaptiveBoostActive ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isAdaptiveBoostActive ? <Zap className="w-5 h-5 fill-yellow-200" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-slate-900">
                {isAdaptiveBoostActive ? '🚀 啟動【進階句型與詞彙挑戰模式】' : '🌱 AI 自適應難度調整：標準模式'}
              </h4>
              {isAdaptiveBoostActive && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  升級中
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isAdaptiveBoostActive ? (
                <span>
                  檢測到你近期 <strong>{totalRecentQuizzes}</strong> 次測驗平均正確率達{' '}
                  <strong className="text-amber-600">{recentAccuracy}%</strong>（大於 90%）！AI 已自動調高【複雜句型與高階詞彙】比重！
                </span>
              ) : (
                <span>
                  累積測驗平均正確率達 <strong>90%</strong> 以上時，系統將自動啟動【進階挑戰模式】，適度提升試題深度！
                  {totalRecentQuizzes > 0 && ` (目前近 5 次平均正確率：${recentAccuracy}%)`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 self-start sm:self-center">
          <span
            className={`text-xs font-black px-3 py-1.5 rounded-xl inline-flex items-center gap-1 ${
              isAdaptiveBoostActive
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-slate-200/70 text-slate-700'
            }`}
          >
            {isAdaptiveBoostActive ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /> 句型比重升級
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> 基礎穩固
              </>
            )}
          </span>
        </div>
      </motion.div>

      {/* Topic Preference Badge Banner */}
      {topicPreference && (
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border border-rose-200 rounded-2xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-500/30" />
            <span>個人化學習喜好連動中：</span>
            <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
              {topicPreference}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ✨ AI 出題將自動優先融入專屬單字與情境
          </span>
        </div>
      )}

      {/* Grade Indicator */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <span className="text-xs font-bold text-purple-900">目前選擇年級程度：</span>
        <span className="bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
          {grade === 'low' ? '低年級 (1-2年級)' : grade === 'mid' ? '中年級 (3-4年級)' : '高年級 (5-6年級)'}
        </span>
      </div>

      {/* Preset Topic Selection */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">選擇主題 preset：</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic && !customTopic;
            return (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                  setCustomTopic('');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Topic Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">或自訂你想練習的主題或單字群：</label>
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="例如：夜市食物、戶外運動、農場動物與比大小..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm font-medium outline-hidden transition-all"
        />
      </div>

      {/* Count Selection */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">題目數量：</label>
        <div className="flex gap-3">
          {[5, 8, 10].map((num) => (
            <button
              key={num}
              onClick={() => setCount(num)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                count === num
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {num} 題
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-base shadow-lg transition-all ${
          loading
            ? 'bg-purple-400 cursor-not-allowed'
            : isAdaptiveBoostActive
            ? 'bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
            <span>AI 老師正在生成題目，請稍候...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-yellow-300" />
            <span>
              {isAdaptiveBoostActive ? '⚡ 開始生成【進階句型】AI 英文試卷' : '開始生成專屬 AI 英文試卷'} ({count}題)
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};

