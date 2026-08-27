export interface Question {
  id: string;
  subject: string;
  difficulty: 'Oson' | 'O\'rtacha' | 'Qiyin';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface User {
  id?: string;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
  xp: number;
  level: number;
  avatar?: string;
  rank: number;
  total_battles?: number;
  battles_won?: number;
  battles_lost?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  winRate: number;
  badge: string;
  isUser?: boolean;
}
