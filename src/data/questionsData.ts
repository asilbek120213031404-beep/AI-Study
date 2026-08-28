import type { Question } from '../types';

export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subject: 'Matematika',
    difficulty: 'Qiyin',
    question: 'x^2 - 5x + 6 = 0 tenglamaning ildizlari yig\'indisini toping.',
    options: ['-5', '5', '6', '-6'],
    correctAnswerIndex: 1, // '5' (Viyeta teoremasi bo'yicha: x1 + x2 = 5)
    explanation: 'Viyeta teoremasiga ko\'ra, x^2 + px + q = 0 kvadrat tenglamaning ildizlari yig\'indisi x1 + x2 = -p ga teng. Bu yerda p = -5, demak ildizlar yig\'indisi -(-5) = 5.'
  },
  {
    id: 'q2',
    subject: 'Dasturlash',
    difficulty: 'O\'rtacha',
    question: 'JavaScript da `typeof null` nimani qaytaradi?',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correctAnswerIndex: 2,
    explanation: 'JavaScript tarixidagi texnik xatolik sababli `typeof null` har doim `"object"` qaytaradi.'
  },
  {
    id: 'q3',
    subject: 'Sun\'iy Intellekt',
    difficulty: 'Qiyin',
    question: 'Transformer arxitekturasida "Self-Attention" nimani hisoblaydi?',
    options: [
      'So\'zlarning bir-biriga kontekstual bog\'liqlik vaznini',
      'Matnni faqat rasmga aylantirishni',
      'Faqat xotirani tozalashni',
      'Matn hajmini qisqartirishni'
    ],
    correctAnswerIndex: 0,
    explanation: 'Self-Attention har bir tokenning boshqa barcha tokenlar bilan bog\'liqlik darajasini hisoblaydi.'
  },
  {
    id: 'q4',
    subject: 'Tarix',
    difficulty: 'Oson',
    question: 'Amir Temur nechanchi yilda tug\'ilgan?',
    options: ['1336-yil', '1340-yil', '1405-yil', '1380-yil'],
    correctAnswerIndex: 0,
    explanation: 'Amir Temur 1336-yil 9-aprelda Shahrisabz yaqinidagi Xo\'ja Ilg\'or qishlog\'ida tug\'ilgan.'
  },
  {
    id: 'q5',
    subject: 'Python',
    difficulty: 'O\'rtacha',
    question: 'Python da ro\'yxat (list) ga yangi element qo\'shish uchun qaysi metod ishlatiladi?',
    options: ['push()', 'append()', 'add()', 'insert_last()'],
    correctAnswerIndex: 1,
    explanation: 'Python list ob’yektida elementni oxiriga qo\'shish uchun append() metodi ishlatiladi.'
  },
  {
    id: 'q6',
    subject: 'Python',
    difficulty: 'Oson',
    question: 'Python dasturlash tilida izoh (comment) qaysi belgi bilan boshlanadi?',
    options: ['//', '/*', '#', '<!--'],
    correctAnswerIndex: 2,
    explanation: 'Python da bir qatorli izohlar `#` belgisi bilan boshlanadi.'
  }
];
