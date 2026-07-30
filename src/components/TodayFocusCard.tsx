import React, { useState, useMemo } from 'react';
import { GradeLevel, MistakeItem } from '../types';
import { playSpeech } from '../utils/speech';
import { Target, Sparkles, Volume2, Layers, RefreshCw, Eye, CheckCircle2, ChevronRight, ChevronLeft, RotateCcw, X, ShieldAlert, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FocusItem {
  id: string;
  wordOrPattern: string;
  phonics: string;
  meaning: string;
  category: string;
  reason: string;
  exampleEn: string;
  exampleZh: string;
  tip: string;
}

interface TodayFocusCardProps {
  grade: GradeLevel;
  mistakes: MistakeItem[];
  speechSpeed: number;
}

export const TodayFocusCard: React.FC<TodayFocusCardProps> = ({
  grade,
  mistakes = [],
  speechSpeed = 0.85
}) => {
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  // Derive 3 key focus items from mistake history or grade fallback
  const focusItems: FocusItem[] = useMemo(() => {
    // Collect weak concepts from mistakes
    if (mistakes.length > 0) {
      const items: FocusItem[] = [];
      const usedWords = new Set<string>();

      mistakes.forEach((m, idx) => {
        if (items.length >= 3) return;

        // Extract key English phrase/word from audioText or question
        const rawText = m.question.audioText || m.question.question;
        const match = rawText.match(/[a-zA-Z\s'?!]+/g);
        let wordOrPattern = match ? match[0].trim() : m.question.category;

        if (wordOrPattern.length > 30) {
          wordOrPattern = wordOrPattern.substring(0, 25) + '...';
        }

        if (!usedWords.has(wordOrPattern)) {
          usedWords.add(wordOrPattern);
          const correctAnswer = m.question.options[m.question.answerIndex];
          items.push({
            id: `focus-mistake-${idx}`,
            wordOrPattern: wordOrPattern || '重點句型解析',
            phonics: '/ Focus Practice /',
            meaning: correctAnswer,
            category: m.question.category || '易錯複習',
            reason: `近期錯題診斷：${m.question.category}`,
            exampleEn: m.question.audioText || m.question.question,
            exampleZh: m.question.explanation,
            tip: m.question.tips || '重點複習：注意正確用法與發音'
          });
        }
      });

      if (items.length >= 3) return items.slice(0, 3);
    }

    // Default grade-tailored fallback focus items if mistakes < 3
    if (grade === 'low') {
      return [
        {
          id: 'focus-default-low-1',
          wordOrPattern: 'How are you?',
          phonics: '/haʊ ɑːr juː/',
          meaning: '你好嗎？（打招呼問候）',
          category: '生活問候',
          reason: '國小低年級必備常用對話',
          exampleEn: 'A: How are you? B: I am fine, thank you!',
          exampleZh: '甲：你好嗎？ 乙：我很好，謝謝你！',
          tip: '記憶小撇步：聽到 How are you 禮貌回答 I am fine!'
        },
        {
          id: 'focus-default-low-2',
          wordOrPattern: 'umbrella',
          phonics: '/ʌmˈbrelə/',
          meaning: '雨傘',
          category: '生活用品',
          reason: '自然發音與母音冠詞 an 特訓',
          exampleEn: 'It is raining. Take an umbrella!',
          exampleZh: '下雨了。帶一把雨傘吧！',
          tip: '注意：字首為母音 u，前面冠詞要用 an umbrella'
        },
        {
          id: 'focus-default-low-3',
          wordOrPattern: 'like vs. want',
          phonics: '/laɪk/ vs /wɑːnt/',
          meaning: '喜歡 (like) 與 想要 (want)',
          category: '動詞區分',
          reason: '常見概念混淆特訓',
          exampleEn: 'I like apples, but I want ice cream now.',
          exampleZh: '我喜歡蘋果，但我現在想吃冰淇淋。',
          tip: 'like 代表長期的喜好；want 代表當下的渴望！'
        }
      ];
    } else if (grade === 'mid') {
      return [
        {
          id: 'focus-default-mid-1',
          wordOrPattern: 'What time is it?',
          phonics: '/wɑːt taɪm ɪz ɪt/',
          meaning: '現在幾點鐘？',
          category: '時間句型',
          reason: '中年級時間與數字問答考點',
          exampleEn: 'What time is it? It is eight o clock.',
          exampleZh: '現在幾點鐘？現在是八點鐘。',
          tip: '句型公式：It is + 數字 + o clock.'
        },
        {
          id: 'focus-default-mid-2',
          wordOrPattern: 'raincoat',
          phonics: '/ˈreɪnkəʊt/',
          meaning: '雨衣',
          category: '複合單字',
          reason: '單字拆解記憶法特訓',
          exampleEn: 'Put on your raincoat before you go out.',
          exampleZh: '出門前請穿上你的雨衣。',
          tip: '拆解記憶：rain (雨) + coat (外套) = raincoat (雨衣)'
        },
        {
          id: 'focus-default-mid-3',
          wordOrPattern: 'look at vs. look for',
          phonics: '/lʊk æt/ vs /lʊk fɔːr/',
          meaning: '看著 (look at) 與 尋找 (look for)',
          category: '片語動詞',
          reason: '介系詞易混淆考點',
          exampleEn: 'Look at the blackboard! Are you looking for your key?',
          exampleZh: '看著黑板！你正在找你的鑰匙嗎？',
          tip: 'at 是定點盯著看；for 是為了找到目標而搜尋！'
        }
      ];
    } else {
      return [
        {
          id: 'focus-default-high-1',
          wordOrPattern: 'because vs. so',
          phonics: '/bɪˈkɒz/ vs /səʊ/',
          meaning: '因為 (because) 與 所以 (so)',
          category: '連接詞文法',
          reason: '高年級句型連接詞易錯點',
          exampleEn: 'He is tired because he played sports. (不用 so)',
          exampleZh: '他很累是因為他做了運動。',
          tip: '重要英文規則：because 與 so 不能在同句中同時出現！'
        },
        {
          id: 'focus-default-high-2',
          wordOrPattern: 'delicious',
          phonics: '/dɪˈlɪʃəs/',
          meaning: '美味可口的',
          category: '高級形容詞',
          reason: '音節拼字與美式發音特訓',
          exampleEn: 'Mom made a delicious chocolate cake for my birthday.',
          exampleZh: '媽媽為我的生日做了一個美味的巧克力蛋糕。',
          tip: '音節拆解：de-li-cious，字尾 cious 發 /ʃəs/ 音'
        },
        {
          id: 'focus-default-high-3',
          wordOrPattern: 'Where are you going?',
          phonics: '/weər ɑːr juː ˈɡəʊɪŋ/',
          meaning: '你要去哪裡？（現在進行式）',
          category: '時態句型',
          reason: 'be動詞 + V-ing 現在進行式特訓',
          exampleEn: 'Where are you going? I am going to the library.',
          exampleZh: '你要去哪裡？我要去圖書館。',
          tip: '問句 be + V-ing，答句也要用 be + V-ing 回應！'
        }
      ];
    }
  }, [grade, mistakes]);

  const handleOpenPractice = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowCelebration(false);
    setCompletedCards(new Set());
    setPracticeModalOpen(true);
  };

  const currentCard = focusItems[currentCardIndex] || focusItems[0];

  const handleNextCard = () => {
    const newSet = new Set(completedCards);
    newSet.add(currentCardIndex);
    setCompletedCards(newSet);

    if (currentCardIndex < focusItems.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setShowCelebration(true);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* Main Banner Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side Info */}
        <div className="space-y-2.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-950/40 border border-amber-200/40 text-amber-100 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
              <Target className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              今日 AI 弱點診斷焦點
            </span>
            {mistakes.length > 0 ? (
              <span className="bg-rose-900/60 text-rose-100 border border-rose-300/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                依據 {mistakes.length} 個歷史錯題分析
              </span>
            ) : (
              <span className="bg-amber-900/40 text-amber-100 border border-amber-200/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {grade === 'low' ? '低年級必勝焦點' : grade === 'mid' ? '中年級進階焦點' : '高年級挑戰焦點'}
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            🎯 今日 3 大學習焦點 (Daily Focus)
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </h3>

          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed max-w-xl">
            AI 智慧演算法每日自動篩選 3 個最具挑戰性的關鍵單字與句型，花 2 分鐘進行「快速閃示記憶卡」練習，專注突破盲點！
          </p>

          {/* 3 Focus Items Preview Chips */}
          <div className="pt-1 flex flex-wrap gap-2">
            {focusItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setCurrentCardIndex(idx);
                  setIsFlipped(false);
                  setPracticeModalOpen(true);
                }}
                className="bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-1.5 rounded-2xl backdrop-blur-xs cursor-pointer transition-all flex items-center gap-2 group"
              >
                <span className="bg-yellow-400 text-amber-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs text-white group-hover:text-yellow-200 transition-colors">
                  {item.wordOrPattern}
                </span>
                <span className="text-[11px] text-amber-200 font-medium hidden sm:inline">
                  ({item.meaning})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Practice Button */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={handleOpenPractice}
            className="w-full sm:w-auto bg-amber-300 hover:bg-amber-200 text-amber-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Zap className="w-5 h-5 text-amber-800 fill-amber-800 group-hover:scale-110 transition-transform" />
            <span>開始「快速閃示記憶卡」練習</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Interactive Quick Flashcard Modal */}
      <AnimatePresence>
        {practiceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-amber-200 shadow-2xl w-full max-w-lg p-6 overflow-hidden flex flex-col relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      今日焦點閃示記憶卡
                      <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                        {currentCardIndex + 1} / {focusItems.length}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">點擊卡片翻面・掌握核心考點</p>
                  </div>
                </div>

                <button
                  onClick={() => setPracticeModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Completion Celebration State */}
              {showCelebration ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-100 animate-bounce">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">
                      太棒了！完成今日 3 大學習焦點！
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      你已順利複習今天最關鍵的單字與句型，持續每天溫習打好美語基礎！
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                        setShowCelebration(false);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>再溫習一次</span>
                    </button>
                    <button
                      onClick={() => setPracticeModalOpen(false)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      完成並回主畫面
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Flashcard Container */
                <div className="space-y-4">
                  {/* Flip Flashcard */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer perspective-1000 min-h-[220px] bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-100/60 border-2 border-amber-200 hover:border-amber-400 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group overflow-hidden"
                  >
                    {/* Category & Reason Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full">
                        {currentCard.category}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSpeech(currentCard.wordOrPattern, { rate: speechSpeed });
                        }}
                        className="p-2 bg-white hover:bg-amber-100 text-amber-800 rounded-xl shadow-xs transition-all cursor-pointer"
                        title="朗讀英文發音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Card Body - Front vs Back */}
                    {!isFlipped ? (
                      /* Front Side */
                      <div className="py-4 text-center my-auto space-y-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-wide group-hover:text-amber-700 transition-colors">
                          {currentCard.wordOrPattern}
                        </h2>
                        <p className="text-xs font-mono text-slate-400">{currentCard.phonics}</p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/90 px-3 py-1 rounded-xl">
                            <Eye className="w-3.5 h-3.5" /> 點擊卡片翻面看中文解釋
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Back Side */
                      <div className="py-2 space-y-3 my-auto">
                        <div>
                          <span className="text-xs text-slate-400 font-bold block mb-0.5">中文意思：</span>
                          <p className="text-xl font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl inline-block">
                            {currentCard.meaning}
                          </p>
                        </div>

                        {/* Example */}
                        <div className="bg-white/80 p-3 rounded-2xl border border-amber-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-amber-900 font-bold">
                            <span>實用例句：</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSpeech(currentCard.exampleEn, { rate: speechSpeed });
                              }}
                              className="text-amber-700 hover:text-amber-900 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Volume2 className="w-3 h-3" /> 聽例句
                            </button>
                          </div>
                          <p className="font-semibold text-slate-800 italic">{currentCard.exampleEn}</p>
                          <p className="text-slate-500 text-[11px]">{currentCard.exampleZh}</p>
                        </div>

                        {/* Memory Tip */}
                        <div className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                          💡 記憶密技：{currentCard.tip}
                        </div>
                      </div>
                    )}

                    {/* Flip hint at bottom */}
                    <div className="text-center pt-2 border-t border-amber-200/50 text-[11px] text-amber-700 font-bold">
                      {isFlipped ? '反覆點擊卡片可再次翻回正面' : '點擊卡片任意處查看發音、例句與密技'}
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handlePrevCard}
                      disabled={currentCardIndex === 0}
                      className={`flex items-center gap-1 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                        currentCardIndex > 0
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>上一張</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {focusItems.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            idx === currentCardIndex
                              ? 'bg-amber-500 w-5'
                              : completedCards.has(idx)
                              ? 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextCard}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>{currentCardIndex === focusItems.length - 1 ? '完成測驗' : '下一張'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
