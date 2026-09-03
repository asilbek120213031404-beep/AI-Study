import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  X,
  Swords,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { SAMPLE_QUESTIONS } from '../data/questionsData';
import confetti from 'canvas-confetti';
import type { User, Question } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubject?: string;
  user?: User | null;
  roomId?: string | null;
  onUserUpdate?: (updatedUser?: User) => void;
}

const getTableNameBySubject = (subject?: string): string => {
  if (!subject) return 'questions_for_it';
  const s = subject.toLowerCase().trim();
  if (s.includes('python')) return 'questions_for_python';
  if (s.includes('math') || s.includes('matematika')) return 'questions_for_math';
  if (s.includes('hist') || s.includes('tarix')) return 'questions_for_history';
  if (s.includes('phys') || s.includes('fizika')) return 'questions_for_physics';
  if (s.includes('eng') || s.includes('ingliz')) return 'questions_for_english';
  if (s.includes('it') || s.includes('dasturlash') || s.includes('kod')) return 'questions_for_it';
  return 'questions_for_it';
};

const mapRowToQuestion = (q: any, i: number, defaultSubject: string): Question => {
  const questionText = q.question || q.savol || q.text || q.title || q.content || 'Savol matni';

  let opts: string[] = [];
  if (Array.isArray(q.options)) {
    opts = q.options;
  } else if (Array.isArray(q.variantlar)) {
    opts = q.variantlar;
  } else if (Array.isArray(q.variants)) {
    opts = q.variants;
  } else if (typeof q.options === 'string') {
    try {
      const parsed = JSON.parse(q.options);
      if (Array.isArray(parsed)) opts = parsed;
    } catch (e) {}
  }

  if (opts.length === 0) {
    const rawOpts = [
      q.option1 || q.a || q.variant_a || q.option_a,
      q.option2 || q.b || q.variant_b || q.option_b,
      q.option3 || q.c || q.variant_c || q.option_c,
      q.option4 || q.d || q.variant_d || q.option_d,
    ].filter(Boolean);

    if (rawOpts.length > 0) {
      opts = rawOpts;
    } else {
      opts = ['Variant A', 'Variant B', 'Variant C', 'Variant D'];
    }
  }

  let correctIdx = 0;
  if (typeof q.correct_answer_index === 'number') {
    correctIdx = q.correct_answer_index;
  } else if (typeof q.correctAnswerIndex === 'number') {
    correctIdx = q.correctAnswerIndex;
  } else if (typeof q.togri_javob_index === 'number') {
    correctIdx = q.togri_javob_index;
  } else if (q.correct_answer || q.togri_javob || q.correct_option || q.answer) {
    const target = (q.correct_answer || q.togri_javob || q.correct_option || q.answer).toString().trim();
    if (/^[0-3]$/.test(target)) {
      correctIdx = parseInt(target, 10);
    } else if (/^[a-dA-D]$/.test(target)) {
      correctIdx = target.toUpperCase().charCodeAt(0) - 65;
    } else {
      const matchedIndex = opts.findIndex((o) => o.trim().toLowerCase() === target.toLowerCase());
      if (matchedIndex !== -1) correctIdx = matchedIndex;
    }
  }

  return {
    id: q.id?.toString() || `q_${i}`,
    subject: defaultSubject || q.subject || 'Dasturlash',
    difficulty: q.difficulty || q.qiyinlik || q.daraja || 'O\'rtacha',
    question: questionText,
    options: opts,
    correctAnswerIndex: Math.max(0, Math.min(opts.length - 1, correctIdx)),
    explanation: q.explanation || q.izoh || q.tushuntirish || 'Tushuntirish berilmagan.',
  };
};

export const BattleModal: React.FC<BattleModalProps> = ({
  isOpen,
  onClose,
  selectedSubject,
  user,
  roomId,
  onUserUpdate,
}) => {
  const [qIdx, setQIdx] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  // Ref — har doim joriy qiymatni saqlaydi (useEffect closure muammosini hal qiladi)
  const playerScoreRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Questions state from Supabase
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Opponent Realtime state
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [opponentOpt, setOpponentOpt] = useState<number | null>(null);

  const [battleOver, setBattleOver] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const transitionRef = useRef(false);
  const hasSavedResultRef = useRef(false);

  // Filter fallback questions based on selected subject
  const fallbackQuestions = React.useMemo(() => {
    if (!selectedSubject) return SAMPLE_QUESTIONS;
    const matched = SAMPLE_QUESTIONS.filter(
      (q) => q.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    return matched.length > 0 ? matched : SAMPLE_QUESTIONS;
  }, [selectedSubject]);

  // Fetch 10 random questions from Supabase based on subject table
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // Seeded shuffle helper for exact question alignment between host and guest
    const seedStr = roomId ? `${roomId}_${selectedSubject}` : `${selectedSubject}_default`;
    let seedNum = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seedNum = ((seedNum << 5) - seedNum) + seedStr.charCodeAt(i);
      seedNum |= 0;
    }
    const pseudoRandom = () => {
      const x = Math.sin(seedNum++) * 10000;
      return x - Math.floor(x);
    };

    const initialShuffled = [...fallbackQuestions];
    for (let i = initialShuffled.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [initialShuffled[i], initialShuffled[j]] = [initialShuffled[j], initialShuffled[i]];
    }
    setQuestions(initialShuffled.slice(0, 10));

    const fetchQuestionsFromSupabase = async () => {
      if (!isSupabaseConfigured()) return;
      setIsLoadingQuestions(true);

      const tableName = getTableNameBySubject(selectedSubject);
      console.log(`🌐 Supabase'dan savollar yuklanmoqda: ${tableName}`);

      try {
        let { data, error } = await supabase.from(tableName).select('*');

        // Fallback: If table is empty or error, try unified 'questions' table
        if (error || !data || data.length === 0) {
          console.log(`Fallback strategy check for subject: ${selectedSubject}`);
          const fallbackRes = await supabase
            .from('questions')
            .select('*')
            .eq('subject', selectedSubject || 'Dasturlash');

          if (fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
          }
        }

        if (data && data.length > 0 && isMounted) {
          const mappedQuestions: Question[] = data.map((q: any, i: number) =>
            mapRowToQuestion(q, i, selectedSubject || 'Dasturlash')
          );

          // Deterministic shuffle using roomId (or selectedSubject) as seed so both host & guest get exact same 10 questions
          const seedStr = roomId ? `${roomId}_${selectedSubject}` : `${selectedSubject}_default`;
          let seedNum = 0;
          for (let i = 0; i < seedStr.length; i++) {
            seedNum = ((seedNum << 5) - seedNum) + seedStr.charCodeAt(i);
            seedNum |= 0;
          }
          const pseudoRandom = () => {
            const x = Math.sin(seedNum++) * 10000;
            return x - Math.floor(x);
          };

          const shuffled = [...mappedQuestions];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(pseudoRandom() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          const selectedSet = shuffled.slice(0, 10);

          setQuestions(selectedSet);

          // Broadcast 10 selected questions to opponent so both players get exact same set
          if (roomId && isSupabaseConfigured()) {
            const channel = supabase.channel(`battle_room_${roomId}`);
            channel.send({
              type: 'broadcast',
              event: 'questions_loaded',
              payload: { questions: selectedSet },
            });
          }
        }
      } catch (err) {
        console.error('Savollarni yuklashda xatolik:', err);
      } finally {
        if (isMounted) setIsLoadingQuestions(false);
      }
    };

    fetchQuestionsFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedSubject, roomId, fallbackQuestions]);

  // Reset battle state on open
  useEffect(() => {
    if (isOpen) {
      setQIdx(0);
      setPlayerScore(0);
      setOpponentScore(0);
      playerScoreRef.current = 0;
      opponentScoreRef.current = 0;
      setSelectedOpt(null);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setOpponentOpt(null);
      setBattleOver(false);
      setCountdown(null);
      transitionRef.current = false;
      hasSavedResultRef.current = false;
    }
  }, [isOpen, selectedSubject, roomId]);

  // Save battle outcome (battles_won / battles_lost / xp) to local user state & Supabase profiles table when battle is over
  useEffect(() => {
    if (!battleOver || hasSavedResultRef.current) {
      return;
    }

    const saveBattleResult = async () => {
      hasSavedResultRef.current = true;

      const isWin = playerScore > opponentScore;
      const isTie = playerScore === opponentScore;

      const currentWon = Number(user?.battles_won ?? 0);
      const currentLost = Number(user?.battles_lost ?? 0);
      const currentTotal = Number(user?.total_battles ?? (currentWon + currentLost));
      const currentXp = Number(user?.xp ?? 500);

      const newWon = isWin ? currentWon + 1 : currentWon;
      const newLost = (!isWin && !isTie) ? currentLost + 1 : currentLost;
      const newTotal = currentTotal + 1;
      const newXp = isWin ? currentXp + 200 : currentXp;
      const newLevel = Math.min(10, Math.floor(newXp / 1000) + 1);

      // Create updated local user object
      const updatedUser: User = {
        ...(user || {
          id: `demo-${Date.now()}`,
          name: 'O\'yinchi',
          username: 'player',
          rank: 4,
        }),
        battles_won: newWon,
        battles_lost: newLost,
        total_battles: newTotal,
        xp: newXp,
        level: newLevel,
      };

      // Notify parent component immediately so local React state & UI update without delay
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      // If Supabase is configured, check if activeUserId is a valid UUID before upserting into Supabase DB
      if (isSupabaseConfigured()) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const activeUserId = user?.id || sessionData?.session?.user?.id;

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!activeUserId || !uuidRegex.test(activeUserId)) {
            console.warn('⚠️ Demo rejim yoki yaroqli UUID topilmadi, Supabase-ga saqlanmadi.');
            return;
          }

          console.log(`💾 Jang yakunlandi. Supabase'ga saqlash boshlandi... User: ${activeUserId}, G'alaba: ${isWin}`);

          // Fetch current profile stats from DB (source of truth)
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('battles_won, battles_lost, total_battles, xp, level, full_name, username')
            .eq('id', activeUserId)
            .maybeSingle();

          if (fetchError) {
            console.error('❌ Supabase profil ma\'lumotlarini olishda xatolik:', fetchError.message);
            // Fetch xato bo'lsa upsert ham ishlamaydi, shuning uchun to'xtatamiz
            return;
          }

          // DB dagi qiymatlardan foydalanish (agar yo'q bo'lsa local state fallback)
          const baseWon   = Number(existingProfile?.battles_won   ?? currentWon);
          const baseLost  = Number(existingProfile?.battles_lost  ?? currentLost);
          const baseTotal = Number(existingProfile?.total_battles ?? currentTotal);
          const baseXp    = Number(existingProfile?.xp            ?? currentXp);

          const dbWon   = isWin             ? baseWon  + 1 : baseWon;
          const dbLost  = (!isWin && !isTie)? baseLost + 1 : baseLost;
          const dbTotal = baseTotal + 1;
          const dbXp    = isWin ? baseXp + 200 : baseXp;
          const dbLevel = Math.min(10, Math.floor(dbXp / 1000) + 1);

          const userName =
            existingProfile?.full_name ||
            user?.name ||
            sessionData?.session?.user?.user_metadata?.full_name ||
            sessionData?.session?.user?.email?.split('@')[0] ||
            'O\'yinchi';
          // const userEmail    = user?.email    || sessionData?.session?.user?.email || '';
          const userUsername = existingProfile?.username || user?.username || sessionData?.session?.user?.user_metadata?.username || null;

          console.log(`💾 DB'dan o'qilgan qiymatlar: G'alaba=${baseWon}, Mag'lubiyat=${baseLost}, Jami=${baseTotal}`);
          console.log(`💾 Yangi qiymatlar: G'alaba=${dbWon}, Mag'lubiyat=${dbLost}, Jami=${dbTotal}, XP=${dbXp}`);

          // undefined o'rniga null ishlatamiz — Supabase undefined ni e'tiborsiz qoldiradi
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: activeUserId,
                full_name: userName,
                username: userUsername,   // null bo'lsa Supabase null saqlaydi
                battles_won: dbWon,
                battles_lost: dbLost,
                total_battles: dbTotal,
                xp: dbXp,
                level: dbLevel,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (upsertError) {
            console.error('❌ Supabase profiles upsert xatosi:', upsertError.message, upsertError);
          } else {
            console.log(
              `✅ Supabase profiles muvaffaqiyatli yangilandi: G'alaba=${dbWon}, Mag'lubiyat=${dbLost}, Jami=${dbTotal}, XP=${dbXp}, Level=${dbLevel}`
            );
          }
        } catch (err) {
          console.error('❌ Jang natijasini saqlashda kutilmagan xatolik:', err);
        }
      }
    };

    saveBattleResult();
  }, [battleOver, user, opponentScore, playerScore, onUserUpdate]);

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
          if (data.isCorrect) {
            setOpponentScore((prev) => prev + 1);
          }
        }
      })
      .on('broadcast', { event: 'next_question' }, (payload) => {
        const data = payload.payload;
        if (typeof data.nextQIdx === 'number') {
          transitionRef.current = false;
          setQIdx(data.nextQIdx);
          setSelectedOpt(null);
          setSubmitted(false);
          setOpponentSubmitted(false);
          setOpponentOpt(null);
          setCountdown(null);
        }
      })
      .on('broadcast', { event: 'questions_loaded' }, (payload) => {
        const data = payload.payload;
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId, user?.id, qIdx]);

  const currentQ = questions[qIdx] || questions[0] || fallbackQuestions[0];

  const handleSelect = (idx: number) => {
    if (submitted || !currentQ) return;
    setSelectedOpt(idx);
    setSubmitted(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    if (isCorrect) {
      playerScoreRef.current += 1;
      setPlayerScore(playerScoreRef.current);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
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
    } else {
      // Single player / demo fallback: simulate opponent answer
      setTimeout(() => {
        const oppIsCorrect = Math.random() < 0.7;
        const oppOpt = oppIsCorrect
          ? currentQ.correctAnswerIndex
          : (currentQ.correctAnswerIndex + 1) % currentQ.options.length;

        setOpponentSubmitted(true);
        setOpponentOpt(oppOpt);
        if (oppIsCorrect) {
          opponentScoreRef.current += 1;
          setOpponentScore(opponentScoreRef.current);
        }
      }, 600);
    }
  };

  const nextQuestion = () => {
    const nextIdx = qIdx + 1;
    transitionRef.current = false;

    if (nextIdx >= questions.length) {
      setBattleOver(true);
    } else {
      setQIdx(nextIdx);
      setSelectedOpt(null);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setOpponentOpt(null);
      setCountdown(null);

      // Broadcast next question index to ALL players in room
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

  // Auto-advance to next question when BOTH players have answered
  useEffect(() => {
    if (submitted && opponentSubmitted && !transitionRef.current && !battleOver) {
      transitionRef.current = true;
      setCountdown(2);

      const timer1 = setTimeout(() => setCountdown(1), 1000);
      const timer2 = setTimeout(() => {
        nextQuestion();
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [submitted, opponentSubmitted, battleOver]);

  const restartBattle = () => {
    setQIdx(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setSelectedOpt(null);
    setSubmitted(false);
    setOpponentSubmitted(false);
    setOpponentOpt(null);
    setBattleOver(false);
    setCountdown(null);
    transitionRef.current = false;
    hasSavedResultRef.current = false;

    if (roomId && isSupabaseConfigured()) {
      const channel = supabase.channel(`battle_room_${roomId}`);
      channel.send({
        type: 'broadcast',
        event: 'next_question',
        payload: { nextQIdx: 0 },
      });
    }
  };

  if (!isOpen) return null;

  const bothAnswered = submitted && opponentSubmitted;
  const isBothCorrect =
    bothAnswered &&
    currentQ &&
    selectedOpt === currentQ.correctAnswerIndex &&
    opponentOpt === currentQ.correctAnswerIndex;

  return (
    <div className={clsx('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'p-3', 'md:p-6', 'bg-slate-950/90', 'backdrop-blur-xl', 'animate-fadeIn')}>
      <div className={clsx('bg-[#0A0D1B]', 'border', 'border-slate-800/90', 'rounded-2xl', 'md:rounded-3xl', 'w-full', 'max-w-4xl', 'p-6', 'md:p-10', 'space-y-6', 'shadow-2xl', 'shadow-purple-950/30', 'relative', 'overflow-hidden', 'text-slate-100')}>

        {/* Ambient Glow */}
        <div className={clsx('absolute', 'top-0', 'right-0', 'w-72', 'h-72', 'bg-purple-600/10', 'rounded-full', 'blur-3xl', 'pointer-events-none')} />
        <div className={clsx('absolute', 'bottom-0', 'left-0', 'w-72', 'h-72', 'bg-cyan-600/10', 'rounded-full', 'blur-3xl', 'pointer-events-none')} />

        {/* Top Navigation & Close Header */}
        <div className={clsx('flex', 'items-center', 'justify-between', 'border-b', 'border-slate-800/80', 'pb-4', 'relative', 'z-10')}>
          <button
            onClick={onClose}
            className={clsx('flex', 'items-center', 'gap-2', 'px-3', 'py-1.5', 'rounded-xl', 'text-xs', 'font-semibold', 'text-slate-400', 'hover:text-white', 'bg-slate-900', 'border', 'border-slate-800', 'transition-colors')}
          >
            <ArrowLeft className={clsx('w-4', 'h-4')} />
            <span>Chiqish</span>
          </button>

          <div className={clsx('flex', 'items-center', 'gap-2')}>
            <Swords className={clsx('w-5', 'h-5', 'text-purple-400')} />
            <h3 className={clsx('text-lg', 'font-black', 'text-white', 'tracking-tight')}>
              AI Battle Arena {selectedSubject && <span className="text-purple-400">• {selectedSubject}</span>}
            </h3>
          </div>

          <button
            onClick={onClose}
            className={clsx('p-2', 'text-slate-400', 'hover:text-white', 'hover:bg-slate-800', 'rounded-xl', 'transition-colors')}
            title="Yopish"
          >
            <X className={clsx('w-5', 'h-5')} />
          </button>
        </div>

        {/* Score Progress Bar Section */}
        <div className={clsx('grid', 'grid-cols-2', 'gap-4', 'md:gap-8', 'bg-[#070914]', 'p-4', 'rounded-2xl', 'border', 'border-slate-800/80', 'relative', 'z-10')}>
          {/* Player Score */}
          <div className="space-y-1.5">
            <div className={clsx('flex', 'justify-between', 'items-center', 'text-xs', 'font-bold')}>
              <span className={clsx('text-emerald-400', 'flex', 'items-center', 'gap-1.5')}>
                <span className={clsx('w-2', 'h-2', 'rounded-full', 'bg-emerald-400', 'shadow-[0_0_8px_#22c55e]')} />
                {user?.name || 'Siz (O\'yinchi 1)'}
              </span>
              <span className={clsx('text-emerald-400', 'font-mono', 'text-sm')}>{playerScore} / {questions.length} ball</span>
            </div>
            <div className={clsx('w-full', 'h-3', 'bg-slate-900', 'rounded-full', 'overflow-hidden', 'border', 'border-slate-800')}>
              <div
                className={clsx('h-full', 'bg-gradient-to-r', 'from-emerald-500', 'to-teal-400', 'rounded-full', 'transition-all', 'duration-300')}
                style={{ width: `${(playerScore / Math.max(1, questions.length)) * 100}%` }}
              />
            </div>
          </div>

          {/* Opponent Score */}
          <div className="space-y-1.5">
            <div className={clsx('flex', 'justify-between', 'items-center', 'text-xs', 'font-bold')}>
              <span className={clsx('text-purple-400', 'flex', 'items-center', 'gap-1.5')}>
                <span className={clsx('w-2', 'h-2', 'rounded-full', 'bg-purple-400', 'shadow-[0_0_8px_#a855f7]')} />
                Raqib (O'yinchi 2)
              </span>
              <span className={clsx('text-purple-400', 'font-mono', 'text-sm')}>{opponentScore} / {questions.length} ball</span>
            </div>
            <div className={clsx('w-full', 'h-3', 'bg-slate-900', 'rounded-full', 'overflow-hidden', 'border', 'border-slate-800')}>
              <div
                className={clsx('h-full', 'bg-gradient-to-r', 'from-purple-600', 'to-indigo-500', 'rounded-full', 'transition-all', 'duration-300')}
                style={{ width: `${(opponentScore / Math.max(1, questions.length)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Battle Over Screen */}
        {battleOver ? (
          <div className={clsx('text-center', 'py-10', 'space-y-6', 'animate-fadeIn', 'relative', 'z-10')}>
            <div className={clsx('w-20', 'h-20', 'mx-auto', 'rounded-3xl', 'bg-slate-900', 'border', 'border-slate-800', 'flex', 'items-center', 'justify-center', 'text-5xl', 'shadow-2xl')}>
              {playerScore > opponentScore ? '🏆' : playerScore < opponentScore ? '💀' : '🤝'}
            </div>
            <div className="space-y-2">
              <h4 className={clsx('text-3xl', 'font-black', 'text-white', 'tracking-tight')}>
                {playerScore > opponentScore
                  ? 'G\'ALABA QOZONDINGIZ!'
                  : playerScore < opponentScore
                  ? 'MAG\'LUBIYAT!'
                  : 'DURANG!'}
              </h4>
              <p className={clsx('text-sm', 'text-slate-400', 'max-w-md', 'mx-auto')}>
                {playerScore > opponentScore
                  ? `Tabriklaymiz! Siz ${questions.length} ta savoldan ${playerScore} tasiga to'g'ri javob berdingiz (raqib: ${opponentScore}) va +200 XP to'pladingiz!`
                  : playerScore < opponentScore
                  ? `Raqibingiz ${opponentScore} ta savolga to'g'ri javob berdi, siz esa ${playerScore} ta. Qayta sinab ko'ring.`
                  : `Ikkala o'yinchi ham ${playerScore} tadan to'g'ri javob berdi! Janggiz durang bilan yakunlandi.`}
              </p>
            </div>
            <div className={clsx('flex', 'justify-center', 'gap-4', 'pt-4')}>
              <button
                onClick={restartBattle}
                className={clsx('px-7', 'py-3.5', 'rounded-xl', 'text-xs', 'font-bold', 'bg-purple-600', 'hover:bg-purple-500', 'text-white', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'shadow-purple-600/30', 'transition-all')}
              >
                <RotateCcw className={clsx('w-4', 'h-4')} />
                <span>Qayta o'ynash</span>
              </button>
              <button
                onClick={onClose}
                className={clsx('px-7', 'py-3.5', 'rounded-xl', 'text-xs', 'font-bold', 'bg-slate-900', 'border', 'border-slate-800', 'hover:bg-slate-800', 'text-slate-300', 'transition-all')}
              >
                Jangni yakunlash
              </button>
            </div>
          </div>
        ) : (
          /* Active Question & Options Content */
          <div className={clsx('space-y-6', 'relative', 'z-10')}>

            {/* Realtime Status Indicator Bar */}
            <div className={clsx('flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-2', 'text-xs', 'font-semibold', 'px-1')}>
              <div className={clsx('flex', 'items-center', 'gap-2', 'text-slate-300')}>
                <Clock className={clsx('w-3.5', 'h-3.5', 'text-purple-400')} />
                <span>
                  {submitted
                    ? 'Javobingiz qabul qilindi ✓'
                    : 'Javobingizni tanlang...'}
                </span>
              </div>

              <div className={clsx('flex', 'items-center', 'gap-2')}>
                <UserIcon className={clsx('w-3.5', 'h-3.5', 'text-cyan-400')} />
                {opponentSubmitted ? (
                  <span className={clsx('text-emerald-400', 'font-bold', 'flex', 'items-center', 'gap-1')}>
                    <CheckCircle2 className={clsx('w-3.5', 'h-3.5')} /> Raqib ham javob berdi!
                  </span>
                ) : (
                  <span className={clsx('text-amber-400', 'flex', 'items-center', 'gap-1.5', 'animate-pulse', 'font-medium')}>
                    <Loader2 className={clsx('w-3.5', 'h-3.5', 'animate-spin')} /> Raqib javob berishi kutilmoqda...
                  </span>
                )}
              </div>
            </div>

            {/* Question Card */}
            {isLoadingQuestions ? (
              <div className={clsx('bg-[#0F1426]', 'p-12', 'rounded-2xl', 'border', 'border-slate-800/80', 'flex', 'flex-col', 'items-center', 'justify-center', 'space-y-3', 'text-purple-400')}>
                <Loader2 className={clsx('w-8', 'h-8', 'animate-spin')} />
                <span className={clsx('text-sm', 'font-bold', 'text-slate-300')}>
                  Supabase'dan {selectedSubject || 'Dasturlash'} fanidan 10 ta savollar yuklanmoqda...
                </span>
              </div>
            ) : currentQ ? (
              <>
                <div className={clsx('bg-[#0F1426]', 'p-6', 'rounded-2xl', 'border', 'border-slate-800/80', 'space-y-3', 'shadow-lg')}>
                  <div className={clsx('flex', 'items-center', 'justify-between', 'text-xs', 'font-semibold')}>
                    <span className={clsx('text-purple-400', 'bg-purple-500/10', 'px-3', 'py-1', 'rounded-lg', 'border', 'border-purple-500/20')}>
                      Savol {qIdx + 1} / {questions.length} • {currentQ.subject}
                    </span>
                    <span className={clsx('text-slate-400', 'font-mono')}>Qiyinlik: {currentQ.difficulty}</span>
                  </div>
                  <p className={clsx('font-bold', 'text-lg', 'md:text-xl', 'text-white', 'leading-snug', 'pt-1')}>
                    {currentQ.question}
                  </p>
                </div>

                {/* 4 Option Buttons Grid */}
                <div className={clsx('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-3.5')}>
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
                        <span className={clsx('mr-2', 'text-slate-400', 'font-mono')}>{String.fromCharCode(65 + idx)})</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {/* Answer Explanation & Automatic Transition Notice */}
            {submitted && currentQ && (
              <div className={clsx('space-y-3', 'animate-fadeIn')}>
                {bothAnswered ? (
                  <div className={clsx('p-3.5', 'rounded-2xl', 'bg-emerald-500/15', 'border', 'border-emerald-500/30', 'text-emerald-300', 'text-xs', 'md:text-sm', 'font-bold', 'flex', 'items-center', 'justify-between', 'shadow-lg')}>
                    <div className={clsx('flex', 'items-center', 'gap-2')}>
                      <CheckCircle2 className={clsx('w-4', 'h-4', 'text-emerald-400')} />
                      <span>
                        {isBothCorrect
                          ? '🎉 Ikkala o\'yinchi ham to\'g\'ri javob berdi!'
                          : 'Ikkala o\'yinchi ham javob berdi!'}
                      </span>
                    </div>
                    {countdown !== null && (
                      <span className={clsx('bg-emerald-500/20', 'text-emerald-300', 'px-3', 'py-1', 'rounded-xl', 'text-xs', 'font-mono')}>
                        {countdown}s da keyingi savol...
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={clsx('p-3', 'rounded-xl', 'bg-purple-500/10', 'border', 'border-purple-500/20', 'text-purple-300', 'text-xs', 'font-semibold', 'flex', 'items-center', 'gap-2')}>
                    <Loader2 className={clsx('w-4', 'h-4', 'animate-spin', 'text-purple-400')} />
                    <span>Javobingiz qabul qilindi. Raqibingiz javob bergach, avtomatik keyingi savolga o'tiladi.</span>
                  </div>
                )}

                <div className={clsx('p-4', 'rounded-2xl', 'bg-[#0F1426]', 'border', 'border-slate-800', 'text-xs', 'md:text-sm', 'text-slate-300', 'leading-relaxed')}>
                  💡 <strong className="text-white">Tushuntirish:</strong> {currentQ.explanation}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
