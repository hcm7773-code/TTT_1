import { GrammarLesson } from '../types';

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: 'g-1',
    title: 'Be 動詞全攻略 (am / is / are)',
    grade: 'low',
    summary: 'Be 動詞的意思是「是」或「在」。只要記住主詞配對口訣，就能掌握！',
    keyPoints: [
      '主詞是 I → 搭配 am (I am a student.)',
      '主詞是 You/We/They/複數 → 搭配 are (You are my friend.)',
      '主詞是 He/She/It/單數名詞 → 搭配 is (She is tall.)'
    ],
    examples: [
      { en: 'I am 8 years old.', zh: '我 8 歲。' },
      { en: 'He is a brave dog.', zh: '牠是一隻勇敢的小狗。' },
      { en: 'They are in the classroom.', zh: '他們在教室裡面。' }
    ],
    quizCheck: {
      id: 'gq-1',
      grade: 'low',
      category: '基礎文法',
      question: '請選出正確的填空：My sister ____ 10 years old.',
      audioText: 'My sister is 10 years old.',
      options: ['am', 'is', 'are', 'be'],
      answerIndex: 1,
      explanation: 'My sister 代表「她 (She)」，第三人稱單數要用 "is"。'
    }
  },
  {
    id: 'g-2',
    title: '位置介系詞 (in / on / under / behind)',
    grade: 'mid',
    summary: '用介系詞來告訴大家東西放在哪裡！',
    keyPoints: [
      'in 在…裡面：in the box (在盒子裡)',
      'on 在…上面：on the desk (在桌上)',
      'under 在…下面：under the tree (在樹下)',
      'behind 在…後面：behind the door (在門後)'
    ],
    examples: [
      { en: 'The apple is in the basket.', zh: '蘋果在籃子裡面。' },
      { en: 'The book is on the table.', zh: '書本在桌子上。' },
      { en: 'The cat is under the bed.', zh: '貓咪在床底下。' }
    ],
    quizCheck: {
      id: 'gq-2',
      grade: 'mid',
      category: '基礎文法',
      question: 'The ball is ____ the chair. (球在椅子下面。)',
      audioText: 'The ball is under the chair.',
      options: ['on', 'in', 'under', 'next'],
      answerIndex: 2,
      explanation: '「在…下面」要使用 under。'
    }
  },
  {
    id: 'g-3',
    title: '現在進行式 (Be + V-ing)',
    grade: 'high',
    summary: '當我們想要表達「正在做某件事」時，就要使用現在進行式！',
    keyPoints: [
      '公式：Be動詞 (am/is/are) + 動詞加上 -ing',
      '常搭配的關鍵字：Look! (看！), Listen! (聽！), right now (現在)',
      '例句變化：play → playing, run → running, dance → dancing'
    ],
    examples: [
      { en: 'She is reading a comic book right now.', zh: '她現在正在看漫畫書。' },
      { en: 'Look! The kids are running in the park.', zh: '看！孩子們正在公園跑步。' }
    ],
    quizCheck: {
      id: 'gq-3',
      grade: 'high',
      category: '基礎文法',
      question: '填空：Listen! The birds ____ sweetly in the tree.',
      audioText: 'Listen! The birds are singing sweetly in the tree.',
      options: ['sing', 'sings', 'are singing', 'sang'],
      answerIndex: 2,
      explanation: '句首有 Listen! (聽！)，代表正在發生的事，Birds 是複數，用 are singing。'
    }
  }
];
