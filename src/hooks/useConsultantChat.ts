import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from './useDemoMode';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useConsultantChat = () => {
  const { profile, isDemo } = useDemoMode();
  const userId = profile?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load chat sessions for authenticated users
  const loadChatSessions = useCallback(async () => {
    if (isDemo || !userId || userId === 'demo-user') return;

    try {
      const { data, error } = await supabase
        .from('consultant_chats')
        .select('id, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading chat sessions:', error);
        return;
      }

      setChatSessions(data?.map(s => ({
        id: s.id,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      })) || []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  }, [isDemo, userId]);

  // Load messages for a specific chat
  const loadChatMessages = useCallback(async (chatId: string) => {
    if (isDemo || !userId || userId === 'demo-user') return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('consultant_messages')
        .select('id, role, content, image_url, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data?.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imageUrl: m.image_url || undefined,
        timestamp: new Date(m.created_at),
      })) || []);
      setCurrentChatId(chatId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isDemo, userId]);

  // Create a new chat session
  const createNewChat = useCallback(async () => {
    if (isDemo || !userId || userId === 'demo-user') {
      setMessages([]);
      setCurrentChatId(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('consultant_chats')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        return null;
      }

      setCurrentChatId(data.id);
      setMessages([]);
      await loadChatSessions();
      return data.id;
    } catch (err) {
      console.error('Failed to create chat:', err);
      return null;
    }
  }, [isDemo, userId, loadChatSessions]);

  // Save a message to the current chat
  const saveMessage = useCallback(async (message: Message) => {
    if (isDemo || !userId || userId === 'demo-user') return;

    let chatId = currentChatId;
    
    // Create new chat if needed
    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) return;
    }

    try {
      await supabase
        .from('consultant_messages')
        .insert({
          chat_id: chatId,
          role: message.role,
          content: message.content,
          image_url: message.imageUrl || null,
        });

      // Update chat's updated_at
      await supabase
        .from('consultant_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, [isDemo, userId, currentChatId, createNewChat]);

  // Upload image to storage
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Failed to upload image:', err);
      return null;
    }
  }, []);

  // Delete a chat session
  const deleteChat = useCallback(async (chatId: string) => {
    if (isDemo || !userId || userId === 'demo-user') return;

    try {
      await supabase
        .from('consultant_chats')
        .delete()
        .eq('id', chatId);

      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      
      await loadChatSessions();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }, [isDemo, userId, currentChatId, loadChatSessions]);

  // Initial load
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  return {
    messages,
    setMessages,
    chatSessions,
    currentChatId,
    isLoadingHistory,
    isAuthenticated: !isDemo && userId !== 'demo-user' && !!userId,
    loadChatSessions,
    loadChatMessages,
    createNewChat,
    saveMessage,
    uploadImage,
    deleteChat,
  };
};
