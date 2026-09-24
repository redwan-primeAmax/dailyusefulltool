/**
 * Addiction Remover Domain Model & 21-Day Challenge Architecture.
 * Pure logic and structured content based on neuroplasticity science.
 */

export interface PhaseInfo {
  phase: number;
  name: string;
  subtitle: string;
  dayRange: string;
  startDay: number;
  endDay: number;
  color: string;
  description: string;
  scientificInsight: string;
  keyAction: string;
}

export const CHALLENGE_PHASES: PhaseInfo[] = [
  {
    phase: 1,
    name: 'Phase 1: Detox & Craving Control',
    subtitle: 'The Foundation',
    dayRange: 'Days 1 – 7',
    startDay: 1,
    endDay: 7,
    color: '#f59e0b', // Amber/Gold
    description: 'Break initial dopamine loops, manage acute cravings, and build psychological willpower.',
    scientificInsight: 'Dopamine receptor sensitivity begins recalibrating within 72 hours. Cravings peak between days 3–5 and drop sharply thereafter.',
    keyAction: 'Use the 3-Minute Urge Surfing SOS whenever a craving hits.',
  },
  {
    phase: 2,
    name: 'Phase 2: Habit Rewiring',
    subtitle: 'The Turning Point',
    dayRange: 'Days 8 – 14',
    startDay: 8,
    endDay: 14,
    color: '#0ea5e9', // Sky Blue
    description: 'Replace old automated triggers with empowering physical, creative, and mental habits.',
    scientificInsight: 'Synaptic connections for old urges weaken as new neural pathways form in the prefrontal cortex.',
    keyAction: 'Reinforce substitute routines (exercise, water, reading, deep work).',
  },
  {
    phase: 3,
    name: 'Phase 3: Identity Transformation',
    subtitle: 'The New You',
    dayRange: 'Days 15 – 21',
    startDay: 15,
    endDay: 21,
    color: '#10b981', // Emerald
    description: 'Cement your identity as someone who is completely free, resilient, and in total control.',
    scientificInsight: '21 continuous days of abstinence establishes automaticity and consolidates high self-efficacy.',
    keyAction: 'Celebrate total mastery and step confidently into lifelong freedom.',
  },
];

export interface PresetAddiction {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  typicalTriggers: string[];
}

export const PRESET_ADDICTIONS: PresetAddiction[] = [
  {
    id: 'smoking',
    name: 'Smoking / Vaping',
    category: 'Substance',
    emoji: '🚭',
    color: '#ef4444',
    typicalTriggers: ['Stress', 'After meals', 'Social drinking', 'Boredom'],
  },
  {
    id: 'sugar',
    name: 'Sugar & Junk Food',
    category: 'Diet & Health',
    emoji: '🥗',
    color: '#f97316',
    typicalTriggers: ['Late night snacking', 'Emotional stress', 'Energy slump', 'Celebrations'],
  },
  {
    id: 'social_media',
    name: 'Social Media & Doomscrolling',
    category: 'Digital',
    emoji: '📵',
    color: '#0ea5e9',
    typicalTriggers: ['Waking up', 'Procrastination', 'Bedtime', 'Idleness'],
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    category: 'Substance',
    emoji: '🍵',
    color: '#8b5cf6',
    typicalTriggers: ['Social outings', 'Unwinding after work', 'Anxiety', 'Weekends'],
  },
  {
    id: 'gaming',
    name: 'Excessive Gaming',
    category: 'Digital',
    emoji: '🎮',
    color: '#14b8a6',
    typicalTriggers: ['Escapism', 'Free evenings', 'Peer invites', 'Avoiding chores'],
  },
  {
    id: 'caffeine',
    name: 'Excessive Caffeine',
    category: 'Substance',
    emoji: '💧',
    color: '#d97706',
    typicalTriggers: ['Morning grogginess', 'Afternoon slump', 'Habitual cup'],
  },
  {
    id: 'gambling',
    name: 'Gambling & Betting',
    category: 'Behavioral',
    emoji: '🎲',
    color: '#e11d48',
    typicalTriggers: ['Chasing losses', 'Financial stress', 'Thrill seeking'],
  },
  {
    id: 'shopping',
    name: 'Compulsive Shopping',
    category: 'Behavioral',
    emoji: '🛍️',
    color: '#ec4899',
    typicalTriggers: ['Flash sales', 'Feeling down', 'Boredom scrolling'],
  },
];

export const PRESET_REASONS: string[] = [
  'Reclaim my mental clarity & razor-sharp focus',
  'Improve my physical health, energy & longevity',
  'Save money & achieve financial freedom',
  'Restore deep self-respect and bulletproof discipline',
  'Be a role model for my family & loved ones',
  'Break free from dopamine dependency',
  'Sleep deeper and wake up energized',
];

export interface MilestoneBadge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  daysRequired: number;
  phase: number;
}

export const MILESTONE_BADGES: MilestoneBadge[] = [
  {
    id: 'b_24h',
    name: 'First Step',
    description: 'Survived the first 24 hours of freedom.',
    emoji: '🌱',
    daysRequired: 1,
    phase: 1,
  },
  {
    id: 'b_3d',
    name: 'Craving Crusher',
    description: 'Overcame the initial 72-hour peak craving window.',
    emoji: '⚡',
    daysRequired: 3,
    phase: 1,
  },
  {
    id: 'b_5d',
    name: 'Willpower Warrior',
    description: '5 straight days of clean living and resilience.',
    emoji: '🛡️',
    daysRequired: 5,
    phase: 1,
  },
  {
    id: 'b_7d',
    name: 'Phase 1 Champion',
    description: 'Completed 1 full week! Detox milestone achieved.',
    emoji: '🏆',
    daysRequired: 7,
    phase: 1,
  },
  {
    id: 'b_10d',
    name: 'Double Digits',
    description: '10 days clean. New neural pathways are active.',
    emoji: '🔥',
    daysRequired: 10,
    phase: 2,
  },
  {
    id: 'b_14d',
    name: 'Phase 2 Master',
    description: '2 weeks unbroken! Habit rewiring is taking hold.',
    emoji: '💎',
    daysRequired: 14,
    phase: 2,
  },
  {
    id: 'b_18d',
    name: 'Freedom Seeker',
    description: '18 days of total control. The finish line is in sight.',
    emoji: '🚀',
    daysRequired: 18,
    phase: 3,
  },
  {
    id: 'b_21d',
    name: '21-Day Freedom Master',
    description: 'Challenge Completed! You have conquered your addiction!',
    emoji: '👑',
    daysRequired: 21,
    phase: 3,
  },
  {
    id: 'b_30d',
    name: 'Unstoppable Legend',
    description: '30+ Days clean. A permanent lifestyle transformation.',
    emoji: '🌟',
    daysRequired: 30,
    phase: 4,
  },
];

export interface DailyMotivation {
  day: number;
  quote: string;
  author: string;
  tip: string;
  powerWord: string;
}

export const DAILY_MOTIVATIONS: DailyMotivation[] = [
  {
    day: 1,
    quote: 'The journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    tip: 'Day 1 is about declaring your freedom. Rid your environment of any triggers or cues right now.',
    powerWord: 'DECISION',
  },
  {
    day: 2,
    quote: 'You do not have to control your thoughts. You just have to stop letting them control you.',
    author: 'Dan Millman',
    tip: 'Notice your cravings as temporary physical sensations that rise, crest like a wave, and dissipate in 3 minutes.',
    powerWord: 'AWARENESS',
  },
  {
    day: 3,
    quote: 'Strength does not come from winning. Your struggles develop your strengths.',
    author: 'Arnold Schwarzenegger',
    tip: 'Day 3 is often the peak physical withdrawal. Drink cold water, take deep breaths, and stay active.',
    powerWord: 'RESILIENCE',
  },
  {
    day: 4,
    quote: 'He who conquers himself is the mightiest warrior.',
    author: 'Confucius',
    tip: 'Your brain chemistry is recalibrating right now. Every urge you say no to rewires your dopamine baseline.',
    powerWord: 'MASTERY',
  },
  {
    day: 5,
    quote: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
    tip: 'You are over the initial hump! Notice how much clearer your head feels today.',
    powerWord: 'PROGRESS',
  },
  {
    day: 6,
    quote: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
    tip: 'Replace old idle time with positive actions: exercise, a walk, reading, or drinking fresh water.',
    powerWord: 'DISCIPLINE',
  },
  {
    day: 7,
    quote: 'One week clean. You have proven you have the power to change your life.',
    author: 'Neural Rewiring Principle',
    tip: '🎉 1 WEEK MILESTONE! Phase 1 Complete. Take pride in your commitment — you are building real momentum.',
    powerWord: 'VICTORY',
  },
  {
    day: 8,
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
    tip: 'Welcome to Phase 2: Habit Rewiring. Focus on building the healthy replacement routines that will sustain you.',
    powerWord: 'TRANSFORMATION',
  },
  {
    day: 9,
    quote: 'The secret of change is to focus all of your energy not on fighting the old, but on building the new.',
    author: 'Socrates',
    tip: 'When an old cue appears, immediately substitute your new anchor action without debate.',
    powerWord: 'FOCUS',
  },
  {
    day: 10,
    quote: 'Double digits! 10 days of freedom and strength.',
    author: 'Mindset Core',
    tip: 'Double digits reached! Your self-control muscle is twice as strong today as it was on Day 1.',
    powerWord: 'MOMENTUM',
  },
  {
    day: 11,
    quote: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
    tip: 'Look at how much time and energy you have saved over the last 11 days. Keep channeling it constructively.',
    powerWord: 'CONSISTENCY',
  },
  {
    day: 12,
    quote: 'Your past does not define your future. Your choices today define who you become.',
    author: 'Marcus Aurelius',
    tip: 'Avoid complacency. If a subtle craving whispers, acknowledge it and immediately move your body.',
    powerWord: 'VIGILANCE',
  },
  {
    day: 13,
    quote: 'Almost two weeks. The habit loop is breaking down.',
    author: 'Cognitive Behavioral Science',
    tip: 'Your automatic impulse is losing its grip. You are now making conscious, deliberate decisions.',
    powerWord: 'CLARITY',
  },
  {
    day: 14,
    quote: 'Phase 2 Completed! Two full weeks of clean, disciplined living.',
    author: 'Milestone Honor',
    tip: '🔥 2 WEEKS COMPLETE! You have conquered the hardest part of habit rewiring. Phase 3 begins tomorrow.',
    powerWord: 'TRIUMPH',
  },
  {
    day: 15,
    quote: 'You are no longer trying to quit. You are someone who is free.',
    author: 'Identity Shift Law',
    tip: 'Phase 3: Identity Transformation. Adopt the mindset: "I don\'t do that anymore — that\'s who I used to be."',
    powerWord: 'IDENTITY',
  },
  {
    day: 16,
    quote: 'Freedom is the oxygen of the soul.',
    author: 'Moshe Dayan',
    tip: 'Feel the peace of not being bound by an impulse. You own your time, your health, and your focus.',
    powerWord: 'FREEDOM',
  },
  {
    day: 17,
    quote: 'Courage is resistance to fear, mastery of fear—not absence of fear.',
    author: 'Mark Twain',
    tip: 'Only 4 days left in your 21-Day Challenge! Stay sharp and finish with absolute excellence.',
    powerWord: 'COURAGE',
  },
  {
    day: 18,
    quote: 'Your future self will thank you for the battle you are winning today.',
    author: 'Stoic Wisdom',
    tip: 'Reflect on how far you have come from Day 1. The old habit feels alien to the new person you have built.',
    powerWord: 'GRATITUDE',
  },
  {
    day: 19,
    quote: 'The difference between who you are and who you want to be is what you do.',
    author: 'Bill Phillips',
    tip: '2 days until 21-day mastery! Keep your environment clean and your mind empowered.',
    powerWord: 'POWER',
  },
  {
    day: 20,
    quote: 'The penultimate day. You are standing on the threshold of victory.',
    author: 'Discipline Code',
    tip: 'Tomorrow you complete the 21-Day Neural Rewiring Challenge. Prepare to celebrate this massive milestone.',
    powerWord: 'EXCELLENCE',
  },
  {
    day: 21,
    quote: '21 DAYS CONQUERED! You have mastered your mind and claimed your freedom!',
    author: 'Challenge Mastery',
    tip: '👑 YOU DID IT! 21 full days of discipline, courage, and triumph. You have broken the addiction and built a new life.',
    powerWord: 'CHAMPION',
  },
];

export function getDailyMotivation(dayNumber: number): DailyMotivation {
  if (dayNumber <= 0) return DAILY_MOTIVATIONS[0];
  if (dayNumber <= 21) return DAILY_MOTIVATIONS[dayNumber - 1] ?? DAILY_MOTIVATIONS[20];
  // Post-21 days:
  const overflowQuotes = [
    { quote: 'Consistency is the DNA of mastery.', author: 'Robin Sharma', tip: 'Day ' + dayNumber + ' of continued freedom. You are an inspiration.', powerWord: 'UNBREAKABLE' },
    { quote: 'Do not count the days, make the days count.', author: 'Muhammad Ali', tip: 'Keep living by your values. Freedom is a daily standard.', powerWord: 'LEGEND' },
    { quote: 'We suffer more often in imagination than in reality.', author: 'Seneca', tip: 'You have conquered the craving. Enjoy your healthy life.', powerWord: 'SOVEREIGN' },
  ];
  return {
    day: dayNumber,
    ...overflowQuotes[dayNumber % overflowQuotes.length],
  };
}
