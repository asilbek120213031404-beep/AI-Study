import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  PlusCircle,
  Gamepad2,
  BarChart3,
  Settings,
  Calculator,
  Code,
  FlaskConical,
  Globe,
  BookOpen,
  Zap,
  Clock,
  Swords,
  ArrowLeft,
  Loader2,
  // FileText,
  ArrowRight,
  User as UserIcon,
  // CheckCircle2,
  // Shield,
  // Trophy
} from 'lucide-react';
import type { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (subject?: string) => void;
  onOpenLeaderboard: () => void;
  user: User | null;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onStartBattle,
  onOpenLeaderboard,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'asosiy' | 'yaratish' | 'qoshilish' | 'reyting' | 'sozlamalar'>('asosiy');
  const [selectedCreateSubject, setSelectedCreateSubject] = useState<string>('Matematika');
  const [inputBattleCode, setInputBattleCode] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [dbProfile, setDbProfile] = useState<{
    name: string;
    xp: number;
    level: number;
    rank: number;
    battles_won: number;
    battles_lost: number;
    avatar_url?: string;
    questions_for_math?: number;
    questions_for_physics?: number;
    questions_for_it?: number;
    questions_for_history?: number;
    questions_for_english?: number;
  } | null>(null);

  // Fetch real-time user profile data directly from Supabase
  useEffect(() => {
    const fetchProfileFromSupabase = async () => {
      if (!user?.id || !isSupabaseConfigured()) return;
      setIsLoadingProfile(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setDbProfile({
            name: profile.full_name || user.name || 'Foydalanuvchi',
            xp: profile.xp ?? user.xp ?? 500,
            level: profile.level ?? user.level ?? 1,
            rank: profile.rank ?? user.rank ?? 127,
            battles_won: profile.battles_won ?? user.battles_won ?? 0,
            battles_lost: profile.battles_lost ?? user.battles_lost ?? 0,
            avatar_url: profile.avatar_url || user.avatar,
            questions_for_math: profile.questions_for_math,
            questions_for_physics: profile.questions_for_physics,
            questions_for_it: profile.questions_for_it,
            questions_for_history: profile.questions_for_history,
            questions_for_english: profile.questions_for_english ?? profile.questions_for_math
          });
        }
      } catch (err) {
        console.error('Supabase profilini yuklashda xatolik:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (isOpen && user?.id) {
      fetchProfileFromSupabase();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Real-time Supabase profile values with fallbacks
  const userName = dbProfile?.name || user?.name || 'Rustam';
  const level = dbProfile?.level ?? user?.level ?? 12;
  const xp = dbProfile?.xp ?? user?.xp ?? 2450;
  const rank = dbProfile?.rank ?? user?.rank ?? 127;
  const wins = dbProfile?.battles_won ?? user?.battles_won ?? 45;
  const losses = dbProfile?.battles_lost ?? user?.battles_lost ?? 20;
  const winRate = losses > 0 ? Math.round(100 - (wins / losses) * 10) : (wins > 0 ? 100 : 0);
  const avatarUrl = dbProfile?.avatar_url || user?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80';

  const navItems = [
    { id: 'asosiy', label: 'Asosiy', icon: Home },
    { id: 'yaratish', label: 'Jang yaratish', icon: PlusCircle },
    { id: 'qoshilish', label: 'Jangga qo\'shilish', icon: Gamepad2 },
    { id: 'reyting', label: 'Reyting', icon: BarChart3 },
    { id: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
  ] as const;

  const subjects = [
    { name: 'Matematika', icon: Calculator, battles: '24 ta faol jang', questions: dbProfile?.questions_for_math ?? 180, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Dasturlash', icon: Code, battles: '56 ta faol jang', questions: dbProfile?.questions_for_it ?? 240, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { name: 'Fizika', icon: FlaskConical, battles: '12 ta faol jang', questions: dbProfile?.questions_for_physics ?? 150, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Ingliz tili', icon: Globe, battles: '89 ta faol jang', questions: dbProfile?.questions_for_english ?? dbProfile?.questions_for_math ?? 90, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { name: 'Tarix', icon: BookOpen, battles: '5 ta faol jang', questions: dbProfile?.questions_for_history ?? 120, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  ];

  // Specific subjects for Create Battle screen matching screenshot, populated from Supabase
  const createSubjects = [
    { name: 'Matematika', icon: Calculator, questions: dbProfile?.questions_for_math, color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30' },
    { name: 'Fizika', icon: FlaskConical, questions: dbProfile?.questions_for_physics, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    { name: 'Dasturlash', icon: Code, questions: dbProfile?.questions_for_it ?? 240, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
    { name: 'Tarix', icon: Globe, questions: dbProfile?.questions_for_history ?? 120, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  ];

  const recentBattles = [
    {
      id: 1,
      opponent: '@Aziz_Coder',
      subject: 'Dasturlash',
      time: 'Bugun',
      result: 'G\'alaba',
      xpChange: '+45 XP',
      isWin: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      opponent: '@MathGenius',
      subject: 'Matematika',
      time: 'Kecha',
      result: 'Mag\'lubiyat',
      xpChange: '-12 XP',
      isWin: false,
      initial: 'M'
    },
    {
      id: 3,
      opponent: '@Polyglot99',
      subject: 'Ingliz tili',
      time: '2 kun oldin',
      result: 'G\'alaba',
      xpChange: '+50 XP',
      isWin: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    }
  ];

  const handleNavClick = (id: typeof activeTab) => {
    setActiveTab(id);
    if (id === 'reyting') {
      onOpenLeaderboard();
    }
  };

  const handleGuestJoinRoom = async (codeToJoin?: string, defaultSubject: string = 'Dasturlash') => {
    const targetCode = (codeToJoin || inputBattleCode).trim().replace(/\s+/g, '');
    if (isSupabaseConfigured() && targetCode) {
      try {
        const { data: room } = await supabase
          .from('game_rooms')
          .select('*')
          .or(`room_code.eq.${targetCode},code.eq.${targetCode}`)
          .maybeSingle();

        if (room) {
          await supabase
            .from('game_rooms')
            .update({
              guest_id: user?.id,
              guest_name: user?.name || 'Raqib',
              guest_avatar: user?.avatar,
              status: 'matched'
            })
            .eq('id', room.id);

          onStartBattle(room.subject || defaultSubject);
          return;
        }
      } catch (err) {
        console.error('Supabase xonasiga ulanishda xatolik:', err);
      }
    }

    onStartBattle(defaultSubject);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070914] text-slate-100 min-h-screen flex flex-col md:flex-row overflow-hidden animate-fadeIn">

      {/* LEFT SIDEBAR (Full Height Panel) */}
      <aside className="w-full md:w-64 bg-[#0B0E1D] border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 z-20">
        <div className="space-y-6">

          {/* Back to Home Button & Brand Logo */}
          <div className="space-y-3 pt-1">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bosh sahifaga qaytish</span>
            </button>

            <div className="flex items-center gap-2.5 pt-2">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Swords className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                AI Study Battle
              </h2>
            </div>
          </div>

          {/* User Level Avatar Badge (Populated live from Supabase) */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#080A15] border border-slate-800/80 shadow-md relative">
            {isLoadingProfile && (
              <div className="absolute inset-0 bg-[#080A15]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            )}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={userName}
                className="w-11 h-11 rounded-xl object-cover border-2 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              />
              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full border border-slate-900">
                {level}
              </span>
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-slate-100 truncate">
                Level {level}
              </div>
              <div className="text-xs font-semibold text-slate-400">
                {xp.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all text-left ${isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-medium text-center">
          AI Study Battle v1.2
        </div>
      </aside>

      {/* MAIN DASHBOARD PAGE CONTENT AREA */}
      <main className="flex-1 bg-[#060812] p-5 md:p-8 overflow-y-auto space-y-6 relative custom-scrollbar">

        {/* TOP BAR ACTION HEADER */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {activeTab === 'yaratish' ? 'Jang Yaratish' : activeTab === 'qoshilish' ? 'Jangga Qo\'shilish' : activeTab === 'sozlamalar' ? 'Sozlamalar' : 'Boshqaruv Paneli'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {activeTab === 'yaratish' ? 'O\'z intellektual jang maydoningizni sozlang' : 'Statistika va tezkor janglar markazi'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB 1: ASOSIY DASHBOARD VIEW */}
        {activeTab === 'asosiy' && (
          <div className="space-y-6 animate-fadeIn">
            {/* TOP SECTION: Welcome Banner + User Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Welcome Banner Card (7 cols) */}
              <div className="lg:col-span-7 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Xush kelibsiz, <span className="text-gradient-purple">{userName}</span>
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-md">
                    Davom etish va reytingda ko'tarilish uchun yangi jang boshlang yoki mavjudlariga qo'shiling.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
                  <button
                    onClick={() => setActiveTab('yaratish')}
                    className="btn-primary-purple px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Yangi jang boshlash</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qoshilish')}
                    className="bg-[#070914] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    Jangga qo'shilish
                  </button>
                </div>
              </div>

              {/* Level & Stats Summary Card (5 cols - Supabase Real-time Stats) */}
              <div className="lg:col-span-5 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-white">
                      Level {level}
                    </div>
                  </div>
                  <div className="bg-[#14172B] text-purple-300 border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-tight">
                    Global Reyting: #{rank}
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">XP Progress</span>
                    <span className="text-slate-200">{xp.toLocaleString()} / {(Math.floor(xp / 1000) + 1) * 1000}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (xp % 1000) / 10))}%` }}
                    />
                  </div>
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
                  <div>
                    <div className="text-2xl font-black text-emerald-400">
                      {wins}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      G'alaba
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-rose-500">
                      {losses}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Mag'lubiyat
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-cyan-400">
                      {winRate}%
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Win rate
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* LOWER SECTION: Tezkor Janglar + So'nggi Janglar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Tezkor Janglar (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h4 className="text-lg font-extrabold text-white">
                    Tezkor Janglar
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subjects.map((sub, idx) => {
                    const Icon = sub.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedCreateSubject(sub.name);
                          setActiveTab('yaratish');
                        }}
                        className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#12162B] p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sub.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                            {sub.name}
                          </div>
                          <div className="text-xs font-semibold text-slate-400 pt-0.5">
                            {sub.battles}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* So'nggi Janglar (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-extrabold text-white">
                    So'nggi Janglar
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {recentBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className="bg-[#0C0F1E] border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between hover:bg-[#12162B] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {battle.avatar ? (
                          <img
                            src={battle.avatar}
                            alt={battle.opponent}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">
                            {battle.initial}
                          </div>
                        )}

                        <div>
                          <div className="font-bold text-xs md:text-sm text-slate-100">
                            {battle.opponent}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400">
                            {battle.subject} • {battle.time}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black ${battle.isWin ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {battle.result}
                        </span>
                        <span className={`block text-[10px] font-mono font-bold ${battle.isWin ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {battle.xpChange}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={onOpenLeaderboard}
                    className="w-full py-3 rounded-xl bg-[#0C0F1E] hover:bg-slate-800 border border-slate-800/80 text-xs font-bold text-slate-300 text-center transition-all cursor-pointer block mt-2"
                  >
                    Barchasini ko'rish
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: JANG YARATISH PAGE VIEW (MATCHING USER SCREENSHOT EXACTLY) */}
        {activeTab === 'yaratish' && (
          <div className="space-y-8 animate-fadeIn pt-2 max-w-5xl">
            {/* Header Text */}
            <div className="space-y-1.5">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Jang yaratish
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                O'z intellektual jang maydoningizni sozlang.
              </p>
            </div>

            {/* Subject Selection Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-bold text-white">
                Fanni tanlang
              </h3>

              {/* Grid of Subject Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {createSubjects.map((sub, idx) => {
                  const Icon = sub.icon;
                  const isSelected = selectedCreateSubject === sub.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedCreateSubject(sub.name);
                        onStartBattle(sub.name);
                      }}
                      className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-6 relative overflow-hidden ${isSelected
                        ? 'bg-[#0E1225] border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02]'
                        : 'bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/40 hover:bg-[#12162B]'
                        }`}
                    >
                      {/* Icon Box */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${sub.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Info Text */}
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white">
                          {sub.name}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Right CTA Action Button */}
            <div className="flex justify-end pt-8">
              <button
                onClick={() => onStartBattle(selectedCreateSubject)}
                className="btn-primary-purple px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center gap-2.5 shadow-xl shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Janggni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: JANGGA QO'SHILISH VIEW (MATCHING USER SCREENSHOT EXACTLY) */}
        {activeTab === 'qoshilish' && (
          <div className="space-y-8 animate-fadeIn pt-2 max-w-5xl">

            {/* Top Join Via Battle Code Card */}
            <div className="bg-gradient-to-br from-[#121426] via-[#0E1122] to-[#0A0D1B] border border-slate-800/90 rounded-3xl p-6 md:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-2 relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Jangga Qo'shilish
                </h2>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                  Sizga berilgan maxsus jang kodini kiriting va raqiblar bilan kuch sinashishni boshlang. Yoki quyidagi ommaviy janglardan biriga qo'shiling.
                </p>
              </div>

              {/* Code Input Form */}
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto pt-2 relative z-10">
                <input
                  type="text"
                  value={inputBattleCode}
                  onChange={(e) => setInputBattleCode(e.target.value)}
                  placeholder="# Jang kodini kiriting (masalan: BTL-8429)"
                  className="flex-1 w-full bg-[#080B17] border border-slate-800 focus:border-purple-500 rounded-2xl px-5 py-3.5 text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
                />
                <button
                  onClick={() => handleGuestJoinRoom(inputBattleCode, 'Dasturlash')}
                  className="btn-primary-purple px-6 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-105 transition-all w-full sm:w-auto shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Qo'shilish</span>
                </button>
              </div>
            </div>

            {/* Bottom Section: Ommaviy Janglar */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Ommaviy Janglar
                  </h3>
                  <p className="text-xs text-slate-400 font-medium pt-0.5">
                    Hozirda faol bo'lgan va qatnashchilar kutayotgan arenalar.
                  </p>
                </div>
                <button
                  onClick={() => onStartBattle()}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <span>Barchasini ko'rish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Public Arena Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">

                {/* Card 1: Algoritmlar */}
                <div className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#12162B] rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Algoritmlar
                      </span>
                      <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        15 daqiqa
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      Dijkstra vs A* Star
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Eng qisqa yo'lni topish algoritmlari bo'yicha tezkor musobaqa. Graph nazariyasini bilish talab etiladi.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      12 / 20
                    </span>
                    <button
                      onClick={() => onStartBattle('Algoritmlar')}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-purple-600 hover:border-purple-500 hover:text-white text-xs font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      Qo'shilish
                    </button>
                  </div>
                </div>

                {/* Card 2: Frontend */}
                <div className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#12162B] rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        Frontend
                      </span>
                      <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        45 daqiqa
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      React Hooks Masterclass
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Custom hooklar yaratish va state management bo'yicha amaliy topshiriqlar jangi.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      8 / 10
                    </span>
                    <button
                      onClick={() => onStartBattle('Dasturlash')}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-purple-600 hover:border-purple-500 hover:text-white text-xs font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      Qo'shilish
                    </button>
                  </div>
                </div>

                {/* Card 3: Ma'lumotlar Bazasi */}
                <div className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#12162B] rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Ma'lumotlar Bazasi
                      </span>
                      <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        30 daqiqa
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      Murakkab SQL So'rovlari
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ko'p jadvalli JOINlar, subquerylar va window funksiyalaridan foydalanib muammolarni hal qiling.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      45 / 50
                    </span>
                    <button
                      onClick={() => onStartBattle('Dasturlash')}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-purple-600 hover:border-purple-500 hover:text-white text-xs font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      Qo'shilish
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SOZLAMALAR VIEW */}
        {activeTab === 'sozlamalar' && (
          <div className="space-y-6 animate-fadeIn pt-2 max-w-3xl">
            <div className="space-y-1.5">
              <h2 className="text-3xl font-black text-white tracking-tight">
                Sozlamalar
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                Profil va hisob sozlamalarini boshqaring.
              </p>
            </div>

            <div className="bg-[#0C0F1E] border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/60"
                />
                <div>
                  <h4 className="font-bold text-lg text-white">{userName}</h4>
                  <p className="text-xs text-slate-400">{user?.email || 'foydalanuvchi@misol.com'}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Joriy daraja</span>
                  <span className="text-purple-400 font-bold">Level {level}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Jami to'plangan XP</span>
                  <span className="text-amber-400 font-bold">{xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
