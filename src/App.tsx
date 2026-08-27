import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { BattleModal } from './components/BattleModal';
import { DashboardModal } from './components/DashboardModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import type { User } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isBattleOpen, setIsBattleOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check active session on load
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          xp: profile?.xp || 500,
          level: profile?.level || 1,
          total_battles: profile?.total_battles || 0,
          battles_won: profile?.battles_won || 0,
          battles_lost: profile?.battles_lost || 0,
          rank: 4
        });
      }
    };

    fetchSession();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          xp: profile?.xp || 500,
          level: profile?.level || 1,
          total_battles: profile?.total_battles || 0,
          battles_won: profile?.battles_won || 0,
          battles_lost: profile?.battles_lost || 0,
          rank: 4
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStartBattle = () => {
    if (!user) {
      setIsLoginOpen(true);
    } else {
      setIsDashboardOpen(true);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsDashboardOpen(true);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDashboardOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">

      {/* Header Bar */}
      <Header
        onOpenLogin={() => {
          if (user) {
            setIsDashboardOpen(true);
          } else {
            setIsLoginOpen(true);
          }
        }}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onStartBattle={handleStartBattle}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />

        {/* Features Section */}
        <FeaturesSection />
      </main>

      {/* Footer Bar */}
      <Footer />

      {/* Modals & Pages */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onStartBattle={(subject, directBattle) => {
          setSelectedSubject(subject);
          if (directBattle) {
            setIsDashboardOpen(false);
            setIsBattleOpen(true);
          } else {
            setIsMatchmakingOpen(true);
          }
        }}
        onOpenLeaderboard={() => {
          setIsLeaderboardOpen(true);
        }}
        user={user}
      />

      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        onClose={() => setIsMatchmakingOpen(false)}
        subject={selectedSubject}
        user={user}
        onStartBattle={() => {
          setIsMatchmakingOpen(false);
          setIsBattleOpen(true);
        }}
      />

      <BattleModal
        isOpen={isBattleOpen}
        onClose={() => setIsBattleOpen(false)}
        selectedSubject={selectedSubject}
      />

    </div>
  );
}
