import React, { useMemo, useState } from 'react';
import { MistakeItem, Question, GradeLevel } from '../types';
import { playSpeech } from '../utils/speech';
import { generateBlankQuestion } from '../utils/blankQuestionGenerator';
import { MistakeHeatmapCard } from './MistakeHeatmapCard';
import { WeaknessRelationCard } from './WeaknessRelationCard';
import {
  BookMarked,
  Trash2,
  RotateCcw,
  Volume2,
  Sparkles,
  CheckCircle,
  BrainCircuit,
  Target,
  Lightbulb,
  Edit3,
  Award,
  Zap,
  Check,
  X,
  HelpCircle,
  Type,
  BookOpen,
  Headphones,
  Layers,
  Filter,
  PlayCircle
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface MistakesViewProps {
  mistakes: MistakeItem[];
  speechSpeed: number;
  onRemoveMistake: (id: string) => void;
  onUpdateMistake?: (updatedItem: MistakeItem) => void;
  onClearAllMistakes: () => void;
  onStartRetest: (questions: Question[]) => void;
  onRequestAiExplanation: (question: Question, selectedOption: number) => void;
  onOpenPronunciationModal?: (question?: Question, selectedOptionIndex?: number) => void;
}

export const MistakesView: React.FC<MistakesViewProps> = ({
  mistakes,
  speechSpeed,
  onRemoveMistake,
  onUpdateMistake,
  onClearAllMistakes,
  onStartRetest,
  onRequestAiExplanation,
  onOpenPronunciationModal
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'reinforcement'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vocab' | 'grammar' | 'listening'>('all');
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { isCorrect?: boolean; message?: string }>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handlePlayAudio = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  // Helper to categorize mistakes into Vocabulary, Grammar, or Listening
  const getMistakeCategoryType = (item: MistakeItem): 'vocab' | 'grammar' | 'listening' => {
    const cat = (item.question.category || '').toLowerCase();
    const qText = (item.question.question || '').toLowerCase();

    // 1. Listening mistake
    if (
      cat.includes('聽力') ||
      cat.includes('listening') ||
      cat.includes('audio') ||
      cat.includes('語音') ||
      qText.includes('聽') ||
      qText.includes('audio') ||
      qText.includes('listen') ||
      !!item.question.audioText
    ) {
      return 'listening';
    }

    // 2. Vocabulary mistake
    if (
      cat.includes('單字') ||
      cat.includes('發音') ||
      cat.includes('phonics') ||
      cat.includes('vocab') ||
      cat.includes('詞彙') ||
      cat.includes('拼字') ||
      cat.includes('字母')
    ) {
      return 'vocab';
    }

    // 3. Grammar mistake
    if (
      cat.includes('文法') ||
      cat.includes('句型') ||
      cat.includes('對話') ||
      cat.includes('時態') ||
      cat.includes('動詞') ||
      cat.includes('介系詞') ||
      cat.includes('代名詞') ||
      cat.includes('grammar')
    ) {
      return 'grammar';
    }

    // Fallback heuristic: short questions tend to be vocab, longer ones grammar
    return qText.length < 22 ? 'vocab' : 'grammar';
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    let vocab = 0;
    let grammar = 0;
    let listening = 0;

    mistakes.forEach((m) => {
      const type = getMistakeCategoryType(m);
      if (type === 'vocab') vocab++;
      else if (type === 'grammar') grammar++;
      else if (type === 'listening') listening++;
    });

    return { vocab, grammar, listening };
  }, [mistakes]);

  // Filtered mistakes list based on category filter
  const filteredMistakes = useMemo(() => {
    if (categoryFilter === 'all') return mistakes;
    return mistakes.filter((m) => getMistakeCategoryType(m) === categoryFilter);
  }, [mistakes, categoryFilter]);

  const handleRetestAll = () => {
    if (mistakes.length === 0) return;
    const questions = mistakes.map((m) => m.question);
    onStartRetest(questions);
  };

  const handleRetestCurrentFilter = () => {
    if (filteredMistakes.length === 0) return;
    const questions = filteredMistakes.map((m) => m.question);
    onStartRetest(questions);
  };

  // Convert a mistake into auto-reinforced mode manually if not already
  const handleEnableReinforcement = (item: MistakeItem) => {
    const blankQ = item.blankQuestion || generateBlankQuestion(item.question);
    const updated: MistakeItem = {
      ...item,
      autoReinforced: true,
      wrongCount: (item.wrongCount || 1) + 1,
      fillInBlankPracticeCount: item.fillInBlankPracticeCount || 0,
      blankQuestion: blankQ
    };
    onUpdateMistake?.(updated);
    setSuccessToast(`⚡ 已成功將該題轉換為「自動化弱點填空補強」！`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Handle Fill-In-The-Blank Submit
  const handleCheckBlankAnswer = (item: MistakeItem) => {
    const blankQ = item.blankQuestion || generateBlankQuestion(item.question);
    const rawInput = userInputs[item.id] || '';
    const cleanInput = rawInput.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
    const cleanTarget = blankQ.targetAnswer.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

    if (!cleanInput) return;

    if (cleanInput === cleanTarget) {
      const currentCount = item.fillInBlankPracticeCount || 0;
      const newCount = currentCount + 1;

      if (newCount >= 3) {
        // Mastered!
        setFeedback((prev) => ({
          ...prev,
          [item.id]: {
            isCorrect: true,
            message: '🎉 太棒了！已連續 3 次正確完成填空練習！已為您自動精通並移出錯題本！'
          }
        }));
        setSuccessToast(`🏆 恭喜！《${item.question.question}》已完成 3 次強化練習，自動移出錯題本！`);
        setTimeout(() => setSuccessToast(null), 4000);

        // Remove from mistake list
        setTimeout(() => {
          onRemoveMistake(item.id);
        }, 1200);
      } else {
        // Progress increment
        const updated: MistakeItem = {
          ...item,
          fillInBlankPracticeCount: newCount,
          autoReinforced: true,
          blankQuestion: blankQ
        };
        onUpdateMistake?.(updated);

        setFeedback((prev) => ({
          ...prev,
          [item.id]: {
            isCorrect: true,
            message: `✨ 答對了！填空練習進度：${newCount} / 3 次！再答對 ${3 - newCount} 次即可移出錯題本！`
          }
        }));

        // Reset input for next time
        setUserInputs((prev) => ({ ...prev, [item.id]: '' }));
      }
    } else {
      setFeedback((prev) => ({
        ...prev,
        [item.id]: {
          isCorrect: false,
          message: `❌ 答案不夠精準喔！正確答案包含「${blankQ.targetAnswer}」。再試一次看看！`
        }
      }));
    }
  };

  // Filter items for auto-reinforcement (items with wrongCount >= 2 or explicitly autoReinforced)
  const reinforcedMistakes = useMemo(() => {
    return mistakes.filter((m) => m.autoReinforced || (m.wrongCount && m.wrongCount >= 2));
  }, [mistakes]);

  // Analyze mistake categories into 3 core pillars: 單字, 句型, 文法
  const categoryAnalysis = useMemo(() => {
    let vocabCount = 0;
    let sentenceCount = 0;
    let grammarCount = 0;

    mistakes.forEach((m) => {
      const cat = (m.question.category || '').toLowerCase();
      if (cat.includes('單字') || cat.includes('發音') || cat.includes('聽力') || cat.includes('vocab')) {
        vocabCount++;
      } else if (cat.includes('句型') || cat.includes('對話') || cat.includes('閱讀') || cat.includes('會話')) {
        sentenceCount++;
      } else if (cat.includes('文法') || cat.includes('時態') || cat.includes('動詞') || cat.includes('介系詞') || cat.includes('grammar')) {
        grammarCount++;
      } else {
        grammarCount++;
      }
    });

    const maxCount = Math.max(vocabCount, sentenceCount, grammarCount, 1);

    const radarData = [
      { category: '單字 (Vocabulary)', count: vocabCount, fullMark: maxCount + 2 },
      { category: '句型 (Sentences)', count: sentenceCount, fullMark: maxCount + 2 },
      { category: '文法 (Grammar)', count: grammarCount, fullMark: maxCount + 2 }
    ];

    let topWeakness = '單字';
    if (sentenceCount >= vocabCount && sentenceCount >= grammarCount) {
      topWeakness = '句型對話';
    } else if (grammarCount >= vocabCount && grammarCount >= sentenceCount) {
      topWeakness = '文法結構';
    }

    return {
      radarData,
      vocabCount,
      sentenceCount,
      grammarCount,
      topWeakness
    };
  }, [mistakes]);

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 relative">
      {/* Success Notification Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📕 錯題診斷本
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full border border-rose-200">
              共 {mistakes.length} 題
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">自動記錄答錯題目，針對多次出錯進行 AI 自動化填空補強！</p>
        </div>

        {mistakes.length > 0 && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRetestAll}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>錯題全數重測 ({mistakes.length})</span>
            </motion.button>

            <button
              onClick={onClearAllMistakes}
              className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer"
              title="清空錯題本"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      {mistakes.length > 0 && (
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold max-w-md">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📋 全部錯題一覽 ({mistakes.length})</span>
          </button>

          <button
            onClick={() => setViewMode('reinforcement')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'reinforcement'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-purple-700 hover:text-purple-900 bg-purple-50/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>🤖 AI 填空弱點補強 ({reinforcedMistakes.length})</span>
          </button>
        </div>
      )}

      {/* Category Filter Switcher Tabs (Shown when there are mistakes in 'all' view) */}
      {mistakes.length > 0 && viewMode === 'all' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm mb-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>主題式錯題自動歸類切換器：</span>
            </div>

            {categoryFilter !== 'all' && filteredMistakes.length > 0 && (
              <button
                onClick={handleRetestCurrentFilter}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>
                  一鍵重測『
                  {categoryFilter === 'vocab'
                    ? '單字錯誤'
                    : categoryFilter === 'grammar'
                    ? '文法錯誤'
                    : '聽力錯誤'}
                  』({filteredMistakes.length} 題)
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
            {/* All */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className={`w-4 h-4 ${categoryFilter === 'all' ? 'text-sky-300' : 'text-slate-500'}`} />
                <span>全部錯題</span>
              </div>
              <span className={`text-[11px] ${categoryFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                {mistakes.length} 題
              </span>
            </button>

            {/* Vocab */}
            <button
              onClick={() => setCategoryFilter('vocab')}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                categoryFilter === 'vocab'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-102'
                  : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Type className={`w-4 h-4 ${categoryFilter === 'vocab' ? 'text-yellow-100' : 'text-amber-600'}`} />
                <span>🔤 單字錯誤</span>
              </div>
              <span className={`text-[11px] ${categoryFilter === 'vocab' ? 'text-amber-100' : 'text-amber-700'}`}>
                {categoryCounts.vocab} 題
              </span>
            </button>

            {/* Grammar */}
            <button
              onClick={() => setCategoryFilter('grammar')}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                categoryFilter === 'grammar'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-102'
                  : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className={`w-4 h-4 ${categoryFilter === 'grammar' ? 'text-indigo-200' : 'text-indigo-600'}`} />
                <span>📖 文法錯誤</span>
              </div>
              <span className={`text-[11px] ${categoryFilter === 'grammar' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                {categoryCounts.grammar} 題
              </span>
            </button>

            {/* Listening */}
            <button
              onClick={() => setCategoryFilter('listening')}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                categoryFilter === 'listening'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102'
                  : 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Headphones className={`w-4 h-4 ${categoryFilter === 'listening' ? 'text-rose-100' : 'text-rose-600'}`} />
                <span>🎧 聽力錯誤</span>
              </div>
              <span className={`text-[11px] ${categoryFilter === 'listening' ? 'text-rose-100' : 'text-rose-700'}`}>
                {categoryCounts.listening} 題
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Radar Chart Analysis Banner (shown when in all view) */}
      {mistakes.length > 0 && viewMode === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl border border-indigo-800/50 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-indigo-500/30 text-yellow-300 rounded-xl border border-indigo-400/30">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                AI 智慧錯題雷達與弱點轉化分析
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <p className="text-xs text-indigo-200">當錯題出錯 ≥2 次，AI 將自動啟動「填空弱點補強」模式！</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Recharts Radar Chart */}
            <div className="h-60 w-full bg-white/5 rounded-2xl p-2 border border-white/10 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryAnalysis.radarData}>
                  <PolarGrid stroke="#6366f1" strokeOpacity={0.4} />
                  <PolarAngleAxis
                    dataKey="category"
                    stroke="#e0e7ff"
                    tick={{ fill: '#e0e7ff', fontSize: 11, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} stroke="#818cf8" strokeOpacity={0.2} />
                  <Radar
                    name="錯題數量"
                    dataKey="count"
                    stroke="#fbbf24"
                    fill="#fbbf24"
                    fillOpacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#475569',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [`${value} 題錯題`, '累積指標']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Diagnosis Insights */}
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-yellow-300 font-bold text-xs mb-1">
                  <Target className="w-4 h-4" />
                  <span>核心弱點診斷：【{categoryAnalysis.topWeakness}】</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  系統偵測你在<strong>【{categoryAnalysis.topWeakness}】</strong>單元累積較多錯題！切換至「AI 填空弱點補強」，完成 3 次填空練習即可將錯題完全移出錯題本！
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-indigo-200 text-[11px]">單字單元</div>
                  <div className="text-lg font-black text-amber-300">{categoryAnalysis.vocabCount} 題</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-indigo-200 text-[11px]">句型對話</div>
                  <div className="text-lg font-black text-sky-300">{categoryAnalysis.sentenceCount} 題</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-indigo-200 text-[11px]">核心文法</div>
                  <div className="text-lg font-black text-purple-300">{categoryAnalysis.grammarCount} 題</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mistake Time Heatmap Visualization & AI Time Recommendation */}
      {viewMode === 'all' && (
        <>
          <WeaknessRelationCard mistakes={mistakes} onStartTargetedPractice={onStartRetest} />
          <MistakeHeatmapCard mistakes={mistakes} />
        </>
      )}

      {/* Empty State */}
      {mistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">錯題本空空如也！</h3>
          <p className="text-xs text-slate-500">太棒了！你目前沒有任何錯題，繼續保持完美成績吧！🎉</p>
        </div>
      ) : viewMode === 'reinforcement' ? (
        /* Fill-in-the-blank Reinforcement Practice View */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-900 font-black text-sm mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>AI 自動化填空補強模式說明</span>
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">
                當題目重複出錯（或手動開啟補強）時，AI 會自動將選擇題改寫為「填空測驗」。學生必須<strong>連續練習 3 次正確輸入英文單字/句型</strong>，系統才會判定完全掌握並自動移出錯題本！
              </p>
            </div>
            <div className="bg-white border border-purple-200 px-4 py-2 rounded-2xl text-center flex-shrink-0">
              <div className="text-[10px] text-purple-700 font-bold">待強化弱點</div>
              <div className="text-2xl font-black text-purple-900">{reinforcedMistakes.length} 題</div>
            </div>
          </div>

          {reinforcedMistakes.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-2 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-base">目前尚無需要重複補強的錯題！</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                你可以切換至「全部錯題一覽」，點選題目右方的『⚡ 轉為填空補強』手動開啟強化練習！
              </p>
              <button
                onClick={() => setViewMode('all')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                回到全部錯題列表
              </button>
            </div>
          ) : (
            reinforcedMistakes.map((item) => {
              const blankQ = item.blankQuestion || generateBlankQuestion(item.question);
              const practiceCount = item.fillInBlankPracticeCount || 0;
              const feedbackObj = feedback[item.id];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border-2 border-purple-200 p-5 sm:p-6 shadow-md space-y-4"
                >
                  {/* Card Header & Progress badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span>弱點補強中</span>
                      </span>
                      <span className="text-xs text-slate-500 font-bold">
                        累積出錯 {item.wrongCount || 1} 次
                      </span>
                    </div>

                    {/* 3 Stars Mastery Progress */}
                    <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-2xl border border-purple-100">
                      <span className="text-xs font-black text-purple-900">練習進度：</span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((starIdx) => (
                          <div
                            key={starIdx}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                              practiceCount >= starIdx
                                ? 'bg-amber-400 text-amber-950 shadow-2xs scale-110'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {practiceCount >= starIdx ? '★' : starIdx}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-purple-800 ml-1">
                        ({practiceCount}/3 次)
                      </span>
                    </div>
                  </div>

                  {/* Fill in the blank prompt */}
                  <div>
                    <div className="text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>請閱讀句子並在空格處填入正確英文：</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                      {blankQ.sentenceWithBlank}
                    </div>
                  </div>

                  {/* Interactive Answer Input Form */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={userInputs[item.id] || ''}
                      onChange={(e) => setUserInputs({ ...userInputs, [item.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheckBlankAnswer(item);
                      }}
                      placeholder="在 此 輸入拼音或英文單字..."
                      className="flex-1 bg-white border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-all"
                    />

                    <button
                      onClick={() => handleCheckBlankAnswer(item)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>檢查答案</span>
                    </button>

                    {(item.question.audioText || item.question.question) && (
                      <button
                        onClick={() => handlePlayAudio(item.question.audioText || item.question.question)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>聽發音</span>
                      </button>
                    )}
                  </div>

                  {/* Realtime Feedback Alert */}
                  {feedbackObj && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-bold ${
                        feedbackObj.isCorrect
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}
                    >
                      {feedbackObj.message}
                    </div>
                  )}

                  {/* Explanation / Hint accordion */}
                  <div className="text-xs text-slate-600 bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>觀念提示：</strong> {blankQ.hint}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Classic All Mistakes List View */
        <div className="space-y-4">
          {filteredMistakes.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">此分類目前沒有任何錯題！</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                你在『
                {categoryFilter === 'vocab'
                  ? '單字錯誤'
                  : categoryFilter === 'grammar'
                  ? '文法錯誤'
                  : '聽力錯誤'}
                』領域表現非常優異！可以切換至其他分類進行複習。
              </p>
              <button
                onClick={() => setCategoryFilter('all')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                查看全部錯題 ({mistakes.length} 題)
              </button>
            </div>
          ) : (
            filteredMistakes.map((item) => {
              const q = item.question;
              const userSelectedText = q.options[item.selectedOption] || '未選擇';
              const correctText = q.options[q.answerIndex];
              const isAutoReinforced = item.autoReinforced || (item.wrongCount && item.wrongCount >= 2);
              const catType = getMistakeCategoryType(item);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all relative group rounded-3xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {/* Auto Category Tag */}
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 ${
                          catType === 'vocab'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                            : catType === 'grammar'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {catType === 'vocab' ? (
                          <>
                            <Type className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>🔤 單字錯題</span>
                          </>
                        ) : catType === 'grammar' ? (
                          <>
                            <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>📖 文法錯題</span>
                          </>
                        ) : (
                          <>
                            <Headphones className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>🎧 聽力錯題</span>
                          </>
                        )}
                      </span>

                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        {q.category}
                      </span>

                      {isAutoReinforced && (
                        <span className="text-[11px] font-black text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>已開啟填空補強 ({item.fillInBlankPracticeCount || 0}/3)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAutoReinforced && (
                        <button
                          onClick={() => handleEnableReinforcement(item)}
                          className="p-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="手動轉換為填空弱點補強題"
                        >
                          <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>轉為填空補強</span>
                        </button>
                      )}

                      {(q.audioText || q.question) && (
                        <button
                          onClick={() => handlePlayAudio(q.audioText || q.question)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> 發音
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveMistake(item.id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="移除此題目（已學會）"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">{q.question}</h3>

                  {/* Answers breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-xl text-rose-900 dark:text-rose-200 font-medium">
                      ❌ 你的選擇：<strong>{userSelectedText}</strong>
                    </div>
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl text-emerald-900 dark:text-emerald-200 font-medium">
                      ✅ 正確答案：<strong>{correctText}</strong>
                    </div>
                  </div>

                  {/* Teacher Explanation */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    <strong>解析：</strong>{q.explanation}
                  </div>

                  {/* AI Diagnosis Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onRequestAiExplanation(q, item.selectedOption)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>請 AI 小老師詳細診斷</span>
                    </button>

                    <button
                      onClick={() => onOpenPronunciationModal?.(q, item.selectedOption)}
                      className="flex items-center gap-1.5 text-xs font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5 text-rose-600" />
                      <span>🎧 AI 發音問題辨析</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};


