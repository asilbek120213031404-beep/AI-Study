import React, {
  useEffect,
  useState,
} from 'react';

import {
  Copy,
  Check,
  User as UserIcon,
  X,
  Swords,
  Loader2,
} from 'lucide-react';

import type { User, GameRoom } from '../types';

import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  user: User | null;
  onStartBattle: (roomId?: string) => void;
}

export const MatchmakingModal: React.FC<
  MatchmakingModalProps
> = ({
  isOpen,
  onClose,
  subject = 'Matematika',
  user,
  onStartBattle,
}) => {
    const [copied, setCopied] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [opponentFound, setOpponentFound] = useState(false);
    const [guestDetails, setGuestDetails] = useState<{
      name: string;
      avatar?: string;
    } | null>(null);

    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [isStartingBattle, setIsStartingBattle] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);

    const generateRoomCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    useEffect(() => {
      if (!isOpen) return;

      if (!isSupabaseConfigured()) {
        setRoomError('Supabase sozlanmagan.');
        return;
      }

      if (!user?.id) {
        setRoomError('Foydalanuvchi aniqlanmadi.');
        return;
      }

      let channel: ReturnType<typeof supabase.channel> | null = null;
      let isMounted = true;

      const setupRoom = async () => {
        setIsCreatingRoom(true);
        setRoomError(null);
        setCopied(false);
        setOpponentFound(false);
        setGuestDetails(null);
        setRoomId(null);

        try {
          let room: GameRoom | null = null;
          let attempts = 0;

          while (!room && attempts < 5) {
            attempts++;
            const cleanCode = generateRoomCode();

            const { data, error } = await supabase
              .from('game_rooms')
              .insert({
                room_code: cleanCode,
                subject,
                host_id: user.id,
                host_name: user.name || 'Xona Egasi',
                host_avatar: user.avatar || null,
                status: 'waiting',
              })
              .select()
              .single();

            if (!error && data) {
              room = data as GameRoom;
            }
          }

          if (!room) {
            throw new Error('Unikal xona kodi yaratib bo‘lmadi. Qayta urinib ko‘ring.');
          }

          if (!isMounted) return;

          setRoomId(room.id);
          setRoomCode(room.room_code);

          console.log('✅ ROOM YARATILDI:', room);

          channel = supabase
            .channel(`game-room-${room.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${room.id}`,
              },
              (payload) => {
                const updatedRoom = payload.new as GameRoom;

                if (updatedRoom.status === 'matched' && updatedRoom.guest_id) {
                  setGuestDetails({
                    name: updatedRoom.guest_name || 'Raqib',
                    avatar: updatedRoom.guest_avatar || undefined,
                  });
                  setOpponentFound(true);
                }

                if (updatedRoom.status === 'cancelled') {
                  setOpponentFound(false);
                  setRoomError('Bu battle bekor qilindi.');
                }
              }
            )
            .subscribe();

        } catch (error) {
          console.error('❌ ROOM SETUP XATOSI:', error);
          if (isMounted) {
            setRoomError(
              error instanceof Error
                ? error.message
                : 'Room yaratishda xatolik yuz berdi.'
            );
          }
        } finally {
          if (isMounted) {
            setIsCreatingRoom(false);
          }
        }
      };

      setupRoom();

      return () => {
        isMounted = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }, [isOpen, subject, user?.id, user?.name, user?.avatar]);

    const handleCopyCode = async () => {
      if (!roomCode) return;
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Kodni nusxalashda xatolik:', error);
      }
    };

    const handleHostStartBattle = async () => {
      if (roomId && isSupabaseConfigured()) {
        setIsStartingBattle(true);
        try {
          await supabase
            .from('game_rooms')
            .update({ status: 'in_progress' })
            .eq('id', roomId);
        } catch (err) {
          console.error('Room statusini updatingizda xatolik:', err);
        } finally {
          setIsStartingBattle(false);
        }
      }
      onStartBattle(roomId || undefined);
    };

    const handleClose = async () => {
      if (roomId && user?.id && isSupabaseConfigured()) {
        try {
          await supabase
            .from('game_rooms')
            .update({ status: 'cancelled' })
            .eq('id', roomId)
            .eq('host_id', user.id)
            .eq('status', 'waiting');
        } catch (error) {
          console.error('Roomni yopishda xatolik:', error);
        }
      }
      onClose();
    };

    if (!isOpen) return null;

    const userName = user?.name || 'Siz';
    const level = user?.level || 1;
    const avatarUrl = user?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80';
    const guestAvatar = guestDetails?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
    const guestName = guestDetails?.name || 'Raqib...';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#0A0D1B] border border-slate-800/90 rounded-3xl w-full max-w-sm md:max-w-md p-6 md:p-8 space-y-6 shadow-2xl relative text-center text-slate-100">

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pt-2">
            <h2 className="text-xl font-black text-white">
              {opponentFound ? "Raqib topildi!" : "Raqib kutilmoqda..."}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fan: {subject}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">
            <div className="flex flex-col items-center space-y-1">
              <div className="relative">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] font-extrabold text-white px-3 py-0.5 rounded-full border border-slate-900 whitespace-nowrap">
                  Siz
                </div>
              </div>

              <div className="pt-2">
                <div className="font-extrabold text-base text-white">
                  {userName}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  Level {level}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-1 pt-1">
              <div className="w-11 h-11 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 font-black text-sm flex items-center justify-center italic">
                VS
              </div>
              <div className="text-[11px] font-semibold text-slate-400">
                {opponentFound ? 'Tayyor' : 'Kutilmoqda'}
              </div>
            </div>

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
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-[10px] font-extrabold text-white px-3 py-0.5 rounded-full border border-slate-900 whitespace-nowrap">
                    Qo'shildi
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-slate-600" />
                </div>
              )}

              <div className="pt-2">
                <div className="font-extrabold text-base text-slate-300 truncate max-w-[90px]">
                  {guestName}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {opponentFound ? 'Tayyor' : 'Qidirilmoqda'}
                </div>
              </div>
            </div>
          </div>

          {roomError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-xs font-semibold">
              {roomError}
            </div>
          )}

          {!opponentFound && (
            <>
              <p className="text-xs text-slate-300 font-medium max-w-xs mx-auto leading-relaxed px-2">
                Do'stingizga quyidagi kodni yuboring yoki boshqa o'yinchi qo'shilishini kuting.
              </p>

              <div className="bg-[#0E1222] border border-slate-800/90 rounded-2xl py-6 px-4 text-center shadow-inner">
                {isCreatingRoom ? (
                  <div className="flex items-center justify-center gap-2 text-purple-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-bold">
                      Room yaratilmoqda...
                    </span>
                  </div>
                ) : (
                  <div className="text-4xl md:text-5xl font-mono font-black text-purple-300 tracking-[0.25em]">
                    {roomCode
                      ? `${roomCode.slice(0, 3)} ${roomCode.slice(3)}`
                      : '------'}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-3 pt-1">
            {opponentFound ? (
              <button
                onClick={handleHostStartBattle}
                disabled={isStartingBattle}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white btn-primary-purple flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 animate-pulse disabled:opacity-50"
              >
                {isStartingBattle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Swords className="w-4 h-4" />
                )}
                <span>Battle-ni boshlash</span>
              </button>
            ) : (
              <button
                onClick={handleCopyCode}
                disabled={!roomCode}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white btn-primary-purple flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kod nusxalandi!</span>
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
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-300 bg-[#0C0F1E] hover:bg-slate-800 border border-slate-800 transition-all"
            >
              Bekor qilish
            </button>
          </div>

        </div>
      </div>
    );
  };