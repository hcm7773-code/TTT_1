import { Flashcard } from '../types';

export const FLASHCARDS_DATA: Flashcard[] = [
  // --- 低年級 (1-2年級) ---
  {
    id: 'f-1',
    word: 'apple',
    phonics: '/ˈæp.əl/',
    meaning: '蘋果',
    exampleEn: 'I eat a red apple every day.',
    exampleZh: '我每天吃一顆紅蘋果。',
    category: '🍎 食物與飲料',
    grade: 'low'
  },
  {
    id: 'f-2',
    word: 'banana',
    phonics: '/bəˈnæn.ə/',
    meaning: '香蕉',
    exampleEn: 'Monkeys love to eat bananas.',
    exampleZh: '猴子最喜歡吃香蕉。',
    category: '🍎 食物與飲料',
    grade: 'low'
  },
  {
    id: 'f-3',
    word: 'cat',
    phonics: '/kæt/',
    meaning: '貓咪',
    exampleEn: 'The cat is very cute.',
    exampleZh: '這隻貓咪非常可愛。',
    category: '🐱 動物篇',
    grade: 'low'
  },
  {
    id: 'f-4',
    word: 'dog',
    phonics: '/dɒɡ/',
    meaning: '小狗',
    exampleEn: 'My dog likes to run.',
    exampleZh: '我的小狗喜歡跑步。',
    category: '🐱 動物篇',
    grade: 'low'
  },
  {
    id: 'f-5',
    word: 'red',
    phonics: '/red/',
    meaning: '紅色',
    exampleEn: 'Look at the red bus.',
    exampleZh: '看那輛紅色的公車。',
    category: '🎨 顏色與形狀',
    grade: 'low'
  },
  {
    id: 'f-6',
    word: 'blue',
    phonics: '/bluː/',
    meaning: '藍色',
    exampleEn: 'The sky is clear blue.',
    exampleZh: '天空是清澈的藍色。',
    category: '🎨 顏色與形狀',
    grade: 'low'
  },
  {
    id: 'f-7',
    word: 'mother',
    phonics: '/ˈmʌð.ər/',
    meaning: '媽媽',
    exampleEn: 'I love my mother.',
    exampleZh: '我愛我的媽媽。',
    category: '👨‍👩‍👧 家人與稱謂',
    grade: 'low'
  },
  {
    id: 'f-8',
    word: 'father',
    phonics: '/ˈfɑː.ðər/',
    meaning: '爸爸',
    exampleEn: 'My father is a doctor.',
    exampleZh: '我爸爸是一名醫生。',
    category: '👨‍👩‍👧 家人與稱謂',
    grade: 'low'
  },

  // --- 中年級 (3-4年級) ---
  {
    id: 'f-9',
    word: 'pencil',
    phonics: '/ˈpen.səl/',
    meaning: '鉛筆',
    exampleEn: 'May I borrow your pencil?',
    exampleZh: '我可以借你的鉛筆嗎？',
    category: '🏫 學校與文具',
    grade: 'mid'
  },
  {
    id: 'f-10',
    word: 'eraser',
    phonics: '/ɪˈreɪ.zər/',
    meaning: '橡皮擦',
    exampleEn: 'I need an eraser for my homework.',
    exampleZh: '我寫作業需要塊橡皮擦。',
    category: '🏫 學校與文具',
    grade: 'mid'
  },
  {
    id: 'f-11',
    word: 'sunny',
    phonics: '/ˈsʌn.i/',
    meaning: '晴朗的',
    exampleEn: 'It is a sunny Sunday.',
    exampleZh: '今天是一個晴朗的星期天。',
    category: '🌤 天氣與自然',
    grade: 'mid'
  },
  {
    id: 'f-12',
    word: 'rainy',
    phonics: '/ˈreɪ.ni/',
    meaning: '下雨的',
    exampleEn: 'Don\'t forget your umbrella on rainy days.',
    exampleZh: '下雨天別忘了帶傘。',
    category: '🌤 天氣與自然',
    grade: 'mid'
  },
  {
    id: 'f-13',
    word: 'swimming',
    phonics: '/ˈswɪm.ɪŋ/',
    meaning: '游泳',
    exampleEn: 'We go swimming in the summer.',
    exampleZh: '我們在夏天去游泳。',
    category: '🏃 動作與運動',
    grade: 'mid'
  },
  {
    id: 'f-14',
    word: 'Monday',
    phonics: '/ˈmʌn.deɪ/',
    meaning: '星期一',
    exampleEn: 'We have English class on Monday.',
    exampleZh: '我們星期一有英文課。',
    category: '⏰ 時間與日子',
    grade: 'mid'
  },

  // --- 高年級 (5-6年級) ---
  {
    id: 'f-15',
    word: 'library',
    phonics: '/ˈlaɪ.brər.i/',
    meaning: '圖書館',
    exampleEn: 'The students are reading in the library.',
    exampleZh: '學生們正在圖書館閱讀。',
    category: '🏫 學校與文具',
    grade: 'high'
  },
  {
    id: 'f-16',
    word: 'dinosaur',
    phonics: '/ˈdaɪ.nə.sɔːr/',
    meaning: '恐龍',
    exampleEn: 'T-Rex was a giant dinosaur.',
    exampleZh: '暴龍是一隻巨大的恐龍。',
    category: '🐱 動物篇',
    grade: 'high'
  },
  {
    id: 'f-17',
    word: 'yesterday',
    phonics: '/ˈjes.tə.deɪ/',
    meaning: '昨天',
    exampleEn: 'I watched a movie with my family yesterday.',
    exampleZh: '我昨天和家人看了一部電影。',
    category: '⏰ 時間與日子',
    grade: 'high'
  },
  {
    id: 'f-18',
    word: 'delicious',
    phonics: '/dɪˈlɪʃ.əs/',
    meaning: '美味的',
    exampleEn: 'My grandmother made delicious soup.',
    exampleZh: '我奶奶煮了美味的湯。',
    category: '🍎 食物與飲料',
    grade: 'high'
  }
];
