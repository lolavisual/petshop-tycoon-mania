import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  oderId: string;
  username: string | null;
  first_name: string | null;
  level: number;
  avatar_variant: number;
  status: string;
  friendshipId: string;
  isRequester: boolean;
}

interface Gift {
  id: string;
  from_user_id: string;
  to_user_id: string;
  gift_type: string;
  amount: number;
  message: string | null;
  is_claimed: boolean;
  created_at: string;
  sender?: {
    first_name: string | null;
    username: string | null;
    avatar_variant: number;
  };
}

export const useFriends = (userId?: string) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadFriends = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Load friendships where user is involved
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendshipsError) throw friendshipsError;

      const friendIds = (friendships || []).map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, first_name, level, avatar_variant')
          .in('id', friendIds);

        if (profilesError) throw profilesError;

        const friendsList: Friend[] = [];
        const pendingList: Friend[] = [];

        (friendships || []).forEach(f => {
          const oderId = f.user_id === userId ? f.friend_id : f.user_id;
          const profile = (profiles || []).find(p => p.id === oderId);
          
          if (profile) {
            const friendData: Friend = {
              id: profile.id,
              oderId,
              username: profile.username,
              first_name: profile.first_name,
              level: profile.level,
              avatar_variant: profile.avatar_variant,
              status: f.status,
              friendshipId: f.id,
              isRequester: f.user_id === userId,
            };

            if (f.status === 'accepted') {
              friendsList.push(friendData);
            } else if (f.status === 'pending' && f.friend_id === userId) {
              pendingList.push(friendData);
            }
          }
        });

        setFriends(friendsList);
        setPendingRequests(pendingList);
      } else {
        setFriends([]);
        setPendingRequests([]);
      }

      // Load received gifts
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('*')
        .eq('to_user_id', userId)
        .eq('is_claimed', false)
        .order('created_at', { ascending: false });

      if (giftsError) throw giftsError;

      // Get sender profiles for gifts
      if (gifts && gifts.length > 0) {
        const senderIds = [...new Set(gifts.map(g => g.from_user_id))];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, username, avatar_variant')
          .in('id', senderIds);

        const giftsWithSenders = gifts.map(g => ({
          ...g,
          sender: senderProfiles?.find(p => p.id === g.from_user_id),
        }));

        setReceivedGifts(giftsWithSenders);
      } else {
        setReceivedGifts([]);
      }

    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Запрос уже отправлен",
            description: "Вы уже отправили запрос этому игроку",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Запрос отправлен! 📨",
        description: "Ожидайте ответа от игрока",
      });

      await loadFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить запрос",
        variant: "destructive",
      });
    }
  }, [userId, loadFriends, toast]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Друг добавлен! 🎉",
        description: "Теперь вы можете обмениваться подарками",
      });

      await loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять запрос",
        variant: "destructive",
      });
    }
  }, [loadFriends, toast]);

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Запрос отклонён",
      });

      await loadFriends();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  }, [loadFriends, toast]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Друг удалён",
      });

      await loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }, [loadFriends, toast]);

  const sendGift = useCallback(async (toUserId: string, giftType: string, amount: number, message?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-gift', {
        body: { toUserId, giftType, amount, message },
      });

      if (error) throw error;

      toast({
        title: "Подарок отправлен! 🎁",
        description: `${amount} ${giftType === 'crystals' ? 'кристаллов' : 'алмазов'} отправлено`,
      });

      return data;
    } catch (error) {
      console.error('Error sending gift:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить подарок",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const claimGift = useCallback(async (giftId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('claim-gift', {
        body: { giftId },
      });

      if (error) throw error;

      toast({
        title: "Подарок получен! 🎉",
        description: `+${data.amount} ${data.giftType === 'crystals' ? 'кристаллов' : data.giftType === 'diamonds' ? 'алмазов' : 'XP'}`,
      });

      await loadFriends();
      return data;
    } catch (error) {
      console.error('Error claiming gift:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить подарок",
        variant: "destructive",
      });
      throw error;
    }
  }, [loadFriends, toast]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  return {
    friends,
    pendingRequests,
    receivedGifts,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    sendGift,
    claimGift,
    refreshFriends: loadFriends,
    unclaimedGiftsCount: receivedGifts.length,
  };
};
