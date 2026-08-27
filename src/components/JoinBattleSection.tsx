import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Clock,
  User as UserIcon,
  Loader2,
  Swords,
} from 'lucide-react';

import type { User, GameRoom } from '../types';
import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface JoinBattleSectionProps {
  user: User | null;
  onStartBattle: (subject?: string, directBattle?: boolean) => void;
}

export const JoinBattleSection: React.FC<JoinBattleSectionProps> = ({
  user,
  onStartBattle,
}) => {
  const [inputBattleCode, setInputBattleCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<GameRoom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  // Fetch active waiting rooms from Supabase
  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchPublicRooms = async () => {
      if (!isSupabaseConfigured()) return;
      setIsLoadingPublic(true);
      try {
        const { data, error } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('status', 'waiting')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data && isMounted) {
          setPublicRooms(data as GameRoom[]);
        }
      } catch (err) {
        console.error('Ommaviy janglarni yuklashda xatolik:', err);
      } finally {
        if (isMounted) setIsLoadingPublic(false);
      }
    };

    fetchPublicRooms();

    // Subscribe to live public rooms
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('public_game_rooms')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_rooms' },
          () => {
            fetchPublicRooms();
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Listen to joined room status changes (Host starting the game)
  useEffect(() => {
    if (!joinedRoom || !waitingForHost || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`joined-room-${joinedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${joinedRoom.id}`,
        },
        (payload) => {
          const updated = payload.new as GameRoom;
          if (updated.status === 'in_progress') {
            onStartBattle(updated.subject, true);
          } else if (updated.status === 'cancelled') {
            setWaitingForHost(false);
            setJoinedRoom(null);
            setErrorMessage('Xona egasi jangni bekor qildi.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joinedRoom, waitingForHost, onStartBattle]);

  const handleJoinRoom = async () => {
    const targetCode = inputBattleCode.trim().replace(/\s+/g, '');
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage('Supabase sozlanmagan.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Avval tizimga kiring.');
      return;
    }

    if (!targetCode) {
      setErrorMessage('Jang kodini kiriting.');
      return;
    }

    if (!/^\d{6}$/.test(targetCode)) {
      setErrorMessage('Jang kodi 6 xonali bo‘lishi kerak.');
      return;
    }

    setIsJoining(true);

    try {
      const { data: room, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', targetCode)
        .eq('status', 'waiting')
        .maybeSingle();

      if (findError || !room) {
        setErrorMessage('Bunday kodli faol jang topilmadi.');
        return;
      }

      const typedRoom = room as GameRoom;

      if (typedRoom.host_id === user.id) {
        setErrorMessage('Siz o‘zingiz yaratgan jangga qo‘shila olmaysiz.');
        return;
      }

      const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({
          guest_id: user.id,
          guest_name: user.name || 'Raqib',
          guest_avatar: user.avatar || null,
          status: 'matched',
        })
        .eq('id', typedRoom.id)
        .eq('status', 'waiting')
        .select()
        .single();

      if (updateError || !updatedRoom) {
        setErrorMessage('Room band bo‘lib qolgan yoki xatolik yuz berdi.');
        return;
      }

      const currentRoom = updatedRoom as GameRoom;
      setJoinedRoom(currentRoom);

      if (currentRoom.status === 'in_progress') {
        onStartBattle(currentRoom.subject, true);
      } else {
        setWaitingForHost(true);
      }
    } catch (error) {
      console.error('Roomga qo‘shilishda xatolik:', error);
      setErrorMessage('Kutilmagan xatolik yuz berdi.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pt-2 max-w-5xl">
      {/* JOIN CARD */}
      <div className="bg-gradient-to-br from-[#121426] via-[#0E1122] to-[#0A0D1B] border border-slate-800/90 rounded-3xl p-6 md:p-10 shadow-2xl text-center space-y-6">
        <div className="space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Jangga Qo'shilish
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Do'stingiz yuborgan 6 xonali jang kodini kiriting.
          </p>
        </div>

        {/* INPUT OR WAITING STATE */}
        {waitingForHost ? (
          <div className="bg-[#080B17] border border-purple-500/40 rounded-2xl p-6 max-w-xl mx-auto space-y-4 animate-pulse">
            <div className="flex items-center justify-center gap-3 text-purple-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-bold text-base">Xona egasi jangni boshlashini kutilmoqda...</span>
            </div>
            <p className="text-xs text-slate-400">
              Raqibingiz "Jangni boshlash" tugmasini bosishi bilan o'yin avtomatik boshlanadi.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <input
              type="text"
              value={inputBattleCode}
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setInputBattleCode(value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinRoom();
              }}
              placeholder="Masalan: 582914"
              className="flex-1 w-full bg-[#080B17] border border-slate-800 focus:border-purple-500 rounded-2xl px-5 py-3.5 text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none transition-colors"
            />

            <button
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="btn-primary-purple px-6 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Qo'shilmoqda...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Qo'shilish</span>
                </>
              )}
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-xl mx-auto bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-sm font-semibold">
            {errorMessage}
          </div>
        )}
      </div>

      {/* DYNAMIC PUBLIC BATTLES */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white">
              Ommaviy Janglar
            </h3>
            <p className="text-xs text-slate-400">
              Hozirda faol bo'lgan va qatnashchilar kutayotgan xonalar.
            </p>
          </div>
        </div>

        {isLoadingPublic ? (
          <div className="flex justify-center py-8 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : publicRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {room.subject}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold flex items-center gap-1 font-mono">
                      #{room.room_code}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white">
                    {room.host_name || 'Xona Egasi'} bilan Jang
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Xona kodi: <strong className="text-purple-300 font-mono">{room.room_code}</strong>. Qo'shiling va bilimingizni sinang.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    1 / 2
                  </span>
                  <button
                    onClick={() => {
                      setInputBattleCode(room.room_code);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-purple-600 hover:border-purple-500 text-xs font-bold text-slate-200 transition-all flex items-center gap-1"
                  >
                    <span>Kodni tanlash</span>
                    <Swords className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PublicBattleCard
              subject="Algoritmlar"
              title="Dijkstra vs A* Star"
              description="Eng qisqa yo‘lni topish algoritmlari bo‘yicha musobaqa."
              duration="15 daqiqa"
              players="1 / 2"
              onJoin={() => onStartBattle('Algoritmlar', true)}
            />
            <PublicBattleCard
              subject="Frontend"
              title="React Hooks Masterclass"
              description="React Hooks va state management bo‘yicha battle."
              duration="45 daqiqa"
              players="1 / 2"
              onJoin={() => onStartBattle('Dasturlash', true)}
            />
            <PublicBattleCard
              subject="Ma'lumotlar Bazasi"
              title="Murakkab SQL So‘rovlari"
              description="JOIN, subquery va window funksiyalari."
              duration="30 daqiqa"
              players="1 / 2"
              onJoin={() => onStartBattle('Dasturlash', true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface PublicBattleCardProps {
  subject: string;
  title: string;
  description: string;
  duration: string;
  players: string;
  onJoin: () => void;
}

const PublicBattleCard: React.FC<PublicBattleCardProps> = ({
  subject,
  title,
  description,
  duration,
  players,
  onJoin,
}) => {
  return (
    <div className="bg-[#0C0F1E] border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {subject}
          </span>
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {duration}
          </span>
        </div>

        <h4 className="text-lg font-bold text-white">
          {title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          {players}
        </span>
        <button
          onClick={onJoin}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-purple-600 hover:border-purple-500 text-xs font-bold text-slate-200 transition-all"
        >
          Qo'shilish
        </button>
      </div>
    </div>
  );
};