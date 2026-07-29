import React from 'react';
import { MistakeItem, Question, GradeLevel } from '../types';
import { playSpeech } from '../utils/speech';
import { BookMarked, Trash2, RotateCcw, Volume2, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';

interface MistakesViewProps {
  mistakes: MistakeItem[];
  speechSpeed: number;
  onRemoveMistake: (id: string) => void;
  onClearAllMistakes: () => void;
  onStartRetest: (questions: Question[]) => void;
  onRequestAiExplanation: (question: Question, selectedOption: number) => void;
}

export const MistakesView: React.FC<MistakesViewProps> = ({
  mistakes,
  speechSpeed,
  onRemoveMistake,
  onClearAllMistakes,
  onStartRetest,
  onRequestAiExplanation
}) => {
  const handlePlayAudio = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  const handleRetestAll = () => {
    if (mistakes.length === 0) return;
    const questions = mistakes.map((m) => m.question);
    onStartRetest(questions);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📕 錯題診斷本
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full border border-rose-200">
              共 {mistakes.length} 題
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">自動記錄答錯的題目，進行重點重測，達到 100% 掌握！</p>
        </div>

        {mistakes.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleRetestAll}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>開始錯題重測 ({mistakes.length})</span>
            </button>

            <button
              onClick={onClearAllMistakes}
              className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 rounded-2xl transition-all"
              title="清空錯題本"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {mistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">錯題本空空如也！</h3>
          <p className="text-xs text-slate-500">太棒了！你目前沒有任何錯題，繼續保持完美成績吧！🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((item) => {
            const q = item.question;
            const userSelectedText = q.options[item.selectedOption] || '未選擇';
            const correctText = q.options[q.answerIndex];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs hover:shadow-md transition-all relative group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    {q.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {(q.audioText || q.question) && (
                      <button
                        onClick={() => handlePlayAudio(q.audioText || q.question)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> 發音
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveMistake(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                      title="移除此題目（已學會）"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-3">{q.question}</h3>

                {/* Answers breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-rose-50/70 border border-rose-200 p-2.5 rounded-xl text-rose-900 font-medium">
                    ❌ 你的選擇：<strong>{userSelectedText}</strong>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 font-medium">
                    ✅ 正確答案：<strong>{correctText}</strong>
                  </div>
                </div>

                {/* Teacher Explanation */}
                <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 leading-relaxed mb-3">
                  <strong>解析：</strong>{q.explanation}
                </div>

                {/* AI Explanation Request Button */}
                <button
                  onClick={() => onRequestAiExplanation(q, item.selectedOption)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  請 AI 小老師詳細診斷
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
