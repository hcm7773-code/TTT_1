import React, { useState } from 'react';
import { GradeLevel, Question } from '../types';
import { Sparkles, Loader2, BookOpen, Wand2, CheckCircle } from 'lucide-react';

interface AiQuizGeneratorProps {
  grade: GradeLevel;
  onQuestionsGenerated: (questions: Question[], title: string) => void;
}

export const AiQuizGenerator: React.FC<AiQuizGeneratorProps> = ({ grade, onQuestionsGenerated }) => {
  const [selectedTopic, setSelectedTopic] = useState('日常單字與基礎句型');
  const [customTopic, setCustomTopic] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
          count
        })
      });

      if (!response.ok) {
        throw new Error('API server not available on static host');
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        onQuestionsGenerated(data.questions, `AI 出題：${topicToUse}`);
      } else {
        setErrorMsg(data.error || 'AI 出題發生錯誤，請稍後重試。');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback sample generated questions for static hosting (e.g. GitHub Pages)
      const mockQuestions: Question[] = [
        {
          id: `gh-${Date.now()}-1`,
          grade,
          category: topicToUse,
          question: `Which word relates to "${topicToUse}"?`,
          audioText: `Which word relates to ${topicToUse}?`,
          options: ['Apple 蘋果', 'Book 書本', 'Cat 貓咪', 'Sunny 晴朗'],
          answerIndex: 0,
          explanation: `在靜態預覽頁面中，這是一道精選的「${topicToUse}」相關練習題！`,
          tips: '觀察選項中的英文名稱對應'
        },
        {
          id: `gh-${Date.now()}-2`,
          grade,
          category: topicToUse,
          question: 'What is the correct greeting in the morning?',
          audioText: 'What is the correct greeting in the morning?',
          options: ['Good morning', 'Good night', 'Goodbye', 'Thank you'],
          answerIndex: 0,
          explanation: '早上見面招呼語為 Good morning。',
          tips: 'morning 意思是早晨'
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

      onQuestionsGenerated(mockQuestions, `測驗題庫：${topicToUse} (靜態模式)`);
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
          <p className="text-xs text-slate-500">由 Gemini AI 針對指定主題與年級生動出題並附繁體中文解析！</p>
        </div>
      </div>

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
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-base shadow-lg transition-all ${
          loading
            ? 'bg-purple-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
            <span>AI 老師正在出題中，請稍候...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 text-yellow-300" />
            <span>開始生成專屬 AI 英文試卷 ({count}題)</span>
          </>
        )}
      </button>
    </div>
  );
};
