import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { SAMPLE_QUESTIONS } from '../data/questionsData';
import confetti from 'canvas-confetti';
import type { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubject?: string;
  user?: User | null;
  roomId?: string | null;
}

export const BattleModal: React.FC<BattleModalProps> = ({
  isOpen,
  onClose,
  selectedSubject,
  user,
  roomId,
}) => {
  const [qIdx, setQIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Opponent Realtime state
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [opponentOpt, setOpponentOpt] = useState<number | null>(null);
  // const [opponentIsCorrect, setOpponentIsCorrect] = useState<boolean | null>(null);

  const [battleOver, setBattleOver] = useState(false);

  // Filter questions based on selected subject if matched, otherwise fallback to all questions
  const filteredQuestions = React.useMemo(() => {
    if (!selectedSubject) return SAMPLE_QUESTIONS;
    const matched = SAMPLE_QUESTIONS.filter(
      (q) => q.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    return matched.length > 0 ? matched : SAMPLE_QUESTIONS;
  }, [selectedSubject]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQIdx(0);
      setPlayerHp(100);
      setOpponentHp(100);
      setSelectedOpt(null);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setOpponentOpt(null);
      // setOpponentIsCorrect(null);
      setBattleOver(false);
    }
  }, [isOpen, selectedSubject, roomId]);

  // Supabase Realtime Broadcast Listener
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured() || !roomId) return;

    const channel = supabase.channel(`battle_room_${roomId}`);

    channel
      .on('broadcast', { event: 'player_answered' }, (payload) => {
        const data = payload.payload;
        if (data.playerId !== user?.id && data.qIdx === qIdx) {
          setOpponentSubmitted(true);
          setOpponentOpt(data.selectedOpt);
          // setOpponentIsCorrect(data.isCorrect);
        }
      })
      .on('broadcast', { event: 'next_question' }, (payload) => {
        const data = payload.payload;
        if (typeof data.nextQIdx === 'number') {
          setQIdx(data.nextQIdx);
          setSelectedOpt(null);
          setSubmitted(false);
          setOpponentSubmitted(false);
          setOpponentOpt(null);
          // setOpponentIsCorrect(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId, user?.id, qIdx]);

  if (!isOpen) return null;

  const currentQ = filteredQuestions[qIdx] || filteredQuestions[0];

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelectedOpt(idx);
    setSubmitted(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    if (isCorrect) {
      setOpponentHp((prev) => {
        const next = Math.max(0, prev - 25);
        if (next === 0) {
          setBattleOver(true);
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        return next;
      });
    } else {
      setPlayerHp((prev) => {
        const next = Math.max(0, prev - 25);
        if (next === 0) setBattleOver(true);
        return next;
      });
    }

    // Broadcast answer to opponent in real-time
    if (roomId && isSupabaseConfigured()) {
      const channel = supabase.channel(`battle_room_${roomId}`);
      channel.send({
        type: 'broadcast',
        event: 'player_answered',
        payload: {
          playerId: user?.id || 'player',
          playerName: user?.name || 'O\'yinchi',
          qIdx,
          selectedOpt: idx,
          isCorrect,
        },
      });
    }
  };

  const nextQuestion = () => {
    const nextIdx = qIdx + 1;
    if (nextIdx >= filteredQuestions.length || playerHp <= 0 || opponentHp <= 0) {
      setBattleOver(true);
    } else {
      setQIdx(nextIdx);
      setSelectedOpt(null);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setOpponentOpt(null);
      // setOpponentIsCorrect(null);

      // Broadcast next question to ALL players in the room
      if (roomId && isSupabaseConfigured()) {
        const channel = supabase.channel(`battle_room_${roomId}`);
        channel.send({
          type: 'broadcast',
          event: 'next_question',
          payload: {
            nextQIdx: nextIdx,
          },
        });
      }
    }
  };

  const restartBattle = () => {
    setQIdx(0);
    setPlayerHp(100);
    setOpponentHp(100);
    setSelectedOpt(null);
    setSubmitted(false);
    setOpponentSubmitted(false);
    setOpponentOpt(null);
    // setOpponentIsCorrect(null);
    setBattleOver(false);

    if (roomId && isSupabaseConfigured()) {
      const channel = supabase.channel(`battle_room_${roomId}`);
      channel.send({
        type: 'broadcast',
        event: 'next_question',
        payload: { nextQIdx: 0 },
      });
    }
  };

  const bothAnswered = submitted && opponentSubmitted;
  const isBothCorrect =
    bothAnswered &&
    selectedOpt === currentQ.correctAnswerIndex &&
    opponentOpt === currentQ.correctAnswerIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0A0D1B] border border-slate-800/90 rounded-2xl md:rounded-3xl w-full max-w-4xl p-6 md:p-10 space-y-6 shadow-2xl shadow-purple-950/30 relative overflow-hidden text-slate-100">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation & Close Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chiqish</span>
          </button>

          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-black text-white tracking-tight">
              AI Battle Arena {selectedSubject && <span className="text-purple-400">• {selectedSubject}</span>}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Bars Status Section */}
        <div className="grid grid-cols-2 gap-4 md:gap-8 bg-[#070914] p-4 rounded-2xl border border-slate-800/80 relative z-10">
          {/* Player HP */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" />
                {user?.name || 'Siz (O\'yinchi 1)'}
              </span>
              <span className="text-emerald-400 font-mono">{playerHp} HP</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${playerHp}%` }}
              />
            </div>
          </div>

          {/* Opponent HP */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                Raqib (O'yinchi 2)
              </span>
              <span className="text-purple-400 font-mono">{opponentHp} HP</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${opponentHp}%` }}
              />
            </div>
          </div>
        </div>

        {/* Battle Over Screen */}
        {battleOver ? (
          <div className="text-center py-10 space-y-6 animate-fadeIn relative z-10">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl shadow-2xl">
              {opponentHp === 0 ? '🏆' : '💀'}
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-white tracking-tight">
                {opponentHp === 0 ? 'G\'ALABA QOZONDINGIZ!' : 'MAG\'LUBIYAT!'}
              </h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {opponentHp === 0
                  ? 'Tabriklaymiz! Siz jangda g\'olib bo\'ldingiz va +200 XP to\'pladingiz!'
                  : 'Raqibingiz bu safar tezroq va aniqroq javob berdi. Qayta sinab ko\'ring.'}
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={restartBattle}
                className="px-7 py-3.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Qayta o'ynash</span>
              </button>
              <button
                onClick={onClose}
                className="px-7 py-3.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all"
              >
                Jangni yakunlash
              </button>
            </div>
          </div>
        ) : (
          /* Active Question & Options Content */
          <div className="space-y-6 relative z-10">

            {/* Realtime Status Indicator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold px-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {submitted
                    ? 'Siz javob berdingiz ✓'
                    : 'Javobingizni tanlang...'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                {opponentSubmitted ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Raqib ham javob berdi!
                  </span>
                ) : (
                  <span className="text-slate-400 animate-pulse">
                    Raqib javob berishi kutilmoqda...
                  </span>
                )}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#0F1426] p-6 rounded-2xl border border-slate-800/80 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                  Savol {qIdx + 1} / {filteredQuestions.length} • {currentQ.subject}
                </span>
                <span className="text-slate-400 font-mono">Qiyinlik: {currentQ.difficulty}</span>
              </div>
              <p className="font-bold text-lg md:text-xl text-white leading-snug pt-1">
                {currentQ.question}
              </p>
            </div>

            {/* 4 Option Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-[#0F1426] hover:bg-slate-800/80 border-slate-800/80 text-slate-200';
                if (submitted) {
                  if (idx === currentQ.correctAnswerIndex) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                  } else if (idx === selectedOpt) {
                    btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                  } else {
                    btnStyle = 'opacity-40 bg-slate-900 border-slate-800 text-slate-500';
                  }
                }
                return (
                  <button
                    key={idx}
                    disabled={submitted}
                    onClick={() => handleSelect(idx)}
                    className={`p-4 rounded-2xl border text-sm md:text-base font-semibold text-left transition-all ${btnStyle}`}
                  >
                    <span className="mr-2 text-slate-400 font-mono">{String.fromCharCode(65 + idx)})</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Next Question Action */}
            {submitted && (
              <div className="space-y-3 animate-fadeIn">
                {isBothCorrect && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                    🎉 Ikkala o'yinchi ham to'g'ri javobni belgiladi!
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl bg-[#0F1426] border border-slate-800 text-xs md:text-sm gap-4">
                  <span className="text-slate-300 leading-relaxed">
                    💡 <strong className="text-white">Tushuntirish:</strong> {currentQ.explanation}
                  </span>
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shrink-0 shadow-lg shadow-purple-600/30 transition-all w-full md:w-auto justify-center"
                  >
                    <span>Keyingi savol</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
