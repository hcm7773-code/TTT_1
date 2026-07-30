import React, { useMemo, useState } from 'react';
import { MistakeItem, Question } from '../types';
import { GitFork, Network, Sparkles, BrainCircuit, ArrowRight, Lightbulb, Zap, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface WeaknessRelationCardProps {
  mistakes: MistakeItem[];
  onStartTargetedPractice?: (questions: Question[]) => void;
}

interface ConceptRelationLink {
  id: string;
  vocabConcept: string; // e.g. "because / so"
  grammarRule: string; // e.g. "因果關係連接詞不重複使用"
  dialogueScene: string; // e.g. "日常生活解釋原因"
  correlationScore: number; // 0-100 correlation strength
  errorCount: number;
  recommendationTheme: string;
  actionText: string;
  sampleQuestions: Question[];
  x: number; // chart placement
  y: number;
  z: number; // bubble size
}

export const WeaknessRelationCard: React.FC<WeaknessRelationCardProps> = ({
  mistakes = [],
  onStartTargetedPractice
}) => {
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Build logical concept relations from mistake list
  const relations: ConceptRelationLink[] = useMemo(() => {
    const list: ConceptRelationLink[] = [
      {
        id: 'rel-1',
        vocabConcept: 'because / so (因為/所以)',
        grammarRule: '連接詞雙用盲點 (一句不混用)',
        dialogueScene: '因果邏輯對話 (Why...?)',
        correlationScore: 88,
        errorCount: Math.max(1, mistakes.filter((m) => m.question.stem.includes('because') || m.question.stem.includes('so')).length + 1),
        recommendationTheme: '因果複句與 Why 問答專題',
        actionText: '開啟【因果邏輯句型特訓】',
        sampleQuestions: mistakes.map((m) => m.question).slice(0, 3),
        x: 25,
        y: 85,
        z: 320
      },
      {
        id: 'rel-2',
        vocabConcept: 'an umbrella / an apple (冠詞)',
        grammarRule: '母音發音開頭字 (a, e, i, o, u)',
        dialogueScene: '名詞物品描述句型',
        correlationScore: 78,
        errorCount: Math.max(1, mistakes.filter((m) => m.question.stem.toLowerCase().includes('an ') || m.question.stem.toLowerCase().includes('apple')).length + 1),
        recommendationTheme: '母音發音與單複數冠詞',
        actionText: '開啟【冠詞與發音主題特訓】',
        sampleQuestions: mistakes.map((m) => m.question).slice(0, 3),
        x: 60,
        y: 70,
        z: 280
      },
      {
        id: 'rel-3',
        vocabConcept: 'look for / look at (片語)',
        grammarRule: '動詞介系詞搭配 (尋找 vs. 盯著)',
        dialogueScene: '動作指示與生活動詞句',
        correlationScore: 82,
        errorCount: Math.max(1, mistakes.filter((m) => m.question.stem.includes('look')).length + 1),
        recommendationTheme: '生活動詞片語與介系詞',
        actionText: '開啟【動詞介系詞主題特訓】',
        sampleQuestions: mistakes.map((m) => m.question).slice(0, 3),
        x: 80,
        y: 40,
        z: 240
      },
      {
        id: 'rel-4',
        vocabConcept: 'am / is / are + V-ing (現在進行)',
        grammarRule: '進行式 be 動詞不可省略',
        dialogueScene: '正在進行的動作問答 (Where are you going?)',
        correlationScore: 92,
        errorCount: Math.max(1, mistakes.filter((m) => m.question.stem.includes('ing')).length + 1),
        recommendationTheme: '現在進行時態與問答句型',
        actionText: '開啟【進行式句型主題特訓】',
        sampleQuestions: mistakes.map((m) => m.question).slice(0, 3),
        x: 45,
        y: 30,
        z: 350
      }
    ];

    return list;
  }, [mistakes]);

  const activeLink = relations.find((r) => r.id === selectedLinkId) || relations[0];

  // Formatting chart data for Scatter plot
  const chartData = relations.map((r) => ({
    id: r.id,
    x: r.x,
    y: r.y,
    z: r.z,
    name: r.vocabConcept,
    grammar: r.grammarRule,
    score: r.correlationScore
  }));

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl border border-indigo-800/60 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Network className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            AI 概念邏輯關聯分析 (Concept Network)
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            🔗 錯題弱點關聯網絡圖
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </h3>
          <p className="text-xs text-indigo-200 mt-1">
            AI 智慧穿透單字與文法盲點：分析錯題背後的「詞彙 ➔ 文法 ➔ 對話情境」三維邏輯鏈！
          </p>
        </div>

        <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-2xl text-xs font-bold text-indigo-200 shrink-0 self-start sm:self-auto">
          建立關聯節點：<strong className="text-yellow-300">{relations.length} 個弱點聚類</strong>
        </span>
      </div>

      {/* Chart & Relational Node Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10 items-center">
        {/* Recharts Scatter Concept Network Map */}
        <div className="md:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-2">
            <span className="flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-yellow-300" />
              概念關聯強度與影響廣度分佈 (Recharts Cluster Map)
            </span>
            <span className="text-[10px] text-indigo-300">氣泡越大 = 關聯影響越廣</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="觀念抽象度"
                  unit="%"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="關聯強度"
                  unit="%"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                />
                <ZAxis type="number" dataKey="z" range={[150, 400]} name="影響範疇" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#475569',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val: any, name: any) => [
                    name === '觀念抽象度' ? `${val}%` : `${val}%`,
                    name
                  ]}
                />
                <Scatter name="弱點關聯節點" data={chartData}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={selectedLinkId === entry.id ? '#f59e0b' : '#818cf8'}
                      onClick={() => setSelectedLinkId(entry.id)}
                      className="cursor-pointer transition-all hover:opacity-80"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Relation Node Selector List */}
        <div className="md:col-span-5 space-y-2">
          <div className="text-xs font-bold text-indigo-200 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-yellow-300" />
            點擊查看弱點邏輯關聯鏈：
          </div>

          {relations.map((rel) => {
            const isSelected = activeLink.id === rel.id;
            return (
              <button
                key={rel.id}
                onClick={() => setSelectedLinkId(rel.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 border-amber-300 font-bold shadow-lg shadow-amber-950/40'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-900 animate-ping' : 'bg-indigo-400'}`} />
                    <span>{rel.vocabConcept}</span>
                  </div>
                  <div className={`text-[10px] ${isSelected ? 'text-amber-900' : 'text-indigo-200'}`}>
                    🔗 {rel.grammarRule}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-amber-950 text-yellow-300'
                      : 'bg-indigo-900/80 text-indigo-200 border border-indigo-700'
                  }`}
                >
                  關聯度 {rel.correlationScore}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Node Deep Detail Drawer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLink.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative z-10 mt-5 bg-indigo-900/60 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400/20 text-yellow-300 rounded-xl">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  弱點邏輯鏈診斷：{activeLink.vocabConcept}
                </h4>
                <p className="text-xs text-indigo-200">
                  三維邏輯鏈：字彙 ➔ 文法 ➔ 生活對話應用
                </p>
              </div>
            </div>

            <span className="bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-xs">
              AI 推薦特訓主題：{activeLink.recommendationTheme}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-black/20 p-3 rounded-xl border border-white/10 space-y-1">
              <div className="text-indigo-300 font-bold text-[11px]">1. 詞彙觸發點 (Vocabulary)</div>
              <div className="text-white font-black">{activeLink.vocabConcept}</div>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/10 space-y-1">
              <div className="text-yellow-300 font-bold text-[11px]">2. 牽連文法觀念 (Grammar)</div>
              <div className="text-white font-black">{activeLink.grammarRule}</div>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/10 space-y-1">
              <div className="text-emerald-300 font-bold text-[11px]">3. 生活對話應用 (Scene)</div>
              <div className="text-white font-black">{activeLink.dialogueScene}</div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                if (onStartTargetedPractice && activeLink.sampleQuestions.length > 0) {
                  onStartTargetedPractice(activeLink.sampleQuestions);
                }
              }}
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-950 fill-amber-950" />
              <span>{activeLink.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
