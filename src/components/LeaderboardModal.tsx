import { X, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Sardorbek_AI', xp: 18450, winRate: 92, badge: '👑 Grandmaster' },
  { rank: 2, name: 'Malika_Dev', xp: 14200, winRate: 88, badge: '💎 Master' },
  { rank: 3, name: 'Javohir_Math', xp: 11900, winRate: 85, badge: '🥇 Diamond' },
  { rank: 4, name: 'Siz (You)', xp: 1250, winRate: 80, badge: '⚡ Platinum', isUser: true },
  { rank: 5, name: 'Anvar_Code', xp: 950, winRate: 74, badge: '🥇 Gold' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
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
          {MOCK_LEADERBOARD.map((item) => (
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
          ))}
        </div>

      </div>
    </div>
  );
};
