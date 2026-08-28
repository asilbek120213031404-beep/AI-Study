import React, { useState } from 'react';
import { LogIn, LogOut, Bell, Zap, User as UserIcon, Menu, X } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  onOpenLogin: () => void;
  onLogout: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onLogout, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <header className="w-full bg-[#070913]/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800/60 px-4 md:px-8 py-3.5 relative">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            AI Study Battle
          </h1>
        </div>

        {/* Desktop Navigation & Actions (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-3">
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
                <span>Chiqish</span>
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

          <button
            className="p-2 rounded-xl bg-[#0D111F] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Bildirishnomalar"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            className="p-2 rounded-xl bg-[#0D111F] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Energiya va Boost"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Header Right Bar (User Badge + Menu Button) */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="flex items-center gap-1.5 bg-[#0D111F] px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-200">
              <UserIcon className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[80px]">{user.name}</span>
              <span className="font-bold text-amber-400">({user.xp})</span>
            </div>
          )}

          {/* Menu Button Toggle */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-xl bg-[#0D111F] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            aria-label="Menyu"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800/90 shadow-2xl">
          {!user && (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-300 font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-purple-400" />
                Kirish / Ro'yxatdan o'tish
              </span>
            </button>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D111F] border border-slate-800/80 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              Bildirishnomalar
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D111F] border border-slate-800/80 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Energiya va Boost
            </span>
            <span className="text-amber-400 font-bold text-[10px] bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              Faol
            </span>
          </div>

          {user && (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors hover:bg-rose-500/20"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                Tizimdan chiqish
              </span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
