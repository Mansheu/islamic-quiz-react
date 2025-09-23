import type { Question } from '../types';

export const allQuestions: Question[] = [
  // Quranic Basics
  {
    question: "Which Surah is known as the 'Heart of the Quran'?",
    options: ["Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Yasin", "Surah Al-Ikhlas"],
    answer: "Surah Yasin",
    topic: "Quranic Basics",
    explanation: "Surah Yasin is called the 'Heart of the Quran' because it emphasizes core themes like resurrection, belief in Allah, and the message of the prophets."
  },
  {
    question: "How many Surahs are there in the Quran?",
    options: ["100", "110", "114", "120"],
    answer: "114",
    topic: "Quranic Basics",
    explanation: "The Quran consists of 114 Surahs, revealed over a span of 23 years."
  },
  {
    question: "Which Surah was revealed entirely at once?",
    options: ["Surah Al-Kahf", "Surah Maryam", "Surah Yusuf", "Surah Al-Fatiha"],
    answer: "Surah Al-Fatiha",
    topic: "Quranic Basics",
    explanation: "Surah Al-Fatiha was revealed all at once and is recited in every unit of Salah."
  },
  {
    question: "Which angel delivered the revelation to Prophet Muhammad (PBUH)?",
    options: ["Angel Michael", "Angel Gabriel (Jibril)", "Angel Israfil", "Angel Azrael"],
    answer: "Angel Gabriel (Jibril)",
    topic: "Quranic Basics",
    explanation: "Angel Jibril (Gabriel) was the messenger of revelation who brought the Quran to the Prophet Muhammad (PBUH)."
  },
  {
    question: "What is the meaning of the word 'Quran'?",
    options: ["Guidance", "The Book", "The Recitation", "The Knowledge"],
    answer: "The Recitation",
    topic: "Quranic Basics",
    explanation: "The word Quran literally means 'The Recitation', as it was revealed to be recited aloud."
  },

  // Prophets in Islam
  {
    question: "Which Prophet is mentioned the most in the Quran?",
    options: ["Prophet Ibrahim", "Prophet Musa", "Prophet Isa", "Prophet Muhammad"],
    answer: "Prophet Musa",
    topic: "Prophets in Islam",
    explanation: "Prophet Musa (Moses) is mentioned more than 100 times in the Quran, more than any other prophet."
  },
  {
    question: "Which Prophet was swallowed by a whale?",
    options: ["Prophet Isa", "Prophet Musa", "Prophet Yunus", "Prophet Yusuf"],
    answer: "Prophet Yunus",
    topic: "Prophets in Islam",
    explanation: "Prophet Yunus (Jonah) was swallowed by a great fish after leaving his people, and he prayed for forgiveness inside its belly."
  },
  {
    question: "Which Prophet was given the Zabur (Psalms)?",
    options: ["Prophet Isa", "Prophet Dawud", "Prophet Musa", "Prophet Ibrahim"],
    answer: "Prophet Dawud",
    topic: "Prophets in Islam",
    explanation: "The Zabur (Psalms) was given to Prophet Dawud (David), consisting mainly of praises and songs to Allah."
  },
  {
    question: "Which Prophet is associated with building the Kaaba?",
    options: ["Prophet Isa", "Prophet Ibrahim", "Prophet Musa", "Prophet Yusuf"],
    answer: "Prophet Ibrahim",
    topic: "Prophets in Islam",
    explanation: "Prophet Ibrahim (Abraham) and his son Ismail rebuilt the Kaaba in Makkah as a center for monotheistic worship."
  },
  {
    question: "Who was the first prophet of Islam?",
    options: ["Prophet Musa", "Prophet Nuh", "Prophet Adam", "Prophet Ibrahim"],
    answer: "Prophet Adam",
    topic: "Prophets in Islam",
    explanation: "Prophet Adam (AS) was the first human created by Allah and the first prophet."
  },

  // Islamic Beliefs and Practices
  {
    question: "What is the first pillar of Islam?",
    options: ["Salah", "Zakat", "Shahada", "Sawm"],
    answer: "Shahada",
    topic: "Islamic Beliefs and Practices",
    explanation: "The Shahada, or testimony of faith, is the first pillar of Islam: 'There is no god but Allah, and Muhammad is His Messenger.'"
  },
  {
    question: "During which month do Muslims fast from dawn to sunset?",
    options: ["Muharram", "Ramadan", "Shawwal", "Dhul-Hijjah"],
    answer: "Ramadan",
    topic: "Islamic Beliefs and Practices",
    explanation: "Ramadan is the ninth month of the Islamic calendar, in which fasting (Sawm) is obligatory for Muslims."
  },
  {
    question: "What does 'Zakat' mean?",
    options: ["Purification", "Charity", "Worship", "Fasting"],
    answer: "Purification",
    topic: "Islamic Beliefs and Practices",
    explanation: "Zakat means 'purification' and refers to purifying wealth by giving a portion to those in need."
  },
  {
    question: "How many times a day are Muslims required to perform Salah?",
    options: ["3", "4", "5", "6"],
    answer: "5",
    topic: "Islamic Beliefs and Practices",
    explanation: "Muslims are required to perform five daily prayers: Fajr, Dhuhr, Asr, Maghrib, and Isha."
  },
  {
    question: "What is the name of the pilgrimage to Mecca that Muslims must perform once in a lifetime, if able?",
    options: ["Sawm", "Zakat", "Hajj", "Jihad"],
    answer: "Hajj",
    topic: "Islamic Beliefs and Practices",
    explanation: "Hajj is the fifth pillar of Islam and is obligatory for Muslims who are physically and financially capable."
  },

  // Quranic Stories
  {
    question: "Which Surah narrates the story of Prophet Yusuf (Joseph) in detail?",
    options: ["Surah Maryam", "Surah Al-Baqarah", "Surah Yusuf", "Surah Al-Anbiya"],
    answer: "Surah Yusuf",
    topic: "Quranic Stories",
    explanation: "Surah Yusuf tells the life story of Prophet Yusuf (Joseph), including his childhood, imprisonment, and rise to power in Egypt."
  },
  {
    question: "In which Surah is the story of Prophet Musa and Khidr found?",
    options: ["Surah Al-Mulk", "Surah Al-Kahf", "Surah Maryam", "Surah Al-Anbiya"],
    answer: "Surah Al-Kahf",
    topic: "Quranic Stories",
    explanation: "Surah Al-Kahf includes the story of Prophet Musa (Moses) and Khidr, teaching lessons on divine wisdom and patience."
  },
  {
    question: "Who was the Prophet that was tested by being swallowed by a whale but survived through the mercy of Allah?",
    options: ["Prophet Yunus (Jonah)", "Prophet Musa (Moses)", "Prophet Isa (Jesus)", "Prophet Ibrahim (Abraham)"],
    answer: "Prophet Yunus (Jonah)",
    topic: "Quranic Stories",
    explanation: "Prophet Yunus was swallowed by a whale and saved after making the famous dua: 'There is no god but You, Glory be to You, indeed I was of the wrongdoers.'"
  },
  {
    question: "In the Quran, which Prophet's story includes interpreting the dreams of a king while imprisoned in Egypt?",
    options: ["Prophet Muhammad (PBUH)", "Prophet Zakariya (Zechariah)", "Prophet Yusuf (Joseph)", "Prophet Nuh (Noah)"],
    answer: "Prophet Yusuf (Joseph)",
    topic: "Quranic Stories",
    explanation: "Prophet Yusuf interpreted the king's dream about years of famine and abundance, which saved Egypt from starvation."
  },
  {
    question: "Which Prophet is known in the Quran for being thrown into a fire by his people but miraculously surviving unharmed?",
    options: ["Prophet Isa (Jesus)", "Prophet Ibrahim (Abraham)", "Prophet Hud", "Prophet Shuayb"],
    answer: "Prophet Ibrahim (Abraham)",
    topic: "Quranic Stories",
    explanation: "Prophet Ibrahim was thrown into a blazing fire by his people, but Allah commanded the fire to be cool and safe for him."
  },

  // Ethics and Morality in Islam
  {
    question: "Which of the following is strongly discouraged in Islam?",
    options: ["Kindness", "Gossiping", "Generosity", "Helping others"],
    answer: "Gossiping",
    topic: "Ethics and Morality in Islam",
    explanation: "Gossiping and backbiting are strongly condemned in Islam as they harm others and destroy brotherhood."
  },
  {
    question: "What does Islam say about respecting parents?",
    options: ["It's optional", "It's mandatory", "Only if they are Muslim", "Only if they are wealthy"],
    answer: "It's mandatory",
    topic: "Ethics and Morality in Islam",
    explanation: "Respecting and obeying parents is an obligation in Islam, second only to worshipping Allah."
  },
  {
    question: "What is the Quran's stance on honesty in speech and actions?",
    options: [
      "It is recommended but not obligatory.",
      "It is forbidden to speak the truth in all circumstances.",
      "Honesty is a fundamental ethical principle in Islam.",
      "Lying is allowed if it benefits oneself."
    ],
    answer: "Honesty is a fundamental ethical principle in Islam.",
    topic: "Ethics and Morality in Islam",
    explanation: "The Quran and Hadith emphasize truthfulness as a foundation of faith and morality."
  },
  {
    question: "What does the Quran teach about justice in Surah An-Nisa (4:135)?",
    options: [
      "Justice is only required among Muslims.",
      "Uphold justice even if it is against yourself or family.",
      "Justice is secondary to personal interest.",
      "Revenge is a form of justice."
    ],
    answer: "Uphold justice even if it is against yourself or family.",
    topic: "Ethics and Morality in Islam",
    explanation: "Surah An-Nisa commands fairness and justice even when it goes against oneself or relatives."
  },
  {
    question: "What does the Quran say about backbiting in Surah Al-Hujurat (49:12)?",
    options: [
      "It is a small sin that can be forgiven easily.",
      "It is like eating the flesh of your dead brother.",
      "It is encouraged to expose others' faults.",
      "It is a necessary evil for societal reform."
    ],
    answer: "It is like eating the flesh of your dead brother.",
    topic: "Ethics and Morality in Islam",
    explanation: "Surah Al-Hujurat condemns backbiting, likening it to eating the flesh of one's dead brother."
  }
];

export const getQuestionsByTopic = (topic: string): Question[] => {
  if (topic === 'All Topics') {
    return allQuestions;
  }
  return allQuestions.filter(q => q.topic === topic);
};

export const getUniqueTopics = (): string[] => {
  const topics = Array.from(new Set(allQuestions.map(q => q.topic)));
  return ['All Topics', ...topics];
};