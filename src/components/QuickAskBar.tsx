import React, { useState } from 'react';
import { GradeLevel, LearningStyle } from '../types';
import { playSpeech } from '../utils/speech';
import { Sparkles, Search, Send, Volume2, X, Loader2, Bot, ChevronUp, ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAskBarProps {
  grade: GradeLevel;
  learningStyle: LearningStyle;
  speechSpeed: number;
  openAiTutor: () => void;
}

const QUICK_SUGGESTIONS = [
  '🍎 apple',
  '🐶 dog',
  '❓ How are you?',
  '⚡ look for 與 look at',
  '🎒 school bag'
];

export const QuickAskBar: React.FC<QuickAskBarProps> = ({
  grade,
  learningStyle,
  speechSpeed,
  openAiTutor
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSearch = async (targetText?: string) => {
    const searchText = (targetText || query).trim();
    if (!searchText) return;

    setLoading(true);
    setShowResult(true);
    setActiveQuery(searchText);
    setResult(null);

    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchText,
          grade,
          learningStyle
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        setResult('AI 小老師連線忙碌中，請稍後再試！');
      }
    } catch (error) {
      console.error('Quick lookup failed:', error);
      setResult('查詢發生錯誤，請檢查網路狀態。');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black px-4 py-3 rounded-full shadow-2xl border-2 border-white flex items-center gap-2 cursor-pointer text-xs sm:text-sm hover:shadow-indigo-500/30"
      >
        <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
        <span>💬 AI 快速問答</span>
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-[85%] max-w-2xl">
      <AnimatePresence>
        {/* Result Overlay Card */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            className="mb-2 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-indigo-200 shadow-2xl overflow-hidden p-4 sm:p-5 max-h-[380px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <span>「{activeQuery}」快速解析</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      {learningStyle === 'fun'
                        ? '🎭 趣味風格'
                        : learningStyle === 'precise'
                        ? '🎯 精準風格'
                        : '⚡ 速記風格'}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {result && (
                  <button
                    onClick={() => playSpeech(result, { rate: speechSpeed })}
                    className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="語音朗讀"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="hidden sm:inline">朗讀</span>
                  </button>
                )}
                <button
                  onClick={() => setShowResult(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs font-bold text-indigo-600 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>AI 老師正在搜尋「{activeQuery}」的生動速查說明...</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 font-medium">
                  {result}
                </div>
              )}
            </div>

            {/* Footer action to full tutor */}
            {!loading && result && (
              <div className="pt-3 border-t border-indigo-50 mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">想了解更多句型與發音？</span>
                <button
                  onClick={() => {
                    setShowResult(false);
                    openAiTutor();
                  }}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>開啟 AI 老師完整對話視窗</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-indigo-300 shadow-2xl p-2.5 sm:p-3 flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="🔍 AI 快速詢問：單字、句型或文法（如: banana, How are you?）"
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              query.trim() && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">查詢</span>
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="最小化"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[11px] text-slate-500">
          <span className="font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-500" /> 熱門速查:
          </span>
          {QUICK_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => {
                const clean = sug.replace(/^[^a-zA-Z0-9]+/, '').trim();
                setQuery(clean);
                handleSearch(clean);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors whitespace-nowrap font-medium cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
