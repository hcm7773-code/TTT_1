import React, { useState, useEffect } from 'react';
import { Question, QuizResult, GradeLevel } from '../types';
import { playSpeech } from '../utils/speech';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, BookPlus, Trophy, Star, Lightbulb, Clock, Download, FileText, Printer, Loader2, BrainCircuit, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

interface QuizRunnerProps {
  questions: Question[];
  grade: GradeLevel;
  quizTitle?: string;
  speechSpeed: number;
  onFinishQuiz: (result: QuizResult) => void;
  onAddMistake: (question: Question, selectedOption: number) => void;
  onRequestAiExplanation: (question: Question, selectedOption: number) => void;
  onRestartQuiz: () => void;
  onOpenPronunciationModal?: (question?: Question, selectedOptionIndex?: number) => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  questions,
  grade,
  quizTitle = '國小英語綜合練習題',
  speechSpeed,
  onFinishQuiz,
  onAddMistake,
  onRequestAiExplanation,
  onRestartQuiz,
  onOpenPronunciationModal
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: number; isCorrect: boolean }[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [addedMistakeIds, setAddedMistakeIds] = useState<Set<string>>(new Set());
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // Dynamic Adaptive Difficulty Engine States
  const [difficultyTier, setDifficultyTier] = useState<'standard' | 'challenge' | 'focus'>('standard');
  const [consecutiveStreak, setConsecutiveStreak] = useState(0);
  const [adaptiveToast, setAdaptiveToast] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    const reportElement = document.getElementById('study-report-card');
    if (!reportElement) return;

    setIsDownloadingReport(true);
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `國小英語學習診斷報告_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error('Download report error:', err);
    } finally {
      setIsDownloadingReport(false);
    }
  };

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

    // Dynamic Adaptive Difficulty Logic
    if (isCorrect) {
      const newStreak = consecutiveStreak + 1;
      setConsecutiveStreak(newStreak);

      if (newStreak >= 2 && difficultyTier !== 'challenge') {
        setDifficultyTier('challenge');
        setAdaptiveToast('⚡ 動態難度晉升：已連續答對 2 題！進入【進階挑戰難度】(+1.5倍答題加分)！');
        setTimeout(() => setAdaptiveToast(null), 3500);
      }
    } else {
      setConsecutiveStreak(0);
      if (difficultyTier === 'challenge') {
        setDifficultyTier('standard');
        setAdaptiveToast('💡 動態調節：難度切換回【標準階段】，穩紮穩打打好基礎！');
        setTimeout(() => setAdaptiveToast(null), 3500);
      } else if (difficultyTier === 'standard') {
        setDifficultyTier('focus');
        setAdaptiveToast('💡 動態調節：已開啟【弱點觀念引導】，下方的老師解析將提供更多關鍵提示！');
        setTimeout(() => setAdaptiveToast(null), 3500);
      }
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

      const totalCorrect = userAnswersList.filter((a) => a.isCorrect).length;
      const score = Math.round((totalCorrect / questions.length) * 100);
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

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
    const wrongAnswers = answers.filter((a) => !a.isCorrect);

    const gradeLabel = grade === 'low' ? '低年級 (1-2年級)' : grade === 'mid' ? '中年級 (3-4年級)' : '高年級 (5-6年級)';
    const timeSpentSec = Math.round((Date.now() - startTime) / 1000);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="max-w-3xl mx-auto my-6 p-4 sm:p-8 bg-white rounded-3xl border border-sky-100 shadow-xl text-center"
      >
        {/* Celebration Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          className="inline-flex p-4 rounded-full bg-amber-100 text-amber-600 mb-4 shadow-inner"
        >
          <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">測驗完成！棒極了！ 🎉</h2>
        <p className="text-sm text-slate-500 mb-6">{quizTitle} ・ 年級：{gradeLabel}</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + s * 0.1, type: 'spring' }}
            >
              <Star
                className={`w-10 h-10 ${
                  s <= stars ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-200 fill-slate-100'
                }`}
              />
            </motion.div>
          ))}
        </div>

        {/* Action Bar Above Report */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownloadReport}
            disabled={isDownloadingReport}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 px-6 rounded-2xl shadow-md transition-all"
          >
            {isDownloadingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>報告圖片產生中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>下載學習診斷報告 (PNG圖片)</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestartQuiz}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再測驗一次</span>
          </motion.button>
        </div>

        {/* Exportable Printable Study Report Card */}
        <div
          id="study-report-card"
          className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-xs text-slate-800 space-y-6"
        >
          {/* Report Card Banner */}
          <div className="border-b-2 border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs tracking-wider uppercase mb-1">
                <BrainCircuit className="w-4 h-4" />
                <span>國小線上英語學習平台 ・ 診斷報告</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{quizTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">
                學生程度：{gradeLabel} ｜ 產生時間：{new Date().toLocaleString('zh-TW')}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center flex-shrink-0">
              <div className="text-[11px] font-bold text-indigo-600">本次得分</div>
              <div className="text-3xl font-black text-indigo-700">{score} <span className="text-sm">分</span></div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="text-xs text-slate-500 font-bold">總題數</div>
              <div className="text-lg font-black text-slate-800">{questions.length} 題</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
              <div className="text-xs text-emerald-700 font-bold">答對題數</div>
              <div className="text-lg font-black text-emerald-700">{totalCorrect} 題</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
              <div className="text-xs text-amber-800 font-bold">答題時間</div>
              <div className="text-lg font-black text-amber-800">{timeSpentSec} 秒</div>
            </div>
          </div>

          {/* AI Diagnostic Advice */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-purple-900 font-black text-sm mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI 老師學習診斷與建議：</span>
            </div>
            <p className="text-xs sm:text-sm text-purple-950 leading-relaxed">
              {score >= 90 ? (
                <span>🌟 <strong>表現極其優異！</strong> 學生對於這個主題的單字與句型理解非常紮實，完全掌握了核心觀念。建議可以嘗試【高一年級】試題或挑戰【AI 進階句型測驗】！</span>
              ) : score >= 60 ? (
                <span>👍 <strong>基礎概念良好的發揮！</strong> 大部分題目都能正確解答，僅有少數文法變化或介系詞細節需加強。請參考下方錯題建議，把不熟的單字加到單字卡複習！</span>
              ) : (
                <span>💪 <strong>繼續加油，熟能生巧！</strong> 建議先點選【單字卡】熟悉情境單字，再搭配【AI Tutor 口語發音與文法小老師】進行一對一複習，觀念會更清晰喔！</span>
              )}
            </p>
          </div>

          {/* Detailed Mistakes Analysis */}
          <div>
            <h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              錯題與觀念重點解析 ({wrongAnswers.length} 題)
            </h4>

            {wrongAnswers.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center text-xs text-emerald-800 font-bold">
                🎉 太棒了！本次測驗全對，完全沒有錯題！繼續保持！
              </div>
            ) : (
              <div className="space-y-3">
                {wrongAnswers.map((ans, idx) => {
                  const q = questions.find((item) => item.id === ans.questionId);
                  if (!q) return null;

                  return (
                    <div key={ans.questionId} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-800">
                          {idx + 1}. {q.question}
                        </span>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {q.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-100">
                          ❌ 你的選擇：{q.options[ans.selectedOption]}
                        </div>
                        <div className="text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                          ✅ 正確答案：{q.options[q.answerIndex]}
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed text-[11px]">
                          💡 <strong>解析：</strong>{q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer stamp */}
          <div className="text-center border-t border-slate-200 pt-4 text-[11px] text-slate-400">
            國小線上英語練習與AI智慧診斷系統 ・ 家長學習追蹤聯絡單
          </div>
        </div>
      </motion.div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.answerIndex;

  return (
    <div className="max-w-3xl mx-auto my-4 sm:my-6 p-4 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xl relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {adaptiveToast && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 whitespace-nowrap border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>{adaptiveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar & Adaptive Difficulty Header */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-500 mb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full border border-sky-200">
              {currentQuestion.category}
            </span>

            {/* Live Dynamic Difficulty Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 transition-all ${
                difficultyTier === 'challenge'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  : difficultyTier === 'focus'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <BrainCircuit className="w-3 h-3 text-indigo-600" />
              <span>
                {difficultyTier === 'challenge'
                  ? '🎯 AI 動態難度：進階挑戰 (+1.5x倍數)'
                  : difficultyTier === 'focus'
                  ? '💡 AI 動態難度：觀念弱點引導'
                  : '標準難度'}
              </span>
            </span>
          </div>

          <span className="text-slate-600 font-mono text-sm">
            題目 {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id || currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {/* Question Box */}
          <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 relative">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Audio TTS Button */}
              {(currentQuestion.audioText || currentQuestion.question) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayAudio(currentQuestion.audioText || currentQuestion.question)}
                  className="flex-shrink-0 flex items-center gap-1 bg-sky-100 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="點擊聽英文朗讀"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>聽發音</span>
                </motion.button>
              )}
            </div>

            {/* Optional Audio prompt banner */}
            {currentQuestion.audioText && (
              <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium">
                <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>聽力內容："<strong>{currentQuestion.audioText}</strong>"</span>
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              let buttonStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-slate-800';

              if (selectedOption === idx) {
                buttonStyle = 'bg-sky-100 dark:bg-sky-950/80 border-sky-500 text-sky-900 dark:text-sky-200 font-bold ring-2 ring-sky-300 dark:ring-sky-800';
              }

              if (isAnswerSubmitted) {
                if (idx === currentQuestion.answerIndex) {
                  buttonStyle = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-300 dark:ring-emerald-800';
                } else if (selectedOption === idx && !isCorrect) {
                  buttonStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-300 dark:ring-rose-800';
                } else {
                  buttonStyle = 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={!isAnswerSubmitted ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isAnswerSubmitted ? { scale: 0.97 } : {}}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${buttonStyle}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedOption === idx ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {optionLetter}
                  </span>
                  <span className="text-base font-semibold flex-1">{option}</span>
                  {isAnswerSubmitted && idx === currentQuestion.answerIndex && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    </motion.div>
                  )}
                  {isAnswerSubmitted && selectedOption === idx && !isCorrect && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer Explanation & AI Teacher Action */}
      <AnimatePresence>
        {isAnswerSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`p-5 rounded-2xl border mb-6 transition-all ${
              isCorrect
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-base mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>答對了！太厲害了！🎉</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>答錯囉！沒關係，我們一起學起來！加油！💪</span>
                </>
              )}
            </div>

            {/* Teacher Explanation */}
            <p className="text-sm leading-relaxed mb-3 font-medium">
              <strong>【老師解析】</strong>：{currentQuestion.explanation}
            </p>

            {currentQuestion.tips && (
              <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/80 p-2.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-semibold mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>記憶小秘訣：{currentQuestion.tips}</span>
              </div>
            )}

            {/* AI Explanation & Add to Mistakes action */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onRequestAiExplanation(currentQuestion, selectedOption ?? -1)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>請 AI 老師補充詳細說明</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenPronunciationModal?.(currentQuestion, selectedOption ?? -1)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-yellow-300" />
                <span>🎧 AI 發音問題分析</span>
              </motion.button>

              {!isCorrect && (
                <span className="text-xs text-rose-600 font-bold flex items-center gap-1 bg-rose-100/70 px-2.5 py-1 rounded-xl">
                  <BookPlus className="w-3.5 h-3.5" /> 已自動記錄至錯題本
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit / Next Button */}
      <div className="flex justify-end">
        {!isAnswerSubmitted ? (
          <motion.button
            whileHover={selectedOption !== null ? { scale: 1.03 } : {}}
            whileTap={selectedOption !== null ? { scale: 0.97 } : {}}
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className={`flex items-center gap-2 font-bold px-8 py-3 rounded-2xl text-white transition-all shadow-md ${
              selectedOption !== null
                ? 'bg-sky-500 hover:bg-sky-600'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            確認答案
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNextQuestion}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-md"
          >
            <span>{currentIndex < questions.length - 1 ? '下一題' : '查看測驗結果'}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
};
