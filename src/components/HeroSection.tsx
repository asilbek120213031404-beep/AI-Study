import React from 'react';
import { Swords, BarChart3 } from 'lucide-react';

interface HeroSectionProps {
  onStartBattle: () => void;
  onOpenLeaderboard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartBattle, onOpenLeaderboard }) => {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
      
      {/* Left Text & CTAs */}
      <div className="lg:col-span-6 space-y-6">
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
          O'qi. Jang qil. <br />
          <span className="text-gradient-purple">G'alaba qozon!</span>
        </h1>

        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
          Bilimingizni real vaqt rejimida raqobatbardosh tajribaga aylantiring. Fanlarni tanlang, bilimlaingizni sinovdan o'tkazing va peshqadamlar qatoriga qo'shiling.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* Jangni boshlash button */}
          <button
            onClick={onStartBattle}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white btn-primary-purple"
          >
            <Swords className="w-4 h-4" />
            <span>Jangni boshlash</span>
          </button>

          {/* Reytingni ko'rish button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-[#0D111F] hover:bg-slate-800 border border-slate-700/80 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Reytingni ko'rish</span>
          </button>
        </div>
      </div>

      {/* Right Hero Battle Widget (Static Showcase - Non-interactive) */}
      <div className="lg:col-span-6 pointer-events-none select-none">
        <div className="bg-[#0B0F1D] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          
          {/* Battle Header: Siz 1250 XP VS Raqib 1310 XP */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            {/* Player Info */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              <div>
                <span className="font-bold text-sm text-slate-200 block">Siz</span>
                <span className="text-xs font-semibold text-slate-400">1250 XP</span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="text-xl font-black text-amber-400 tracking-wider">
              VS
            </div>

            {/* Opponent Info */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="font-bold text-sm text-slate-200 block">Raqib</span>
                <span className="text-xs font-semibold text-slate-400">1310 XP</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-[#111629] p-5 rounded-xl border border-slate-800/60 space-y-3">
            <div className="text-xs font-medium text-slate-400">
              Matematika • Qiyin
            </div>
            <p className="font-bold text-base md:text-lg text-white leading-snug">
              x^2 - 5x + 6 = 0 tenglamaning ildizlari yig'indisini toping.
            </p>
          </div>

          {/* 4 Option Grid (Static visual options matching screenshot) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="py-3.5 px-4 rounded-xl text-sm font-semibold text-center bg-[#111629] border border-slate-800 text-slate-300">
              -5
            </div>
            <div className="py-3.5 px-4 rounded-xl text-sm font-semibold text-center bg-[#312E81] border border-indigo-500 text-white shadow-md">
              5
            </div>
            <div className="py-3.5 px-4 rounded-xl text-sm font-semibold text-center bg-[#111629] border border-slate-800 text-slate-300">
              6
            </div>
            <div className="py-3.5 px-4 rounded-xl text-sm font-semibold text-center bg-[#111629] border border-slate-800 text-slate-300">
              -6
            </div>
          </div>

        </div>
      </div>

    </section>
  );
};

