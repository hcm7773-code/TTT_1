import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GradeLevel, MistakeItem, QuizResult, LearningStyle } from '../types';
import { playSpeech } from '../utils/speech';
import { Sparkles, X, Send, Volume2, Bot, User, Loader2, Heart, ShieldAlert, Sliders, Zap, Compass, Ear, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeLevel;
  speechSpeed: number;
  mistakes?: MistakeItem[];
  quizResults?: QuizResult[];
  onRecordMood?: (moodId: string) => void;
  learningStyle?: LearningStyle;
  setLearningStyle?: (style: LearningStyle) => void;
  onOpenPronunciationModal?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  moodSticker?: string;
}

export interface MoodSticker {
  id: string;
  emoji: string;
  label: string;
  promptText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  fallbackReply: string;
}

const MOOD_STICKERS: MoodSticker[] = [
  {
    id: 'frustrated',
    emoji: '😭',
    label: '卡關挫折',
    promptText: '😭 我遇到英文題目卡關覺得有點挫折，好難喔...',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
    borderColor: 'border-rose-200',
    fallbackReply: '抱抱小學霸！🤗 學習英文就像學騎腳踏車，摔倒幾次很正常喔！錯題是我們成長的超級養分。來，先深呼吸一次～我們一次搞懂一個小觀念，小老師一直在這裡陪著你！你超級棒的！💪✨'
  },
  {
    id: 'celebrate',
    emoji: '🎉',
    label: '慶祝高分',
    promptText: '🎉 我剛剛練習拿到了高分！快來跟我一起慶祝吧！',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200',
    fallbackReply: '哇啊啊啊！太讚啦！恭喜你！🎉🎊 你的努力完全展現在亮眼成績上了！給你一個超級大大的 High-Five ✋！記得保持這份自信，你就是真正的英語小學霸！🏆✨'
  },
  {
    id: 'motivated',
    emoji: '💪',
    label: '充滿幹勁',
    promptText: '💪 我現在充滿學習幹勁！請給我一個今日英文樂趣挑戰！',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-200',
    fallbackReply: '這股熱情太令人振奮了！🔥 既然你能量滿滿，小老師出一個快問快答考考你：請問【蘋果 Apple】與【香蕉 Banana】的複數各是什麼？答對的話代表你實力爆棚喔！😄'
  },
  {
    id: 'tired',
    emoji: '😴',
    label: '讀書累了',
    promptText: '😴 我讀英文讀到眼睛有點酸有點累，想休息一下...',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 hover:bg-sky-100',
    borderColor: 'border-sky-200',
    fallbackReply: '辛苦了！休息也是學習非常重要的一部分喔！💤 趕快站起來伸個懶腰、喝杯溫水、看看窗外綠色植物～今天你已經進步很多了，給自己一個大大的讚，休息好了隨時再回來找小老師喔！🍵🌱'
  },
  {
    id: 'confused',
    emoji: '🤔',
    label: '觀念不解',
    promptText: '🤔 這個英文觀念我一直搞不懂，可以換個超簡單的方式教我嗎？',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
    fallbackReply: '沒問題！英文觀念如果死記硬背真的很枯燥。沒關係，把它當成小故事：就像動詞開頭的三單 He/She/It ，就像三個愛加料『s』的小朋友！你最想了解哪個特定觀念？告訴我，我用最有趣的譬喻解釋給你聽！💡'
  }
];

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  grade,
  speechSpeed,
  mistakes = [],
  quizResults = [],
  onRecordMood,
  learningStyle = 'fun',
  setLearningStyle,
  onOpenPronunciationModal
}) => {
  // Analyze top weak categories
  const weakSummary = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    mistakes.forEach((m) => {
      const cat = m.question.category || '基礎文法';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted.length > 0 ? sorted[0][0] : null;
    const topCount = sorted.length > 0 ? sorted[0][1] : 0;

    return {
      topCategory,
      topCount,
      allCategories: sorted.map(([cat]) => cat)
    };
  }, [mistakes]);

  // Proactive greeting based on weakness memory
  const proactiveGreeting = useMemo(() => {
    if (weakSummary.topCategory) {
      return `👋 哈囉小學霸！我是你的「AI 英語小老師」👩‍🏫✨\n翻開你的練習紀錄，我注意到你在【${weakSummary.topCategory}】（累積 ${weakSummary.topCount} 個錯題）有些小考驗呢！別擔心～要不要先聽聽小老師為你整理的「記憶口訣」？或者有任何英文問題隨時考考我喔！❤️`;
    }
    return 'Hello! 我是你的「AI 英文小老師」👋！請問在學習英文單字、句型或發音上遇到什麼難題嗎？隨時問我喔！😄';
  }, [weakSummary]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize or reset proactive greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: proactiveGreeting }]);
    }
  }, [isOpen, proactiveGreeting, messages.length]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const PRESET_QUESTIONS = weakSummary.topCategory
    ? [
        `請教我【${weakSummary.topCategory}】的解題秘訣！`,
        '什麼時候用 a？什麼時候用 an？',
        'He / She / It 為什麼動詞要加 s？',
        '請幫我做一段美式口語朗讀示範！'
      ]
    : [
        '什麼時候用 a？什麼時候用 an？',
        'He / She / It 為什麼動詞要加 s？',
        'Good morning 跟 Good afternoon 有什麼差別？',
        '請教我 Apple 和 Banana 的複數怎麼寫！'
      ];

  const handleSendMessage = async (textToSend?: string, moodStickerObj?: MoodSticker) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    if (moodStickerObj) {
      onRecordMood?.(moodStickerObj.id);
    }

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: query, moodSticker: moodStickerObj?.emoji }
    ];
    setMessages(newMessages);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          grade,
          weakCategories: weakSummary.allCategories,
          recentMistakesCount: mistakes.length,
          moodSticker: moodStickerObj?.id,
          learningStyle
        })
      });

      if (!response.ok) {
        throw new Error('Static host response error');
      }

      const data = await response.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const reply = moodStickerObj ? moodStickerObj.fallbackReply : '抱歉，AI 老師剛剛走神了，請再試問一次喔！';
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      console.error(err);
      const reply = moodStickerObj
        ? moodStickerObj.fallbackReply
        : '💡 提示：在 GitHub Pages 靜態環境下，全站豐富的預設英語單字卡、聽力發音、國小三大年級試題與文法解析皆可完整使用！若需與 AI 老師進行即時對話，可於支援 Node.js Server 的環境中執行。';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-2xl w-full max-w-xl h-[85vh] max-h-[650px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-col">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <Bot className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-base flex items-center gap-1.5">
                      AI 英文小老師
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    </h3>
                    <p className="text-xs text-indigo-100">繁體中文解說・適合國小理解</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Learning Style Switcher & Features Sub-bar */}
              <div className="bg-indigo-950/40 border-t border-indigo-400/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-100">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sliders className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>AI 風格：</span>
                  <div className="flex gap-1 bg-black/20 p-0.5 rounded-xl">
                    <button
                      onClick={() => setLearningStyle?.('fun')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                        learningStyle === 'fun'
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : 'text-indigo-200 hover:text-white'
                      }`}
                      title="強調趣味：幽默故事、圖像化生動口訣"
                    >
                      🎭 趣味
                    </button>
                    <button
                      onClick={() => setLearningStyle?.('precise')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                        learningStyle === 'precise'
                          ? 'bg-sky-400 text-sky-950 shadow-xs'
                          : 'text-indigo-200 hover:text-white'
                      }`}
                      title="強調精準：結構文法解析、條理清晰"
                    >
                      🎯 精準
                    </button>
                    <button
                      onClick={() => setLearningStyle?.('quick')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                        learningStyle === 'quick'
                          ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                          : 'text-indigo-200 hover:text-white'
                      }`}
                      title="快速複習：極簡 3 大重點列舉、10秒速記"
                    >
                      ⚡ 速記
                    </button>
                  </div>
                </div>

                {/* Pronunciation Diagnosis Button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (onOpenPronunciationModal) {
                      onOpenPronunciationModal();
                    } else {
                      handleSendMessage('🎧 請 AI 老師幫我做『發音問題分析』！特別針對聽力練習常錯的音近字（如 ship/sheep, desk/disk, cat/cut, walk/work）進行辨析建議！');
                    }
                  }}
                  className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black px-2.5 py-1 rounded-xl shadow-xs text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-yellow-300" />
                  <span>🎧 發音問題分析 (音近字辨析)</span>
                </motion.button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-sky-500 text-white font-medium rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.role === 'assistant' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReadAloud(msg.content)}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> 朗讀內容
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 p-3 rounded-2xl w-max"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-300" />
                  <span>AI 老師思考中...</span>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Mood Stickers Bar */}
            <div className="px-4 py-2 bg-gradient-to-r from-amber-50/80 via-purple-50/50 to-indigo-50/80 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                  <span>心情貼紙 Mood Stickers</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">點擊貼紙讓 AI 老師為你打氣！</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {MOOD_STICKERS.map((sticker) => (
                  <motion.button
                    key={sticker.id}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage(sticker.promptText, sticker)}
                    disabled={loading}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-2xs ${sticker.bgColor} ${sticker.borderColor} ${sticker.color} cursor-pointer flex-shrink-0`}
                  >
                    <span className="text-sm">{sticker.emoji}</span>
                    <span>{sticker.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Preset chips */}
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none">
              {PRESET_QUESTIONS.map((q, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="text-[11px] font-bold whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  {q}
                </motion.button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="請輸入英文發音、單字或文法問題..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-indigo-500"
              />
              <motion.button
                whileHover={inputQuery.trim() && !loading ? { scale: 1.05 } : {}}
                whileTap={inputQuery.trim() && !loading ? { scale: 0.95 } : {}}
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || loading}
                className={`p-2.5 rounded-xl text-white font-bold transition-all ${
                  inputQuery.trim() && !loading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
