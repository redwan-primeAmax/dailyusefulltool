import type {
  AddictionChallenge,
  ChallengeDifficulty,
  ChallengeDurationDays,
  ChallengeTimeUnit,
} from '../../types';

export interface ChallengeOption {
  id: ChallengeDifficulty;
  title: string;
  englishTitle: string;
  durationDays: ChallengeDurationDays;
  description: string;
  emoji: string;
}

export const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    id: 'easy',
    title: 'সহজ',
    englishTitle: 'EASY',
    durationDays: 7,
    description: '৭ দিনের ছোট শুরু',
    emoji: '🌱',
  },
  {
    id: 'medium',
    title: 'মাঝারি',
    englishTitle: 'MEDIUM',
    durationDays: 14,
    description: '১৪ দিনের ধারাবাহিক চেষ্টা',
    emoji: '🌿',
  },
  {
    id: 'hard',
    title: 'কঠিন',
    englishTitle: 'HARD',
    durationDays: 22,
    description: '২২ দিনের বড় লক্ষ্য',
    emoji: '🔥',
  },
];

export const COUNTDOWN_OPTIONS: { id: ChallengeTimeUnit; label: string }[] = [
  { id: 'seconds', label: 'সেকেন্ড' },
  { id: 'minutes', label: 'মিনিট' },
  { id: 'normal', label: 'স্বাভাবিক' },
  { id: 'hours', label: 'ঘণ্টা' },
];

export const DAILY_MESSAGES = [
  'শুরু করেছ—এটাই আজকের বড় পদক্ষেপ।',
  'আজ শুধু পরের ছোট সিদ্ধান্তটিতে মন দাও।',
  'কঠিন লাগলে একটু থামো, পানি খাও, নিরাপদ কারও সঙ্গে কথা বলো।',
  'যে পরিস্থিতি তোমাকে টানে, আজ তার থেকে একটু দূরত্ব তৈরি করো।',
  'নিজের উদ্দেশ্য মনে করো—কেন এই পরিবর্তন শুরু করেছ?',
  'একবারে পুরো পথ নয়; আজকের দিনটুকুই সামলাও।',
  'প্রথম সপ্তাহের শেষ দিন—নিজের চেষ্টাকে স্বীকার করো।',
  'নতুন সপ্তাহ, নতুন সুযোগ; আগের দিনগুলোর অভিজ্ঞতা কাজে লাগাও।',
  'কোন সময়ে ইচ্ছেটা বাড়ে খেয়াল করো—খেয়াল করাটাও অগ্রগতি।',
  'সহায়তা চাওয়া সাহসী পদক্ষেপ।',
  'কঠিন মুহূর্তে লক্ষ্য ছোট করো—পরের দশ মিনিট দিয়ে শুরু করো।',
  'আজ একটি নিরাপদ বিকল্প আগে থেকে ঠিক করে রাখো।',
  'অগ্রগতি সবসময় সোজা পথে হয় না; আবার শুরু করা যায়।',
  'দুই সপ্তাহের পথ—তুমি চেষ্টা চালিয়ে যাচ্ছ।',
  'আজ নিজের চারপাশ থেকে একটি প্রলোভনের সংকেত সরিয়ে রাখো।',
  'বিশ্বাসের কাউকে তোমার লক্ষ্যটা জানাও।',
  'কঠিন অনুভূতি কিছু সময় থাকতে পারে; সাহায্য নেওয়া ঠিক আছে।',
  'আজ নিজের প্রতি কঠোর না হয়ে পরের ভালো সিদ্ধান্তটি বেছে নাও।',
  'তোমার পরিকল্পনা কাজ না করলে, সেটি বদলানো যায়।',
  'বিশ্রাম ও নিরাপদ পরিবেশের যত্ন নাও।',
  'আরেকটি দিন চেষ্টা—এটিও মূল্যবান।',
  'শেষ দিনের চেষ্টা—আজও নিজের যত্নকে গুরুত্ব দাও।',
] as const;

export function toBanglaDigits(value: number | string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}

export function getChallengeDay(challenge: AddictionChallenge, nowTs = Date.now()): number {
  const elapsedDays = Math.max(0, Math.floor((nowTs - challenge.startTs) / 86_400_000));
  return Math.min(challenge.durationDays, elapsedDays + 1);
}

export function getRemainingMs(challenge: AddictionChallenge, nowTs = Date.now()): number {
  const deadline = challenge.startTs + challenge.durationDays * 86_400_000;
  return Math.max(0, deadline - nowTs);
}

export function getCountdownValue(
  challenge: AddictionChallenge,
  unit: Exclude<ChallengeTimeUnit, 'normal'>,
  nowTs = Date.now(),
): number {
  const remainingMs = getRemainingMs(challenge, nowTs);
  const divisor = unit === 'seconds' ? 1_000 : unit === 'minutes' ? 60_000 : 3_600_000;
  return Math.ceil(remainingMs / divisor);
}

export function getNormalCountdown(challenge: AddictionChallenge, nowTs = Date.now()) {
  const totalSeconds = Math.ceil(getRemainingMs(challenge, nowTs) / 1_000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function getDailyMessage(day: number, durationDays: number): string {
  const safeDay = Math.max(1, Math.min(Math.floor(day), durationDays, DAILY_MESSAGES.length));
  return DAILY_MESSAGES[safeDay - 1] ?? DAILY_MESSAGES[0];
}

export function getChallengeOption(difficulty: ChallengeDifficulty): ChallengeOption {
  return CHALLENGE_OPTIONS.find((option) => option.id === difficulty) ?? CHALLENGE_OPTIONS[0];
}
