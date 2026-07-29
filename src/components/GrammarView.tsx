import React, { useState } from 'react';
import { GradeLevel, Question } from '../types';
import { GRAMMAR_LESSONS } from '../data/grammarLessons';
import { playSpeech } from '../utils/speech';
import { BookOpen, CheckCircle, Volume2, Sparkles, HelpCircle, Check, X } from 'lucide-react';

interface GrammarViewProps {
  grade: GradeLevel;
  speechSpeed: number;
  onRequestAiExplanation: (question: Question, selectedOption: number) => void;
}

export const GrammarView: React.FC<GrammarViewProps> = ({ grade, speechSpeed, onRequestAiExplanation }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const lessons = GRAMMAR_LESSONS.filter((l) => l.grade === grade || grade === 'mid');

  const handleSelectQuiz = (lessonId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [lessonId]: optionIdx }));
  };

  const handleCheckAnswer = (lessonId: string) => {
    setCheckedIds((prev) => new Set(prev).add(lessonId));
  };

  const handlePlayAudio = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          💡 國小實用觀念文法
          <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
            {grade === 'low' ? '低年級 1-2' : grade === 'mid' ? '中年級 3-4' : '高年級 5-6'}
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">簡潔易懂的觀念解說、生活例句與隨堂小測驗，打好文法底子！</p>
      </div>

      {/* Grammar Cards List */}
      <div className="space-y-6">
        {lessons.map((lesson) => {
          const quiz = lesson.quizCheck;
          const userSelected = selectedAnswers[lesson.id];
          const isChecked = checkedIds.has(lesson.id);
          const isCorrect = userSelected === quiz.answerIndex;

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{lesson.title}</h3>
                  <p className="text-xs text-slate-500">{lesson.summary}</p>
                </div>
              </div>

              {/* Key Points */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 mb-5">
                <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  觀念重點口訣：
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {lesson.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-600 mb-2">生活實用例句：</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lesson.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{ex.en}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ex.zh}</p>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(ex.en)}
                        className="text-indigo-600 hover:text-indigo-800 p-1"
                        title="聽發音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Mini Quiz */}
              <div className="pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>隨堂即時隨機小隨測：</span>
                </div>

                <p className="text-xs font-bold text-slate-900 mb-3">{quiz.question}</p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {quiz.options.map((opt, optIdx) => {
                    let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';

                    if (userSelected === optIdx) {
                      btnClass = 'bg-indigo-100 border-indigo-500 text-indigo-900 font-bold';
                    }

                    if (isChecked) {
                      if (optIdx === quiz.answerIndex) {
                        btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                      } else if (userSelected === optIdx && !isCorrect) {
                        btnClass = 'bg-rose-100 border-rose-500 text-rose-900 font-bold';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => !isChecked && handleSelectQuiz(lesson.id, optIdx)}
                        disabled={isChecked}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all ${btnClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {!isChecked ? (
                  <button
                    onClick={() => handleCheckAnswer(lesson.id)}
                    disabled={userSelected === undefined}
                    className={`text-xs font-bold px-4 py-2 rounded-xl text-white transition-all ${
                      userSelected !== undefined
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    檢查小測驗答案
                  </button>
                ) : (
                  <div className="text-xs p-3 rounded-xl bg-white border border-slate-200">
                    <p className={`font-bold mb-1 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCorrect ? '🎉 正確！太棒了！' : '❌ 答錯囉！再看一次解析吧！'}
                    </p>
                    <p className="text-slate-600">{quiz.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
