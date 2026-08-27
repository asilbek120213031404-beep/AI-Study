import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

import type { User } from '../types';
import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface JoinBattleSectionProps {
  user: User | null;
  onStartBattle: (subject?: string) => void;
}

interface GameRoom {
  id: string;
  room_code: string;
  subject: string;
  host_id: string;
  host_name: string | null;
  host_avatar: string | null;
  guest_id: string | null;
  guest_name: string | null;
  guest_avatar: string | null;
  status: string;
}

export const JoinBattleSection: React.FC<
  JoinBattleSectionProps
> = ({
  user,
  onStartBattle,
}) => {
    const [inputBattleCode, setInputBattleCode] =
      useState('');

    const [isJoining, setIsJoining] =
      useState(false);

    const [errorMessage, setErrorMessage] =
      useState<string | null>(null);

    const handleJoinRoom = async () => {
      const targetCode = inputBattleCode
        .trim()
        .replace(/\s+/g, '');

      setErrorMessage(null);

      if (!isSupabaseConfigured()) {
        setErrorMessage(
          'Supabase sozlanmagan.'
        );
        return;
      }

      if (!user?.id) {
        setErrorMessage(
          'Avval tizimga kiring.'
        );
        return;
      }

      if (!targetCode) {
        setErrorMessage(
          'Jang kodini kiriting.'
        );
        return;
      }

      if (!/^\d{6}$/.test(targetCode)) {
        setErrorMessage(
          'Jang kodi 6 xonali bo‘lishi kerak.'
        );
        return;
      }

      setIsJoining(true);

      try {
        /*
         * ========================================================
         * 1. ROOMNI QIDIRISH
         * ========================================================
         */

        const {
          data: room,
          error: findError,
        } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('room_code', targetCode)
          .eq('status', 'waiting')
          .maybeSingle();

        if (findError) {
          console.error(
            '❌ Room qidirishda xatolik:',
            findError
          );

          setErrorMessage(
            'Roomni qidirishda xatolik yuz berdi.'
          );

          return;
        }

        if (!room) {
          setErrorMessage(
            'Bunday kodli faol jang topilmadi.'
          );

          return;
        }

        const typedRoom =
          room as GameRoom;

        /*
         * ========================================================
         * 2. O'Z ROOMINGIZGA KIRIB QOLISHNI OLDINI OLISH
         * ========================================================
         */

        if (typedRoom.host_id === user.id) {
          setErrorMessage(
            'Siz o‘zingiz yaratgan jangga qo‘shila olmaysiz.'
          );

          return;
        }

        /*
         * ========================================================
         * 3. ROOMNI UPDATE QILISH
         * ========================================================
         */

        const {
          data: updatedRoom,
          error: updateError,
        } = await supabase
          .from('game_rooms')
          .update({
            guest_id: user.id,
            guest_name:
              user.name || 'Raqib',
            guest_avatar:
              user.avatar || null,
            status: 'matched',
          })
          .eq('id', typedRoom.id)
          .eq('status', 'waiting')
          .select()
          .single();

        if (updateError) {
          console.error(
            '❌ Roomga qo‘shilishda xatolik:',
            updateError
          );

          setErrorMessage(
            'Jangga qo‘shilishda xatolik yuz berdi.'
          );

          return;
        }

        if (!updatedRoom) {
          setErrorMessage(
            'Room band bo‘lib qolgan. Boshqa kodni sinab ko‘ring.'
          );

          return;
        }

        console.log(
          '✅ Roomga muvaffaqiyatli qo‘shildingiz:',
          updatedRoom
        );

        /*
         * ========================================================
         * 4. BATTLE PAGE
         * ========================================================
         *
         * Player 2 roomga muvaffaqiyatli kirgandan keyin
         * battle page'ga o'tadi.
         */

        onStartBattle(
          (updatedRoom as GameRoom).subject
        );

      } catch (error) {
        console.error(
          '❌ Roomga qo‘shilishda xatolik:',
          error
        );

        setErrorMessage(
          'Kutilmagan xatolik yuz berdi.'
        );
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

          {/* INPUT */}

          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">

            <input
              type="text"
              value={inputBattleCode}
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => {
                const value =
                  e.target.value.replace(
                    /\D/g,
                    ''
                  );

                setInputBattleCode(value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinRoom();
                }
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

          {/* ERROR */}

          {errorMessage && (
            <div className="max-w-xl mx-auto bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

        </div>

        {/* PUBLIC BATTLES */}

        <div className="space-y-4 pt-2">

          <div className="flex items-center justify-between">

            <div>

              <h3 className="text-2xl font-black text-white">
                Ommaviy Janglar
              </h3>

              <p className="text-xs text-slate-400">
                Faol janglar.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* CARD 1 */}

            <PublicBattleCard
              subject="Algoritmlar"
              title="Dijkstra vs A* Star"
              description="Eng qisqa yo‘lni topish algoritmlari bo‘yicha musobaqa."
              duration="15 daqiqa"
              players="12 / 20"
              onJoin={() =>
                onStartBattle('Algoritmlar')
              }
            />

            {/* CARD 2 */}

            <PublicBattleCard
              subject="Frontend"
              title="React Hooks Masterclass"
              description="React Hooks va state management bo‘yicha battle."
              duration="45 daqiqa"
              players="8 / 10"
              onJoin={() =>
                onStartBattle('Dasturlash')
              }
            />

            {/* CARD 3 */}

            <PublicBattleCard
              subject="Ma'lumotlar Bazasi"
              title="Murakkab SQL So‘rovlari"
              description="JOIN, subquery va window funksiyalari."
              duration="30 daqiqa"
              players="45 / 50"
              onJoin={() =>
                onStartBattle('Dasturlash')
              }
            />

          </div>

        </div>

      </div>
    );
  };

/*
 * ==============================================================
 * PUBLIC BATTLE CARD
 * ==============================================================
 */

interface PublicBattleCardProps {
  subject: string;
  title: string;
  description: string;
  duration: string;
  players: string;
  onJoin: () => void;
}

const PublicBattleCard: React.FC<
  PublicBattleCardProps
> = ({
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
              <Clock className="w-3 h-3" />
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
            <UserIcon className="w-3.5 h-3.5" />
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