import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/uuid';

interface QuestNotification {
  id: string;
  user_id: string;
  notification_type: string;
  quest_id: string | null;
  quest_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useQuestNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<QuestNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    // Skip API calls for demo mode or invalid UUIDs
    if (!userId || !isValidUUID(userId)) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quest_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('quest_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId || !isValidUUID(userId)) return;

    try {
      const { error } = await supabase
        .from('quest_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [userId]);

  const createNotification = useCallback(async (
    type: string,
    message: string,
    questType: string = 'daily',
    questId?: string
  ) => {
    if (!userId || !isValidUUID(userId)) return;

    try {
      const { error } = await supabase
        .from('quest_notifications')
        .insert({
          user_id: userId,
          notification_type: type,
          message,
          quest_type: questType,
          quest_id: questId || null,
        });

      if (error) throw error;

      // Show toast for important notifications
      if (type === 'completed' || type === 'reward_available') {
        toast({
          title: type === 'completed' ? '🎯 Квест выполнен!' : '🎁 Награда доступна!',
          description: message,
          duration: 5000,
        });
      }

      await loadNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [userId, loadNotifications, toast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('quest_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const clearOldNotifications = useCallback(async () => {
    if (!userId || !isValidUUID(userId)) return;

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { error } = await supabase
        .from('quest_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)
        .lt('created_at', weekAgo.toISOString());

      if (error) throw error;

      await loadNotifications();
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }
  }, [userId, loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId || !isValidUUID(userId)) return;

    const channel = supabase
      .channel('quest_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quest_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as QuestNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for new notifications
          toast({
            title: '🔔 Новое уведомление',
            description: newNotification.message,
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    clearOldNotifications,
    refreshNotifications: loadNotifications,
  };
};
