import React from 'react';
import { GradeLevel } from '../types';
import { BookOpen, Sparkles, Volume2, Award, BookMarked, HelpCircle, Layers, Flame } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  grade: GradeLevel;
  setGrade: (grade: GradeLevel) => void;
  streakDays: number;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  openAiTutor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  grade,
  setGrade,
  streakDays,
  speechSpeed,
  setSpeechSpeed,
  openAiTutor
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">國小線上英語練習測驗</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  快樂學英文
                </span>
              </div>
              <p className="text-xs text-slate-500">低 / 中 / 高年級單字・文法・聽力・AI 智慧診斷</p>
            </div>
          </div>

          {/* Controls: Grade selector, Speech speed, Streak, AI Tutor */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Grade Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setGrade('low')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'low'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                低年級 (1-2)
              </button>
              <button
                onClick={() => setGrade('mid')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'mid'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                中年級 (3-4)
              </button>
              <button
                onClick={() => setGrade('high')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'high'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                高年級 (5-6)
              </button>
            </div>

            {/* Speech speed setting */}
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl text-xs">
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-medium hidden sm:inline">發音語速:</span>
              <button
                onClick={() => setSpeechSpeed(speechSpeed === 0.85 ? 1.0 : 0.85)}
                className="font-bold bg-amber-200/60 px-1.5 py-0.5 rounded hover:bg-amber-200"
              >
                {speechSpeed === 0.85 ? '🐢 慢速 (0.85x)' : '⚡ 標準 (1.0x)'}
              </button>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-xl text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>連續 {streakDays} 天</span>
            </div>

            {/* AI Tutor Chat Trigger Button */}
            <button
              onClick={openAiTutor}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>AI 英文小老師</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'quiz'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>📝 綜合測驗</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-generator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'ai-generator'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>🤖 AI 智慧出題</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📖 主題單字卡</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'grammar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>💡 觀念文法</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'mistakes'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>📕 錯題本</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🏆 成就與證書</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
