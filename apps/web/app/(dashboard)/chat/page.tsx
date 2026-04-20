'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useChat } from '@/hooks/use-chat';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { SuggestedQuestions } from '@/components/chat/suggested-questions';

export default function ChatPage() {
  const { user: authUser, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useChat();

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewConversation = async () => {
    const conv = await createConversation();
    if (conv) {
      await selectConversation(conv.id);
    }
  };

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  const handleFeedback = async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    await submitFeedback(messageId, feedback);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ChatSidebar
        conversations={conversations?.items || []}
        currentId={currentConversation?.id}
        onSelect={selectConversation}
        onNew={handleNewConversation}
        onDelete={deleteConversation}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {!currentConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold mb-3">Compliance Assistant</h1>
              <p className="text-muted-foreground mb-8">
                Tanya saya tentang regulasi, izin, atau kepatuhan bisnis. Saya siap membantu!
              </p>
              {conversations?.items.length === 0 ? (
                <button
                  onClick={handleNewConversation}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Mulai Percakapan
                </button>
              ) : (
                <SuggestedQuestions onSelect={handleSend} />
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Kirim pesan untuk memulai percakapan
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onFeedback={handleFeedback}
                  />
                ))
              )}
            </div>

            <ChatInput
              onSend={handleSend}
              disabled={streaming}
            />
          </>
        )}
      </main>
    </div>
  );
}