import React, { useState, useEffect } from 'react';
import { Copy, Check, User as UserIcon, X, Swords } from 'lucide-react';
import type { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  user: User | null;
  onStartBattle: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  subject = 'Matematika',
  user,
  onStartBattle
}) => {
  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState('582 914');
  const [opponentFound, setOpponentFound] = useState(false);
  const [guestDetails, setGuestDetails] = useState<{ name: string; avatar?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Generate dynamic 6-digit room code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedCode = `${randomCode.slice(0, 3)} ${randomCode.slice(3)}`;
    const cleanCode = randomCode;

    setRoomCode(formattedCode);
    setCopied(false);
    setOpponentFound(false);
    setGuestDetails(null);

    // 1. Create Room in Supabase
    const createGameRoomInSupabase = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const roomPayload = {
          room_code: cleanCode,
          code: cleanCode,
          subject: subject,
          host_id: user?.id,
          created_by: user?.id,
          host_name: user?.name || 'Xona Egasi',
          host_avatar: user?.avatar,
          status: 'waiting',
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('game_rooms')
          .insert([roomPayload]);

        if (error) {
          console.log('game_rooms insert fallback notice:', error.message);
          await supabase.from('game_room').insert([roomPayload]);
        }
      } catch (err) {
        console.error('Supabase room yaratishda xatolik:', err);
      }
    };

    createGameRoomInSupabase();

    // 2. Realtime Subscription to listen for Guest joining this room code
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel(`room_${cleanCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_rooms',
            filter: `room_code=eq.${cleanCode}`
          },
          (payload) => {
            const updatedRoom = payload.new;
            if (updatedRoom?.guest_name || updatedRoom?.status === 'matched') {
              setGuestDetails({
                name: updatedRoom.guest_name || 'Raqib',
                avatar: updatedRoom.guest_avatar
              });
              setOpponentFound(true);
            }
          }
        )
        .subscribe();
    }

    // 3. Fallback demo simulation if no real opponent joins in 8 seconds
    const timer = setTimeout(() => {
      setOpponentFound((prev) => {
        if (!prev) {
          setGuestDetails({
            name: '@Aziz_Coder',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
          });
          return true;
        }
        return prev;
      });
    }, 8000);

    return () => {
      clearTimeout(timer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, subject, user?.id, user?.name, user?.avatar]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    const cleanCode = roomCode.replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userName = user?.name || 'Siz';
  const level = user?.level || 12;
  const avatarUrl = user?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80';
  const guestAvatar = guestDetails?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
  const guestName = guestDetails?.name || '@Aziz_Coder';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0A0D1B] border border-slate-800/90 rounded-3xl w-full max-w-sm md:max-w-md p-6 md:p-8 space-y-6 shadow-2xl relative text-center text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          title="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Players Matchmaking Header Layout */}
        <div className="flex items-center justify-center gap-4 md:gap-6 pt-2">
          
          {/* Host Player (Left) */}
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] font-extrabold text-white px-3 py-0.5 rounded-full border border-slate-900 whitespace-nowrap shadow-md">
                Tayyor
              </div>
            </div>
            <div className="pt-2">
              <div className="font-extrabold text-base text-white">
                {userName}
              </div>
              <div className="text-xs font-semibold text-slate-400 font-mono">
                Level {level}
              </div>
            </div>
          </div>

          {/* VS Center Badge */}
          <div className="flex flex-col items-center space-y-1 pt-1">
            <div className="w-11 h-11 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 font-black text-sm flex items-center justify-center italic shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              VS
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {opponentFound ? 'Boshlanmoqda' : 'Kutilmoqda'}
            </div>
          </div>

          {/* Guest Opponent (Right) */}
          <div className="flex flex-col items-center space-y-1">
            {opponentFound ? (
              <div className="relative animate-fadeIn">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <img
                    src={guestAvatar}
                    alt={guestName}
                    className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-[10px] font-extrabold text-white px-3 py-0.5 rounded-full border border-slate-900 whitespace-nowrap shadow-md">
                  Qo'shildi
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-600">
                <UserIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}
            
            <div className="pt-2">
              <div className="font-extrabold text-base text-slate-300 truncate max-w-[90px]">
                {opponentFound ? guestName : 'Raqib...'}
              </div>
              <div className="text-xs font-semibold text-slate-400 font-mono">
                {opponentFound ? 'Level 14' : 'Qidirilmoqda'}
              </div>
            </div>
          </div>

        </div>

        {/* Subtext Instructions */}
        <p className="text-xs text-slate-300 font-medium max-w-xs mx-auto leading-relaxed px-2">
          Do'stingizga quyidagi kodni yuboring yoki o'yinchi qo'shilishini kuting.
        </p>

        {/* Room Code Display Box */}
        <div className="bg-[#0E1222] border border-slate-800/90 rounded-2xl py-6 px-4 text-center shadow-inner">
          <div className="text-4xl md:text-5xl font-mono font-black text-purple-300 tracking-[0.25em]">
            {roomCode}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          {opponentFound ? (
            <button
              onClick={onStartBattle}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white btn-primary-purple flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 animate-pulse"
            >
              <Swords className="w-4 h-4" />
              <span>Jangni boshlash</span>
            </button>
          ) : (
            <button
              onClick={handleCopyCode}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white btn-primary-purple flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Kodni nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kodni nusxalash</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-300 bg-[#0C0F1E] hover:bg-slate-800 border border-slate-800 transition-all"
          >
            Bekor qilish
          </button>
        </div>

      </div>
    </div>
  );
};
