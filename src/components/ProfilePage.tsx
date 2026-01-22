import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { useFriends } from '@/hooks/useFriends';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePetCollection } from '@/hooks/usePetCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, Crown, Sparkles, Gem, Zap, Calendar, Trophy, 
  Users, Gift, Send, Check, X, UserPlus, Heart, Star,
  Clock, Target, Award, Palette, PawPrint, Medal, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PetSelector, { getPetEmoji } from '@/components/game/PetSelector';
import { useRanks } from '@/hooks/useRanks';
import PetCollectionStats from '@/components/profile/PetCollectionStats';
import CaughtPetsStats from '@/components/profile/CaughtPetsStats';

interface ProfilePageProps {
  setCurrentPage?: (page: string) => void;
}

const PETS = ['🐕', '🐈', '🐹', '🐰', '🦜'];
const PET_TYPES = ['dog', 'cat', 'hamster', 'rabbit', 'parrot'];

const ProfilePage = ({ setCurrentPage }: ProfilePageProps) => {
  const { profile, refreshProfile } = useGameState();
  const { friends, pendingRequests, receivedGifts, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, sendGift, claimGift, loading } = useFriends(profile?.id);
  const { leaderboard } = useLeaderboard();
  const { getCurrentRank } = useRanks();
  const [activeSection, setActiveSection] = useState<'stats' | 'pets' | 'friends' | 'gifts'>('stats');
  const [giftDialog, setGiftDialog] = useState<{ open: boolean; friendId: string; friendName: string }>({ open: false, friendId: '', friendName: '' });
  const [giftAmount, setGiftAmount] = useState('10');
  const [giftType, setGiftType] = useState<'crystals' | 'diamonds'>('crystals');
  const [sendingGift, setSendingGift] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);

  const currentRank = getCurrentRank();

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  const pet = getPetEmoji(profile.pet_type || 'dog');
  const playerRank = leaderboard.findIndex(p => p.id === profile.id) + 1;
  const memberSince = new Date(profile.created_at).toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSendGift = async () => {
    if (!giftDialog.friendId || !giftAmount) return;
    setSendingGift(true);
    try {
      await sendGift(giftDialog.friendId, giftType, parseInt(giftAmount));
      setGiftDialog({ open: false, friendId: '', friendName: '' });
      setGiftAmount('10');
    } catch (error) {
      // Error handled in hook
    } finally {
      setSendingGift(false);
    }
  };

  const sections = [
    { id: 'stats', label: 'Статистика', icon: Trophy },
    { id: 'pets', label: 'Питомцы', icon: PawPrint },
    { id: 'friends', label: 'Друзья', icon: Users, badge: pendingRequests.length },
    { id: 'gifts', label: 'Подарки', icon: Gift, badge: receivedGifts.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 pb-24 space-y-4"
      data-testid="profile-page"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card-premium p-6 rounded-2xl text-center relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        
        <div className="relative z-10">
          {/* Avatar */}
          <motion.div
            className="text-6xl mb-3 inline-block relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {pet}
            {playerRank > 0 && playerRank <= 3 && (
              <motion.span
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {playerRank === 1 ? '👑' : playerRank === 2 ? '🥈' : '🥉'}
              </motion.span>
            )}
          </motion.div>
          
          <h1 className="text-2xl font-bold mb-1">
            {profile.first_name || profile.username || 'Игрок'}
          </h1>
          
          {profile.username && (
            <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>
          )}
          
          {/* Level badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
            <Crown className="w-5 h-5 text-primary" />
            <span className="font-bold">Уровень {profile.level}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPetSelector(true)}
            >
              <Palette className="w-4 h-4 mr-2" />
              Питомцы
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage?.('titles')}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
            >
              <Medal className="w-4 h-4 mr-2" />
              Ранги и титулы
            </Button>
          </div>

          {/* Current Rank Display */}
          {currentRank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card cursor-pointer hover:bg-muted/50 transition-all"
              onClick={() => setCurrentPage?.('titles')}
              style={{ borderColor: currentRank.color }}
            >
              <span className="text-lg">{currentRank.icon}</span>
              <span className="font-medium" style={{ color: currentRank.color }}>
                {currentRank.name_ru}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Pet Selector Modal */}
      <AnimatePresence>
        {showPetSelector && (
          <PetSelector
            currentPetType={profile.pet_type || 'dog'}
            userId={profile.id}
            userCrystals={profile.crystals}
            userDiamonds={profile.diamonds}
            onClose={() => setShowPetSelector(false)}
            onPetChanged={() => refreshProfile?.()}
            onCurrencySpent={() => refreshProfile?.()}
          />
        )}
      </AnimatePresence>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-all relative ${
              activeSection === section.id 
                ? 'glass-card-premium text-primary' 
                : 'glass-card text-muted-foreground'
            }`}
          >
            <section.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{section.label}</span>
            {section.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {section.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Section */}
      <AnimatePresence mode="wait">
        {activeSection === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
            data-testid="profile-stats"
          >
            {/* Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="text-muted-foreground text-sm">Кристаллы</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {Math.floor(profile.crystals).toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Gem className="w-5 h-5 text-purple-400" />
                  <span className="text-muted-foreground text-sm">Алмазы</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {Math.floor(profile.diamonds).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-muted-foreground text-sm">Опыт</span>
                </div>
                <p className="text-xl font-bold">{Math.floor(profile.xp).toLocaleString()}</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  <span className="text-muted-foreground text-sm">Стрик</span>
                </div>
                <p className="text-xl font-bold">{profile.streak_days} дней 🔥</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-muted-foreground text-sm">Рейтинг</span>
                </div>
                <p className="text-xl font-bold">#{playerRank || '—'}</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-muted-foreground text-sm">Друзья</span>
                </div>
                <p className="text-xl font-bold">{friends.length}</p>
              </div>
            </div>

            {/* Member since */}
            <div className="glass-card p-4 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">В игре с</p>
                <p className="font-medium">{memberSince}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pets Section */}
        {activeSection === 'pets' && (
          <motion.div
            key="pets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Статистика пойманных питомцев */}
            <CaughtPetsStats />
            
            {/* Коллекция питомцев */}
            <PetCollectionStats 
              userId={profile.id} 
              currentPetType={profile.pet_type || 'dog'} 
            />
          </motion.div>
        )}

        {/* Friends Section */}
        {activeSection === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Запросы в друзья</h3>
                {pendingRequests.map(request => (
                  <div key={request.friendshipId} className="glass-card p-3 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">{PETS[request.avatar_variant % PETS.length]}</div>
                    <div className="flex-1">
                      <p className="font-medium">{request.first_name || request.username || 'Игрок'}</p>
                      <p className="text-xs text-muted-foreground">Уровень {request.level}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptFriendRequest(request.friendshipId)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => rejectFriendRequest(request.friendshipId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Мои друзья ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className="glass-card p-6 rounded-xl text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Пока нет друзей</p>
                  <p className="text-xs text-muted-foreground mt-1">Найди друзей в лидерборде!</p>
                </div>
              ) : (
                friends.map(friend => (
                  <div key={friend.friendshipId} className="glass-card p-3 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">{PETS[friend.avatar_variant % PETS.length]}</div>
                    <div className="flex-1">
                      <p className="font-medium">{friend.first_name || friend.username || 'Игрок'}</p>
                      <p className="text-xs text-muted-foreground">Уровень {friend.level}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setGiftDialog({ 
                        open: true, 
                        friendId: friend.id, 
                        friendName: friend.first_name || friend.username || 'Игрок' 
                      })}
                    >
                      <Gift className="w-4 h-4 mr-1" />
                      Подарок
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Gifts Section */}
        {activeSection === 'gifts' && (
          <motion.div
            key="gifts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Полученные подарки</h3>
            {receivedGifts.length === 0 ? (
              <div className="glass-card p-6 rounded-xl text-center">
                <Gift className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Нет новых подарков</p>
              </div>
            ) : (
              receivedGifts.map(gift => (
                <motion.div 
                  key={gift.id} 
                  className="glass-card-premium p-4 rounded-xl"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🎁</div>
                    <div className="flex-1">
                      <p className="font-medium">
                        От {gift.sender?.first_name || gift.sender?.username || 'Друга'}
                      </p>
                      <div className="flex items-center gap-1 text-sm">
                        {gift.gift_type === 'crystals' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                        {gift.gift_type === 'diamonds' && <Gem className="w-4 h-4 text-purple-400" />}
                        <span className="font-bold">+{gift.amount}</span>
                        <span className="text-muted-foreground">
                          {gift.gift_type === 'crystals' ? 'кристаллов' : 'алмазов'}
                        </span>
                      </div>
                      {gift.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{gift.message}"</p>
                      )}
                    </div>
                    <Button onClick={() => claimGift(gift.id)}>
                      Забрать
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Dialog */}
      <Dialog open={giftDialog.open} onOpenChange={(open) => setGiftDialog({ ...giftDialog, open })}>
        <DialogContent className="glass-card-premium border-0">
          <DialogHeader>
            <DialogTitle>Отправить подарок</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground">Получатель: <span className="text-foreground font-medium">{giftDialog.friendName}</span></p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setGiftType('crystals')}
                className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  giftType === 'crystals' ? 'bg-cyan-500/20 border-2 border-cyan-500' : 'glass-card'
                }`}
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Кристаллы</span>
              </button>
              <button
                onClick={() => setGiftType('diamonds')}
                className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  giftType === 'diamonds' ? 'bg-purple-500/20 border-2 border-purple-500' : 'glass-card'
                }`}
              >
                <Gem className="w-5 h-5 text-purple-400" />
                <span>Алмазы</span>
              </button>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Количество</label>
              <Input 
                type="number" 
                value={giftAmount} 
                onChange={(e) => setGiftAmount(e.target.value)}
                min="1"
                className="text-center text-lg"
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleSendGift}
              disabled={sendingGift || !giftAmount || parseInt(giftAmount) < 1}
            >
              {sendingGift ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProfilePage;
