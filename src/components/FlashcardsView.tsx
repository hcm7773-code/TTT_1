import React, { useState, useEffect } from 'react';
import { GradeLevel, Flashcard } from '../types';
import { FLASHCARDS_DATA } from '../data/flashcards';
import { playSpeech } from '../utils/speech';
import { Volume2, Search, Eye, EyeOff, BookOpen, Sparkles, Brain, Clock, CheckCircle2, RotateCcw, Calendar, Flame, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsViewProps {
  grade: GradeLevel;
  speechSpeed: number;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ grade, speechSpeed }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'spaced'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideMeaning, setHideMeaning] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Spaced Repetition Memory Levels state (cardId -> level 0: 1天, 1: 3天, 2: 7天, 3: 30天長期)
  const [cardLevels, setCardLevels] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('elem_eng_card_levels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('elem_eng_card_levels', JSON.stringify(cardLevels));
  }, [cardLevels]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLevelUp = (cardId: string, word: string) => {
    const current = cardLevels[cardId] || 0;
    const nextLevel = Math.min(3, current + 1);
    setCardLevels((prev) => ({ ...prev, [cardId]: nextLevel }));

    const levelLabels = ['第 1 天複習', '第 3 天複習', '第 7 天黃金記憶期', '👑 30天長期記憶庫'];
    setToastMessage(`✨ 《${word}》已提升至【${levelLabels[nextLevel]}】！大腦記憶留存率提高！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLevelReset = (cardId: string, word: string) => {
    setCardLevels((prev) => ({ ...prev, [cardId]: 0 }));
    setToastMessage(`💡 《${word}》已重新排入【第 1 天核心複習】，溫故知新效果好！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    <div className="max-w-6xl mx-auto my-6 px-4 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-600"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📖 國小主題單字與記憶曲線
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              {grade === 'low' ? '低年級 1-2' : grade === 'mid' ? '中年級 3-4' : '高年級 5-6'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">結合美語純正發音與艾賓浩斯記憶曲線，精準鞏固單字記憶！</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📖 主題單字庫 ({filteredCards.length})
          </button>
          <button
            onClick={() => setActiveTab('spaced')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'spaced'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>🧠 艾賓浩斯記憶曲線間隔複習</span>
          </button>
        </div>
      </div>

      {activeTab === 'spaced' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl border border-teal-700/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-emerald-500/30 text-yellow-300 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                艾賓浩斯記憶曲線 (Ebbinghaus Spaced Repetition) 間隔排程
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <p className="text-xs text-emerald-200">
                人類記憶在學習後 20 分鐘與 24 小時遺忘最快！透過「1天 ➔ 3天 ➔ 7天 ➔ 30天」四階段複習，將短期記憶轉化為永久長期記憶！
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs mt-4">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
              <div className="text-emerald-300 font-bold mb-0.5">階段 1：第 1 天</div>
              <div className="text-lg font-black text-white">核心記憶建立</div>
              <div className="text-[10px] text-emerald-200 mt-0.5">留存率 58%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
              <div className="text-amber-300 font-bold mb-0.5">階段 2：第 3 天</div>
              <div className="text-lg font-black text-white">短期記憶鞏固</div>
              <div className="text-[10px] text-amber-200 mt-0.5">留存率 75%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
              <div className="text-sky-300 font-bold mb-0.5">階段 3：第 7 天</div>
              <div className="text-lg font-black text-white">黃金記憶期</div>
              <div className="text-[10px] text-sky-200 mt-0.5">留存率 88%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
              <div className="text-purple-300 font-bold mb-0.5">階段 4：第 30 天</div>
              <div className="text-lg font-black text-yellow-300">👑 長期記憶庫</div>
              <div className="text-[10px] text-purple-200 mt-0.5">留存率 98%</div>
            </div>
          </div>
        </motion.div>
      )}

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

        {/* Hide Meaning Toggle */}
        <button
          onClick={() => setHideMeaning(!hideMeaning)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-xs shrink-0 ${
            hideMeaning
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {hideMeaning ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{hideMeaning ? '已隱藏中文' : '遮蓋中文背誦'}</span>
        </button>
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
            const currentLevel = cardLevels[card.id] || 0;

            const levelBadges = [
              { label: '1天 核心', bg: 'bg-slate-100 text-slate-700' },
              { label: '3天 鞏固', bg: 'bg-amber-100 text-amber-900 border border-amber-200' },
              { label: '7天 黃金期', bg: 'bg-sky-100 text-sky-900 border border-sky-200' },
              { label: '👑 30天 長期記憶', bg: 'bg-purple-100 text-purple-900 border border-purple-300 font-black' }
            ];

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Category & Memory Stage Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {card.category}
                      </span>

                      {activeTab === 'spaced' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadges[currentLevel].bg}`}>
                          {levelBadges[currentLevel].label}
                        </span>
                      )}
                    </div>

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
                <div className="pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-2xl mb-3">
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

                {/* Spaced Repetition Interactive Action Controls */}
                {activeTab === 'spaced' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLevelReset(card.id, card.word)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="忘記了，重新安排第 1 天核心複習"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>忘記了 (重置)</span>
                    </button>

                    <button
                      onClick={() => handleLevelUp(card.id, card.word)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      title="記住了，晉升下一個複習階段"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                      <span>記住了 (晉級)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

