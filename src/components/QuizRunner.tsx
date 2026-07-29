import React, { useState, useEffect } from 'react';
import { Question, QuizResult, GradeLevel } from '../types';
import { playSpeech } from '../utils/speech';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, BookPlus, Trophy, Star, Lightbulb, Clock } from 'lucide-react';

interface QuizRunnerProps {
  questions: Question[];
  grade: GradeLevel;
  quizTitle?: string;
  speechSpeed: number;
  onFinishQuiz: (result: QuizResult) => void;
  onAddMistake: (question: Question, selectedOption: number) => void;
  onRequestAiExplanation: (question: Question, selectedOption: number) => void;
  onRestartQuiz: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  questions,
  grade,
  quizTitle = '國小英語綜合練習題',
  speechSpeed,
  onFinishQuiz,
  onAddMistake,
  onRequestAiExplanation,
  onRestartQuiz
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: number; isCorrect: boolean }[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [addedMistakeIds, setAddedMistakeIds] = useState<Set<string>>(new Set());

  const currentQuestion = questions[currentIndex];

  // Reset state when new questions set is loaded
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setAnswers([]);
    setIsFinished(false);
    setAddedMistakeIds(new Set());
  }, [questions]);

  // Auto speak audio text if available on new question
  useEffect(() => {
    if (currentQuestion?.audioText && !isFinished) {
      playSpeech(currentQuestion.audioText, { rate: speechSpeed });
    }
  }, [currentIndex, currentQuestion, speechSpeed, isFinished]);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-lg mx-auto my-8">
        <h3 className="text-lg font-bold text-slate-800 mb-2">尚無測驗題目</h3>
        <p className="text-sm text-slate-500 mb-6">請選擇年級或使用 AI 智慧出題產生專屬題目！</p>
        <button
          onClick={onRestartQuiz}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          重新載入測驗
        </button>
      </div>
    );
  }

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.answerIndex;
    setIsAnswerSubmitted(true);

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect
    };

    setAnswers((prev) => [...prev, newAnswer]);

    // Play feedback audio
    if (isCorrect) {
      // Gentle chime or speak option
    } else {
      // Automatically add to mistake list memory
      onAddMistake(currentQuestion, selectedOption);
      setAddedMistakeIds((prev) => new Set(prev).add(currentQuestion.id));
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz complete: answers array already contains all submitted results including the last question
      const totalCorrect = answers.filter((a) => a.isCorrect).length;
      const score = Math.round((totalCorrect / questions.length) * 100);
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

      const userAnswersList = questions.map((q) => {
        const ans = answers.find((a) => a.questionId === q.id) || {
          selectedOption: selectedOption ?? -1,
          isCorrect: selectedOption === q.answerIndex
        };
        return {
          questionId: q.id,
          question: q,
          selectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect
        };
      });

      const finalResult: QuizResult = {
        id: `result-${Date.now()}`,
        date: new Date().toLocaleDateString('zh-TW'),
        grade,
        title: quizTitle,
        totalQuestions: questions.length,
        correctCount: totalCorrect,
        score,
        timeSpentSeconds,
        userAnswers: userAnswersList
      };

      setIsFinished(true);
      onFinishQuiz(finalResult);
    }
  };

  // Sound repeat handler
  const handlePlayAudio = (text: string) => {
    playSpeech(text, { rate: speechSpeed });
  };

  // Final summary screen
  if (isFinished) {
    const totalCorrect = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((totalCorrect / questions.length) * 100);
    const stars = score >= 90 ? 3 : score >= 60 ? 2 : 1;

    return (
      <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl border border-sky-100 shadow-xl text-center animate-fade-in">
        {/* Celebration Header */}
        <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-600 mb-4 shadow-inner">
          <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">測驗完成！棒極了！ 🎉</h2>
        <p className="text-sm text-slate-500 mb-6">{quizTitle} ・ 年級：{grade === 'low' ? '1-2年級' : grade === 'mid' ? '3-4年級' : '5-6年級'}</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-10 h-10 ${
                s <= stars ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-200 fill-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-6 mb-8 flex items-center justify-around">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">得分 Score</div>
            <div className="text-4xl sm:text-5xl font-black text-sky-600">{score}<span className="text-lg">分</span></div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">答對題數</div>
            <div className="text-2xl font-black text-emerald-600">
              {totalCorrect} / {questions.length}
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">花費時間</div>
            <div className="text-2xl font-black text-indigo-600 flex items-center gap-1 justify-center">
              <Clock className="w-4 h-4" />
              {Math.round((Date.now() - startTime) / 1000)}s
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRestartQuiz}
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            再測驗一次
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.answerIndex;

  return (
    <div className="max-w-3xl mx-auto my-4 sm:my-6 p-4 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xl">
      {/* Progress Bar & Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
          <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full border border-sky-200">
            {currentQuestion.category}
          </span>
          <span className="text-slate-600 font-mono text-sm">
            題目 {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Box */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 sm:p-6 mb-6 relative">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Audio TTS Button */}
          {(currentQuestion.audioText || currentQuestion.question) && (
            <button
              onClick={() => handlePlayAudio(currentQuestion.audioText || currentQuestion.question)}
              className="flex-shrink-0 flex items-center gap-1 bg-sky-100 hover:bg-sky-200 text-sky-700 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              title="點擊聽英文朗讀"
            >
              <Volume2 className="w-4 h-4" />
              <span>聽發音</span>
            </button>
          )}
        </div>

        {/* Optional Audio prompt banner */}
        {currentQuestion.audioText && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-medium">
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>聽力內容："<strong>{currentQuestion.audioText}</strong>"</span>
          </div>
        )}
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentQuestion.options.map((option, idx) => {
          const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
          let buttonStyle = 'bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50';

          if (selectedOption === idx) {
            buttonStyle = 'bg-sky-100 border-sky-500 text-sky-900 font-bold ring-2 ring-sky-300';
          }

          if (isAnswerSubmitted) {
            if (idx === currentQuestion.answerIndex) {
              buttonStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-300';
            } else if (selectedOption === idx && !isCorrect) {
              buttonStyle = 'bg-rose-100 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-300';
            } else {
              buttonStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswerSubmitted}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${buttonStyle}`}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                selectedOption === idx ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {optionLetter}
              </span>
              <span className="text-base font-semibold flex-1">{option}</span>
              {isAnswerSubmitted && idx === currentQuestion.answerIndex && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              {isAnswerSubmitted && selectedOption === idx && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & AI Teacher Action */}
      {isAnswerSubmitted && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${
          isCorrect ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center gap-2 font-black text-base mb-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>答對了！太厲害了！🎉</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>答錯囉！沒關係，我們一起學起來！加油！💪</span>
              </>
            )}
          </div>

          {/* Teacher Explanation */}
          <p className="text-sm leading-relaxed mb-3 font-medium">
            <strong>【老師解析】</strong>：{currentQuestion.explanation}
          </p>

          {currentQuestion.tips && (
            <div className="flex items-center gap-2 bg-white/80 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 font-semibold mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>記憶小秘訣：{currentQuestion.tips}</span>
            </div>
          )}

          {/* AI Explanation & Add to Mistakes action */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
            <button
              onClick={() => onRequestAiExplanation(currentQuestion, selectedOption ?? -1)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              請 AI 老師補充詳細說明
            </button>

            {!isCorrect && (
              <span className="text-xs text-rose-600 font-bold flex items-center gap-1 bg-rose-100/70 px-2.5 py-1 rounded-xl">
                <BookPlus className="w-3.5 h-3.5" /> 已自動記錄至錯題本
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submit / Next Button */}
      <div className="flex justify-end">
        {!isAnswerSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className={`flex items-center gap-2 font-bold px-8 py-3 rounded-2xl text-white transition-all shadow-md ${
              selectedOption !== null
                ? 'bg-sky-500 hover:bg-sky-600 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            確認答案
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-md"
          >
            <span>{currentIndex < questions.length - 1 ? '下一題' : '查看測驗結果'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
