import React, { useState, useRef, useEffect } from 'react';
import { GradeLevel } from '../types';
import { playSpeech } from '../utils/speech';
import { Sparkles, X, Send, Volume2, Bot, User, Loader2 } from 'lucide-react';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeLevel;
  speechSpeed: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({ isOpen, onClose, grade, speechSpeed }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! 我是你的「AI 英文小老師」👋！請問在學習英文單字、句型或發音上遇到什麼難題嗎？隨時問我喔！😄'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const PRESET_QUESTIONS = [
    '什麼時候用 a？什麼時候用 an？',
    'He / She / It 為什麼動詞要加 s？',
    'Good morning 跟 Good afternoon 有什麼差別？',
    '請教我 Apple 和 Banana 的複數怎麼寫！'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          grade
        })
      });

      if (!response.ok) {
        throw new Error('Static host response error');
      }

      const data = await response.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '抱歉，AI 老師剛剛走神了，請再試問一次喔！' }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '💡 提示：在 GitHub Pages 靜態環境下，全站豐富的預設英語單字卡、聽力發音、國小三大年級試題與文法解析皆可完整使用！若需與 AI 老師進行即時對話，可於支援 Node.js Server 的環境中執行。'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = (text: string) => {
    // Extract English fragments or speak whole text
    playSpeech(text, { rate: speechSpeed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-2xl w-full max-w-xl h-[85vh] max-h-[650px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Bot className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-1.5">
                AI 英文小老師
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <p className="text-xs text-indigo-100">繁體中文解說・適合國小理解</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white font-medium rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleReadAloud(msg.content)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> 朗讀內容
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-3 rounded-2xl w-max">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>AI 老師思考中...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Preset chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 scrollbar-none">
          {PRESET_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-bold whitespace-nowrap bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-xl transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="請輸入英文發音、單字或文法問題..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            className={`p-2.5 rounded-xl text-white font-bold transition-all ${
              inputQuery.trim() && !loading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
