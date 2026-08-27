import { LogIn, LogOut, Bell, Zap, User as UserIcon } from 'lucide-react';
import type { User } from '../types';
// import { UserStar } from 'lucide-react';
// import { useState } from 'react';

interface HeaderProps {
  onOpenLogin: () => void;
  onLogout: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onLogout, user }) => {


  return (
    <header className="w-full bg-[#070913]/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800/60 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
          AI Study Battle
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0D111F] px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200">
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>{user.name}</span>
              <span className="ml-1 font-bold text-amber-400">({user.xp} XP)</span>
            </div>

            {/* LogOut Button */}
            <button
              onClick={onLogout}
              title="Tizimdan chiqish"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D111F] hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 bg-[#0D111F] hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 transition-all shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5 text-purple-400" />
            <span>Kirish</span>
          </button>
        )}

        <button className="p-2 rounded-xl bg-[#0D111F] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <button className="p-2 rounded-xl bg-[#0D111F] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
          <Zap className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
