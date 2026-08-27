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

export interface GameRoom {
  id: string;
  room_code: string;
  subject: string;
  host_id: string;
  host_name: string | null;
  host_avatar: string | null;
  guest_id: string | null;
  guest_name: string | null;
  guest_avatar: string | null;
  status: 'waiting' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}
