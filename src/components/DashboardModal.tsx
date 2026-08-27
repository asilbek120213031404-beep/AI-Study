import React, { useEffect, useState } from 'react';
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
  // Clock,
  Swords,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import type { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JoinBattleSection } from './JoinBattleSection';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (subject?: string, directBattle?: boolean) => void;
  onOpenLeaderboard: () => void;
  user: User | null;
}

interface DbProfile {
  full_name?: string | null;
  xp?: number | null;
  level?: number | null;
  rank?: number | null;
  battles_won?: number | null;
  battles_lost?: number | null;
  avatar_url?: string | null;
  questions_for_math?: number | null;
  questions_for_physics?: number | null;
  questions_for_it?: number | null;
  questions_for_history?: number | null;
  questions_for_english?: number | null;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onStartBattle,
  onOpenLeaderboard,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<
    'asosiy' | 'yaratish' | 'qoshilish' | 'reyting' | 'sozlamalar'
  >('asosiy');

  const [selectedCreateSubject, setSelectedCreateSubject] =
    useState<string>('Matematika');

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

  /*
   * ============================================================
   * USER PROFILE
   * ============================================================
   */

  useEffect(() => {
    if (!isOpen || !user?.id || !isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setIsLoadingProfile(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Profilni olishda xatolik:', error);
          return;
        }

        if (!data || cancelled) {
          return;
        }

        const profile = data as DbProfile;

        setDbProfile({
          name: profile.full_name || user.name || 'Foydalanuvchi',
          xp: profile.xp ?? user.xp ?? 0,
          level: profile.level ?? user.level ?? 1,
          rank: profile.rank ?? user.rank ?? 0,
          battles_won: profile.battles_won ?? user.battles_won ?? 0,
          battles_lost: profile.battles_lost ?? user.battles_lost ?? 0,
          avatar_url: profile.avatar_url || user.avatar,
          questions_for_math: profile.questions_for_math ?? undefined,
          questions_for_physics: profile.questions_for_physics ?? undefined,
          questions_for_it: profile.questions_for_it ?? undefined,
          questions_for_history: profile.questions_for_history ?? undefined,
          questions_for_english:
            profile.questions_for_english ?? undefined,
        });
      } catch (error) {
        console.error('❌ Supabase profil xatosi:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

  if (!isOpen) {
    return null;
  }

  /*
   * ============================================================
   * USER DATA
   * ============================================================
   */

  const userName =
    dbProfile?.name ||
    user?.name ||
    'Foydalanuvchi';

  const level =
    dbProfile?.level ??
    user?.level ??
    1;

  const xp =
    dbProfile?.xp ??
    user?.xp ??
    0;

  const rank =
    dbProfile?.rank ??
    user?.rank ??
    0;

  const wins =
    dbProfile?.battles_won ??
    user?.battles_won ??
    0;

  const losses =
    dbProfile?.battles_lost ??
    user?.battles_lost ??
    0;

  const totalBattles = wins + losses;

  const winRate =
    totalBattles > 0
      ? Math.round((wins / totalBattles) * 100)
      : 0;

  const avatarUrl =
    dbProfile?.avatar_url ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80';

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const navItems = [
    {
      id: 'asosiy',
      label: 'Asosiy',
      icon: Home,
    },
    {
      id: 'yaratish',
      label: 'Jang yaratish',
      icon: PlusCircle,
    },
    {
      id: 'qoshilish',
      label: "Jangga qo'shilish",
      icon: Gamepad2,
    },
    {
      id: 'reyting',
      label: 'Reyting',
      icon: BarChart3,
    },
    {
      id: 'sozlamalar',
      label: 'Sozlamalar',
      icon: Settings,
    },
  ] as const;

  const handleNavClick = (
    id: typeof activeTab
  ) => {
    setActiveTab(id);

    if (id === 'reyting') {
      onOpenLeaderboard();
    }
  };

  /*
   * ============================================================
   * SUBJECTS
   * ============================================================
   */

  const subjects = [
    {
      name: 'Matematika',
      icon: Calculator,
      battles: '24 ta faol jang',
      questions: dbProfile?.questions_for_math ?? 180,
      color:
        'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      name: 'Dasturlash',
      icon: Code,
      battles: '56 ta faol jang',
      questions: dbProfile?.questions_for_it ?? 240,
      color:
        'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      name: 'Fizika',
      icon: FlaskConical,
      battles: '12 ta faol jang',
      questions: dbProfile?.questions_for_physics ?? 150,
      color:
        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      name: 'Ingliz tili',
      icon: Globe,
      battles: '89 ta faol jang',
      questions: dbProfile?.questions_for_english ?? 90,
      color:
        'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      name: 'Tarix',
      icon: BookOpen,
      battles: '5 ta faol jang',
      questions: dbProfile?.questions_for_history ?? 120,
      color:
        'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
  ];

  const createSubjects = [
    {
      name: 'Matematika',
      icon: Calculator,
      questions: dbProfile?.questions_for_math ?? 180,
      color:
        'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    },
    {
      name: 'Fizika',
      icon: FlaskConical,
      questions: dbProfile?.questions_for_physics ?? 150,
      color:
        'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    },
    {
      name: 'Dasturlash',
      icon: Code,
      questions: dbProfile?.questions_for_it ?? 240,
      color:
        'text-amber-400 bg-amber-500/20 border-amber-500/30',
    },
    {
      name: 'Tarix',
      icon: BookOpen,
      questions: dbProfile?.questions_for_history ?? 120,
      color:
        'text-blue-400 bg-blue-500/20 border-blue-500/30',
    },
  ];

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="fixed inset-0 z-50 bg-[#070914] text-slate-100 min-h-screen flex flex-col md:flex-row overflow-hidden animate-fadeIn">

      {/* SIDEBAR */}

      <aside className="w-full md:w-64 bg-[#0B0E1D] border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 z-20">

        <div className="space-y-6">

          <div className="space-y-3 pt-1">

            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bosh sahifaga qaytish</span>
            </button>

            <div className="flex items-center gap-2.5 pt-2">

              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Swords className="w-5 h-5" />
              </div>

              <h2 className="text-xl font-black tracking-tight text-white">
                AI Study Battle
              </h2>

            </div>
          </div>

          {/* USER */}

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
                className="w-11 h-11 rounded-xl object-cover border-2 border-purple-500/60"
              />

              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full border border-slate-900">
                {level}
              </span>

            </div>

            <div className="overflow-hidden">

              <div className="font-bold text-sm text-slate-100 truncate">
                {userName}
              </div>

              <div className="text-xs font-semibold text-slate-400">
                {xp.toLocaleString()} XP
              </div>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="space-y-1.5 pt-2">

            {navItems.map((item) => {

              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavClick(item.id)
                  }
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all text-left ${isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                >
                  <Icon className="w-4 h-4" />
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

      {/* MAIN */}

      <main className="flex-1 bg-[#060812] p-5 md:p-8 overflow-y-auto space-y-6 relative">

        {/* HEADER */}

        <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">

          <div>

            <h1 className="text-xl md:text-2xl font-black text-white">
              {activeTab === 'yaratish'
                ? 'Jang Yaratish'
                : activeTab === 'qoshilish'
                  ? "Jangga Qo'shilish"
                  : activeTab === 'sozlamalar'
                    ? 'Sozlamalar'
                    : 'Boshqaruv Paneli'}
            </h1>

            <p className="text-xs text-slate-400 font-medium">
              {activeTab === 'yaratish'
                ? "O'z intellektual jang maydoningizni sozlang"
                : "Statistika va tezkor janglar markazi"}
            </p>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* =====================================================
            ASOSIY
        ====================================================== */}

        {activeTab === 'asosiy' && (
          <div className="space-y-6 animate-fadeIn">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              <div className="lg:col-span-7 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between space-y-6">

                <div className="space-y-2">

                  <h3 className="text-2xl md:text-3xl font-black text-white">
                    Xush kelibsiz,{' '}
                    <span className="text-gradient-purple">
                      {userName}
                    </span>
                  </h3>

                  <p className="text-slate-300 text-xs md:text-sm">
                    Yangi jang boshlang yoki mavjud jangga qo'shiling.
                  </p>

                </div>

                <div className="flex flex-wrap items-center gap-3">

                  <button
                    onClick={() =>
                      setActiveTab('yaratish')
                    }
                    className="btn-primary-purple px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    Yangi jang boshlash
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab('qoshilish')
                    }
                    className="bg-[#070914] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-6 py-3 rounded-xl font-bold text-sm"
                  >
                    Jangga qo'shilish
                  </button>

                </div>

              </div>

              {/* STATS */}

              <div className="lg:col-span-5 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-6 space-y-5">

                <div className="flex items-center justify-between">

                  <div className="text-xl font-black text-white">
                    Level {level}
                  </div>

                  <div className="bg-[#14172B] text-purple-300 border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                    Global Reyting: #{rank}
                  </div>

                </div>

                <div className="space-y-1.5">

                  <div className="flex justify-between text-xs font-bold">

                    <span className="text-slate-400">
                      XP Progress
                    </span>

                    <span className="text-slate-200">
                      {xp.toLocaleString()} XP
                    </span>

                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (xp % 1000) / 10
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">

                  <div>
                    <div className="text-2xl font-black text-emerald-400">
                      {wins}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      G'ALABA
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-rose-500">
                      {losses}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      MAG'LUBIYAT
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-cyan-400">
                      {winRate}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      WIN RATE
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* QUICK BATTLES */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h4 className="text-lg font-extrabold text-white">
                  Tezkor Janglar
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

                {subjects.map((sub) => {

                  const Icon = sub.icon;

                  return (
                    <button
                      key={sub.name}
                      onClick={() => {
                        setSelectedCreateSubject(sub.name);
                        setActiveTab('yaratish');
                      }}
                      className="text-left bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 p-4 rounded-2xl transition-all"
                    >

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sub.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="font-bold text-sm text-slate-100 mt-4">
                        {sub.name}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {sub.battles}
                      </div>

                    </button>
                  );
                })}

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            CREATE BATTLE
        ====================================================== */}

        {activeTab === 'yaratish' && (
          <div className="space-y-8 animate-fadeIn pt-2 max-w-5xl">

            <div className="space-y-1.5">

              <h2 className="text-3xl md:text-4xl font-black text-white">
                Jang yaratish
              </h2>

              <p className="text-sm text-slate-400">
                Fanni tanlang va raqibni kuting.
              </p>

            </div>

            <div className="space-y-4">

              <h3 className="text-lg font-bold text-white">
                Fanni tanlang
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

                {createSubjects.map((sub) => {

                  const Icon = sub.icon;

                  const isSelected =
                    selectedCreateSubject ===
                    sub.name;

                  return (
                    <button
                      key={sub.name}
                      onClick={() =>
                        setSelectedCreateSubject(
                          sub.name
                        )
                      }
                      className={`text-left p-6 rounded-2xl transition-all flex flex-col justify-between space-y-6 ${isSelected
                          ? 'bg-[#0E1225] border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02]'
                          : 'bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/40'
                        }`}
                    >

                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${sub.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div>

                        <h4 className="text-lg font-bold text-white">
                          {sub.name}
                        </h4>

                        <p className="text-xs text-slate-400 mt-1">
                          {sub.questions ?? 0} ta savol
                        </p>

                      </div>

                    </button>
                  );
                })}

              </div>

            </div>

            <div className="flex justify-end pt-4">

              <button
                onClick={() =>
                  onStartBattle(
                    selectedCreateSubject
                  )
                }
                className="btn-primary-purple px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center gap-2.5"
              >
                <Swords className="w-4 h-4" />
                Jangni boshlash
              </button>

            </div>

          </div>
        )}

        {/* =====================================================
            JOIN BATTLE
        ====================================================== */}

        {activeTab === 'qoshilish' && (
          <JoinBattleSection
            user={user}
            onStartBattle={onStartBattle}
          />
        )}

        {/* =====================================================
            SETTINGS
        ====================================================== */}

        {activeTab === 'sozlamalar' && (
          <div className="space-y-6 animate-fadeIn pt-2 max-w-3xl">

            <h2 className="text-3xl font-black text-white">
              Sozlamalar
            </h2>

            <div className="bg-[#0C0F1E] border border-slate-800/80 p-6 rounded-2xl space-y-4">

              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">

                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/60"
                />

                <div>

                  <h4 className="font-bold text-lg text-white">
                    {userName}
                  </h4>

                  <p className="text-xs text-slate-400">
                    {user?.email || 'Foydalanuvchi'}
                  </p>

                </div>

              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">
                  Joriy daraja
                </span>

                <span className="text-purple-400">
                  Level {level}
                </span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">
                  Jami XP
                </span>

                <span className="text-amber-400">
                  {xp.toLocaleString()} XP
                </span>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};