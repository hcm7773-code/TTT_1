import React, { useMemo } from 'react';
import { MistakeItem, GradeLevel, Question } from '../types';
import { Target, Sparkles, Zap, Lightbulb, ChevronRight, CheckCircle2, ShieldAlert, ArrowRight, BrainCircuit, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface BlindSpotCardProps {
  grade: GradeLevel;
  mistakes: MistakeItem[];
  onStartTargetedPractice: (questions: Question[]) => void;
  onOpenFlashcardFocus: () => void;
}

interface BlindSpotDiagnosis {
  id: string;
  topic: string;
  weaknessDetail: string;
  solution: string;
  confidenceScore: number;
  actionText: string;
  actionType: 'retest' | 'flashcard';
  sampleQuestions: Question[];
}

export const BlindSpotCard: React.FC<BlindSpotCardProps> = ({
  grade,
  mistakes = [],
  onStartTargetedPractice,
  onOpenFlashcardFocus
}) => {
  const diagnoses: BlindSpotDiagnosis[] = useMemo(() => {
    // Check mistake items
    if (mistakes.length > 0) {
      const result: BlindSpotDiagnosis[] = [];

      // Categorize mistakes
      const vocabMistakes = mistakes.filter((m) =>
        (m.question.category || '').includes('單字') || (m.question.category || '').includes('發音')
      );
      const grammarMistakes = mistakes.filter((m) =>
        (m.question.category || '').includes('文法') || (m.question.category || '').includes('時態')
      );
      const sentenceMistakes = mistakes.filter((m) =>
        (m.question.category || '').includes('對話') || (m.question.category || '').includes('句型') || (m.question.category || '').includes('聽力')
      );

      if (vocabMistakes.length > 0) {
        result.push({
          id: 'blindspot-vocab',
          topic: '單字拼寫與自然發音',
          weaknessDetail: `錯題庫中累積了 ${vocabMistakes.length} 個單字相關題目，主要集中在自然發音規則與母音拼字習慣。`,
          solution: '建議利用「快速閃示記憶卡」配合美語語音朗讀，強化字根字首聯想！',
          confidenceScore: Math.min(92, 60 + vocabMistakes.length * 8),
          actionText: '進行【單字專項閃卡練習】',
          actionType: 'flashcard',
          sampleQuestions: vocabMistakes.map((m) => m.question)
        });
      }

      if (grammarMistakes.length > 0) {
        result.push({
          id: 'blindspot-grammar',
          topic: '基礎文法與連接詞邏輯',
          weaknessDetail: `偵測到 ${grammarMistakes.length} 個文法概念出錯（如 because/so 連接詞不混用、be 動詞與動詞原形搭配）。`,
          solution: '建議針對該單元進行 AI 一對一觀念講解，並練習 3 題填空句型卡！',
          confidenceScore: Math.min(95, 65 + grammarMistakes.length * 10),
          actionText: '進行【文法盲點一鍵測驗】',
          actionType: 'retest',
          sampleQuestions: grammarMistakes.map((m) => m.question)
        });
      }

      if (sentenceMistakes.length > 0) {
        result.push({
          id: 'blindspot-sentence',
          topic: '生活對話與問答語序',
          weaknessDetail: `在生活對話與句型理解中有 ${sentenceMistakes.length} 個疑問句語序顛倒，如 What time is it? / Where are you going?`,
          solution: '建議播放句型朗讀發音，透過聽寫口語練習建立英文直覺習慣！',
          confidenceScore: Math.min(90, 55 + sentenceMistakes.length * 12),
          actionText: '進行【對話句型智慧重測】',
          actionType: 'retest',
          sampleQuestions: sentenceMistakes.map((m) => m.question)
        });
      }

      if (result.length > 0) return result.slice(0, 3);
    }

    // Default Fallback Grade-Based AI Diagnoses
    if (grade === 'low') {
      return [
        {
          id: 'blindspot-fallback-low-1',
          topic: '母音冠詞 (a vs. an) 搭配規則',
          weaknessDetail: '低年級常見盲點：忘記在母音開頭單字 (a, e, i, o, u) 前使用 an (如 an umbrella, an apple)。',
          solution: '口訣教導：「看到字母元音首，冠詞也要加個 n (an)！」',
          confidenceScore: 78,
          actionText: '練習【冠詞專項卡】',
          actionType: 'flashcard',
          sampleQuestions: []
        },
        {
          id: 'blindspot-fallback-low-2',
          topic: '問候對話反應句型 (How are you?)',
          weaknessDetail: '容易混淆 How are you? (你好嗎) 與 How old are you? (你幾歲)。',
          solution: '情境音效練習：聽到 old 找數字，只有 how 問近況！',
          confidenceScore: 82,
          actionText: '進行【生活問候一鍵測驗】',
          actionType: 'retest',
          sampleQuestions: []
        }
      ];
    } else if (grade === 'mid') {
      return [
        {
          id: 'blindspot-fallback-mid-1',
          topic: '動詞片語介系詞 (look at vs. look for)',
          weaknessDetail: '中年級常見盲點：look at 是看著目標；look for 是尋找不見的東西。',
          solution: '情境記憶：「at 盯著看黑板，for 找東西尋目標！」',
          confidenceScore: 85,
          actionText: '進行【介系詞盲點練習】',
          actionType: 'retest',
          sampleQuestions: []
        },
        {
          id: 'blindspot-fallback-mid-2',
          topic: '複合字拆解拼字 (raincoat, classroom)',
          weaknessDetail: '遇到較長單字容易產生排斥心態，未能運用拆解記憶法。',
          solution: '拆解技巧：rain (雨) + coat (外套) = raincoat (雨衣)。',
          confidenceScore: 88,
          actionText: '練習【單字閃示記憶卡】',
          actionType: 'flashcard',
          sampleQuestions: []
        }
      ];
    } else {
      return [
        {
          id: 'blindspot-fallback-high-1',
          topic: '連接詞 because 與 so 不能同時使用',
          weaknessDetail: '高年級作文與選擇題最常見錯誤：深受中文影響寫出 "Because... so..." 冗餘雙連接詞。',
          solution: '黃金鐵則：英文一字歸一字，because 與 so 一句只能選一個！',
          confidenceScore: 91,
          actionText: '進行【連接詞文法測驗】',
          actionType: 'retest',
          sampleQuestions: []
        },
        {
          id: 'blindspot-fallback-high-2',
          topic: '現在進行式時態問答 (be + V-ing)',
          weaknessDetail: '在回答 Where are you going? 時漏掉 be 動詞，寫成 "I going to..."',
          solution: '結構公式：Subject + am/is/are + V-ing。',
          confidenceScore: 86,
          actionText: '進行【時態句型特訓】',
          actionType: 'retest',
          sampleQuestions: []
        }
      ];
    }
  }, [grade, mistakes]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl border border-indigo-700/50 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      <div className="absolute left-1/2 -bottom-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
            <BrainCircuit className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            AI 智慧盲點診斷 (Blind Spot Diagnosis)
          </span>

          <span className="text-[11px] font-bold text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full">
            每週動態精準掃描
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          💡 學生學習盲點診斷與最佳解方
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </h3>
        <p className="text-xs text-indigo-200 mt-1">
          AI 演算分析歷史答題軌跡，抓出最需要突破的 2-3 個「文法與語感盲點」，提供一鍵快特訓！
        </p>
      </div>

      {/* Diagnosis List */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {diagnoses.map((diag, idx) => (
          <motion.div
            key={diag.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: 'spring' }}
            className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/15 transition-all group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-yellow-300 bg-yellow-400/20 px-2.5 py-0.5 rounded-full border border-yellow-300/30">
                  盲點 {idx + 1}：{diag.topic}
                </span>

                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-black/20 px-2 py-0.5 rounded-full">
                  盲點指標 {diag.confidenceScore}%
                </span>
              </div>

              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                {diag.weaknessDetail}
              </p>

              <div className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-400/20 text-xs text-indigo-200 flex items-start gap-1.5">
                <Lightbulb className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">AI 解方：</strong>
                  {diag.solution}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-3 mt-3 border-t border-white/10">
              <button
                onClick={() => {
                  if (diag.actionType === 'flashcard') {
                    onOpenFlashcardFocus();
                  } else {
                    if (diag.sampleQuestions.length > 0) {
                      onStartTargetedPractice(diag.sampleQuestions);
                    } else {
                      onOpenFlashcardFocus();
                    }
                  }
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-amber-400/20"
              >
                <Zap className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                <span>{diag.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
