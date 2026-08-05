import React, { useMemo } from 'react';
import { GradeLevel, QuizResult, MistakeItem, Question } from '../types';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { Sparkles, ArrowRight, Brain, Target, Compass, CheckCircle2, Zap, BookOpen, Headphones, Type, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface RecommendedUnit {
  id: string;
  title: string;
  category: string;
  type: 'vocab' | 'grammar' | 'listening' | 'general';
  priority: 'High' | 'Medium' | 'Normal';
  reason: string;
  estimatedMinutes: number;
  questionCount: number;
  questions: Question[];
  actionTab?: string;
}

interface AiLearningPathCardProps {
  grade: GradeLevel;
  quizResults: QuizResult[];
  mistakes: MistakeItem[];
  onStartUnitPractice: (questions: Question[], title: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AiLearningPathCard: React.FC<AiLearningPathCardProps> = ({
  grade,
  quizResults,
  mistakes,
  onStartUnitPractice,
  onNavigateTab
}) => {
  // Analyze student's weak points from recent quiz results & mistakes
  const recommendedUnits = useMemo<RecommendedUnit[]>(() => {
    // 1. Gather mistakes breakdown
    let vocabWrong = 0;
    let grammarWrong = 0;
    let listeningWrong = 0;

    const vocabQuestions: Question[] = [];
    const grammarQuestions: Question[] = [];
    const listeningQuestions: Question[] = [];

    // Categorize mistakes
    mistakes.forEach((m) => {
      const cat = (m.question.category || '').toLowerCase();
      const qText = (m.question.question || '').toLowerCase();
      if (
        cat.includes('聽力') ||
        cat.includes('listening') ||
        cat.includes('audio') ||
        qText.includes('聽') ||
        !!m.question.audioText
      ) {
        listeningWrong++;
        if (!listeningQuestions.some((q) => q.id === m.question.id)) listeningQuestions.push(m.question);
      } else if (
        cat.includes('文法') ||
        cat.includes('句型') ||
        cat.includes('對話') ||
        cat.includes('grammar')
      ) {
        grammarWrong++;
        if (!grammarQuestions.some((q) => q.id === m.question.id)) grammarQuestions.push(m.question);
      } else {
        vocabWrong++;
        if (!vocabQuestions.some((q) => q.id === m.question.id)) vocabQuestions.push(m.question);
      }
    });

    // Grade label
    const gradeLabel = grade === 'low' ? '低年級' : grade === 'mid' ? '中年級' : '高年級';

    // Get grade default questions pool
    const gradePool = DEFAULT_QUESTIONS.filter((q) => q.grade === grade);

    // Build 3 intelligent recommended units
    const units: RecommendedUnit[] = [];

    // Unit 1: Top mistake domain or core vocabulary focus
    if (vocabWrong >= grammarWrong && vocabWrong >= listeningWrong && vocabWrong > 0) {
      const pool = vocabQuestions.length >= 3 ? vocabQuestions : gradePool.filter((q) => q.category.includes('單字') || q.category.includes('字母') || q.category.includes('發音'));
      units.push({
        id: 'unit-vocab-focus',
        title: `${gradeLabel}核心單字與發音突破`,
        category: '核心單字與拼字',
        type: 'vocab',
        priority: 'High',
        reason: `近一週累積 ${vocabWrong} 題單字錯題，建議優先鞏固拼字與字義靈敏度。`,
        estimatedMinutes: 5,
        questionCount: Math.max(pool.length, 5),
        questions: pool.length > 0 ? pool : gradePool.slice(0, 5),
        actionTab: 'flashcards'
      });
    } else if (grammarWrong > 0) {
      const pool = grammarQuestions.length >= 3 ? grammarQuestions : gradePool.filter((q) => q.category.includes('文法') || q.category.includes('句型') || q.category.includes('對話'));
      units.push({
        id: 'unit-grammar-focus',
        title: `${gradeLabel}必備文法與對話句型`,
        category: '文法與常用對話',
        type: 'grammar',
        priority: 'High',
        reason: `檢測到 ${grammarWrong} 題文法與句型邏輯混淆，建議觀看文法解析並練習。`,
        estimatedMinutes: 6,
        questionCount: Math.max(pool.length, 5),
        questions: pool.length > 0 ? pool : gradePool.slice(0, 5),
        actionTab: 'grammar'
      });
    } else {
      units.push({
        id: 'unit-vocab-general',
        title: `${gradeLabel}高頻核心單字特訓`,
        category: '單字與詞彙累積',
        type: 'vocab',
        priority: 'High',
        reason: 'AI 根據你的學習階段，推薦優先建立高頻詞彙庫與生活美語基底。',
        estimatedMinutes: 5,
        questionCount: 5,
        questions: gradePool.slice(0, 5),
        actionTab: 'quiz'
      });
    }

    // Unit 2: Listening or Context Dialogue
    if (listeningWrong > 0 || mistakes.some((m) => m.question.audioText)) {
      const pool = listeningQuestions.length >= 2 ? listeningQuestions : gradePool.filter((q) => q.audioText || q.category.includes('聽力'));
      units.push({
        id: 'unit-listening-boost',
        title: `${gradeLabel}聽力辨識與語音聽解`,
        category: '英語聽力理解',
        type: 'listening',
        priority: 'Medium',
        reason: '加強母語發音敏銳度，提升聽力辨析與對話朗讀記憶。',
        estimatedMinutes: 4,
        questionCount: Math.max(pool.length, 4),
        questions: pool.length > 0 ? pool : gradePool.filter((q) => q.audioText).slice(0, 4),
        actionTab: 'quiz'
      });
    } else {
      const grammarPool = gradePool.filter((q) => q.category.includes('句型') || q.category.includes('對話') || q.category.includes('文法'));
      units.push({
        id: 'unit-dialogue-daily',
        title: `${gradeLabel}日常生活對話與情境`,
        category: '情境對話練習',
        type: 'grammar',
        priority: 'Medium',
        reason: '系統推薦加強日常生活應用對話，培養英文思考連貫性。',
        estimatedMinutes: 5,
        questionCount: Math.max(grammarPool.length, 5),
        questions: grammarPool.length > 0 ? grammarPool : gradePool.slice(0, 5),
        actionTab: 'quiz'
      });
    }

    // Unit 3: AI Weakness Challenge or Comprehensive Review
    if (mistakes.length > 0) {
      const mistakePool = mistakes.map((m) => m.question);
      units.push({
        id: 'unit-mistakes-clear',
        title: '錯題集中消滅與精準清空',
        category: '錯題診斷與弱點特訓',
        type: 'general',
        priority: 'Normal',
        reason: `目前錯題庫尚有 ${mistakes.length} 題未清空，一鍵挑戰重測可迅速提升掌握度。`,
        estimatedMinutes: 6,
        questionCount: mistakes.length,
        questions: mistakePool,
        actionTab: 'mistakes'
      });
    } else {
      units.push({
        id: 'unit-comprehensive-challenge',
        title: `${gradeLabel}綜合實力挑戰特訓`,
        category: '綜合情境測驗',
        type: 'general',
        priority: 'Normal',
        reason: '表現優異！建議挑戰綜合隨機測驗，全面驗證單字、聽力與文法運用能力。',
        estimatedMinutes: 7,
        questionCount: gradePool.length,
        questions: gradePool,
        actionTab: 'ai-quiz'
      });
    }

    return units.slice(0, 3);
  }, [grade, quizResults, mistakes]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden mb-6 border border-indigo-700/50">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-indigo-700/60 relative z-10 mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-white flex items-center gap-1.5">
                AI 學習路徑建議 (Adaptive Learning Path)
              </h2>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                個人化推薦
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              根據近期 {quizResults.length} 次測驗與 {mistakes.length} 個錯題自動分析，為你主動推薦最佳練習單元
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-indigo-200 block font-medium">學習分析狀態</span>
          <span className="text-xs font-black text-emerald-400 flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 弱點模型同步中
          </span>
        </div>
      </div>

      {/* 3 Recommended Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
        {recommendedUnits.map((unit, idx) => {
          const isHighPriority = unit.priority === 'High';
          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-2xl p-4 transition-all border flex flex-col justify-between relative group ${
                isHighPriority
                  ? 'bg-gradient-to-b from-indigo-800/90 to-indigo-950/90 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/60 border-indigo-700/60'
              }`}
            >
              {/* Unit Tag & Priority Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    unit.type === 'vocab'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : unit.type === 'grammar'
                      ? 'bg-indigo-400/20 text-indigo-200 border-indigo-400/40'
                      : unit.type === 'listening'
                      ? 'bg-rose-400/20 text-rose-300 border-rose-400/40'
                      : 'bg-purple-400/20 text-purple-300 border-purple-400/40'
                  }`}>
                    {unit.type === 'vocab' && <Type className="w-3 h-3 text-amber-300" />}
                    {unit.type === 'grammar' && <BookOpen className="w-3 h-3 text-indigo-300" />}
                    {unit.type === 'listening' && <Headphones className="w-3 h-3 text-rose-300" />}
                    {unit.type === 'general' && <Brain className="w-3 h-3 text-purple-300" />}
                    <span>{unit.category}</span>
                  </span>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isHighPriority
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-indigo-200'
                  }`}>
                    推薦 P{idx + 1}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-black text-sm text-white group-hover:text-amber-300 transition-colors mb-1.5 flex items-center gap-1.5">
                  <span>{unit.title}</span>
                </h3>

                {/* Reason */}
                <p className="text-xs text-indigo-200/80 leading-relaxed mb-3 line-clamp-2">
                  {unit.reason}
                </p>
              </div>

              {/* Action & Stats Footer */}
              <div className="pt-3 border-t border-indigo-800/60 mt-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 mb-2.5 font-medium">
                  <span>題目: {unit.questionCount} 題</span>
                  <span>預估時間: ~{unit.estimatedMinutes} 分鐘</span>
                </div>

                <button
                  onClick={() => {
                    if (unit.questions && unit.questions.length > 0) {
                      onStartUnitPractice(unit.questions, unit.title);
                    } else if (unit.actionTab) {
                      onNavigateTab(unit.actionTab);
                    }
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isHighPriority
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 shadow-amber-500/20 active:scale-98'
                      : 'bg-indigo-700/80 hover:bg-indigo-600 text-white active:scale-98'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isHighPriority ? 'text-slate-950 fill-slate-950' : 'text-amber-300'}`} />
                  <span>一鍵開始練習</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
