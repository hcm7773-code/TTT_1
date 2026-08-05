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

// Helper for local fallback question generation
function getFallbackQuestions(grade: string, topic: string, count: number = 5) {
  const lowQuestions = [
    {
      id: `fb-low-1-${Date.now()}`,
      grade: 'low',
      category: '主題單字',
      question: '「蘋果」的英文單字是哪一個？',
      audioText: 'Apple',
      options: ['Apple', 'Banana', 'Cat', 'Dog'],
      answerIndex: 0,
      explanation: 'Apple 代表蘋果，開頭字母 A 發音為 /æ/。',
      tips: 'A - /æ/ - Apple 一天一蘋果！'
    },
    {
      id: `fb-low-2-${Date.now()}`,
      grade: 'low',
      category: '生活對話',
      question: '當你要謝謝別人時，應該說什麼？',
      audioText: 'Thank you!',
      options: ['Hello!', 'Thank you!', 'Sorry!', 'Goodbye!'],
      answerIndex: 1,
      explanation: 'Thank you! 代表「謝謝你！」，是很有禮貌的用語喔。',
      tips: '收到禮物或幫助時說 Thank you！'
    },
    {
      id: `fb-low-3-${Date.now()}`,
      grade: 'low',
      category: '聽力測驗',
      question: '請聽語音，請問播放的動物單字是什麼？',
      audioText: 'Elephant',
      options: ['Rabbit', 'Elephant', 'Monkey', 'Tiger'],
      answerIndex: 1,
      explanation: 'Elephant 代表大象，特徵是有長長的鼻子！',
      tips: 'Elephant 有長鼻子喔！'
    },
    {
      id: `fb-low-4-${Date.now()}`,
      grade: 'low',
      category: '數字與顏色',
      question: '數字「三 (3)」的英文單字是什麼？',
      audioText: 'Three',
      options: ['One', 'Two', 'Three', 'Four'],
      answerIndex: 2,
      explanation: 'Three 代表數字 3；One 是 1，Two 是 2，Four 是 4。',
      tips: '1 One, 2 Two, 3 Three！'
    },
    {
      id: `fb-low-5-${Date.now()}`,
      grade: 'low',
      category: '自然發音 Phonics',
      question: '請問開頭發音為 /k/ 的動物單字是？',
      audioText: 'Cat',
      options: ['Dog', 'Cat', 'Pig', 'Bird'],
      answerIndex: 1,
      explanation: 'Cat 代表貓咪，字母 C 發音為 /k/。',
      tips: 'C - /k/ - Cat 喵喵叫！'
    }
  ];

  const midQuestions = [
    {
      id: `fb-mid-1-${Date.now()}`,
      grade: 'mid',
      category: 'Be動詞填空',
      question: '選出正確的句子填空："She ____ a diligent student."',
      audioText: 'She is a diligent student.',
      options: ['am', 'is', 'are', 'be'],
      answerIndex: 1,
      explanation: '主詞 She 是第三人稱單數，搭配的 Be 動詞是用 is。',
      tips: 'He / She / It 搭配 is！'
    },
    {
      id: `fb-mid-2-${Date.now()}`,
      grade: 'mid',
      category: '問答情境句型',
      question: '問句："What do you want to eat?" 最合適的回答是？',
      audioText: 'What do you want to eat?',
      options: ['I want a pizza.', 'I am ten years old.', 'It is sunny today.', 'I like swimming.'],
      answerIndex: 0,
      explanation: '問句問「你想吃什麼？」，答案選項 "I want a pizza." (我想吃披薩) 最符合語境！',
      tips: '問 Want to eat (想吃什麼)，回答具體食物名稱！'
    },
    {
      id: `fb-mid-3-${Date.now()}`,
      grade: 'mid',
      category: '介系詞辨析',
      question: '句子填空："The cat is sleeping ____ the bed."',
      audioText: 'The cat is sleeping under the bed.',
      options: ['on', 'under', 'at', 'in'],
      answerIndex: 1,
      explanation: 'under 代表「在...下方」，The cat is sleeping under the bed 表示小貓在床底下睡覺。',
      tips: 'on 是在上面，under 是在下面！'
    },
    {
      id: `fb-mid-4-${Date.now()}`,
      grade: 'mid',
      category: '助動詞 Can 句型',
      question: '句子填空："Can you ____ a bicycle?"',
      audioText: 'Can you ride a bicycle?',
      options: ['ride', 'rides', 'riding', 'rode'],
      answerIndex: 0,
      explanation: '助動詞 Can 後面接「原形動詞」，因此選擇 ride。',
      tips: 'Can / May / Must 後面都要接原形動詞！'
    },
    {
      id: `fb-mid-5-${Date.now()}`,
      grade: 'mid',
      category: '冠詞用法',
      question: '選出正確的冠詞填空："I need ____ umbrella because it is raining."',
      audioText: 'I need an umbrella because it is raining.',
      options: ['a', 'an', 'the', '無須冠詞'],
      answerIndex: 1,
      explanation: 'umbrella 開頭字母 u 發母音 /ʌ/，單數前要使用冠詞 an。',
      tips: '母音開頭單字單數前加 an (an apple, an umbrella)！'
    }
  ];

  const highQuestions = [
    {
      id: `fb-high-1-${Date.now()}`,
      grade: 'high',
      category: '過去時態',
      question: '句子填空："Yesterday, Tom ____ to the bookstore and bought a magazine."',
      audioText: 'Yesterday, Tom went to the bookstore.',
      options: ['go', 'goes', 'went', 'going'],
      answerIndex: 2,
      explanation: '時間字眼為 Yesterday (昨天)，屬於過去式時間，動詞要用 go 的過去式 went。',
      tips: 'Yesterday / Last night 等時間副詞出現，要用過去式動詞！'
    },
    {
      id: `fb-high-2-${Date.now()}`,
      grade: 'high',
      category: '比較級句型',
      question: '句子填空："An elephant is much ____ than a rabbit."',
      audioText: 'An elephant is much bigger than a rabbit.',
      options: ['big', 'bigger', 'biggest', 'more big'],
      answerIndex: 1,
      explanation: '兩者比較且有 than 出現，形容詞 big 轉為比較級更要重複字尾 g 加 er 變成 bigger。',
      tips: 'than 出現找比較級 (-er 或 more)！'
    },
    {
      id: `fb-high-3-${Date.now()}`,
      grade: 'high',
      category: '因果複句',
      question: '選出文法正確的句子：',
      audioText: 'Because it was cold, we stayed indoors.',
      options: [
        'Because it was cold, so we stayed indoors.',
        'Because it was cold, we stayed indoors.',
        'Because cold, we stay indoor.',
        'It was cold because so we stayed inside.'
      ],
      answerIndex: 1,
      explanation: '英文中 Because (因為) 和 So (所以) 不可同時在同一個句子中重複出現，故選第 2 選項。',
      tips: 'Because 和 So 是死對頭，一句話只能出現一個！'
    },
    {
      id: `fb-high-4-${Date.now()}`,
      grade: 'high',
      category: '情境閱讀對話',
      question: '對話："Excuse me, how can I get to the library?" "____"',
      audioText: 'Go straight and turn left.',
      options: [
        'Go straight for two blocks and turn left.',
        'I love reading books very much.',
        'Yes, it is very expensive.',
        'It is five o\'clock now.'
      ],
      answerIndex: 0,
      explanation: '對方問如何去圖書館 (How can I get to...)，正確指路回答為 "Go straight for two blocks and turn left." (直走兩個街區後左轉)。',
      tips: '問路 How can I get to...，回答方向指路詞！'
    },
    {
      id: `fb-high-5-${Date.now()}`,
      grade: 'high',
      category: '現在進行式',
      question: '句子填空："Look! The students ____ basketball in the playground."',
      audioText: 'Look! The students are playing basketball in the playground.',
      options: ['play', 'played', 'are playing', 'were play'],
      answerIndex: 2,
      explanation: 'Look! (看啊！) 提示動作正在進行中，第三人稱複數搭配 are + V-ing 呈現現在進行式。',
      tips: 'Look! 或 Listen! 開頭時，要用現在進行式 (be + V-ing)！'
    }
  ];

  const pool = grade === 'low' ? lowQuestions : grade === 'high' ? highQuestions : midQuestions;
  return pool.slice(0, count);
}

// AI Quiz Generator Endpoint
app.post("/api/gemini/generate-quiz", async (req, res) => {
  const { grade = "mid", topic = "日常單字與基礎句型", count = 5, adaptiveBoost = false, recentAccuracy = 0, topicPreference = "" } = req.body;

  try {
    const ai = getGeminiClient();

    const gradeLabel =
      grade === "low"
        ? "國小低年級 (1-2年級，簡單字母、Phonics自然發音、基礎單字如動物/顏色/數字/家人)"
        : grade === "high"
        ? "國小高年級 (5-6年級，包含過去式、介系詞、比較級、情境對話與短文閱讀)"
        : "國小中年級 (3-4年級，日常300單字、句型問答、基礎文法如Be動詞/Can/Do)";

    let adaptivePrompt = "";
    if (adaptiveBoost) {
      adaptivePrompt = `\n【🔥 自適應難度升級指示】：檢測到學生過去測驗表現卓越（近期平均正確率高達 ${recentAccuracy || 90}%）！請在本次出題中大幅增加【進階句型理解與延伸詞彙】的比重（佔比 60% 以上），例如加入情境複合句、比較級/最高級、時態變化或進階日常會話，為學生提供更具挑戰性與成就感的內容！`;
    }

    let prefPrompt = "";
    if (topicPreference && topicPreference !== '無特殊偏好') {
      prefPrompt = `\n【🎨 學生個人主題喜好】：學生最喜歡「${topicPreference}」主題！請盡量將題目中的例句角色、單字情境、對話背景或聽力文本融入與「${topicPreference}」相關的英文元素（例如相關的動物、太空、體育運動、食物、冒險單字或故事情境），讓出題充滿個性化樂趣！`;
    }

    const prompt = `你是一位專業且活潑的台灣國小英語教師。請為「${gradeLabel}」程度的學生，針對主題「${topic}」設計 ${count} 道豐富多樣的英文練習題。${adaptivePrompt}${prefPrompt}
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
    console.warn("Quiz Generation API Limit / Error encountered. Returning smart local fallback questions:", error?.message || error);
    const fallbackQuestions = getFallbackQuestions(grade, topic, count);
    res.json({
      success: true,
      isFallback: true,
      questions: fallbackQuestions
    });
  }
});

// AI Question Explanation Endpoint
app.post("/api/gemini/explain-question", async (req, res) => {
  const { question, options, correctAnswer, userAnswer, grade = "mid", learningStyle = "fun" } = req.body;

  try {
    const ai = getGeminiClient();

    let stylePromptInstruction = "";
    let systemInstruction = "你是一位國小英文 AI 教師，回答一律使用繁體中文。";

    if (learningStyle === "precise") {
      stylePromptInstruction = `解題風格要求【強調精準】：
1. 用結構化、條理分明的文法與詞性解析正確答案 ${correctAnswer} 的文法規則。
2. 精準對比其他選項的錯因與常見混淆點。
3. 提供規範且系統化的記憶規律與發音音標提示。
4. 提供嚴謹專業且肯定學生學習態度的回應。`;
      systemInstruction += " 請保持嚴謹、結構分明、精準清晰的教學風格。";
    } else if (learningStyle === "quick") {
      stylePromptInstruction = `解題風格要求【快速複習】：
1. 用極為精簡的 3 個重點列舉，讓學生 10 秒內抓到核心考點！
2. 列出正解 ${correctAnswer} 與錯選項的核心關鍵字差異。
3. 一句話超速記憶口訣。
4. 精簡明快的打氣！`;
      systemInstruction += " 請保持極簡高效、重點明確、速記條列的複習風格。";
    } else {
      stylePromptInstruction = `解題風格要求【強調趣味】：
1. 講一個有趣的微型生活小故事或擬人化譬喻，解釋為什麼 ${correctAnswer} 是對的！
2. 用可愛逗趣的口吻分析其他選項為什麼會搞錯。
3. 給予超級生動活潑的口訣與豐富的 Emoji 圖像聯想。
4. 用超級有愛的稱讚給學生滿滿信心！`;
      systemInstruction += " 請保持生動活潑、幽默趣味、充滿故事性與 Emoji 的童趣風格。";
    }

    const prompt = `請以「國小英語 AI 老師」的口吻，為這道題目提供解題分析：
題目：${question}
選項：${JSON.stringify(options)}
正確答案：${correctAnswer}
學生選擇：${userAnswer || "未選擇"}
年級程度：${grade}

${stylePromptInstruction}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction
      }
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.warn("Explain Question API limit / Error encountered. Returning local fallback explanation:", error?.message || error);
    const localExplanation = `🎯 【AI 老師題旨診斷與解題分析】

1. 核心考點觀念：
   本題測試焦點在於考驗生活對話句型與文法邏輯。
   👉 正確答案為：「${correctAnswer}」

2. 選項比對與正確原因：
   正確選項「${correctAnswer}」完全符合本題的句法與前後語境規範。
   ${userAnswer && userAnswer !== correctAnswer ? `你剛剛選擇的「${userAnswer}」是常見的混淆選項，請注意詞性與語意搭配喔！` : '太棒了！你的語感非常好！'}

3. 🌟 超實用速記口訣：
   「記住關鍵單字與搭配詞，句子讀兩遍自然順口！」加油，繼續維持超棒的學習態度！💪`;

    res.json({ success: true, isFallback: true, explanation: localExplanation });
  }
});

// AI English Tutor Chat Endpoint
app.post("/api/gemini/tutor-chat", async (req, res) => {
  const { messages = [], grade = "mid", weakCategories = [], recentMistakesCount = 0, learningStyle = "fun" } = req.body;

  try {
    const ai = getGeminiClient();

    const formattedMessages = messages.map((m: { role: string; content: string }) => `${m.role === "user" ? "學生" : "AI老師"}: ${m.content}`).join("\n");

    const weakText = Array.isArray(weakCategories) && weakCategories.length > 0
      ? `學生目前的弱點單元為：${weakCategories.join('、')} (共 ${recentMistakesCount} 個錯題記錄)。`
      : '學生目前學習狀況良好，無明顯特定弱點。';

    let styleGuidelines = "";
    if (learningStyle === "precise") {
      styleGuidelines = "- 學習風格【強調精準】：講解語氣嚴謹清晰，文法概念分析透徹，重系統結構與精確語法規律。";
    } else if (learningStyle === "quick") {
      styleGuidelines = "- 學習風格【快速複習】：條列精簡、講重點、速記口訣，避免長篇大論，讓學生能迅速複習。";
    } else {
      styleGuidelines = "- 學習風格【強調趣味】：語氣生動風趣、多用生活幽默譬喻與豐富 Emoji 😄，像好朋友般互動。";
    }

    const prompt = `你是一位「國小英語 AI 智慧小老師」，專門解答國小學生在學習英文時遇到的問題（單字、文法、發音自然發音 Phonics、美式口語）。
學生目前年級程度：${grade}。
${weakText}

請根據對話歷史回應最新的問題。

對話紀錄：
${formattedMessages}

請確保回答：
- 繁體中文，態度溫暖親切，根據指定的 AI 學習風格回應：
${styleGuidelines}
- 適合國小學生程度，用直白說法與例子，不講深奧艱澀的專業術語
- 若學生提到相關弱點觀念（如${weakCategories.join('、') || '文法或單字'}），適時給予專屬口訣或記憶妙招
- 提供帶讀英文例句與發音提示`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.warn("Tutor Chat API limit / Error encountered. Returning local fallback reply:", error?.message || error);
    const lastUserMsg = messages[messages.length - 1]?.content || '英文學習疑問';
    const fallbackReply = `哈囉！我是你的 AI 英文小老師 ✨
關於你問的「${lastUserMsg}」：
1. 💡 **關鍵觀念**：學習英文最重要的是「多聽、多唸、放膽開口」！
2. 📖 **範例例句**："Practice makes perfect!" (熟能生巧！)
3. 🌟 **小老師打氣**：別擔心犯錯，錯題本是我們進步的最佳夥伴！如果有想針對發音或特定文法練習，隨時在各練習專區隨時開始特訓喔！💪`;

    res.json({ success: true, isFallback: true, reply: fallbackReply });
  }
});

// AI Quick Word & Phrase Lookup Endpoint
app.post("/api/gemini/quick-lookup", async (req, res) => {
  const { query, grade = "mid", learningStyle = "fun" } = req.body;

  try {
    const ai = getGeminiClient();

    let styleInstruction = "";
    if (learningStyle === "precise") {
      styleInstruction = `學習風格【強調精準】：
1. 嚴謹列出詞性 (Part of Speech)、自然發音規律與音標。
2. 精確的繁體中文翻譯與文法結構/搭配詞 (Collocation) 解析。
3. 規範實用的標準英文例句與中文對照。`;
    } else if (learningStyle === "quick") {
      styleInstruction = `學習風格【快速複習】：
1. 極簡列出 1~2 個核心中文意思。
2. 10 秒速記重點口訣。
3. 1 句超簡短生活實用例句。`;
    } else {
      styleInstruction = `學習風格【強調趣味】：
1. 用生動擬人或有趣的想像故事介紹這個單字/句型！
2. 搭配豐富生動的 Emoji 圖像聯想。
3. 超好記的幽默記憶口訣與實用生活對話例句。`;
    }

    const prompt = `你是一位國小英語 AI 小老師。學生在快速查詢欄輸入了：「${query}」。
學生年級程度：${grade}。

${styleInstruction}

請用適合國小生的繁體中文，快速給出清晰易懂的解答：
- 請務必附帶標準英文發音標記與例句
- 回答請保持結構清晰、方便快速閱讀。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一位專為國小生服務的 AI 英文速查小幫手，使用繁體中文。"
      }
    });

    res.json({ success: true, result: response.text });
  } catch (error: any) {
    console.warn("Quick Lookup API limit / Error encountered. Returning local fallback lookup:", error?.message || error);
    const fallbackResult = `🔍 **【AI 速查：${query}】**

• **中文意思**：與「${query}」相關的常用國小核心英文解釋。
• **發音提示**：標準美式發音，建議點擊下方喇叭朗讀收聽！
• **生活例句**：
  - *"It is time to practice ${query} every day!"*
  (每天練習 ${query} 是非常棒的好習慣！)

💡 **記憶小秘訣**：放在真實生活中講出來，記憶效果翻倍！`;

    res.json({ success: true, isFallback: true, result: fallbackResult });
  }
});

// AI Pronunciation & Listening Minimal Pair Analysis Endpoint
app.post("/api/gemini/pronunciation-analysis", async (req, res) => {
  const { pairOrQuestion, questionDetails, grade = "mid", learningStyle = "fun" } = req.body;

  try {
    const ai = getGeminiClient();

    let styleInstruction = "";
    if (learningStyle === "precise") {
      styleInstruction = `學習風格【強調精準】：
1. 嚴謹標註兩者的 KK 音標/IPA 與聲帶發聲構造差異。
2. 精確的口腔嘴型（舌頭位置、唇形開合、氣流強弱）發音動作拆解。
3. 條理分明的聽力測驗題型辨析步驟與考點防錯說明。`;
    } else if (learningStyle === "quick") {
      styleInstruction = `學習風格【快速複習】：
1. 用極簡 3 個重點精華列舉兩字發音差別。
2. 10 秒即學即用的口訣。
3. 2 句極簡標準美式英文例句。`;
    } else {
      styleInstruction = `學習風格【強調趣味】：
1. 用幽默可愛的擬人想像故事比較這兩個音近字（如 ship 像小船快跑、sheep 像綿羊長笑）。
2. 搭配豐富生動的 Emoji 圖像聯想。
3. 超好記的童趣口訣與有愛的發音練習鼓勵！`;
    }

    const questionInfo = questionDetails
      ? `題目細節：${questionDetails.questionText || ''} (音訊文本: "${questionDetails.audioText || ''}")，正確答案: ${questionDetails.correctAnswer || ''}，學生選擇: ${questionDetails.userAnswer || '未選擇'}`
      : `發音對比標的：${pairOrQuestion}`;

    const prompt = `你是一位專業的「國小英語 AI 發音與聽力診斷專家」。
學生正在進行聽力練習與音近字辨析。
分析標的：${pairOrQuestion}
${questionInfo}
年級程度：${grade}。

${styleInstruction}

請為學生撰寫一份親切、極具啟發性的「發音問題診斷與音近字辨析建議」（使用繁體中文），結構要求包含：

1. 🎙️ **音近字嘴型與 Phonics 發音差異對比** (明確對比發音長短、嘴型開合、舌頭位置)
2. 👂 **聽力練習常錯陷阱與聽覺辨識技巧** (告訴國小學生在聽力測驗中如何一聽就分出來)
3. 🗣️ **美式標準發音示範例句** (提供 2 句包含這些字詞的實用英文例句)
4. 💡 **AI 小老師專屬速記口訣** (一句話好記口訣，協助永久記憶)

請確保語氣溫暖親切，適合國小生閱讀！`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一位專門分析國小生英語發音混淆、聽力音近字辨析的 AI 小老師，回答一律使用繁體中文。"
      }
    });

    res.json({ success: true, analysis: response.text });
  } catch (error: any) {
    console.warn("Pronunciation Analysis API limit / Error. Returning smart local fallback analysis:", error?.message || error);

    const fallbackAnalysis = `🎧 **【AI 聽力發音問題診斷與音近字辨析：${pairOrQuestion}】**

1. 🎙️ **發音嘴型與 Phonics 差異對比**：
   • 正確發音目標在母音張口度與音長上有細微差異！
   • 建議練習時觀察「嘴巴開合大小」與「聲音是否短促拉長」。

2. 👂 **聽力辨識防錯技巧**：
   • 國小聽力測驗中最容易因為「長短母音」或「齒音/唇音」混淆！
   • 聽到語音時，先抓住關鍵單字開頭與結尾的聲響。

3. 🗣️ **美式發音對照例句**：
   • *"Please listen carefully to the word ${pairOrQuestion}."*
   • *"Practice makes perfect when learning English phonics!"*

4. 💡 **AI 老師口訣**：
   「嘴型放對位置，發音清清楚楚，聽力測驗拿滿分！」💪`;

    res.json({ success: true, isFallback: true, analysis: fallbackAnalysis });
  }
});

// AI Weekly Learning Progress Report Endpoint for Parents
app.post("/api/gemini/weekly-report", async (req, res) => {
  const { studentName = "小學霸", stats = {}, quizResults = [], mistakes = [], grade = "mid" } = req.body;

  try {
    const ai = getGeminiClient();

    const prompt = `你是一位專業的「國小英語教研專家與 AI 輔導導師」。請根據學生的本週學習數據，為「家長」撰寫一份專業、簡潔且充滿鼓勵溫度的「學習歷程週報 (Parent Weekly Progress Report)」。

學生姓名：${studentName}
年級程度：${grade}
累積完成測驗數：${stats.totalQuizzesTaken || 0} 次
總答題數：${stats.totalQuestionsAnswered || 0} 題
累積正確答題：${stats.totalCorrect || 0} 題
平均答題正確率：${stats.totalQuestionsAnswered ? Math.round(((stats.totalCorrect || 0) / stats.totalQuestionsAnswered) * 100) : 0}%
連續學習天數：${stats.streakDays || 0} 天

最新測驗紀錄摘要：
${JSON.stringify(quizResults.slice(0, 5).map((q: any) => ({ title: q.title, score: q.score, date: q.date })))}

錯題/弱點記錄數：${mistakes?.length || 0} 個

請以「親愛的 ${studentName} 家長您好」為開頭，撰寫一份條理分明、內容紮實的簡潔週報（使用繁體中文），包含以下四大區塊：

1. 📊 本週學習總覽 (Weekly Highlights)
- 以 2~3 句精闢簡述孩子本週的投入度、持續天數與整體正確率表現。

2. 🌟 本週學習強項 (Strengths)
- 分析孩子表現亮眼的知識點（如單字記憶良好、聽力反應敏捷或完成度高）。

3. 💡 需加強與複習觀念 (Areas for Growth)
- 點出孩子可能較常遇到挫折或錯題集中的觀念（如文法時態、單字拼字或句型轉換）。

4. 👨‍👩‍👧‍👦 家長家庭輔導溫馨建議 (Parent Actionable Tips)
- 給家長 2 點在家陪伴學習的具體輕量建議（例如：每天練習 5 分鐘聽力、運用生活情境問答等）。

請保持格式精美、排版清晰，適度搭配 Emoji 提高可讀性。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一位關心學生成長且專業的國小英語教育顧問，專為家長提供簡潔有溫度的學習報告。"
      }
    });

    res.json({ success: true, report: response.text });
  } catch (error: any) {
    console.warn("Weekly Report API limit / Error encountered. Returning local fallback report:", error?.message || error);
    const accuracy = stats.totalQuestionsAnswered ? Math.round(((stats.totalCorrect || 0) / stats.totalQuestionsAnswered) * 100) : 85;
    const fallbackReport = `親愛的 ${studentName} 家長您好：

這是孩子本週在國小英語測驗平台的專屬學習總結：

📊 **1. 本週學習總覽 (Weekly Highlights)**
- 孩子已連續堅持學習 **${stats.streakDays || 1} 天**，完成 **${stats.totalQuizzesTaken || 1} 次** 測驗練習！
- 總答題數達 **${stats.totalQuestionsAnswered || 10} 題**，答題整體正確率維持在 **${accuracy}%**，展現極佳的學習積極度。

🌟 **2. 本週學習強項 (Strengths)**
- 在日常生活主題單字與基礎問答表現相當穩定！
- 積極使用語音朗讀輔助發音辨識，對聽力感官建立具備良好基礎。

💡 **3. 需加強與複習觀念 (Areas for Growth)**
- 錯題本累積 **${mistakes?.length || 0} 個** 待加強觀念（包含 Be 動詞與介系詞搭配）。
- 建議利用平台的「錯題重點重測」與「艾賓浩斯記憶法」進行 3 分鐘快速補強。

👨‍👩‍👧‍👦 **4. 家長家庭輔導溫馨建議 (Parent Actionable Tips)**
- 1. 每天撥出 5 分鐘，邀請孩子向您分享今天學會的 1 個新英文單字。
- 2. 在日常生活中多鼓勵孩子點擊語音播放朗讀，培養美式英語聽力直覺！

讓我們一起為孩子的進步喝采！加油！🌟`;

    res.json({ success: true, isFallback: true, report: fallbackReport });
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
