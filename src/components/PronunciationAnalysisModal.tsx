import React, { useState, useEffect } from 'react';
import { GradeLevel, Question, MistakeItem, LearningStyle } from '../types';
import { playSpeech } from '../utils/speech';
import { Headphones, Sparkles, X, Volume2, Bot, Loader2, CheckCircle, Zap, RefreshCw, Ear, Lightbulb, Sliders, ArrowRight, Play, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PronunciationAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade?: GradeLevel;
  speechSpeed?: number;
  question?: Question;
  selectedOptionIndex?: number;
  listeningMistakes?: MistakeItem[];
  learningStyle?: LearningStyle;
  setLearningStyle?: (style: LearningStyle) => void;
}

// Common Elementary Minimal Pairs for Listening Practice
const POPULAR_MINIMAL_PAIRS = [
  { pair: 'ship / sheep', label: '短母音 /ɪ/ vs 長母音 /iː/', hint: '船 ship (短音) 咩咩羊 sheep (拉長音)' },
  { pair: 'desk / disk', label: '母音 /e/ vs 母音 /ɪ/', hint: '書桌 desk (張嘴) 磁碟片 disk (牙齒微閉)' },
  { pair: 'cat / cut', label: '雙唇蝴蝶音 /æ/ vs 短母音 /ʌ/', hint: '貓咪 cat (嘴巴張大) 切開 cut (快速短促)' },
  { pair: 'bed / bad', label: '母音 /e/ vs 蝴蝶音 /æ/', hint: '床 bed (小口) 壞掉的 bad (大口張開)' },
  { pair: 'walk / work', label: '圓唇音 /ɔːk/ vs 捲舌音 /ɜːrk/', hint: '走路 walk (嘴巴發圓音) 工作 work (舌頭大幅後捲)' },
  { pair: 'tree / three', label: '齒齦音 /tr/ vs 咬舌音 /θr/', hint: '大樹 tree (舌尖頂上齒齦) 數字 3 three (輕輕咬舌頭)' },
  { pair: 'think / sink', label: '咬舌音 /θ/ vs 齒縫音 /s/', hint: '思考 think (輕咬舌頭發氣音) 水槽 sink (笑著發 s 音)' }
];

export const PronunciationAnalysisModal: React.FC<PronunciationAnalysisModalProps> = ({
  isOpen,
  onClose,
  grade = 'mid',
  speechSpeed = 0.85,
  question,
  selectedOptionIndex,
  listeningMistakes = [],
  learningStyle = 'fun',
  setLearningStyle
}) => {
  const [selectedPair, setSelectedPair] = useState<string>('ship / sheep');
  const [customInput, setCustomInput] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  // Auto-fill target word or listening question details when provided
  useEffect(() => {
    if (question) {
      const correctWord = question.options[question.answerIndex] || question.audioText || '';
      const wrongWord = selectedOptionIndex !== undefined && selectedOptionIndex >= 0 ? question.options[selectedOptionIndex] : '';
      if (correctWord && wrongWord && correctWord !== wrongWord) {
        setSelectedPair(`${correctWord} / ${wrongWord}`);
      } else if (correctWord) {
        setSelectedPair(correctWord);
      }
    } else if (listeningMistakes.length > 0) {
      const firstListening = listeningMistakes[0];
      const q = firstListening.question;
      const correct = q.options[q.answerIndex] || q.audioText || '';
      const wrong = firstListening.selectedOption !== undefined && firstListening.selectedOption >= 0 ? q.options[firstListening.selectedOption] : '';
      if (correct && wrong) {
        setSelectedPair(`${correct} / ${wrong}`);
      }
    }
  }, [question, selectedOptionIndex, listeningMistakes, isOpen]);

  // Fetch AI Pronunciation Analysis from backend
  const fetchAnalysis = async (targetPairStr: string) => {
    if (!targetPairStr.trim()) return;
    setLoading(true);
    setAnalysisText('');
    setIsFallbackMode(false);

    try {
      const response = await fetch('/api/gemini/pronunciation-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairOrQuestion: targetPairStr,
          questionDetails: question ? {
            questionText: question.question,
            audioText: question.audioText,
            options: question.options,
            correctAnswer: question.options[question.answerIndex],
            userAnswer: selectedOptionIndex !== undefined && selectedOptionIndex >= 0 ? question.options[selectedOptionIndex] : ''
          } : null,
          grade,
          learningStyle
        })
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysisText(data.analysis);
        setIsFallbackMode(!!data.isFallback);
      } else {
        generateLocalFallbackAnalysis(targetPairStr);
      }
    } catch (err) {
      console.warn('Pronunciation Analysis API error, using local fallback:', err);
      generateLocalFallbackAnalysis(targetPairStr);
    } finally {
      setLoading(false);
    }
  };

  // Local fallback smart analyzer for offline/static deployment
  const generateLocalFallbackAnalysis = (pairStr: string) => {
    setIsFallbackMode(true);
    const lower = pairStr.toLowerCase();

    let targetA = 'Target A';
    let targetB = 'Target B';
    if (pairStr.includes('/')) {
      const parts = pairStr.split('/');
      targetA = parts[0].trim();
      targetB = parts[1].trim();
    } else {
      targetA = pairStr.trim();
      targetB = '相似發音字';
    }

    let detailContent = `🎧 **【AI 聽力發音問題診斷與音近字辨析】**

1. 🎙️ **核心發音差異對比 (Phonics & Mouth Position)**：
   • **${targetA}**：請注意發音時嘴型自然放鬆，發音清晰短促。
   • **${targetB}**：發音時嘴型有些微變化（如舌尖位置或母音延展），需留意尾音與音長。

2. 👂 **聽力辨識防錯陷阱 (Listening Traps)**：
   • 國小學生在聽力測驗中最常因為「長短母音」或「齒音/唇音」未分清而選錯選項！
   • 建議聽語音時，仔細觀察字尾子音與聲音發音的長短節奏！

3. 🗣️ **對照例句與美式口語範例**：
   • 例句 1：*"Look at the ${targetA} in the picture!"*
   • 例句 2：*"I can hear the ${targetB} clearly!"*

4. 💡 **AI 小老師專屬記憶口訣**：
   「耳朵注意聽長短，舌頭放在對的位置，發音辨析超簡單！」加油，多點擊下方語音按鈕朗讀練習喔！💪`;

    if (lower.includes('ship') || lower.includes('sheep')) {
      detailContent = `🎧 **【AI 聽力發音診斷：ship / sheep 音近字辨析】**

1. 🎙️ **發音嘴型與 Phonics 對比**：
   • **ship** /ʃɪp/ (船)：發短母音 **/ɪ/**，嘴角微微放鬆，發音快速短促，像『噓』一聲快速結束！
   • **sheep** /ʃiːp/ (綿羊)：發長母音 **/iː/**，嘴角向兩側張開像在微笑，聲音拉長『依～』！

2. 👂 **聽力考試常見陷阱**：
   • 聽力考題中，聽到大自然或農場情境時多為 **sheep**；聽到大海、港口或交通工具時多為 **ship**！

3. 🗣️ **實用美式朗讀例句**：
   • *"The **ship** is sailing on the big sea."* (大船在航行)
   • *"The white **sheep** is eating grass."* (白羊在吃草)

4. 💡 **AI 老師口訣**：『微笑綿羊 sheep (長音)，小船 ship 快速開走 (短音)！』`;
    } else if (lower.includes('cat') || lower.includes('cut')) {
      detailContent = `🎧 **【AI 聽力發音診斷：cat / cut 音近字辨析】**

1. 🎙️ **發音嘴型與 Phonics 對比**：
   • **cat** /kæt/ (貓咪)：發蝴蝶音 **/æ/**，嘴巴要張到最大（上下可壓兩指高），發『ㄟ/啊』混合音！
   • **cut** /kʌt/ (剪下/切)：發短母音 **/ʌ/**，嘴巴微開自然放鬆，快速短促發出『阿』！

2. 👂 **聽力考試常見陷阱**：
   • **cat** 的母音較為寬廣響亮，**cut** 的發音則乾脆俐落！

3. 🗣️ **實用美式朗讀例句**：
   • *"My **cat** likes to play with the ball."*
   • *"Please **cut** the paper with scissors."*

4. 💡 **AI 老師口訣**：『張大嘴巴叫 cat (蝴蝶音)，快速切開選 cut (短音)！』`;
    }

    setAnalysisText(detailContent);
  };

  // Trigger analysis when modal opens or pair changes
  useEffect(() => {
    if (isOpen) {
      fetchAnalysis(selectedPair);
    }
  }, [isOpen, selectedPair, learningStyle]);

  const handlePlayAudioText = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <Ear className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-1.5">
                  AI 聽力發音問題診斷與音近字辨析
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </h3>
                <p className="text-xs text-rose-100">針對聽力練習錯題與易混淆發音，提供嘴型與音標精準建議！</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Style Switcher Sub-bar */}
          <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-yellow-300" />
              <span>AI 診斷風格：</span>
            </div>
            <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setLearningStyle?.('fun')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  learningStyle === 'fun' ? 'bg-amber-400 text-amber-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎭 強調趣味
              </button>
              <button
                onClick={() => setLearningStyle?.('precise')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  learningStyle === 'precise' ? 'bg-sky-400 text-sky-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎯 強調精準
              </button>
              <button
                onClick={() => setLearningStyle?.('quick')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  learningStyle === 'quick' ? 'bg-emerald-400 text-emerald-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ 快速複習
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-950">
            {/* Minimal Pair Selector Grid */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>國小熱門聽力易混淆音近字一覽（點選切換）：</span>
                </span>
                {isFallbackMode && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    預設靜態診斷模式
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_MINIMAL_PAIRS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPair(item.pair);
                      fetchAnalysis(item.pair);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedPair === item.pair
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs scale-102'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                    }`}
                  >
                    {item.pair}
                  </button>
                ))}
              </div>

              {/* Custom Input for User defined pairs */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      setSelectedPair(customInput.trim());
                      fetchAnalysis(customInput.trim());
                    }
                  }}
                  placeholder="或輸入你想對比發音的英文單字 (如: walk / work)..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900"
                />
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      setSelectedPair(customInput.trim());
                      fetchAnalysis(customInput.trim());
                    }
                  }}
                  disabled={!customInput.trim() || loading}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>辨析</span>
                </button>
              </div>
            </div>

            {/* Target Words Pronunciation Quick Play Bar */}
            <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-purple-950/40 dark:to-indigo-950/40 border border-rose-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-500 text-white rounded-xl shadow-2xs">
                  <Volume2 className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    目前分析標的：<span className="text-rose-600 dark:text-rose-400 font-extrabold">{selectedPair}</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">點擊朗讀直接對比標準美式發音嘴型：</p>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedPair.split('/').map((word, wIdx) => {
                  const cleanWord = word.trim();
                  if (!cleanWord) return null;
                  return (
                    <motion.button
                      key={wIdx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayAudioText(cleanWord)}
                      className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
                      <span>朗讀 「{cleanWord}」</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Analysis Result Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative">
              {loading ? (
                <div className="py-12 text-center text-rose-600 dark:text-rose-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
                  <p className="text-xs font-black">AI 小老師正在分析【{selectedPair}】的聽力音近字發音差異...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-200">
                    {analysisText}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      💡 提示：點擊「朗讀內容」讓 AI 小老師直接示範全句美式語調朗讀！
                    </span>
                    <button
                      onClick={() => handlePlayAudioText(analysisText.replace(/[#*`]/g, ''))}
                      className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>朗讀整篇辨析內容</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              🎧 國小英語聽力特訓 ｜ 養成對美式發音音近字的敏銳聽覺
            </span>
            <button
              onClick={onClose}
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors ml-auto cursor-pointer"
            >
              我知道了，關閉診斷
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
