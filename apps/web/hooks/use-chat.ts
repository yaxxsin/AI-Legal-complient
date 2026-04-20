import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  feedback?: string | null;
  feedbackComment?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  businessProfileId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface ConversationList {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useChat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationList | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const supabase = createClient();

  const getToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? 'dev-token';
    } catch {
      return 'dev-token';
    }
  }, [supabase]);

  const fetchConversations = useCallback(async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiClient.get<ConversationList>('/chat/conversations', {
        query: { page },
        token,
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  const createConversation = useCallback(async (businessProfileId?: string) => {
    if (!user) return null;
    try {
      const token = await getToken();
      const res = await apiClient.post<Conversation>('/chat/conversations', {
        title: 'Percakapan Baru',
        businessProfileId,
      }, { token });
      const conv = res.data;
      setCurrentConversation(conv);
      setMessages([]);
      await fetchConversations();
      return conv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [user, getToken, fetchConversations]);

  const selectConversation = useCallback(async (id: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const [convRes, msgsRes] = await Promise.all([
        apiClient.get<Conversation>(`/chat/conversations/${id}`, { token }).catch(() => null),
        apiClient.get<Message[]>(`/chat/conversations/${id}/messages`, { token }),
      ]);
      setCurrentConversation(convRes?.data ?? { id, title: 'Loading...', businessProfileId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 0 } });
      setMessages(msgsRes.data ?? []);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/chat/conversations/${id}`, { token });
      setConversations(prev => prev ? {
        ...prev,
        items: prev.items.filter(c => c.id !== id),
        total: prev.total - 1,
      } : null);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [user, getToken, currentConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !currentConversation) return;
    
    const accessToken = await getToken();
    
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setStreaming(true);

    const botTempId = `bot-${Date.now()}`;
    const botTempMsg: Message = {
      id: botTempId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, botTempMsg]);

    try {
      const response = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: content,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages(prev => prev.map(m => 
                  m.id === botTempId ? { ...m, content: fullContent } : m
                ));
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m => 
        m.id === botTempId ? { ...m, content: fullContent || 'Maaf, saya tidak dapat menjawab saat ini.' } : m
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m => 
        m.id === botTempId ? { ...m, content: '⚠️ Gagal mengirim pesan. Silakan coba lagi.' } : m
      ));
    } finally {
      setStreaming(false);
    }
  }, [user, currentConversation]);

  const submitFeedback = useCallback(async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down', comment?: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      await apiClient.post(`/chat/messages/${messageId}/feedback`, { feedback, comment }, { token });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    streaming,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    submitFeedback,
  };
}