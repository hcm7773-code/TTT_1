import React, { useState, useMemo } from 'react';
import { GradeLevel, UserStats, QuizResult, LearningStyle, MistakeItem } from '../types';
import { BookOpen, Sparkles, Volume2, Award, BookMarked, HelpCircle, Layers, Flame, Brain, TrendingUp, X, Target, Zap, CheckCircle2, ShieldCheck, Sliders, Settings, Compass, Bell, BellRing, CheckCheck, Trash2, ArrowRight, Clock, AlertTriangle, Heart, Palette, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  grade: GradeLevel;
  setGrade: (grade: GradeLevel) => void;
  streakDays: number;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  openAiTutor: () => void;
  stats: UserStats;
  quizResults: QuizResult[];
  learningStyle: LearningStyle;
  setLearningStyle: (style: LearningStyle) => void;
  topicPreference?: string;
  setTopicPreference?: (pref: string) => void;
  mistakes?: MistakeItem[];
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface NotificationItem {
  id: string;
  type: 'recommendation' | 'mistake' | 'streak' | 'spaced';
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetTab?: string;
  actionText?: string;
  badgeText: string;
  badgeBg: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  grade,
  setGrade,
  streakDays,
  speechSpeed,
  setSpeechSpeed,
  openAiTutor,
  stats,
  quizResults,
  learningStyle,
  setLearningStyle,
  topicPreference = '🐶 動物與寵物',
  setTopicPreference,
  mistakes = [],
  isDarkMode = false,
  toggleDarkMode
}) => {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [adaptiveMode, setAdaptiveMode] = useState<'auto' | 'foundation' | 'challenge'>('auto');

  // AI Notification Center States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'recommendation',
      title: '🎯 AI 學習建議：今日觀念突破',
      message: '根據近期答題分析，您在「生活對話」表現極佳！建議今天進行 3 題文法填空加強結構記憶。',
      time: '10分鐘前',
      read: false,
      targetTab: 'grammar',
      actionText: '開啟觀念文法',
      badgeText: '核心建議',
      badgeBg: 'bg-indigo-100 text-indigo-900 border border-indigo-200'
    },
    {
      id: 'notif-2',
      type: 'mistake',
      title: '🔥 錯題庫重點消滅提醒',
      message: mistakes.length > 0
        ? `錯題本中已有 ${mistakes.length} 個題目待消滅，放學後 17:00 專注度最高，是重測黃金期！`
        : '檢測到過去測驗曾有介系詞 (at/for) 混淆，建議進行 1 分鐘盲點測驗！',
      time: '1小時前',
      read: false,
      targetTab: 'mistakes',
      actionText: '前往錯題本消滅',
      badgeText: '弱點加強',
      badgeBg: 'bg-rose-100 text-rose-900 border border-rose-200'
    },
    {
      id: 'notif-3',
      type: 'spaced',
      title: '🧠 艾賓浩斯單字記憶提醒',
      message: '今日有 3 個主題單字到達「7 天黃金記憶期」，前往閃示卡晉級可鎖定長期記憶！',
      time: '3小時前',
      read: false,
      targetTab: 'flashcards',
      actionText: '進行記憶卡排程',
      badgeText: '記憶曲線',
      badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-200'
    },
    {
      id: 'notif-4',
      type: 'streak',
      title: '⚡ 連續學習成就達標',
      message: `太棒了！您已連續學習 ${streakDays} 天，每天 5 分鐘能建立強大英語直覺！`,
      time: '今天',
      read: true,
      targetTab: 'quiz',
      actionText: '開始綜合測驗',
      badgeText: '連勝成就',
      badgeBg: 'bg-amber-100 text-amber-900 border border-amber-200'
    }
  ]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleActionClick = (targetTab?: string, id?: string) => {
    if (id) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
    setNotificationsOpen(false);
    if (targetTab) {
      setActiveTab(targetTab);
    }
  };

  // Calculate current AI difficulty level dynamically based on performance
  const levelInfo = useMemo(() => {
    const totalAnswered = stats.totalQuestionsAnswered || 0;
    const totalCorrect = stats.totalCorrect || 0;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const totalQuizzes = stats.totalQuizzesTaken || 0;

    let stage = 1;
    let name = '初階';
    let icon = '🌱';
    let title = '基礎詞彙與單字音韻';
    let color = 'from-emerald-500 to-teal-600';
    let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    let nextStageReq = '再完成 2 次測驗或答對率達 60%';
    let advice = 'AI 建議：先熟悉單字卡發音與基礎題目，建立英語聽讀好感度！';

    if (adaptiveMode === 'foundation') {
      stage = 1;
      name = '初階 (基礎模式)';
      icon = '🌱';
    } else if (adaptiveMode === 'challenge') {
      stage = 4;
      name = '達人 (挑戰模式)';
      icon = '👑';
      title = '高階思考與AI靈活句型';
      color = 'from-purple-600 to-pink-600';
      badgeBg = 'bg-purple-50 border-purple-200 text-purple-900';
      advice = '已開啟高難度挑戰模式！試題靈活度提升 100%，激發潛能！';
    } else {
      if (totalQuizzes >= 5 && accuracy >= 88) {
        stage = 4;
        name = '達人';
        icon = '👑';
        title = '高階思考與AI靈活句型';
        color = 'from-purple-600 to-pink-600';
        badgeBg = 'bg-purple-50 border-purple-200 text-purple-900';
        nextStageReq = '您已登頂英語達人殿堂！持續保持全對熱情！';
        advice = '太震撼了！您的綜合題型正確率超過 88%，AI 正為您提供最高靈活性試題！';
      } else if (totalQuizzes >= 3 && accuracy >= 75) {
        stage = 3;
        name = '進階';
        icon = '🚀';
        title = '綜合聽力與文章閱讀';
        color = 'from-sky-500 to-indigo-600';
        badgeBg = 'bg-sky-50 border-sky-200 text-sky-900';
        nextStageReq = '平均正確率達 88% 且累積 5 次測驗';
        advice = '表現非常亮眼！AI 自動提升了情境聽力與對話測驗的比重！';
      } else if (totalQuizzes >= 1 || accuracy >= 50) {
        stage = 2;
        name = '中階';
        icon = '🌿';
        title = '實用生活對話與基礎文法';
        color = 'from-amber-500 to-orange-600';
        badgeBg = 'bg-amber-50 border-amber-200 text-amber-900';
        nextStageReq = '平均正確率達 75% 且累積 3 次測驗';
        advice = '基礎非常紮實！AI 已逐步增加常用句型與情境對話題目。';
      }
    }

    return {
      stage,
      name,
      icon,
      title,
      color,
      badgeBg,
      accuracy,
      totalAnswered,
      totalQuizzes,
      nextStageReq,
      advice
    };
  }, [stats, adaptiveMode]);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-sky-100 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-200 dark:shadow-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">國小線上英語練習測驗</h1>
                <span className="bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  快樂學英文
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">低 / 中 / 高年級單字・文法・聽力・AI 智慧診斷</p>
            </div>
          </div>

          {/* Controls: Grade selector, Speech speed, AI Level, Streak, AI Tutor */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Grade Selector */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => setGrade('low')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'low'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                低年級 (1-2)
              </button>
              <button
                onClick={() => setGrade('mid')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'mid'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                中年級 (3-4)
              </button>
              <button
                onClick={() => setGrade('high')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  grade === 'high'
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                高年級 (5-6)
              </button>
            </div>

            {/* AI Adaptive Difficulty Level Indicator Badge */}
            <button
              onClick={() => setDashboardOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-purple-950/50 border border-purple-200 dark:border-purple-800/80 hover:border-purple-300 text-purple-900 dark:text-purple-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title="點擊查看 AI 測驗難度成長儀表板"
            >
              <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">AI 難度:</span>
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-lg font-black flex items-center gap-1">
                <span>{levelInfo.icon}</span>
                <span>{levelInfo.name}</span>
              </span>
            </button>

            {/* AI Learning Style Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-300 text-emerald-900 dark:text-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title="點擊設定 AI 學習風格與教學習慣"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">AI 風格:</span>
              <span className="bg-emerald-100/90 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg font-black">
                {learningStyle === 'fun'
                  ? '🎭 強調趣味'
                  : learningStyle === 'precise'
                  ? '🎯 強調精準'
                  : '⚡ 快速複習'}
              </span>
            </button>

            {/* AI Learning Topic Preference Button */}
            <button
              onClick={() => setTopicModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-slate-800 dark:to-rose-950/50 border border-rose-200 dark:border-rose-800/80 hover:border-rose-300 text-rose-900 dark:text-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title="點擊設定個人學習喜好主題（AI 出題將自動帶入專屬單字與情境）"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
              <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">學習喜好:</span>
              <span className="bg-rose-100/90 dark:bg-rose-950 text-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-lg font-black truncate max-w-[110px]">
                {topicPreference}
              </span>
            </button>

            {/* Speech speed setting */}
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-xl text-xs">
              <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium hidden sm:inline">發音語速:</span>
              <button
                onClick={() => setSpeechSpeed(speechSpeed === 0.85 ? 1.0 : 0.85)}
                className="font-bold bg-amber-200/60 dark:bg-amber-950/80 px-1.5 py-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900 cursor-pointer"
              >
                {speechSpeed === 0.85 ? '🐢 慢速 (0.85x)' : '⚡ 標準 (1.0x)'}
              </button>
            </div>

            {/* Dark / Light Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={toggleDarkMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-sm cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-300 border-amber-400/50 hover:bg-slate-700 ring-2 ring-amber-400/30'
                  : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-slate-800 border-amber-300 hover:from-amber-200 hover:to-yellow-200 ring-2 ring-amber-300/40'
              }`}
              title={isDarkMode ? '切換為淺色模式' : '切換為深色模式'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400 animate-spin-slow" />
                  <span>☀️ 淺色模式</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-700 fill-indigo-600/30" />
                  <span>🌙 深色模式</span>
                </>
              )}
            </motion.button>

            {/* Streak */}
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-orange-800/80 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-xl text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>連續 {streakDays} 天</span>
            </div>

            {/* AI Tutor Chat Trigger Button */}
            <button
              onClick={openAiTutor}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>AI 英文小老師</span>
            </button>

            {/* AI Notification Center Bell Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl border text-xs font-bold transition-all relative cursor-pointer active:scale-95 flex items-center justify-center ${
                  notificationsOpen
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="AI 智慧學習通知中心"
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-indigo-600 animate-bounce' : ''}`} />

                {/* Red Unread Dot Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 text-white text-[9px] font-black items-center justify-center">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Center Popover Drawer */}
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
                    >
                      {/* Panel Header */}
                      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500/30 rounded-xl text-yellow-300">
                            <BellRing className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm flex items-center gap-1.5">
                              AI 智慧學習通知中心
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            </h4>
                            <p className="text-[10px] text-slate-300">根據學生答題狀況分析之行動建議</p>
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-bold text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>全標為已讀</span>
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            目前沒有新的學習建議通知 🎉
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-2xl transition-all relative group ${
                                !item.read
                                  ? 'bg-indigo-50/50 border border-indigo-100'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                                  {item.badgeText}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.time}
                                  </span>
                                  <button
                                    onClick={(e) => handleDismissNotification(item.id, e)}
                                    className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                                    title="刪除此通知"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h5 className="font-bold text-xs text-slate-800 mb-1 flex items-center gap-1">
                                {!item.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                                <span>{item.title}</span>
                              </h5>

                              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-2">
                                {item.message}
                              </p>

                              {item.actionText && (
                                <button
                                  onClick={() => handleActionClick(item.targetTab, item.id)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <span>{item.actionText}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'quiz'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>📝 綜合測驗</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-generator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'ai-generator'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>🤖 AI 智慧出題</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📖 主題單字卡</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'grammar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>💡 觀念文法</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'mistakes'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-300'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>📕 錯題本</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🏆 成就與證書</span>
          </button>
        </nav>
      </div>

      {/* AI Adaptive Difficulty Level Dashboard Modal */}
      <AnimatePresence>
        {dashboardOpen && (
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
              className="bg-white rounded-3xl border border-purple-100 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setDashboardOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    AI 智慧適應學習系統
                  </span>
                  <h3 className="font-black text-xl text-slate-800 mt-0.5">測驗難度成長儀表板</h3>
                </div>
              </div>

              {/* Current Stage Badge Card */}
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${levelInfo.color} text-white mb-6 shadow-md relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-purple-100 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>當前 AI 難度等級</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                      <span>{levelInfo.icon}</span>
                      <span>{levelInfo.name} 等級</span>
                    </div>
                    <p className="text-xs text-purple-100 mt-1 opacity-90">{levelInfo.title}</p>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20 text-center flex-shrink-0">
                    <div className="text-[10px] text-purple-100 font-bold">整體答對率</div>
                    <div className="text-2xl font-black">{levelInfo.accuracy}%</div>
                  </div>
                </div>
              </div>

              {/* Growth Trajectory Step Pipeline */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>難度成長軌跡 (Growth Pipeline)</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-bold">階段 {levelInfo.stage} / 4</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center relative">
                  {[
                    { stg: 1, title: '初階', icon: '🌱', desc: '基礎詞彙' },
                    { stg: 2, title: '中階', icon: '🌿', desc: '生活句型' },
                    { stg: 3, title: '進階', icon: '🚀', desc: '聽力閱讀' },
                    { stg: 4, title: '達人', icon: '👑', desc: 'AI靈活題' }
                  ].map((item) => {
                    const isCurrent = levelInfo.stage === item.stg;
                    const isPassed = levelInfo.stage > item.stg;

                    return (
                      <div
                        key={item.stg}
                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-between ${
                          isCurrent
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400 shadow-xs'
                            : isPassed
                            ? 'bg-slate-50 border-emerald-200 text-slate-700'
                            : 'bg-slate-50 border-slate-200 opacity-50'
                        }`}
                      >
                        <div className="text-xl mb-1">{item.icon}</div>
                        <div className="font-black text-xs text-slate-800">{item.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>

                        <div className="mt-2">
                          {isCurrent ? (
                            <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              當前難度
                            </span>
                          ) : isPassed ? (
                            <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              已通過
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">鎖定中</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Diagnostic Advice */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>下一階段晉升條件與 AI 建議：</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2 font-medium">
                  {levelInfo.advice}
                </p>
                <div className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 p-2 rounded-xl">
                  🎯 晉升目標：{levelInfo.nextStageReq}
                </div>
              </div>

              {/* Adaptive Mode Override */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>難度微調模式 (Adaptive Override)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAdaptiveMode('auto')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      adaptiveMode === 'auto'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🤖 智慧動態適應
                  </button>

                  <button
                    onClick={() => setAdaptiveMode('foundation')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      adaptiveMode === 'foundation'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🌱 溫和鞏固基礎
                  </button>

                  <button
                    onClick={() => setAdaptiveMode('challenge')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      adaptiveMode === 'challenge'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👑 挑戰達人模式
                  </button>
                </div>
              </div>

              {/* Footer confirm */}
              <div className="text-right">
                <button
                  onClick={() => setDashboardOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  確認並關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Settings Modal: AI Learning Style & Teaching Persona */}
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-emerald-100 shadow-2xl w-full max-w-lg p-6 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      學習設定與 AI 風格
                    </h3>
                    <p className="text-xs text-slate-500">自訂 AI 小老師解題與對話話術風格</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Learning Style Selection Cards */}
              <div className="space-y-4 mb-6">
                <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI 小老師話術風格 (AI Learning Style)</span>
                </label>

                <div className="space-y-2.5">
                  {/* Style 1: Fun */}
                  <div
                    onClick={() => setLearningStyle('fun')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      learningStyle === 'fun'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl pt-0.5">🎭</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                          強調趣味 (Fun & Engaging)
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            熱門預設
                          </span>
                        </span>
                        {learningStyle === 'fun' && (
                          <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        以生活化有趣故事、擬人化譬喻、童趣 Emoji 與活潑口訣帶出正確答案！適合激發童心與學習熱情。
                      </p>
                    </div>
                  </div>

                  {/* Style 2: Precise */}
                  <div
                    onClick={() => setLearningStyle('precise')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      learningStyle === 'precise'
                        ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl pt-0.5">🎯</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                          強調精準 (Precise & Rigorous)
                          <span className="bg-sky-100 text-sky-900 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            紮實文法
                          </span>
                        </span>
                        {learningStyle === 'precise' && (
                          <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        結構化剖析文法觀念、詞性變化、混淆選項對比與標準發音法則。適合高年級與追求觀念精確無誤的學霸。
                      </p>
                    </div>
                  </div>

                  {/* Style 3: Quick */}
                  <div
                    onClick={() => setLearningStyle('quick')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      learningStyle === 'quick'
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl pt-0.5">⚡</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                          快速複習 (Quick Review)
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            高效速記
                          </span>
                        </span>
                        {learningStyle === 'quick' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        極簡 3 大重點列舉 (Bullet Points)，10 秒內掌握核心考點與超速記憶法。適合考前高效衝刺與快速複習。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  設定將即時套用至 AI 解題與對話話術
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  完成設定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Topic Preference Modal: Learning Theme Selection */}
        {topicModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      學習喜好設定 (Topic Preferences)
                    </h3>
                    <p className="text-xs text-slate-500">選擇最感興趣的主題，AI 出題將為你融入專屬單字與趣味情境！</p>
                  </div>
                </div>
                <button
                  onClick={() => setTopicModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Active Indicator */}
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border border-rose-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-xs font-bold text-rose-950">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>目前已鎖定主題喜好：</span>
                  <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-lg">
                    {topicPreference}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">AI 智慧出題即時連動</span>
              </div>

              {/* Grid of Preset Topics */}
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center justify-between">
                  <span>熱門學習主題選擇 (Select a Theme)</span>
                  <span className="text-[11px] text-slate-400 font-normal">點擊即可設為首選</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      name: '🐶 動物與寵物',
                      desc: '可愛動物與寵物單字 (dog, cat, lion, elephant)',
                    },
                    {
                      name: '🚀 太空與宇宙',
                      desc: '宇宙神祕探索英語 (rocket, planet, star, astronaut)',
                    },
                    {
                      name: '⚽ 體育與運動',
                      desc: '活力四射運動單字 (basketball, soccer, swimming, run)',
                    },
                    {
                      name: '🍕 食物與美食',
                      desc: '美味可口餐點英語 (pizza, apple, cake, milk, burger)',
                    },
                    {
                      name: '🏰 奇幻與冒險',
                      desc: '童話魔法故事英語 (dragon, castle, magic, knight)',
                    },
                    {
                      name: '🤖 科技與機器人',
                      desc: '未來科技遊戲單字 (robot, computer, science, AI)',
                    },
                    {
                      name: '🌿 大自然與植物',
                      desc: '美麗自然氣候單字 (tree, flower, sun, rain, mountain)',
                    },
                    {
                      name: '🎨 藝術與音樂',
                      desc: '美感音樂創作英語 (piano, paint, sing, dance, guitar)',
                    }
                  ].map((item) => {
                    const isSelected = topicPreference === item.name;
                    return (
                      <div
                        key={item.name}
                        onClick={() => setTopicPreference && setTopicPreference(item.name)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-2 relative ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 shadow-xs scale-102'
                            : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/80'
                        }`}
                      >
                        <div>
                          <div className="font-black text-xs text-slate-800 flex items-center gap-1">
                            <span>{item.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug font-medium">
                            {item.desc}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="p-1 bg-rose-500 text-white rounded-full shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mb-5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>自訂專屬興趣主題 (Custom Topic Keyword)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    placeholder="輸入你最愛的興趣（如：寶可夢、恐龍、汽車...）"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={() => {
                      if (customTopicInput.trim() && setTopicPreference) {
                        setTopicPreference(`✨ ${customTopicInput.trim()}`);
                        setCustomTopicInput('');
                      }
                    }}
                    disabled={!customTopicInput.trim()}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    套用自訂
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 font-medium">
                  點擊【AI 智慧出題】時，系統將自動套用此喜好主題！
                </div>
                <button
                  onClick={() => setTopicModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  確認完成
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

