import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight, User as UserIcon, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import type { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setTermsAgreed(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isRegisterMode && !termsAgreed) {
      setErrorMessage("Iltimos, xizmat ko'rsatish shartlariga rozilik bildiring!");
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        if (isRegisterMode) {
          // 1. Supabase Sign Up Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                xp: 500,
                level: 1
              }
            }
          });

          if (error) throw error;

          if (data.user) {
            // 2. Profile table update / upsert into Supabase DB
            const usernameFromEmail = email.split('@')[0];
            const { data: dbProfile, error: profileError } = await supabase
              .from('profiles')
              .upsert([
                {
                  id: data.user.id,
                  full_name: fullName,
                  email: email,
                  username: usernameFromEmail,
                  provider: 'email',
                  level: 1,
                  xp: 500,
                  rank: 5,
                  total_battles: 0,
                  battles_won: 0,
                  battles_lost: 0
                }
              ])
              .select()
              .single();

            if (profileError) {
              console.warn("Profil yaratishda ogohlantirish:", profileError.message);
            }

            const loggedUser: User = {
              id: data.user.id,
              name: dbProfile?.username || dbProfile?.full_name || fullName || usernameFromEmail,
              username: dbProfile?.username || usernameFromEmail,
              email: email,
              xp: dbProfile?.xp || 500,
              level: dbProfile?.level || 1,
              total_battles: dbProfile?.total_battles || 0,
              battles_won: dbProfile?.battles_won || 0,
              battles_lost: dbProfile?.battles_lost || 0,
              rank: dbProfile?.rank || 5
            };

            onLoginSuccess(loggedUser);
            handleClose();
          }
        } else {
          // 1. Supabase Sign In Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Profilni yuklashda xatolik:', profileError.message);
            }

            const usernameFromEmail = data.user.email?.split('@')[0] || email.split('@')[0];
            const loggedUser: User = {
              id: data.user.id,
              name: profile?.username || profile?.full_name || data.user.user_metadata?.username || data.user.user_metadata?.full_name || usernameFromEmail,
              username: profile?.username || usernameFromEmail,
              email: data.user.email || email,
              xp: profile?.xp ?? 1250,
              level: profile?.level ?? 5,
              total_battles: profile?.total_battles ?? 0,
              battles_won: profile?.battles_won ?? 0,
              battles_lost: profile?.battles_lost ?? 0,
              rank: profile?.rank ?? 4,
            };

            onLoginSuccess(loggedUser);
            handleClose();
          }
        }
      } else {
        // Demo Mode fallback without Supabase backend
        const username = fullName || (email ? email.split('@')[0] : 'Sardor_Dev');
        const newUser: User = {
          id: `demo-${Date.now()}`,
          name: isRegisterMode ? (fullName || 'Yangi Foydalanuvchi') : username,
          username: username,
          email: email || 'user@example.com',
          xp: isRegisterMode ? 500 : 1250,
          level: isRegisterMode ? 1 : 5,
          rank: isRegisterMode ? 5 : 4,
          total_battles: 0,
          battles_won: 0,
          battles_lost: 0
        };
        onLoginSuccess(newUser);
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://aistudy-ashy.vercel.app'
          }
        });
        if (error) throw error;
      } else {
        const newUser: User = {
          id: `demo-google-${Date.now()}`,
          name: 'Google User',
          username: 'google_user',
          email: 'googleuser@example.com',
          xp: 1500,
          level: 6,
          rank: 3,
          total_battles: 10,
          battles_won: 7,
          battles_lost: 3
        };
        onLoginSuccess(newUser);
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google orqali kirishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0E1A] border border-slate-800/80 rounded-2xl w-full max-w-sm p-6 md:p-8 space-y-6 shadow-2xl relative text-slate-100">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50">
            <GraduationCap className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              AI Study Battle
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {isRegisterMode ? 'Intellektual musobaqa muhitiga xush kelibsiz' : 'Xush kelibsiz'}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Supabase status notice if unconfigured */}
        {!isSupabaseConfigured() && (
          <div className="text-[10px] text-amber-400/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
            💡 `.env` fayliga Supabase kalitlarini kiriting (Demo rejimida ishlamoqda)
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: REGISTRATION MODE                            */}
        {/* ---------------------------------------------------- */}
        {isRegisterMode ? (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-white mb-2">Hisob yaratish</h3>
            </div>

            {/* Google Sign In / Registration Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-[#121626] hover:bg-[#1A1F36] border border-slate-800 rounded-xl flex items-center justify-center gap-3 text-xs font-semibold text-slate-200 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google orqali ro'yxatdan o'tish</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="w-full border-t border-slate-800" />
              <span className="bg-[#0B0E1A] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-widest absolute">
                yoki
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  To'liq ismingiz
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 z-10" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ism Familiya"
                    className="w-full bg-[#121626] border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 z-10" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ism@misol.com"
                    className="w-full bg-[#121626] border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121626] border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-300 font-medium cursor-pointer select-none">
                  Xizmat ko'rsatish shartlariga roziman
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Ro'yxatdan o'tish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Login Footer */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Allaqachon hisobingiz bormi?{' '}
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage(null);
                }}
                className="font-bold text-white hover:text-purple-400 transition-colors"
              >
                Kirish
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------ */
          /* VIEW 2: LOGIN MODE                               */
          /* ------------------------------------------------ */
          <div className="space-y-5 animate-fadeIn">

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-[#121626] hover:bg-[#1A1F36] border border-slate-800 rounded-xl flex items-center justify-center gap-3 text-xs font-semibold text-slate-200 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google orqali davom etish</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-800" />
              <span className="bg-[#0B0E1A] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-widest absolute">
                yoki
              </span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Elektron pochta
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#121626] border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Parol
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                    className="text-[11px] font-semibold text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    Parolni unutdingizmi?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121626] border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Tizimga kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Footer */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Hisobingiz yo'qmi?{' '}
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage(null);
                }}
                className="font-bold text-white hover:text-purple-400 transition-colors"
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

