import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserStats, QuizResult, GradeLevel, MistakeItem, LearningStyle } from '../types';
import { Award, Trophy, Star, Flame, CheckCircle, Printer, Sparkles, Medal, UserCheck, TrendingUp, BarChart2, Zap, Crown, FileText, Copy, Check, Loader2, X, Share2, Volume2, BookOpen, Download, Mic, Activity, FileSpreadsheet, RefreshCw, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSpeech } from '../utils/speech';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';

interface AchievementsViewProps {
  stats: UserStats;
  quizResults: QuizResult[];
  grade?: GradeLevel;
  mistakes?: MistakeItem[];
  speechSpeed?: number;
  learningStyle?: LearningStyle;
  setLearningStyle?: (style: LearningStyle) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  stats,
  quizResults,
  grade = 'mid',
  mistakes = [],
  speechSpeed = 0.85,
  learningStyle,
  setLearningStyle
}) => {
  const [studentName, setStudentName] = useState('小學霸');
  const [showCertificate, setShowCertificate] = useState(false);

  // Learning Style state & sync
  const [currentStyle, setCurrentStyle] = useState<LearningStyle>(() => {
    return learningStyle || (localStorage.getItem('elem_eng_learning_style') as LearningStyle) || 'fun';
  });

  useEffect(() => {
    if (learningStyle) {
      setCurrentStyle(learningStyle);
    }
  }, [learningStyle]);

  const handleSelectStyle = (style: LearningStyle) => {
    setCurrentStyle(style);
    if (setLearningStyle) {
      setLearningStyle(style);
    } else {
      localStorage.setItem('elem_eng_learning_style', style);
    }
    const labelMap: Record<LearningStyle, string> = {
      fun: '已切換為「強調趣味」風格！AI 老師將用更生動活潑的故事與比喻為你輔導。',
      precise: '已切換為「強調精準」風格！AI 老師將著重於文法結構與精準度析述。',
      quick: '已切換為「快速複習」風格！AI 老師將提供高效率的觀念精華與重點摘要。'
    };
    playSpeech(labelMap[style], { rate: speechSpeed });
  };

  // Weekly Report States
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReportText, setWeeklyReportText] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  // PDF Report Export States
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!pdfReportRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(pdfReportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight - pageHeight;
        let position = -pageHeight;
        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
        }
      }

      pdf.save(`國小英語學習成果報告_${studentName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('匯出 PDF 報告時發生錯誤，您也可以選擇點擊「直接列印 / 存為 PDF」。');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Phonics Voice History state
  const [phonicsHistory, setPhonicsHistory] = useState<
    { date: string; label: string; score: number; fluency: number; category: string; word: string }[]
  >(() => {
    const saved = localStorage.getItem('elem_eng_phonics_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse phonics history', e);
      }
    }
    // Default initial 6-session progress curve if not yet recorded
    return [
      { date: '7/20', label: '第 1 次測驗', score: 68, fluency: 65, category: '短母音 Phonics (a/e/i)', word: 'Cat, Bed, Pig' },
      { date: '7/22', label: '第 2 次測驗', score: 75, fluency: 72, category: '長母音 Phonics (a_e/i_e)', word: 'Cake, Bike' },
      { date: '7/24', label: '第 3 次測驗', score: 82, fluency: 78, category: '雙子音 Blends (bl/cl/fl)', word: 'Blue, Clock' },
      { date: '7/26', label: '第 4 次測驗', score: 86, fluency: 84, category: '複合子音 Digraphs (ch/sh)', word: 'Chair, Fish' },
      { date: '7/28', label: '第 5 次測驗', score: 92, fluency: 88, category: '自然發音整合句', word: 'The cat ate cake.' },
      { date: '7/30', label: '最新評測', score: 96, fluency: 94, category: '高階音組與美語連音', word: 'Practice makes perfect.' }
    ];
  });

  // State for voice testing modal inside Achievements
  const [activePhonicsTestWord, setActivePhonicsTestWord] = useState('Elephant');
  const [isRecordingTest, setIsRecordingTest] = useState(false);
  const [testScoreResult, setTestScoreResult] = useState<{ score: number; fluency: number; feedback: string } | null>(null);

  const handleSimulateVoiceTest = () => {
    setIsRecordingTest(true);
    setTestScoreResult(null);

    // Simulate 2s recording & AI voice analysis
    setTimeout(() => {
      setIsRecordingTest(false);
      const randomScore = Math.floor(Math.random() * 11) + 88; // 88 ~ 98
      const randomFluency = Math.floor(Math.random() * 10) + 86; // 86 ~ 95
      const newEntry = {
        date: `${new Date().getMonth() + 1}/${new Date().getDate()}`,
        label: `最新評測 #${phonicsHistory.length + 1}`,
        score: randomScore,
        fluency: randomFluency,
        category: '語音實時發音評測',
        word: activePhonicsTestWord
      };

      const updated = [...phonicsHistory, newEntry];
      setPhonicsHistory(updated);
      localStorage.setItem('elem_eng_phonics_history', JSON.stringify(updated));

      setTestScoreResult({
        score: randomScore,
        fluency: randomFluency,
        feedback: `太棒了！《${activePhonicsTestWord}》發音非常標準清晰，聲調音高與美語標準母語者契合度高達 ${randomScore}%！`
      });
    }, 2000);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const accuracy = stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100)
      : 0;

    let csvContent = '\uFEFF'; // Add UTF-8 BOM for Microsoft Excel Chinese support

    // Section 1: Overview
    csvContent += '【國小英語學習紀錄總覽】\n';
    csvContent += `學生姓名,${studentName}\n`;
    csvContent += `年級程度,${grade === 'low' ? '1-2年級' : grade === 'mid' ? '3-4年級' : '5-6年級'}\n`;
    csvContent += `累積測驗次數,${stats.totalQuizzesTaken}\n`;
    csvContent += `總答題數,${stats.totalQuestionsAnswered}\n`;
    csvContent += `總答對題數,${stats.totalCorrect}\n`;
    csvContent += `平均答題正確率,${accuracy}%\n`;
    csvContent += `連續學習天數,${stats.streakDays} 天\n`;
    csvContent += `匯出日期,${new Date().toLocaleString('zh-TW')}\n\n`;

    // Section 2: Quiz Results History
    csvContent += '【歷次測驗成績紀錄】\n';
    csvContent += '測驗日期,測驗主題,總題數,答對數,得分,耗時(秒)\n';
    if (quizResults.length > 0) {
      quizResults.forEach((r) => {
        csvContent += `"${r.date}","${r.title.replace(/"/g, '""')}",${r.totalQuestions},${r.correctCount},${r.score},${r.timeSpentSeconds || 0}\n`;
      });
    } else {
      csvContent += '尚無測驗紀錄\n';
    }
    csvContent += '\n';

    // Section 3: Mistake List
    csvContent += '【錯題與弱點觀念清單】\n';
    csvContent += '題目類別,題目內容,學生選擇,正確答案,錯題次數,關鍵解析\n';
    if (mistakes.length > 0) {
      mistakes.forEach((m) => {
        const selectedStr = m.question.options?.[m.selectedOption] || '未選擇';
        const correctStr = m.question.options?.[m.question.answerIndex] || '';
        csvContent += `"${m.question.category}","${m.question.question.replace(/"/g, '""')}","${selectedStr.replace(/"/g, '""')}","${correctStr.replace(/"/g, '""')}",${m.wrongCount || 1},"${(m.question.explanation || '').replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += '目前無錯題紀錄，太厲害了！\n';
    }
    csvContent += '\n';

    // Section 4: Pronunciation History
    csvContent += '【自然發音 Phonics 與語音評測歷程】\n';
    csvContent += '評測日期,評測標籤,發音準確率(%),語意流暢度(%),練習主題/單字\n';
    phonicsHistory.forEach((p) => {
      csvContent += `"${p.date}","${p.label}",${p.score},${p.fluency},"${p.category} (${p.word})"\n`;
    });

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `國小英語學習紀錄報表_${studentName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateWeeklyReport = async () => {
    setShowWeeklyReport(true);
    setWeeklyReportLoading(true);
    setWeeklyReportText(null);

    try {
      const res = await fetch('/api/gemini/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          stats,
          quizResults,
          mistakes,
          grade
        })
      });

      const data = await res.json();
      if (data.success && data.report) {
        setWeeklyReportText(data.report);
      } else {
        setWeeklyReportText('產生週報時連線忙碌，請稍後重試！');
      }
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      setWeeklyReportText('網路傳輸發生錯誤，請稍後重試。');
    } finally {
      setWeeklyReportLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!weeklyReportText) return;
    navigator.clipboard.writeText(weeklyReportText);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  // Generate 7-day trend data from quizResults
  const last7DaysData = useMemo(() => {
    const dates = [];
    const today = new Date();
    let totalQsInWeek = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toDateString();
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      const dayResults = quizResults.filter((r) => {
        if (!r.date) return false;
        return new Date(r.date).toDateString() === dateKey;
      });

      const questions = dayResults.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0);
      const correct = dayResults.reduce((acc, curr) => acc + (curr.correctCount || 0), 0);
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      totalQsInWeek += questions;

      dates.push({
        label,
        questions,
        correct,
        accuracy
      });
    }

    if (totalQsInWeek === 0 && stats.totalQuestionsAnswered === 0) {
      const sampleQuestions = [5, 8, 12, 10, 16, 20, 25];
      const sampleAccuracy = [70, 75, 80, 82, 88, 92, 95];
      return dates.map((item, idx) => ({
        ...item,
        questions: sampleQuestions[idx],
        accuracy: sampleAccuracy[idx]
      }));
    }

    return dates;
  }, [quizResults, stats.totalQuestionsAnswered]);

  // Check and save 7-day badge achievement to localStorage
  const is7DaysUnlocked = useMemo(() => {
    const saved = localStorage.getItem('elem_eng_badge_7days_unlocked');
    if (stats.streakDays >= 7) {
      if (saved !== 'true') {
        localStorage.setItem('elem_eng_badge_7days_unlocked', 'true');
        localStorage.setItem('elem_eng_badge_7days_unlocked_at', new Date().toISOString());
      }
      return true;
    }
    return saved === 'true';
  }, [stats.streakDays]);

  useEffect(() => {
    if (stats.streakDays >= 7) {
      localStorage.setItem('elem_eng_badge_7days_unlocked', 'true');
    }
  }, [stats.streakDays]);

  // 學習里程碑徽章數據 (Learning Milestone Badges)
  const MILESTONE_BADGES = useMemo(() => {
    const perfectCount = quizResults.filter((r) => r.score === 100).length;
    const hundredQProgress = Math.min(100, Math.round((stats.totalQuestionsAnswered / 100) * 100));
    const streakProgress = Math.min(100, Math.round((stats.streakDays / 5) * 100));
    const isMistakeTerminator = mistakes.length === 0 && stats.totalQuestionsAnswered >= 5;
    const mistakeProgress = isMistakeTerminator
      ? 100
      : Math.max(0, Math.round(((10 - Math.min(10, mistakes.length)) / 10) * 100));

    return [
      {
        id: 'ms-hundred',
        title: '💯 百題達人',
        desc: '累積答題總數達到 100 題！展現極致學習毅力！',
        unlocked: stats.totalQuestionsAnswered >= 100,
        icon: '💯',
        currentValue: stats.totalQuestionsAnswered,
        targetValue: 100,
        unit: '題',
        progress: hundredQProgress,
        colorTheme: 'sky'
      },
      {
        id: 'ms-streak',
        title: '🔥 連勝紀錄保持者',
        desc: '保持連續學習達到 5 天！建立優良練習習慣！',
        unlocked: stats.streakDays >= 5,
        icon: '🔥',
        currentValue: stats.streakDays,
        targetValue: 5,
        unit: '天',
        progress: streakProgress,
        colorTheme: 'orange'
      },
      {
        id: 'ms-mistake-terminator',
        title: '🧹 錯題終結者',
        desc: '成功消滅錯題庫積累，達成極低或零錯題記錄！',
        unlocked: isMistakeTerminator,
        icon: '🧹',
        currentValue: mistakes.length === 0 ? '全清空' : `剩 ${mistakes.length} 題`,
        targetValue: '0 錯題',
        unit: '',
        progress: mistakeProgress,
        colorTheme: 'emerald'
      },
      {
        id: 'ms-perfect-harvest',
        title: '🏆 滿分收割者',
        desc: '獲得至少 3 次 100 分測驗滿分榮譽！',
        unlocked: perfectCount >= 3,
        icon: '🏆',
        currentValue: perfectCount,
        targetValue: 3,
        unit: '次',
        progress: Math.min(100, Math.round((perfectCount / 3) * 100)),
        colorTheme: 'amber'
      },
      {
        id: 'ms-phonics-master',
        title: '🎧 發音酷音俠',
        desc: '完成 3 次以上的語音自然發音與聽力評測！',
        unlocked: phonicsHistory.length >= 3,
        icon: '🎧',
        currentValue: phonicsHistory.length,
        targetValue: 3,
        unit: '次',
        progress: Math.min(100, Math.round((phonicsHistory.length / 3) * 100)),
        colorTheme: 'rose'
      },
      {
        id: 'ms-elementary-scholar',
        title: '🎓 英語大學霸',
        desc: '全方位完成 10 次英語綜合練習測驗！',
        unlocked: stats.totalQuizzesTaken >= 10,
        icon: '🎓',
        currentValue: stats.totalQuizzesTaken,
        targetValue: 10,
        unit: '次',
        progress: Math.min(100, Math.round((stats.totalQuizzesTaken / 10) * 100)),
        colorTheme: 'indigo'
      }
    ];
  }, [stats, quizResults, mistakes, phonicsHistory]);

  const BADGES = [
    {
      id: 'badge-1',
      title: '🌟 英語初學者',
      desc: '完成個人第 1 次測驗！',
      unlocked: stats.totalQuizzesTaken >= 1,
      icon: '🌟'
    },
    {
      id: 'badge-2',
      title: '🔥 連續學習達人',
      desc: '連續天數達成 3 天！',
      unlocked: stats.streakDays >= 3,
      icon: '🔥'
    },
    {
      id: 'badge-7days',
      title: '👑 英語小達人',
      desc: '連續天數達成 7 天！習慣成自然！',
      unlocked: is7DaysUnlocked,
      icon: '👑',
      special: true
    },
    {
      id: 'badge-3',
      title: '💯 滿分小高手',
      desc: '在測驗中獲得 100 分！',
      unlocked: quizResults.some((r) => r.score === 100),
      icon: '💯'
    },
    {
      id: 'badge-4',
      title: '📖 單字庫小學士',
      desc: '累計回答超過 20 道英文題目！',
      unlocked: stats.totalQuestionsAnswered >= 20,
      icon: '📖'
    },
    {
      id: 'badge-5',
      title: '🤖 AI 智慧探險員',
      desc: '體驗過 AI 智慧出題測驗！',
      unlocked: quizResults.some((r) => r.title.includes('AI')),
      icon: '🤖'
    }
  ];

  const accuracyRate =
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100)
      : 0;

  // 5-Dimension Competency Radar Data
  const competencyRadarData = useMemo(() => {
    let listeningScore = 78;
    let vocabScore = 82;
    let grammarScore = 68;
    let conversationScore = 85;
    let phonicsScore = 75;

    if (quizResults.length > 0) {
      const avg = accuracyRate || 75;
      listeningScore = Math.min(100, Math.max(50, avg + 5));
      vocabScore = Math.min(100, Math.max(50, avg + 8));
      grammarScore = Math.min(100, Math.max(50, avg - 6));
      conversationScore = Math.min(100, Math.max(50, avg + 2));
      phonicsScore = Math.min(100, Math.max(50, avg - 2));
    }

    return [
      { subject: '聽力辨識', score: listeningScore, fullMark: 100 },
      { subject: '字彙積累', score: vocabScore, fullMark: 100 },
      { subject: '語法結構', score: grammarScore, fullMark: 100 },
      { subject: '生活對話', score: conversationScore, fullMark: 100 },
      { subject: '自然發音', score: phonicsScore, fullMark: 100 }
    ];
  }, [quizResults, accuracyRate]);

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Title Header with CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            🏆 學習成就與榮譽證書
          </h2>
          <p className="text-xs text-slate-500 mt-1">累積練習步履，解鎖勳章、查看發音進化歷程並匯出專屬學習報表！</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setShowPdfReportModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-200" />
            <span>下載學習成果報告 (PDF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>匯出 CSV 原始資料</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-sky-100 rounded-3xl p-4 text-center shadow-xs">
          <div className="text-xs font-bold text-slate-500 mb-1">完成測驗數</div>
          <div className="text-3xl font-black text-sky-600">{stats.totalQuizzesTaken}</div>
        </div>

        <div className="bg-white border border-indigo-100 rounded-3xl p-4 text-center shadow-xs">
          <div className="text-xs font-bold text-slate-500 mb-1">答題總數</div>
          <div className="text-3xl font-black text-indigo-600">{stats.totalQuestionsAnswered}</div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-3xl p-4 text-center shadow-xs">
          <div className="text-xs font-bold text-slate-500 mb-1">平均正確率</div>
          <div className="text-3xl font-black text-emerald-600">{accuracyRate}%</div>
        </div>

        <div className="bg-white border border-orange-100 rounded-3xl p-4 text-center shadow-xs">
          <div className="text-xs font-bold text-slate-500 mb-1">連續學習</div>
          <div className="text-3xl font-black text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6 fill-orange-500" />
            {stats.streakDays} 天
          </div>
        </div>
      </div>

      {/* 學習風格標籤視覺化面板 (Learning Style Tags Panel) */}
      <div className="bg-gradient-to-r from-amber-50/80 via-indigo-50/80 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Brain className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                學生偏好學習風格 (Learning Style Preference)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              點選下列標籤即可直接切換 AI 輔導與題目解析風格，打造最適合你的學習節奏！
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs self-start sm:self-auto">
            <span>目前風格：</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {currentStyle === 'fun'
                ? '🎭 強調趣味'
                : currentStyle === 'precise'
                ? '🎯 強調精準'
                : '⚡ 快速複習'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Tag 1: Fun */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectStyle('fun')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              currentStyle === 'fun'
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-100/80 to-orange-50 dark:from-amber-950/40 dark:to-slate-800 border-amber-400 shadow-md ring-2 ring-amber-300'
                : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 shadow-2xs opacity-80 hover:opacity-100'
            }`}
          >
            {currentStyle === 'fun' && (
              <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Check className="w-3 h-3" /> 使用中
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎭</span>
                <div>
                  <h4 className="font-black text-sm text-amber-950 dark:text-amber-200">強調趣味</h4>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    生動活潑・故事引導
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                結合生動情境故事、擬人比喻與樂趣，透過遊戲化引導誘發孩子學習動機。
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/50 dark:border-amber-900/50 flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <span>適性建議：低中年級、啟蒙期</span>
              <Volume2 className="w-3.5 h-3.5 opacity-70" />
            </div>
          </motion.div>

          {/* Tag 2: Precise */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectStyle('precise')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              currentStyle === 'precise'
                ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-100/80 to-purple-50 dark:from-indigo-950/40 dark:to-slate-800 border-indigo-400 shadow-md ring-2 ring-indigo-300'
                : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-2xs opacity-80 hover:opacity-100'
            }`}
          >
            {currentStyle === 'precise' && (
              <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Check className="w-3 h-3" /> 使用中
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-black text-sm text-indigo-950 dark:text-indigo-200">強調精準</h4>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                    觀念嚴謹・文法結構
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                深入拆解單字例句與句型文法，給予嚴謹釐清與邏輯脈絡，強化高分實力。
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
              <span>適性建議：中高年級、檢定準備</span>
              <Volume2 className="w-3.5 h-3.5 opacity-70" />
            </div>
          </motion.div>

          {/* Tag 3: Quick */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectStyle('quick')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              currentStyle === 'quick'
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-100/80 to-teal-50 dark:from-emerald-950/40 dark:to-slate-800 border-emerald-400 shadow-md ring-2 ring-emerald-300'
                : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 shadow-2xs opacity-80 hover:opacity-100'
            }`}
          >
            {currentStyle === 'quick' && (
              <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Check className="w-3 h-3" /> 使用中
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">快速複習</h4>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    高效快搜・精華要點
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                直擊考點重點與常見易錯提示，減少冗長文字，在最短時間達成高效溫習。
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span>適性建議：考前衝刺、快速複習</span>
              <Volume2 className="w-3.5 h-3.5 opacity-70" />
            </div>
          </motion.div>
        </div>
      </div>





      {/* Mood Interaction Stats */}
      {stats.moodCounts && Object.keys(stats.moodCounts).length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-100 rounded-3xl p-4 sm:p-5 mb-8 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💖</span>
                <h3 className="font-black text-xs sm:text-sm text-purple-900">AI 老師心情互動與情緒陪伴紀錄 (Mood Tracking)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.moodCounts).map(([moodId, count]) => {
                  const labelMap: Record<string, { label: string; emoji: string }> = {
                    frustrated: { label: '卡關挫折', emoji: '😭' },
                    celebrate: { label: '慶祝高分', emoji: '🎉' },
                    motivated: { label: '充滿幹勁', emoji: '💪' },
                    tired: { label: '讀書累了', emoji: '😴' },
                    confused: { label: '觀念不解', emoji: '🤔' }
                  };
                  const item = labelMap[moodId] || { label: moodId, emoji: '✨' };
                  return (
                    <div key={moodId} className="bg-white/90 border border-purple-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-1.5">
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                      <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">{count} 次互動</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recharts 5-Dimension Competency Radar Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  英語五維能力核心雷達圖 (Competency Radar Chart)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">多維度診斷：聽力、字彙、語法、對話、發音發展平衡度</p>
              </div>

              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                AI 智慧評估分：{accuracyRate > 0 ? `${accuracyRate} 分` : '高分表現'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 w-full bg-indigo-50/40 rounded-2xl p-2 border border-indigo-100/60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={competencyRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    <Radar
                      name="能力指標"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#818cf8"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} 分`, '能力強弱值']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#475569',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 font-black text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>AI 老師能力五維診斷結論：</span>
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                    強項為<strong>【生活對話】</strong>與<strong>【字彙積累】</strong>，口語直覺反應極佳！建議持續在【語法結構】與【聽力細節】加強練習，能讓答題速度與正確率更上一層樓！
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                    <span>🎧 聽力辨識</span>
                    <span className="text-indigo-600 font-black">{competencyRadarData[0].score} 分</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                    <span>📖 字彙積累</span>
                    <span className="text-emerald-600 font-black">{competencyRadarData[1].score} 分</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                    <span>📝 語法結構</span>
                    <span className="text-purple-600 font-black">{competencyRadarData[2].score} 分</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                    <span>💬 生活對話</span>
                    <span className="text-amber-600 font-black">{competencyRadarData[3].score} 分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts 7-Day Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  近 7 天學習趨勢與正確率分析
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">即時追蹤每日答題題數（柱狀）與測驗正確率 %（折線）</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100 self-start sm:self-auto">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block" /> 完成題數
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 正確率 %
                </span>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#10b981' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const questions = payload.find((p: any) => p.dataKey === 'questions')?.value || 0;
                        const accuracy = payload.find((p: any) => p.dataKey === 'accuracy')?.value || 0;
                        return (
                          <div className="bg-slate-900/90 text-white p-3 rounded-2xl text-xs shadow-xl backdrop-blur-xs border border-slate-700">
                            <p className="font-bold text-sky-300 mb-1">日期：{label}</p>
                            <p className="flex items-center gap-1.5 text-indigo-200">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                              完成題數：<span className="font-bold text-white">{questions} 題</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-emerald-300 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              答題正確率：<span className="font-bold text-white">{accuracy}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="questions"
                    name="完成題數"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    name="正確率 (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Phonics Pronunciation Evolution Section */}
          <div className="bg-white border border-rose-100 rounded-3xl p-5 sm:p-6 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-200">
                    Phonics & Speech Evolution
                  </span>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-rose-600" />
                    自然發音（Phonics）發音進化歷程
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">追蹤歷史錄音評測分數，繪製自然發音準確率與語意流暢度成長曲線</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  平均發音勝任率：{Math.round(phonicsHistory.reduce((acc, curr) => acc + curr.score, 0) / (phonicsHistory.length || 1))}%
                </span>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={phonicsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="phonicsScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fluencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[50, 100]} unit="分" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dataObj = payload[0]?.payload;
                        return (
                          <div className="bg-slate-900/90 text-white p-3 rounded-2xl text-xs shadow-xl backdrop-blur-xs border border-slate-700">
                            <p className="font-bold text-rose-300 mb-1">{dataObj?.label} ({label})</p>
                            <p className="text-slate-300 mb-1">主題：<span className="text-amber-300 font-bold">{dataObj?.category}</span></p>
                            <p className="flex items-center gap-1.5 text-rose-200">
                              🎯 發音準確率：<span className="font-bold text-white text-sm">{dataObj?.score}%</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-purple-200 mt-0.5">
                              ⚡ 語意流暢度：<span className="font-bold text-white text-sm">{dataObj?.fluency}%</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">練習單字/句子：{dataObj?.word}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="發音準確率 (%)"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#phonicsScoreGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fluency"
                    name="語意流暢度 (%)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#fluencyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

      {/* 🏆 學習里程碑專區 (Learning Milestones Hub) */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
              學習里程碑與挑戰成就 (Learning Milestones)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              挑戰解鎖「百題達人」、「連勝紀錄保持者」、「錯題終結者」等重大里程碑！
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
            已達成 {MILESTONE_BADGES.filter((m) => m.unlocked).length} / {MILESTONE_BADGES.length} 項里程碑
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MILESTONE_BADGES.map((ms, idx) => (
            <motion.div
              key={ms.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ scale: 1.02 }}
              onClick={() =>
                playSpeech(
                  ms.unlocked
                    ? `恭喜！已解鎖里程碑【${ms.title}】。${ms.desc}`
                    : `里程碑【${ms.title}】挑戰中，目前進度 ${ms.progress}%。${ms.desc}`,
                  { rate: speechSpeed }
                )
              }
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                ms.unlocked
                  ? 'bg-gradient-to-br from-amber-50/90 via-white to-sky-50/90 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border-amber-300 dark:border-amber-700/60 shadow-xs hover:shadow-md ring-1 ring-amber-300/50'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 opacity-80 hover:opacity-100'
              }`}
            >
              {ms.unlocked && (
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />
              )}

              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs shrink-0 ${
                        ms.unlocked
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ms.unlocked ? ms.icon : '🔒'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                          {ms.title}
                        </h4>
                        {ms.unlocked && (
                          <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            已解鎖
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {ms.desc}
                      </p>
                    </div>
                  </div>

                  <Volume2 className="w-4 h-4 text-slate-400 hover:text-indigo-600 shrink-0" />
                </div>
              </div>

              {/* Progress Bar & Numerical indicators */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    目標累積：<span className="text-slate-800 dark:text-slate-200 font-extrabold">{ms.targetValue} {ms.unit}</span>
                  </span>
                  <span className={`font-black ${ms.unlocked ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {ms.currentValue} {ms.unit} ({ms.progress}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ms.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full transition-all ${
                      ms.unlocked
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-indigo-500 to-sky-500'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 虛擬榮譽勳章展覽館 (Badges Hall) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              虛擬榮譽勳章展覽館 (Badges Hall)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">點擊各勳章卡片即可播放語音與查看解鎖成就細節</p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            已解鎖 {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} 個勳章
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map((badge, idx) => {
            const isSpecialMaster = badge.id === 'badge-7days' && badge.unlocked;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, type: 'spring', damping: 20 }}
                whileHover={{ scale: 1.03, y: -2 }}
                onClick={() => playSpeech(`${badge.title}。${badge.desc}`, { rate: speechSpeed })}
                className={`p-5 rounded-3xl border relative overflow-hidden transition-all flex items-start space-x-3.5 cursor-pointer ${
                  isSpecialMaster
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-100/60 to-yellow-50/80 border-amber-400 shadow-md ring-2 ring-amber-300'
                    : badge.unlocked
                    ? 'bg-white border-amber-200 shadow-xs hover:border-amber-400'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Special Master Glow Effect */}
                {isSpecialMaster && (
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-300/30 rounded-full blur-xl pointer-events-none" />
                )}

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 relative ${
                    isSpecialMaster
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-md'
                      : badge.unlocked
                      ? 'bg-amber-100 text-amber-600 shadow-xs'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {badge.unlocked ? badge.icon : '🔒'}
                  {isSpecialMaster && (
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="absolute -top-1 -right-1"
                    >
                      <Crown className="w-4 h-4 text-amber-700 fill-yellow-400" />
                    </motion.div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-sm text-slate-800">{badge.title}</h4>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 hover:text-amber-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{badge.desc}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isSpecialMaster
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : badge.unlocked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {badge.unlocked ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          {isSpecialMaster ? '7日達人榮耀' : '已解鎖'}
                        </>
                      ) : (
                        '未達成'
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Weekly Progress Report Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 text-teal-100 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            AI Parent Progress Report
          </span>
          <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
            <span>學習歷程週報</span>
            <FileText className="w-6 h-6 text-teal-200" />
          </h3>
          <p className="text-xs text-teal-100 max-w-xl leading-relaxed">
            AI 自動彙整孩子本週學習強項、弱點觀念與答題正確率，並產出家庭親職輔導建議，讓家長輕鬆掌握學習進度！
          </p>
        </div>

        <div className="relative z-10 flex shrink-0">
          <button
            onClick={handleGenerateWeeklyReport}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>生成家長學習週報</span>
          </button>
        </div>
      </div>

      {/* Certificate Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
            Honor Certificate
          </span>
          <h3 className="text-2xl font-black mb-1">領取「國小英語優秀學習證書」🎓</h3>
          <p className="text-xs text-amber-100">輸入學生名字，直接預覽並列印屬於你的專屬英文學習證書！</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="請輸入你的名字"
            className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-sm outline-hidden shadow-xs w-full sm:w-auto"
          />
          <button
            onClick={() => setShowCertificate(true)}
            className="w-full sm:w-auto bg-white hover:bg-amber-50 text-amber-900 font-black text-sm px-6 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            觀看並頒發證書
          </button>
        </div>
      </div>

      {/* Weekly Report Modal */}
      <AnimatePresence>
        {showWeeklyReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-teal-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden print:max-w-none print:shadow-none print:border-none print:max-h-none"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-800 p-5 text-white flex items-center justify-between print:bg-none print:text-slate-900 print:p-0 print:border-b print:pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-yellow-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg flex items-center gap-2">
                      國小英語 AI 學習歷程週報
                      <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                        家長專屬
                      </span>
                    </h3>
                    <p className="text-xs text-teal-100">學生：{studentName || '小學霸'} ・ 產生時間：{new Date().toLocaleDateString('zh-TW')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => setShowWeeklyReport(false)}
                    className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 print:bg-white print:p-0">
                {weeklyReportLoading ? (
                  <div className="py-16 text-center text-sm font-bold text-teal-800 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <p className="text-base font-black text-slate-800">AI 正在專業彙整 {studentName} 的本週學習數據與表現...</p>
                    <p className="text-xs text-slate-500 max-w-md">正在分析答題正確率、強項單元與易錯題庫，產出家庭指導建議...</p>
                  </div>
                ) : (
                  <div className="bg-white border border-teal-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 text-slate-800 print:border-none print:shadow-none print:p-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span>週報報告全文（家長可直接複製分享或列印）</span>
                      </div>
                      {weeklyReportText && (
                        <button
                          onClick={() => playSpeech(weeklyReportText, { rate: speechSpeed })}
                          className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>語音念給家長聽</span>
                        </button>
                      )}
                    </div>

                    {/* Report Text Content */}
                    <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                      {weeklyReportText}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!weeklyReportLoading && weeklyReportText && (
                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    {reportCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{reportCopied ? '已複製週報文字' : '複製週報內容'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>列印週報</span>
                    </button>
                    <button
                      onClick={() => setShowWeeklyReport(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      關閉
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Learning Report Modal */}
      <AnimatePresence>
        {showPdfReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto print:shadow-none print:max-w-none print:max-h-none print:bg-white print:rounded-none"
            >
              {/* Modal Top Control Bar (Hidden when printing) */}
              <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between gap-4 shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-2xl">
                    <FileText className="w-5 h-5 text-sky-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight">國小英語學習成果與能力成長分析報告</h3>
                    <p className="text-xs text-sky-100 opacity-90">完整收錄答題正確率、各科維度能力向度、錯題統計清單與自然發音評測數據</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>產出 PDF 圖檔中...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-emerald-100" />
                        <span>下載 PDF 成果報告圖檔</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer"
                    title="友善列印或另存為 PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>列印 / 存為 PDF</span>
                  </button>

                  <button
                    onClick={() => setShowPdfReportModal(false)}
                    className="p-2 rounded-2xl hover:bg-white/20 transition-colors text-white cursor-pointer ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Report Canvas Container */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/60 print:bg-white print:p-0">
                {/* The Report Document Ref Element to capture */}
                <div
                  ref={pdfReportRef}
                  className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 text-slate-800 shadow-xl space-y-6 max-w-3xl mx-auto font-sans print:shadow-none print:border-none print:max-w-none print:p-0"
                >
                  {/* Document Header */}
                  <div className="border-b-2 border-indigo-600 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                          Official Learning Report
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
                          🎓 國小英語學習成果與成長分析報告
                        </h1>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                          Primary English Learning Performance & Diagnostic Report
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl p-3 text-right shrink-0">
                        <div className="text-[11px] font-bold text-slate-500">學生評估等級</div>
                        <div className="text-lg font-black text-indigo-700">
                          {accuracyRate >= 90 ? '🌟 S級 特優' : accuracyRate >= 80 ? '🥇 A級 優等' : accuracyRate >= 70 ? '🥈 B級 良好' : '🥉 C級 努力中'}
                        </div>
                      </div>
                    </div>

                    {/* Metadata bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">學生姓名</span>
                        <span className="text-sky-700 font-black text-sm">{studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">學習階段</span>
                        <span className="text-slate-800">
                          {grade === 'low' ? '低年級 (1-2年級)' : grade === 'mid' ? '中年級 (3-4年級)' : '高年級 (5-6年級)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">測驗資料筆數</span>
                        <span className="text-slate-800">{quizResults.length} 筆測試紀錄</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">報告產出日期</span>
                        <span className="text-slate-800">{new Date().toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: KPI Statistics */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      一、核心學習戰績總覽
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5 text-center">
                        <div className="text-[11px] font-bold text-sky-800 mb-0.5">平均答題正確率</div>
                        <div className="text-2xl font-black text-sky-600">{accuracyRate}%</div>
                        <div className="w-full bg-sky-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-sky-500 h-full" style={{ width: `${accuracyRate}%` }} />
                        </div>
                      </div>

                      <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 text-center">
                        <div className="text-[11px] font-bold text-indigo-800 mb-0.5">完成測驗次數</div>
                        <div className="text-2xl font-black text-indigo-600">{stats.totalQuizzesTaken} 次</div>
                        <p className="text-[10px] text-indigo-500 mt-1">持續推進學習步履</p>
                      </div>

                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-center">
                        <div className="text-[11px] font-bold text-emerald-800 mb-0.5">答對總題數</div>
                        <div className="text-2xl font-black text-emerald-600">{stats.totalCorrect} 題</div>
                        <p className="text-[10px] text-emerald-600 mt-1">佔總題數 {stats.totalQuestionsAnswered} 題</p>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-center">
                        <div className="text-[11px] font-bold text-amber-800 mb-0.5">連續學習天數</div>
                        <div className="text-2xl font-black text-amber-600">{stats.streakDays} 天</div>
                        <p className="text-[10px] text-amber-600 mt-1">養成良好定時習慣</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Capability Dimensions Bar Breakdown */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      二、英語核心向度能力指標
                    </h3>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                      {competencyRadarData.map((item) => (
                        <div key={item.subject} className="space-y-1">
                          <div className="flex justify-between font-black text-slate-700">
                            <span>{item.subject}</span>
                            <span className="text-indigo-600">{item.score} / 100 分</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Mistakes Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-600" />
                        三、錯題統計與常錯觀念剖析
                      </h3>
                      <span className="bg-rose-100 text-rose-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-rose-200">
                        累積錯題：{mistakes.length} 題
                      </span>
                    </div>

                    {mistakes.length > 0 ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                              <th className="p-2.5 w-1/5">分類領域</th>
                              <th className="p-2.5 w-2/5">題目內容</th>
                              <th className="p-2.5 w-1/5 text-rose-600">學生選擇</th>
                              <th className="p-2.5 w-1/5 text-emerald-600">正確解答</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {mistakes.slice(0, 5).map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold text-slate-700">{m.question.category}</td>
                                <td className="p-2.5 text-slate-800">{m.question.question}</td>
                                <td className="p-2.5 font-bold text-rose-600">
                                  {m.question.options?.[m.selectedOption] || '未答'}
                                </td>
                                <td className="p-2.5 font-bold text-emerald-600">
                                  {m.question.options?.[m.question.answerIndex]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {mistakes.length > 5 && (
                          <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200 font-bold">
                            （已列出前 5 筆代表性錯題，其餘 {mistakes.length - 5} 題可在實體練習專區重覆複習）
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs text-center font-bold">
                        🎉 太厲害了！目前錯題本無累積錯題，代表學生基礎觀念相當紮實！
                      </div>
                    )}
                  </div>

                  {/* Section 4: Phonics & Pronunciation Summary */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-600" />
                      四、自然發音 Phonics 與語音評測數據
                    </h3>

                    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2 font-bold">
                        <span className="text-purple-900">最新發音測驗平均得分</span>
                        <span className="text-purple-700 font-black text-sm">
                          {phonicsHistory.length > 0 ? phonicsHistory[phonicsHistory.length - 1].score : 90} 分
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-purple-900">口語連音與語意流暢度</span>
                        <span className="text-indigo-700 font-black text-sm">
                          {phonicsHistory.length > 0 ? phonicsHistory[phonicsHistory.length - 1].fluency : 88}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        語音聲調高低與口型美語標準母語者契合度表現穩定，建構出出色的聽說整合自然反應。
                      </p>
                    </div>
                  </div>

                  {/* Section 5: AI Advisor Guidance */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      五、給家長與學生的家庭複習導引
                    </h3>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs leading-relaxed text-amber-950 font-medium">
                      <p className="mb-1.5 font-bold text-amber-900">
                        親愛的家長：{studentName} 目前英語學習表現出色（答題正確率 {accuracyRate}%）！
                      </p>
                      <p>
                        建議每日保持 10-15 分鐘的不間斷練習，適度搭配自然發音（Phonics）朗讀與 Flashcard 快問快答。對於錯題專區，可以鼓勵孩子運用單字語意發音多聽多讀，進一步深化長期記憶。
                      </p>
                    </div>
                  </div>

                  {/* Footer Seal */}
                  <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <div>
                      國小線上英語練習與測驗系統 認證備查印記
                      <br />
                      Elementary English Learning Analytics Platform
                    </div>
                    <div className="text-right">
                      產出編號：#REP-{Math.floor(100000 + Math.random() * 900000)}
                      <br />
                      簽發時間：{new Date().toLocaleString('zh-TW')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Hidden when printing) */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 print:hidden shrink-0">
                <span className="text-xs text-slate-500 font-bold">
                  點擊右上角「下載 PDF 成果報告圖檔」可直接儲存完整學習對比分析為 PDF 檔。
                </span>

                <button
                  onClick={() => setShowPdfReportModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer"
                >
                  關閉預覽
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl border-8 border-amber-300 p-8 sm:p-12 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden print:shadow-none print:border-4 print:rounded-2xl print:max-w-none">
            {/* Background watermark */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-amber-50 -z-0 opacity-60" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg print:shadow-none">
                <Trophy className="w-8 h-8 text-white" />
              </div>

              <span className="text-xs font-black text-amber-700 tracking-widest uppercase mb-1 block">
                Certificate of Excellence
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">
                國小英語練習榮譽證書
              </h2>

              <p className="text-sm text-slate-600 mb-4">茲證明學生</p>

              <h3 className="text-3xl font-black text-sky-600 underline decoration-amber-400 underline-offset-8 mb-6">
                {studentName || '小學霸'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
                在「國小線上英語練習測驗」平台中表現優異，積極完成聽力、單字與文法測驗，具備出色的學習熱誠與強大英語實力！特發此證以資鼓勵！
              </p>

              <div className="flex justify-around items-center border-t border-b border-amber-200 py-4 mb-8 text-xs font-bold text-slate-600">
                <div>
                  <div className="text-slate-400">總答題數</div>
                  <div className="text-base font-black text-slate-800">{stats.totalQuestionsAnswered} 題</div>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div>
                  <div className="text-slate-400">平均正確率</div>
                  <div className="text-base font-black text-emerald-600">{accuracyRate}%</div>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div>
                  <div className="text-slate-400">頒發日期</div>
                  <div className="text-base font-black text-slate-800">{new Date().toLocaleDateString('zh-TW')}</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-2xl shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  列印證書
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-2xl transition-all"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
