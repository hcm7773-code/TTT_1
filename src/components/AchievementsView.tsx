import React, { useState, useMemo } from 'react';
import { UserStats, QuizResult } from '../types';
import { Award, Trophy, Star, Flame, CheckCircle, Printer, Sparkles, Medal, UserCheck, TrendingUp, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface AchievementsViewProps {
  stats: UserStats;
  quizResults: QuizResult[];
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ stats, quizResults }) => {
  const [studentName, setStudentName] = useState('小學霸');
  const [showCertificate, setShowCertificate] = useState(false);

  // Generate 7-day trend data from quizResults
  const last7DaysData = useMemo(() => {
    const dates = [];
    const today = new Date();

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

      dates.push({
        label,
        questions,
        correct,
        accuracy
      });
    }

    return dates;
  }, [quizResults]);

  const BADGES = [
    {
      id: 'badge-1',
      title: '🌟 英語初學者',
      desc: '完成個人第 1 次測驗！',
      unlocked: stats.totalQuizzesTaken >= 1
    },
    {
      id: 'badge-2',
      title: '🔥 連續學習達人',
      desc: '連續天數達成 3 天！',
      unlocked: stats.streakDays >= 3
    },
    {
      id: 'badge-3',
      title: '💯 滿分小高手',
      desc: '在測驗中獲得 100 分！',
      unlocked: quizResults.some((r) => r.score === 100)
    },
    {
      id: 'badge-4',
      title: '📖 單字庫小學士',
      desc: '累計回答超過 20 道英文題目！',
      unlocked: stats.totalQuestionsAnswered >= 20
    },
    {
      id: 'badge-5',
      title: '🤖 AI 智慧探險員',
      desc: '體驗過 AI 智慧出題測驗！',
      unlocked: quizResults.some((r) => r.title.includes('AI'))
    }
  ];

  const accuracyRate =
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          🏆 學習成就與榮譽證書
        </h2>
        <p className="text-xs text-slate-500 mt-1">累積練習步履，解鎖勳章並領取專屬國小英語榮譽證書！</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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
            className="w-full sm:w-auto bg-white hover:bg-amber-50 text-amber-900 font-black text-sm px-6 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            觀看並頒發證書
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <Medal className="w-5 h-5 text-amber-500" />
        成就勳章牆 Badges
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {BADGES.map((badge) => (
          <div
            key={badge.id}
            className={`p-5 rounded-3xl border transition-all flex items-center space-x-3 ${
              badge.unlocked
                ? 'bg-white border-amber-200 shadow-sm'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                badge.unlocked
                  ? 'bg-amber-100 text-amber-600 shadow-xs'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {badge.unlocked ? '🏆' : '🔒'}
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-800">{badge.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
              <span
                className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
                  badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {badge.unlocked ? '已解鎖' : '未達成'}
              </span>
            </div>
          </div>
        ))}
      </div>

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
