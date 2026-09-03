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
  Swords,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Save,
  Key,
  User as UserIcon,
  Info,
  Send,
  Mail,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Building2,
} from 'lucide-react';

import type { User, LeaderboardEntry } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JoinBattleSection } from './JoinBattleSection';

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

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (subject?: string, directBattle?: boolean, roomId?: string) => void;
  onOpenLeaderboard: () => void;
  user: User | null;
  onUserUpdate?: () => void;
  initialTab?: 'asosiy' | 'yaratish' | 'qoshilish' | 'reyting' | 'sozlamalar' | 'haqida';
}

interface DbProfile {
  full_name?: string | null;
  username?: string | null;
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
  questions_for_python?: number | null;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onStartBattle,
  // onOpenLeaderboard,
  user,
  onUserUpdate,
  initialTab = 'asosiy',
}) => {
  const [activeTab, setActiveTab] = useState<
    'asosiy' | 'yaratish' | 'qoshilish' | 'reyting' | 'sozlamalar' | 'haqida'
  >(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [selectedCreateSubject, setSelectedCreateSubject] =
    useState<string>('Matematika');

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const [dbProfile, setDbProfile] = useState<{
    name: string;
    username?: string;
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
    questions_for_python?: number;
  } | null>(null);

  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [subjectCounts, setSubjectCounts] = useState<{
    math: number;
    it: number;
    physics: number;
    history: number;
    english: number;
    python: number;
  }>({
    math: 4,
    it: 4,
    physics: 3,
    history: 3,
    english: 3,
    python: 4,
  });

  useEffect(() => {
    if (isOpen) {
      setEditUsername(dbProfile?.username || user?.username || '');
      setEditAvatarUrl(
        dbProfile?.avatar_url ||
        user?.avatar ||
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80'
      );
      setEditPassword('');
      setSettingsMessage(null);
    }
  }, [isOpen, user?.username, user?.avatar, dbProfile?.username, dbProfile?.avatar_url]);

  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured()) return;

    let cancelled = false;

    const fetchQuestionCounts = async () => {
      try {
        const [mathRes, itRes, physRes, histRes, engRes, pyRes] = await Promise.all([
          supabase.from('questions_for_math').select('*', { count: 'exact', head: true }),
          supabase.from('questions_for_it').select('*', { count: 'exact', head: true }),
          supabase.from('questions_for_physics').select('*', { count: 'exact', head: true }),
          supabase.from('questions_for_history').select('*', { count: 'exact', head: true }),
          supabase.from('questions_for_english').select('*', { count: 'exact', head: true }),
          supabase.from('questions_for_python').select('*', { count: 'exact', head: true }),
        ]);

        if (!cancelled) {
          setSubjectCounts({
            math: mathRes.count ?? 4,
            it: itRes.count ?? 4,
            physics: physRes.count ?? 3,
            history: histRes.count ?? 3,
            english: engRes.count ?? 3,
            python: pyRes.count ?? 4,
          });
        }
      } catch (err) {
        console.error('Savollar sonini yuklashda xatolik:', err);
      }
    };

    fetchQuestionCounts();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);

    if (!isSupabaseConfigured()) {
      setSettingsMessage({ type: 'error', text: 'Supabase sozlanmagan.' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const activeUserId = user?.id || session?.user?.id;

    if (!activeUserId) {
      setSettingsMessage({ type: 'error', text: 'Foydalanuvchi tizimga kirmagan.' });
      return;
    }

    const currentFullName = dbProfile?.name || user?.name || 'Foydalanuvchi';
    const trimmedUsername = editUsername.trim().replace(/^@/, '');

    if (editPassword && editPassword.trim().length < 6) {
      setSettingsMessage({
        type: 'error',
        text: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.',
      });
      return;
    }

    setIsSavingSettings(true);

    try {
      // 1. Update profiles table in Supabase DB
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: activeUserId,
            full_name: currentFullName,
            username: trimmedUsername,
            avatar_url: editAvatarUrl.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw new Error(`Profilni yangilashda xatolik: ${profileError.message}`);
      }

      // 2. Update Supabase Auth user metadata & password (if provided)
      const updateAuthData: any = {
        data: {
          full_name: currentFullName,
          username: trimmedUsername,
          avatar_url: editAvatarUrl.trim() || null,
        },
      };

      if (editPassword && editPassword.trim().length >= 6) {
        updateAuthData.password = editPassword.trim();
      }

      const { error: authError } = await supabase.auth.updateUser(updateAuthData);

      if (authError) {
        throw new Error(`Auth/Parol yangilashda xatolik: ${authError.message}`);
      }

      // 3. Update local state
      setDbProfile((prev) =>
        prev
          ? { ...prev, name: currentFullName, username: trimmedUsername, avatar_url: editAvatarUrl }
          : {
            name: currentFullName,
            username: trimmedUsername,
            xp: user?.xp || 500,
            level: user?.level || 1,
            rank: user?.rank || 4,
            battles_won: user?.battles_won || 0,
            battles_lost: user?.battles_lost || 0,
            avatar_url: editAvatarUrl,
          }
      );

      setSettingsMessage({ type: 'success', text: '✅ Sozlamalar va yangi parol muvaffaqiyatli saqlandi!' });
      setEditPassword('');

      if (onUserUpdate) {
        onUserUpdate();
      }
    } catch (err: any) {
      console.error('Sozlamalarni saqlashda xatolik:', err);
      setSettingsMessage({
        type: 'error',
        text: err?.message || 'Sozlamalarni saqlashda kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

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
          username: profile.username || user.username || '',
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

  useEffect(() => {
    if (activeTab !== 'reyting' || !isOpen) return;

    const fetchLeaderboard = async () => {
      if (!isSupabaseConfigured()) {
        setLeaderboardData(MOCK_LEADERBOARD);
        return;
      }

      setIsLoadingLeaderboard(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = user?.id || session?.user?.id;

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
            const isUser = Boolean(activeUserId && item.id === activeUserId);

            return {
              rank,
              name: item.full_name || 'O\'yinchi',
              xp: item.xp || 500,
              winRate,
              badge: getBadgeByXP(item.xp || 500, rank),
              isUser,
            };
          });

          setLeaderboardData(mapped);
        } else {
          setLeaderboardData(MOCK_LEADERBOARD);
        }
      } catch (err) {
        console.error('Leaderboard fetch xatosi:', err);
        setLeaderboardData(MOCK_LEADERBOARD);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, isOpen, user?.id]);

  if (!isOpen) {
    return null;
  }

  /*
   * ============================================================
   * USER DATA
   * ============================================================
   */

  const userName =
    dbProfile?.username ||
    user?.username ||
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
      label: 'Battle yaratish',
      icon: PlusCircle,
    },
    {
      id: 'qoshilish',
      label: "Battle-ga qo'shilish",
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
    {
      id: 'haqida',
      label: 'Biz haqimizda',
      icon: Info,
    },
  ] as const;

  const handleNavClick = (
    id: typeof activeTab
  ) => {
    setActiveTab(id);
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
      battles: '24 ta faol battle',
      questions: subjectCounts.math,
      color:
        'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      name: 'Python',
      icon: Code,
      battles: '42 ta faol battle',
      questions: subjectCounts.python,
      color:
        'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      name: 'Dasturlash',
      icon: Code,
      battles: '56 ta faol battle',
      questions: subjectCounts.it,
      color:
        'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      name: 'Fizika',
      icon: FlaskConical,
      battles: '12 ta faol battle',
      questions: subjectCounts.physics,
      color:
        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      name: 'Ingliz tili',
      icon: Globe,
      battles: '89 ta faol battle',
      questions: subjectCounts.english,
      color:
        'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      name: 'Tarix',
      icon: BookOpen,
      battles: '5 ta faol battle',
      questions: subjectCounts.history,
      color:
        'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
  ];

  const createSubjects = [
    {
      name: 'Matematika',
      icon: Calculator,
      questions: subjectCounts.math,
      color:
        'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    },
    {
      name: 'Python',
      icon: Code,
      questions: subjectCounts.python,
      color:
        'text-sky-400 bg-sky-500/20 border-sky-500/30',
    },
    {
      name: 'Fizika',
      icon: FlaskConical,
      questions: subjectCounts.physics,
      color:
        'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    },
    {
      name: 'Dasturlash',
      icon: Code,
      questions: subjectCounts.it,
      color:
        'text-amber-400 bg-amber-500/20 border-amber-500/30',
    },
    {
      name: 'Ingliz tili',
      icon: Globe,
      questions: subjectCounts.english,
      color:
        'text-purple-400 bg-purple-500/20 border-purple-500/30',
    },
    {
      name: 'Tarix',
      icon: BookOpen,
      questions: subjectCounts.history,
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

      {/* SIDEBAR / NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0B0E1D] border-b md:border-b-0 md:border-r border-slate-800/80 p-3 md:p-5 flex flex-col justify-between shrink-0 z-20">
        <div className="space-y-3 md:space-y-6">
          <div className="flex items-center justify-between md:block space-y-0 md:space-y-3 pt-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Qaytish</span>
            </button>

            <div className="flex items-center gap-2 pt-0 md:pt-2">
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Swords className="w-4 h-4 md:w-5 md:h-5" />
              </div>

              <h2 className="text-base md:text-xl font-black tracking-tight text-white">
                AI Study Battle
              </h2>
            </div>
          </div>

          {/* USER */}
          <div className="flex items-center gap-2.5 p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-[#080A15] border border-slate-800/80 shadow-md relative">
            {isLoadingProfile && (
              <div className="absolute inset-0 bg-[#080A15]/80 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center z-10">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            )}

            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={userName}
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl object-cover border-2 border-purple-500/60"
              />
              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[9px] md:text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full border border-slate-900">
                {level}
              </span>
            </div>

            <div className="overflow-hidden">
              <div className="font-bold text-xs md:text-sm text-slate-100 truncate">
                {userName}
              </div>
              <div className="text-[11px] md:text-xs font-semibold text-slate-400">
                {xp.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex md:flex-col overflow-x-auto gap-1.5 md:space-y-1.5 py-1 md:py-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 text-xs md:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 bg-[#080A15] md:bg-transparent'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
      <main className="flex-1 bg-[#060812] p-3 md:p-8 overflow-y-auto space-y-4 md:space-y-6 relative">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
          <div>
            <h1 className="text-lg md:text-2xl font-black text-white">
              {activeTab === 'yaratish'
                ? 'Battle Yaratish'
                : activeTab === 'qoshilish'
                  ? "Battle-ga Qo'shilish"
                  : activeTab === 'sozlamalar'
                    ? 'Sozlamalar'
                    : activeTab === 'haqida'
                      ? 'Biz Haqimizda'
                      : 'Boshqaruv Paneli'}
            </h1>
            <p className="text-[11px] md:text-xs text-slate-400 font-medium">
              {activeTab === 'yaratish'
                ? "O'z intellektual battle maydoningizni sozlang"
                : activeTab === 'haqida'
                  ? "Loyiha muallifi, bog'lanish va platforma ma'lumotlari"
                  : "Statistika va tezkor battle-lar markazi"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* ASOSIY */}
        {activeTab === 'asosiy' && (
          <div className="space-y-4 md:space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-7 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-4 md:p-6 flex flex-col justify-between space-y-4 md:space-y-6">
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-xl md:text-3xl font-black text-white">
                    Xush kelibsiz,{' '}
                    <span className="text-gradient-purple">
                      {userName}
                    </span>
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm">
                    Yangi Battle boshlang yoki mavjud Battle-ga qo'shiling.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                  <button
                    onClick={() => setActiveTab('yaratish')}
                    className="btn-primary-purple px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Yangi Battle</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qoshilish')}
                    className="bg-[#070914] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center"
                  >
                    <span>Qo'shilish</span>
                  </button>
                </div>
              </div>

              {/* STATS */}
              <div className="lg:col-span-5 bg-[#0C0F1E] border border-slate-800/90 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="flex items-center justify-between">
                  <div className="text-lg md:text-xl font-black text-white">
                    Level {level}
                  </div>
                  <div className="bg-[#14172B] text-purple-300 border border-purple-500/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[11px] md:text-xs font-mono font-bold">
                    Reyting: #{rank}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">XP Progress</span>
                    <span className="text-slate-200">{xp.toLocaleString()} XP</span>
                  </div>
                  <div className="w-full h-2 md:h-2.5 bg-slate-900 rounded-full overflow-hidden">
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
                    <div className="text-xl md:text-2xl font-black text-emerald-400">
                      {wins}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-slate-400">
                      G'ALABA
                    </div>
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl font-black text-rose-500">
                      {losses}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-slate-400">
                      MAG'LUBIYAT
                    </div>
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl font-black text-cyan-400">
                      {winRate}%
                    </div>
                    <div className="text-[10px] md:text-[11px] text-slate-400">
                      WIN RATE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK BATTLES */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                <h4 className="text-base md:text-lg font-extrabold text-white">
                  Tezkor Battle-lar
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
                {subjects.map((sub) => {
                  const Icon = sub.icon;

                  return (
                    <button
                      key={sub.name}
                      onClick={() => {
                        setSelectedCreateSubject(sub.name);
                        setActiveTab('yaratish');
                      }}
                      className="text-left bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all"
                    >
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border ${sub.color}`}
                      >
                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>

                      <div className="font-bold text-xs md:text-sm text-slate-100 mt-2 md:mt-4 truncate">
                        {sub.name}
                      </div>

                      <div className="text-[11px] md:text-xs text-slate-400 mt-0.5 truncate">
                        {sub.battles}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CREATE BATTLE */}
        {activeTab === 'yaratish' && (
          <div className="space-y-4 md:space-y-8 animate-fadeIn pt-1 md:pt-2 max-w-5xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-black text-white">
                Battle yaratish
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Fanni tanlang va raqibni kuting.
              </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-white">
                Fanni tanlang
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                {createSubjects.map((sub) => {
                  const Icon = sub.icon;
                  const isSelected = selectedCreateSubject === sub.name;

                  return (
                    <button
                      key={sub.name}
                      onClick={() => setSelectedCreateSubject(sub.name)}
                      className={`text-left p-4 md:p-6 rounded-xl md:rounded-2xl transition-all flex flex-col justify-between space-y-4 md:space-y-6 ${isSelected
                        ? 'bg-[#0E1225] border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.01]'
                        : 'bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/40'
                        }`}
                    >
                      <div
                        className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center border ${sub.color}`}
                      >
                        <Icon className="w-4 h-4 md:w-6 md:h-6" />
                      </div>

                      <div>
                        <h4 className="text-sm md:text-lg font-bold text-white truncate">
                          {sub.name}
                        </h4>
                        <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
                          {sub.questions ?? 0} ta savol
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 md:pt-4">
              <button
                onClick={() => onStartBattle(selectedCreateSubject)}
                className="w-full sm:w-auto btn-primary-purple px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Battle-ni boshlash</span>
              </button>
            </div>
          </div>
        )}

        {/* JOIN BATTLE */}
        {activeTab === 'qoshilish' && (
          <JoinBattleSection user={user} onStartBattle={onStartBattle} />
        )}

        {/* REYTING */}
        {activeTab === 'reyting' && (
          <div className="space-y-4 md:space-y-6 animate-fadeIn pt-1 md:pt-2 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Peshqadamlar Reytingi
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Platformadagi eng kuchli bilimdonlar ro'yxati va sizning o'rningiz.
              </p>
            </div>

            <div className="bg-[#0C0F1E] border border-slate-800/80 p-4 md:p-6 rounded-2xl space-y-3 shadow-lg">
              {isLoadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-12 text-purple-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Reyting yuklanmoqda...</span>
                </div>
              ) : (
                leaderboardData.map((item) => (
                  <div
                    key={item.rank}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs md:text-sm transition-colors ${item.isUser
                      ? 'bg-purple-950/60 border-purple-500/60 text-white font-bold shadow-md'
                      : 'bg-[#080A15] border-slate-800/80 text-slate-200 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${item.rank === 1 ? 'bg-amber-500 text-black' :
                        item.rank === 2 ? 'bg-slate-300 text-black' :
                          item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {item.rank}
                      </span>
                      <span className="font-semibold">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 hidden sm:inline text-xs">{item.badge}</span>
                      <span className={`font-bold text-xs px-2.5 py-1 rounded-lg border ${item.winRate >= 80
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : item.winRate >= 50
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                        {item.winRate}% W
                      </span>
                      <span className="font-black text-purple-400">{item.xp} XP</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'sozlamalar' && (
          <div className="space-y-4 md:space-y-6 animate-fadeIn pt-1 md:pt-2 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-white">Sozlamalar</h2>
              <p className="text-xs md:text-sm text-slate-400">
                Profil ma'lumotlaringiz va parolingizni yangilang.
              </p>
            </div>

            {settingsMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs md:text-sm font-semibold flex items-center gap-2 ${settingsMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{settingsMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* PROFILE & AVATAR SECTION */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-4 md:p-6 rounded-2xl space-y-4">
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <span>Profil Ma'lumotlari</span>
                </h3>

                {/* Avatar Picker & Preview */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Avatarni tanlang yoki rasm havolasini kiriting
                  </label>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img
                      src={editAvatarUrl || avatarUrl}
                      alt={userName}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-purple-500/80 shadow-lg shadow-purple-600/20 shrink-0"
                    />

                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="url"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        placeholder="Rasm URL havolasi (https://...)"
                        className="w-full bg-[#070914] border border-slate-700/80 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                      />

                      {/* Preset Avatar Pickers */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {[
                          'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
                        ].map((presetUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditAvatarUrl(presetUrl)}
                            className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${editAvatarUrl === presetUrl
                              ? 'border-purple-500 scale-110 shadow-[0_0_10px_#a855f7]'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                          >
                            <img
                              src={presetUrl}
                              alt={`Avatar ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username Input */}
                <div className="pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">
                      Foydalanuvchi nomi (@username)
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-[#070914] border border-slate-700/80 focus:border-purple-500 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECURITY & PASSWORD SECTION */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-4 md:p-6 rounded-2xl space-y-4">
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Xavfsizlik & Parol</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Yangi Parol (ixtiyoriy)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="O'zgartirmaslik uchun bo'sh qoldiring (kamida 6 ta belgi)"
                    className="w-full bg-[#070914] border border-slate-700/80 focus:border-purple-500 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Parolingizni o'zgartirmoqchi bo'lsangiz yangi parolni kiriting.
                  </p>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto btn-primary-purple px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Sozlamalarni Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BIZ HAQIMIZDA */}
        {activeTab === 'haqida' && (
          <div className="space-y-6 animate-fadeIn pt-1 md:pt-2 max-w-4xl">
            {/* HERO BANNER CARD */}
            <div className="bg-gradient-to-r from-purple-900/40 via-[#0C0F1E] to-indigo-900/40 border border-purple-500/30 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">AI Study Battle</h2>
                  <p className="text-xs md:text-sm text-purple-300 font-medium">
                    Intellektual va Real-vaqtli Onlayn Musobaqa Platformasi
                  </p>
                </div>
              </div>

              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
                AI Study Battle — o'quvchilar va dasturchilar uchun bilimlarni sinovdan o'tkazish, real vaqt rejimida boshqa foydalanuvchilar bilan bellashish hamda bilim darajasini oshirishga mo'ljallangan zamonaviy ta'lim va musobaqa platformasidir.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Versiya: v1.2.0
                </span>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  Status: Active (Faol)
                </span>
              </div>
            </div>

            {/* AUTHOR, TEACHER, CENTER & CONTACT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* LOYIHA MUALLIFI */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base md:text-lg font-bold text-white">Loyiha Muallifi</h3>
                </div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  Loyiha sun'iy intellekt va ta'lim texnologiyalariga qiziquvchi dasturchilar jamoasi tomonidan ishlab chiqilgan.
                </p>
                <a
                  href="https://t.me/Hasanov_A_2010"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <span>👨‍💻 Dasturchi: Asilbek (@Hasanov_A_2010)</span>
                </a>
              </div>

              {/* USTOZIMIZ */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base md:text-lg font-bold text-white">Ustozimiz / Mentor</h3>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                    Bosh Mentor
                  </span>
                </div>
                <p className="font-bold text-sm text-slate-100">
                  Hakimov Usmon
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Loyiha yo'nalishlari va bilim sifatini oshirish bo'yicha maslahatchi va ustoz.
                </p>
                <a
                  href="https://t.me/usmonkul"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 pt-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                  <span>Telegram: @usmonkul</span>
                </a>
              </div>

              {/* O'QUV MARKAZ */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base md:text-lg font-bold text-white">O'quv Markazimiz</h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                    IT Ta'lim
                  </span>
                </div>
                <p className="font-bold text-sm text-slate-100">
                  Ilmla IT ta'lim markazi
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Zamonaviy axborot texnologiyalari va dasturlash yo'nalishida sifatli ta'lim maskani.
                </p>
                <a
                  href="https://t.me/ilmla_uz"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 pt-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                  <span>Telegram: t.me/ilmla_uz</span>
                </a>
              </div>

              {/* CONTACT & SOCIAL LINKS CARD */}
              <div className="bg-[#0C0F1E] border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <Send className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base md:text-lg font-bold text-white">Aloqa va Tarmoqlar</h3>
                </div>

                <div className="space-y-2 text-xs md:text-sm font-semibold">
                  <a
                    href="https://t.me/Hasanov_A_2010"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070914] border border-slate-800 hover:border-purple-500/50 text-slate-200 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
                      </svg>
                      <span>Shaxsiy Telegram Profile</span>
                    </span>
                    <span className="text-purple-400 font-mono">@Hasanov_A_2010</span>
                  </a>

                  <a
                    href="https://github.com/asilbek120213031404-beep/AI-Study"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070914] border border-slate-800 hover:border-purple-500/50 text-slate-200 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-300 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub Kodlar Ombori</span>
                    </span>
                    <span className="text-slate-400 font-mono truncate max-w-[120px] sm:max-w-[180px]">AI-Study</span>
                  </a>

                  <a
                    href="mailto:mrasilbek3@gmail.com"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070914] border border-slate-800 hover:border-purple-500/50 text-slate-200 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-400" />
                      <span>Elektron Pochta</span>
                    </span>
                    <span className="text-slate-400 font-mono">mrasilbek3@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* FEATURES GRID */}
            <div className="bg-[#0C0F1E] border border-slate-800/80 p-5 md:p-6 rounded-2xl space-y-4">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span>Asosiy Imkoniyatlar</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#070914] border border-slate-800/80 space-y-1">
                  <div className="font-bold text-purple-400">⚡ Real-Vaqtli Battle-lar</div>
                  <p className="text-slate-400 text-[11px]">Real vaqt rejimida do'stlaringiz va tasodifiy raqiblar bilan bellashing.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070914] border border-slate-800/80 space-y-1">
                  <div className="font-bold text-amber-400">🏆 XP va Reyting Tizimi</div>
                  <p className="text-slate-400 text-[11px]">Har bir g'alaba uchun XP to'plang va global darajangizni oshiring.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070914] border border-slate-800/80 space-y-1">
                  <div className="font-bold text-emerald-400">📚 Turli Fanlar</div>
                  <p className="text-slate-400 text-[11px]">Matematika, Python, Fizika, Dasturlash va Ingliz tili testlari.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};