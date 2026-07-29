import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Quiz Generator Endpoint
app.post("/api/gemini/generate-quiz", async (req, res) => {
  try {
    const { grade = "mid", topic = "日常單字與基礎句型", count = 5 } = req.body;
    const ai = getGeminiClient();

    const gradeLabel =
      grade === "low"
        ? "國小低年級 (1-2年級，簡單字母、Phonics自然發音、基礎單字如動物/顏色/數字/家人)"
        : grade === "high"
        ? "國小高年級 (5-6年級，包含過去式、介系詞、比較級、情境對話與短文閱讀)"
        : "國小中年級 (3-4年級，日常300單字、句型問答、基礎文法如Be動詞/Can/Do)";

    const prompt = `你是一位專業且活潑的台灣國小英語教師。請為「${gradeLabel}」程度的學生，針對主題「${topic}」設計 ${count} 道豐富多樣的英文練習題。
題目類型包含：單字選擇、聽力辨識（標註音訊朗讀文字）、日常生活對話填空、基礎文法選擇與短句理解。
語言要求：題目英文為主，提示與解析必須為繁體中文，適合國小學生理解。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你專門輸出符合指定JSON格式的國小英語測驗題目，解析親切、鼓勵性高且觀念清晰。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING, description: "如：單字選擇, 聽力測驗, 生活對話, 文法理解" },
              question: { type: Type.STRING, description: "題目內容（英文為主）" },
              audioText: { type: Type.STRING, description: "用於朗讀或聽力播放的英文句子或單字" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4個選項 (A, B, C, D)"
              },
              answerIndex: { type: Type.INTEGER, description: "正確答案的索引 (0, 1, 2, 3)" },
              explanation: { type: Type.STRING, description: "親切活潑的繁體中文解析與單字補充" },
              tips: { type: Type.STRING, description: "解題小秘訣或記憶口訣" }
            },
            required: ["id", "category", "question", "options", "answerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const rawQuestions = JSON.parse(jsonText);
    const questions = Array.isArray(rawQuestions)
      ? rawQuestions.map((q: any, idx: number) => ({
          id: q.id || `ai-${Date.now()}-${idx}`,
          grade: grade,
          category: q.category || 'AI 智慧出題',
          question: q.question || '',
          audioText: q.audioText || q.question || '',
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
          answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < 4 ? q.answerIndex : 0,
          explanation: q.explanation || '暫無詳細解析',
          tips: q.tips || ''
        }))
      : [];
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error("Quiz Generation Error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "無法產生測驗題目，請確認 GEMINI_API_KEY 配置。"
    });
  }
});

// AI Question Explanation Endpoint
app.post("/api/gemini/explain-question", async (req, res) => {
  try {
    const { question, options, correctAnswer, userAnswer, grade = "mid" } = req.body;
    const ai = getGeminiClient();

    const prompt = `請以「國小英語 AI 老師」的口吻，為這道題目提供詳細且生動的解題分析：
題目：${question}
選項：${JSON.stringify(options)}
正確答案：${correctAnswer}
學生選擇：${userAnswer || "未選擇"}
年級程度：${grade}

請說明：
1. 為什麼選擇 ${correctAnswer} 是正確的？（用適合國小生的簡單文法或生活例子解釋）
2. 其他選項的意思與常見迷思。
3. 相關單字或句型記憶小技巧（如：聯想記憶、口訣）。
4. 給學生一句溫暖鼓勵的話！`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一位充滿愛心與耐心的國小英文教師，文字繁體中文，生動活潑、多用點讚與鼓勵用語。"
      }
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error("Explain Question Error:", error);
    res.status(500).json({ success: false, error: error?.message || "無法取得 AI 解析" });
  }
});

// AI English Tutor Chat Endpoint
app.post("/api/gemini/tutor-chat", async (req, res) => {
  try {
    const { messages = [], grade = "mid" } = req.body;
    const ai = getGeminiClient();

    const formattedMessages = messages.map((m: { role: string; content: string }) => `${m.role === "user" ? "學生" : "AI老師"}: ${m.content}`).join("\n");

    const prompt = `你是一位「國小英語 AI 智慧小老師」，專門解答國小學生在學習英文時遇到的問題（單字、文法、發音自然發音Phonics、美式口語）。
請根據對話歷史回應最新的問題。

對話紀錄：
${formattedMessages}

請確保回答：
- 繁體中文，搭配生動有趣的 Emoji 😄
- 適合國小學生程度，用簡單直白的說法，不講深奧艱澀的專業文法術語
- 提供帶讀英文例句與發音提示
- 鼓勵學生多聽多讀！`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error("Tutor Chat Error:", error);
    res.status(500).json({ success: false, error: error?.message || "AI 小老師暫時連線忙碌中" });
  }
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Elementary English Quiz App server listening on http://localhost:${PORT}`);
  });
}

startServer();
