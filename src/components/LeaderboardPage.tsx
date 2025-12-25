import { motion } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useGameState } from '@/hooks/useGameState';
import { Crown, Trophy, Medal, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PETS = ['🐕', '🐈', '🐹', '🐰', '🦜'];

const LeaderboardPage = () => {
  const { leaderboard, loading, refreshLeaderboard } = useLeaderboard();
  const { profile } = useGameState();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const currentUserRank = leaderboard.findIndex(p => p.id === profile?.id) + 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 pb-24 space-y-4"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card-premium p-4 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Лидерборд</h1>
              <p className="text-sm text-muted-foreground">
                Топ-50 игроков
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshLeaderboard}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {currentUserRank > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Твоё место:</span>
            <span className="font-bold text-primary">#{currentUserRank}</span>
          </div>
        )}
      </motion.div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-end gap-2 py-4"
        >
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0 }}
              animate={{ 
                y: [0, -8, 0], 
                opacity: 1, 
                scale: 1,
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.5, delay: 0.2 },
                scale: { duration: 0.5, delay: 0.2 }
              }}
              className="text-4xl mb-2 relative"
            >
              <motion.span
                className="absolute -top-2 -right-2 text-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
              {PETS[leaderboard[1].avatar_variant % PETS.length]}
            </motion.div>
            <div className="glass-card p-3 rounded-xl text-center border border-gray-400/30">
              <Trophy className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="font-bold text-sm truncate max-w-20">
                {leaderboard[1].first_name || leaderboard[1].username || 'Игрок'}
              </p>
              <p className="text-xs text-muted-foreground">Ур. {leaderboard[1].level}</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-4">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0 }}
              animate={{ 
                y: [0, -12, 0], 
                opacity: 1, 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.5, delay: 0.15 }
              }}
              className="text-5xl mb-2 relative"
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl"
                animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.span>
              <motion.span
                className="absolute -top-1 -left-3 text-lg"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                ⭐
              </motion.span>
              <motion.span
                className="absolute -top-1 -right-3 text-lg"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
              >
                ⭐
              </motion.span>
              <span className="relative z-10">{PETS[leaderboard[0].avatar_variant % PETS.length]}</span>
            </motion.div>
            <div className="glass-card-premium p-4 rounded-xl text-center border-2 border-yellow-500/30 relative">
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <p className="font-bold truncate max-w-24 mt-2">
                {leaderboard[0].first_name || leaderboard[0].username || 'Игрок'}
              </p>
              <p className="text-sm text-muted-foreground">Ур. {leaderboard[0].level}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-cyan-400 mt-1">
                <Sparkles className="w-3 h-3" />
                {Math.floor(leaderboard[0].crystals).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0 }}
              animate={{ 
                y: [0, -6, 0], 
                opacity: 1, 
                scale: 1,
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.5, delay: 0.25 },
                scale: { duration: 0.5, delay: 0.25 }
              }}
              className="text-4xl mb-2 relative"
            >
              <motion.span
                className="absolute -top-2 -left-2 text-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                🌟
              </motion.span>
              {PETS[leaderboard[2].avatar_variant % PETS.length]}
            </motion.div>
            <div className="glass-card p-3 rounded-xl text-center border border-amber-600/30">
              <Medal className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="font-bold text-sm truncate max-w-20">
                {leaderboard[2].first_name || leaderboard[2].username || 'Игрок'}
              </p>
              <p className="text-xs text-muted-foreground">Ур. {leaderboard[2].level}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rest of Leaderboard */}
      <div className="space-y-2">
        {leaderboard.slice(3).map((player, index) => {
          const rank = index + 4;
          const isCurrentUser = player.id === profile?.id;
          
          return (
            <motion.div
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 * index }}
              className={`glass-card p-3 rounded-xl flex items-center gap-3 ${
                isCurrentUser ? 'ring-2 ring-primary' : ''
              } ${getRankStyle(rank)}`}
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                {getRankIcon(rank)}
              </div>

              {/* Avatar */}
              <div className="text-2xl">
                {PETS[player.avatar_variant % PETS.length]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                  {player.first_name || player.username || 'Игрок'}
                  {isCurrentUser && <span className="text-xs ml-1">(ты)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Уровень {player.level}
                </p>
              </div>

              {/* Crystals */}
              <div className="flex items-center gap-1 text-sm text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span>{Math.floor(player.crystals).toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Пока нет игроков в лидерборде</p>
        </div>
      )}
    </motion.div>
  );
};

export default LeaderboardPage;
