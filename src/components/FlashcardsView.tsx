import React, { useState } from 'react';
import { GradeLevel, Flashcard } from '../types';
import { FLASHCARDS_DATA } from '../data/flashcards';
import { playSpeech } from '../utils/speech';
import { Volume2, Search, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';

interface FlashcardsViewProps {
  grade: GradeLevel;
  speechSpeed: number;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ grade, speechSpeed }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideMeaning, setHideMeaning] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const categories = ['全部', ...Array.from(new Set(FLASHCARDS_DATA.map((f) => f.category)))];

  const filteredCards = FLASHCARDS_DATA.filter((card) => {
    const matchesGrade = card.grade === grade;
    const matchesCategory = selectedCategory === '全部' || card.category === selectedCategory;
    const matchesSearch =
      card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.meaning.includes(searchQuery);

    return matchesGrade && matchesCategory && matchesSearch;
  });

  const handlePlayAudio = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📖 國小必背主題單字卡
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              {grade === 'low' ? '低年級 1-2' : grade === 'mid' ? '中年級 3-4' : '高年級 5-6'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">搭配純正美語發音與實用生活例句，打好英語字彙力！</p>
        </div>

        {/* Hide Meaning Toggle (Memory Test Mode) */}
        <button
          onClick={() => setHideMeaning(!hideMeaning)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-xs ${
            hideMeaning
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {hideMeaning ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{hideMeaning ? '已開啟測驗模式（隱藏中文）' : '開啟背單字模式'}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋英文單字或中文意思..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
          <p className="text-sm font-bold text-slate-600">找不到符合條目的單字卡</p>
          <p className="text-xs text-slate-400 mt-1">嘗試切換年級或搜尋其他關鍵字！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isRevealed = revealedIds.has(card.id);
            const showZh = !hideMeaning || isRevealed;

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {card.category}
                    </span>

                    {/* Speech audio button */}
                    <button
                      onClick={() => handlePlayAudio(card.word)}
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-all shadow-xs"
                      title="發音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Word & Phonics */}
                  <div className="mb-3">
                    <h3 className="text-2xl font-black text-slate-800 tracking-wide group-hover:text-emerald-600 transition-colors">
                      {card.word}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{card.phonics}</p>
                  </div>

                  {/* Chinese Meaning */}
                  <div className="min-h-[2.5rem] flex items-center mb-4">
                    {showZh ? (
                      <span className="text-base font-bold text-emerald-700 bg-emerald-50/70 px-3 py-1 rounded-xl">
                        {card.meaning}
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleReveal(card.id)}
                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> 點擊顯示中文意思
                      </button>
                    )}
                  </div>
                </div>

                {/* Example sentence */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-2xl">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                    <span>例句 Example:</span>
                    <button
                      onClick={() => handlePlayAudio(card.exampleEn)}
                      className="text-emerald-600 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> 聽例句
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-800 italic">{card.exampleEn}</p>
                  {showZh && <p className="text-[11px] text-slate-500 mt-0.5">{card.exampleZh}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
