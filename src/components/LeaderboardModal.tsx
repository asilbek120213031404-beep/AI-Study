import React, { useState, useEffect } from 'react';
import { X, Trophy, Loader2 } from 'lucide-react';
import type { LeaderboardEntry, User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Sardorbek_AI', xp: 18450, winRate: 92, badge: '👑 Grandmaster' },
  { rank: 2, name: 'Malika_Dev', xp: 14200, winRate: 88, badge: '💎 Master' },
  { rank: 3, name: 'Javohir_Math', xp: 11900, winRate: 85, badge: '🥇 Diamond' },
  { rank: 4, name: 'Siz (You)', xp: 1250, winRate: 80, badge: '⚡ Platinum', isUser: true },
  { rank: 5, name: 'Anvar_Code', xp: 950, winRate: 74, badge: '🥇 Gold' },
];

const getBadgeByXP = (xp: number, rank: number): string => {
  if (rank === 1 || xp >= 15000) return '👑 Grandmaster';
  if (rank === 2 || xp >= 10000) return '💎 Master';
  if (rank === 3 || xp >= 5000) return '🥇 Diamond';
  if (xp >= 1000) return '⚡ Platinum';
  return '🥇 Gold';
};

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, user }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      if (!isSupabaseConfigured()) {
        setLeaderboard(MOCK_LEADERBOARD);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, xp, battles_won, total_battles')
          .order('xp', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const mapped: LeaderboardEntry[] = data.map((item: any, index: number) => {
            const rank = index + 1;
            const won = item.battles_won || 0;
            const total = item.total_battles || 0;
            const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
            const isUser = Boolean(user?.id && item.id === user.id);

            return {
              rank,
              name: item.full_name || 'O\'yinchi',
              xp: item.xp || 500,
              winRate,
              badge: getBadgeByXP(item.xp || 500, rank),
              isUser,
            };
          });

          setLeaderboard(mapped);
        } else {
          setLeaderboard(MOCK_LEADERBOARD);
        }
      } catch (err) {
        console.error('Reytingni yuklashda xatolik:', err);
        setLeaderboard(MOCK_LEADERBOARD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B0F1D] border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Global Reyting Jadvali</h3>
            <p className="text-slate-400 text-xs">Mavsumning eng kuchli foydalanuvchilari</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-purple-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Reyting yuklanmoqda...</span>
            </div>
          ) : (
            leaderboard.map((item) => (
              <div
                key={item.rank}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  item.isUser
                    ? 'bg-purple-950/60 border-purple-500/60 text-white font-bold'
                    : 'bg-[#111629] border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-xs ${
                    item.rank === 1 ? 'bg-amber-500 text-black' :
                    item.rank === 2 ? 'bg-slate-300 text-black' :
                    item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.rank}
                  </span>
                  <span className="font-semibold">{item.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{item.badge}</span>
                  <span className="font-black text-purple-400">{item.xp} XP</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
