import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  // --- 低年級 (Grade 1-2) ---
  {
    id: 'l-1',
    grade: 'low',
    category: '字母與發音',
    question: '請問發音為 /b/ 的代表單字是哪一個？',
    audioText: 'B is for Apple? No, B is for Banana!',
    options: ['Apple', 'Banana', 'Cat', 'Dog'],
    answerIndex: 1,
    explanation: 'Banana (香蕉) 開頭字母是 B，發音為 /b/。',
    tips: 'B - /b/ - Banana！'
  },
  {
    id: 'l-2',
    grade: 'low',
    category: '主題單字',
    question: '「紅色」的英文單字是什麼？',
    audioText: 'Red',
    options: ['Blue', 'Yellow', 'Red', 'Green'],
    answerIndex: 2,
    explanation: 'Red 代表紅色；Blue 是藍色，Yellow 是黃色，Green 是綠色。',
    tips: 'Red 蘋果紅咚咚！'
  },
  {
    id: 'l-3',
    grade: 'low',
    category: '生活對話',
    question: '當有人對你說 "Good morning!" 時，你應該怎麼回答？',
    audioText: 'Good morning!',
    options: ['Good morning!', 'Good night!', 'Thank you!', 'Goodbye!'],
    answerIndex: 0,
    explanation: 'Good morning 是「早安」，最禮貌地回應也是說 "Good morning!"。',
    tips: '早上見面說 Good morning！'
  },
  {
    id: 'l-4',
    grade: 'low',
    category: '聽力測驗',
    question: '請點擊喇叭聽語音，請問播放的動物單字是哪一個？',
    audioText: 'Elephant',
    options: ['Dog', 'Cat', 'Elephant', 'Monkey'],
    answerIndex: 2,
    explanation: '語音播放的是 Elephant (大象)。',
    tips: 'Elephant 大象有長長鼻子！'
  },
  {
    id: 'l-5',
    grade: 'low',
    category: '主題單字',
    question: '看圖選單字：圖片中有一隻可愛的小貓咪，英文是？',
    audioText: 'Cat',
    options: ['Pig', 'Cat', 'Fish', 'Bird'],
    answerIndex: 1,
    explanation: 'Cat 是小貓咪；Pig 是豬，Fish 是魚，Bird 是小鳥。',
    tips: 'Cat 喵喵叫！'
  },
  {
    id: 'l-6',
    grade: 'low',
    category: '基礎文法',
    question: '填空：I ____ a student. (我是學生。)',
    audioText: 'I am a student.',
    options: ['is', 'are', 'am', 'be'],
    answerIndex: 2,
    explanation: '主詞是 "I" 時，搭配的 Be 動詞固定用 "am"。',
    tips: '口訣：I 配 am，You 配 are，is 留給 he/she/it！'
  },
  {
    id: 'l-7',
    grade: 'low',
    category: '字母與發音',
    question: '字母 "Dd" 在 Phonics 自然發音中的發音是？',
    audioText: 'Dog, Duck, Door',
    options: ['/d/', '/b/', '/k/', '/t/'],
    answerIndex: 0,
    explanation: '字母 Dd 的自然發音是 /d/，例如 Dog, Duck, Door。',
    tips: 'Dd - /d/ - Dog!'
  },
  {
    id: 'l-8',
    grade: 'low',
    category: '生活對話',
    question: '當想問朋友「你幾歲？」時，應該怎麼問？',
    audioText: 'How old are you?',
    options: ['What is your name?', 'How old are you?', 'How are you?', 'Where are you?'],
    answerIndex: 1,
    explanation: '詢問年齡用 "How old are you?"，回答可以說 "I am seven years old."'
  },

  // --- 中年級 (Grade 3-4) ---
  {
    id: 'm-1',
    grade: 'mid',
    category: '基礎文法',
    question: '填空：Look! The cat is sleeping ____ the chair. (貓咪睡在椅子下面。)',
    audioText: 'The cat is sleeping under the chair.',
    options: ['on', 'under', 'in', 'behind'],
    answerIndex: 1,
    explanation: 'under 代表「在…下面」；on 是在上面，in 是在裡面。',
    tips: 'under 在下面，on 在上面，in 在裡面！'
  },
  {
    id: 'm-2',
    grade: 'mid',
    category: '生活對話',
    question: '問句：____ is this? 答句：It is a ruler.',
    audioText: 'What is this? It is a ruler.',
    options: ['Who', 'Where', 'What', 'How'],
    answerIndex: 2,
    explanation: '詢問「這是什麼物品」要用疑問詞 "What"。如果是問人則用 Who。',
    tips: '問物品用 What，問人用 Who，問地點用 Where！'
  },
  {
    id: 'm-3',
    grade: 'mid',
    category: '主題單字',
    question: '請問 "Thursday" 代表星期幾？',
    audioText: 'Thursday',
    options: ['星期二', '星期三', '星期四', '星期五'],
    answerIndex: 2,
    explanation: 'Thursday 是星期四。Tuesday 是星期二，Wednesday 是星期三，Friday 是星期五。',
    tips: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun 要背熟喔！'
  },
  {
    id: 'm-4',
    grade: 'mid',
    category: '基礎文法',
    question: '填空：I have two ____. (我有兩隻小狗。)',
    audioText: 'I have two dogs.',
    options: ['dog', 'dogs', 'doges', 'a dog'],
    answerIndex: 1,
    explanation: '數量是 2 以上（複數）時，大部分可數名詞字尾要加上 "s"，變成 dogs。'
  },
  {
    id: 'm-5',
    grade: 'mid',
    category: '聽力測驗',
    question: '請聽語音句子，選出正確意思："Can you play the piano?"',
    audioText: 'Can you play the piano?',
    options: ['你會彈鋼琴嗎？', '你想買鋼琴嗎？', '你在聽鋼琴音樂嗎？', '你會畫鋼琴嗎？'],
    answerIndex: 0,
    explanation: 'Can you ...? 代表「你會/能做某件事嗎？」，play the piano 是彈鋼琴。'
  },
  {
    id: 'm-6',
    grade: 'mid',
    category: '閱讀理解',
    question: '閱讀句子：My brother likes apples, but he doesn\'t like bananas. 請問哥哥喜歡什麼水果？',
    audioText: 'My brother likes apples, but he does not like bananas.',
    options: ['香蕉', '蘋果', '都不喜歡', '都喜歡'],
    answerIndex: 1,
    explanation: 'likes apples 代表喜歡蘋果；doesn\'t like bananas 代表不喜歡香蕉。'
  },
  {
    id: 'm-7',
    grade: 'mid',
    category: '基礎文法',
    question: '請問下列哪一個句子用詞完全正確？',
    audioText: 'She is a nice teacher.',
    options: ['She are a nice teacher.', 'She is a nice teacher.', 'She am a nice teacher.', 'She be a nice teacher.'],
    answerIndex: 1,
    explanation: '主詞 She 是單數第三人稱，Be動詞必須配合使用 "is"。'
  },

  // --- 高年級 (Grade 5-6) ---
  {
    id: 'h-1',
    grade: 'high',
    category: '基礎文法',
    question: '填空：Listen! Amy ____ the piano in the music room right now.',
    audioText: 'Listen! Amy is playing the piano in the music room right now.',
    options: ['play', 'plays', 'is playing', 'played'],
    answerIndex: 2,
    explanation: '句中有 Listen! 以及 right now (現在)，表示正在進行動作，需用現在進行式 Be + V-ing (is playing)。',
    tips: '現在進行式口訣：Be動詞(am/is/are) + 動詞ing！'
  },
  {
    id: 'h-2',
    grade: 'high',
    category: '基礎文法',
    question: '填空：Tom is ____ than his older brother.',
    audioText: 'Tom is taller than his older brother.',
    options: ['tall', 'taller', 'tallest', 'more tall'],
    answerIndex: 1,
    explanation: '後方有比較介系詞 "than" (比…)，前面的形容詞要使用比較級 (tall + er = taller)。'
  },
  {
    id: 'h-3',
    grade: 'high',
    category: '基礎文法',
    question: '填空：We ____ to the Taipei Zoo yesterday afternoon.',
    audioText: 'We went to the Taipei Zoo yesterday afternoon.',
    options: ['go', 'goes', 'went', 'going'],
    answerIndex: 2,
    explanation: '時間標示是 "yesterday afternoon" (昨天下午)，屬於過去發生的事，go 的過去式不規則動詞是 "went"。'
  },
  {
    id: 'h-4',
    grade: 'high',
    category: '生活對話',
    question: 'A: Excuse me, how do I get to the library? B: ____',
    audioText: 'Excuse me, how do I get to the library? Go straight and turn left at the corner.',
    options: [
      'Go straight and turn left at the corner.',
      'Yes, I like reading books.',
      'It is five o\'clock.',
      'No, thank you.'
    ],
    answerIndex: 0,
    explanation: 'A 詢問「請問圖書館怎麼走？」，B 回答「直走並在路口左轉」最符合指路語境。'
  },
  {
    id: 'h-5',
    grade: 'high',
    category: '閱讀理解',
    question: '閱讀短文："Peter woke up at 7:00 this morning. He ate toast and drank milk for breakfast. Then he rode his bicycle to school." 請問 Peter 是怎麼去學校的？',
    audioText: 'Peter woke up at 7:00 this morning. He ate toast and drank milk for breakfast. Then he rode his bicycle to school.',
    options: ['走路 (on foot)', '搭公車 (by bus)', '騎腳踏車 (by bicycle)', '搭捷運 (by MRT)'],
    answerIndex: 2,
    explanation: '文中提到 "rode his bicycle to school"，ride 的過去式是 rode，意思是騎腳踏車去學校。'
  },
  {
    id: 'h-6',
    grade: 'high',
    category: '主題單字',
    question: '請問 "Weather Forecast" 意思是？',
    audioText: 'Weather Forecast',
    options: ['天氣預報', '氣候變遷', '自然風景', '新聞報導'],
    answerIndex: 0,
    explanation: 'Weather 是天氣，Forecast 是預報，Weather Forecast 就是氣象預報。'
  },
  {
    id: 'h-7',
    grade: 'high',
    category: '基礎文法',
    question: '填空：There ____ many beautiful flowers in the garden.',
    audioText: 'There are many beautiful flowers in the garden.',
    options: ['is', 'are', 'am', 'was'],
    answerIndex: 1,
    explanation: '後方的名詞 "many beautiful flowers" 是複數，因此用 "There are"。'
  }
];
