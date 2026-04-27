'use client';

import './chat.css';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Cpu,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
}

interface AiModel {
  id: string;
  name: string;
  provider: string;
  plans: string[];
}

interface ConversationItem {
  id: string;
  title: string | null;
  model: string | null;
  provider: string | null;
  updatedAt: string;
  _count: { messages: number };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convoId: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Load conversation list */
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.data || []);
    } catch { /* */ }
  }, []);

  /** Load a specific conversation's messages */
  const loadConversation = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${convoId}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.data?.messages) {
        setMessages(
          data.data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
            model: m.model,
            provider: m.provider,
          }))
        );
      }
      if (data.data?.model) setSelectedModel(data.data.model);
      setConversationId(convoId);
      setError(null);
      setShowHistory(false);
    } catch {
      setError('Gagal memuat percakapan.');
    }
  }, []);

  /** Initial load: models + latest conversation */
  useEffect(() => {
    // Load AI models
    fetch(`${API_URL}/chat/models`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const list = d?.data || [];
        setModels(list);
        if (list.length > 0 && !selectedModel) setSelectedModel(list[0].id);
      })
      .catch(() => {});

    // Load conversations + restore latest
    async function init() {
      try {
        const res = await fetch(`${API_URL}/chat/conversations`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = data.data || [];
        setConversations(list);

        if (list.length > 0) {
          const latest = list[0];
          setConversationId(latest.id);
          if (latest.model) setSelectedModel(latest.model);

          const detailRes = await fetch(`${API_URL}/chat/conversations/${latest.id}`, { credentials: 'include' });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.data?.messages) {
              setMessages(
                detail.data.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: new Date(m.createdAt),
                  model: m.model,
                  provider: m.provider,
                }))
              );
            }
          }
        }
      } catch { /* */ }
      finally { setIsInitializing(false); }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Send message */
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId, model: selectedModel || undefined }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));

        if (res.status === 404 && conversationId) {
          setConversationId(null);
          const retryRes = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, model: selectedModel || undefined }),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.data?.conversationId) setConversationId(retryData.data.conversationId);
            setMessages((prev) => [...prev, {
              id: crypto.randomUUID(), role: 'assistant',
              content: retryData.data?.reply ?? 'Maaf, saya tidak dapat memproses permintaan Anda.',
              timestamp: new Date(),
            }]);
            loadConversations();
            return;
          }
        }

        if (res.status === 403) {
          throw new Error(errBody.message || errBody.error?.message || 'Akses ditolak.');
        }
        throw new Error(errBody.message || errBody.error?.message || `Error ${res.status}`);
      }

      const data = await res.json();

      if (data.data?.conversationId) {
        setConversationId(data.data.conversationId);
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.data?.reply ?? 'Maaf, saya tidak dapat memproses permintaan Anda.',
        timestamp: new Date(),
        model: data.data?.model,
        provider: data.data?.provider,
      }]);

      // Refresh conversation list (new convo may have been created)
      loadConversations();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghubungi ComplianceBot.';
      setError(msg.includes('fetch') ? 'Gagal menghubungi server. Pastikan API berjalan.' : msg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
    setShowHistory(false);
  }

  async function handleDeleteConversation(convoId: string) {
    setDeleting(convoId);
    setContextMenu(null);
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${convoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convoId));
        // If we deleted the active conversation, reset to empty
        if (conversationId === convoId) {
          setConversationId(null);
          setMessages([]);
        }
      }
    } catch { /* */ }
    finally { setDeleting(null); }
  }

  function handleContextMenu(e: React.MouseEvent, convoId: string) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, convoId });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat riwayat percakapan...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-5xl mx-auto animate-fade-in gap-4">
      {/* Conversation History Sidebar */}
      <div className={`${showHistory ? 'flex' : 'hidden lg:flex'} flex-col w-64 shrink-0 border border-border rounded-2xl bg-card overflow-hidden`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Riwayat Chat</h3>
          <button
            onClick={handleNewChat}
            className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            title="Chat Baru"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-3">Belum ada percakapan</p>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => loadConversation(convo.id)}
                onContextMenu={(e) => handleContextMenu(e, convo.id)}
                disabled={deleting === convo.id}
                className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors group ${
                  conversationId === convo.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                } ${deleting === convo.id ? 'opacity-50' : ''}`}
              >
                <p className="text-xs font-medium truncate">{convo.title || 'Percakapan Baru'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{formatDate(convo.updatedAt)}</span>
                  <span className="text-[10px] text-muted-foreground">{convo._count.messages} pesan</span>
                  {deleting === convo.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div
            className="fixed z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleDeleteConversation(contextMenu.convoId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Percakapan
            </button>
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Mobile history toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg">ComplianceBot</h1>
              <p className="text-xs text-muted-foreground">
                AI assistant untuk kepatuhan hukum bisnis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector */}
            {models.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted font-medium transition-colors"
                >
                  <Cpu className="w-3 h-3" />
                  <span className="hidden sm:inline">{models.find((m) => m.id === selectedModel)?.name || 'Model'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                </button>
                {showModelPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {models.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center justify-between ${
                            selectedModel === m.id ? 'bg-primary/5 text-primary font-semibold' : ''
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{m.provider}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={handleNewChat}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted font-medium transition-colors hidden sm:flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Chat Baru
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {messages.length === 0 && <EmptyState />}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ComplianceBot sedang mengetik...</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <span className="text-destructive">{error}</span>
                {error.includes('Upgrade') || error.includes('paket') || error.includes('limit') ? (
                  <a href="/pricing" className="block mt-1 text-xs text-primary font-medium hover:underline">
                    Lihat Paket Upgrade &rarr;
                  </a>
                ) : null}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border pt-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya tentang kewajiban hukum bisnis Anda..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            ComplianceBot memberikan informasi umum, bukan nasihat hukum resmi.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Smart markdown to HTML renderer */
function renderMarkdown(text: string): string {
  let processed = text
    .replace(/(\S)\s+(\d+)\.\s+/g, '$1\n$2. ')
    .replace(/(\S)\s+\*\s+/g, '$1\n* ')
    .replace(/(\S)\s+-\s+/g, '$1\n- ');

  return processed
    .replace(/^### (.+)$/gm, '<h4 class="chat-md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="chat-md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h3 class="chat-md-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-md-link">$1 ↗</a>')
    .replace(/(?<![="'])(https?:\/\/[^\s<)\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-md-link">$1 ↗</a>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="chat-md-li"><span class="chat-md-num">$1.</span> $2</div>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="chat-md-li"><span class="chat-md-bullet">•</span> $1</div>')
    .replace(/📎\s*Sumber:\s*(.+)/g, '<div class="chat-md-source">📎 <strong>Sumber:</strong> $1</div>')
    .replace(/🔗\s*Portal Resmi:/g, '<div class="chat-md-portal-header">🔗 <strong>Portal Resmi:</strong></div>')
    .replace(/⚠️\s*(.+)/g, '<div class="chat-md-warning">⚠️ $1</div>')
    .replace(/\n{2,}/g, '<div class="chat-md-break"></div>')
    .replace(/\n/g, '<br/>');
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        {isUser ? (
          <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-md">
            {message.content}
          </div>
        ) : (
          <div>
            <div
              className="chat-bot-bubble rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted rounded-bl-md"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
            {message.model && (
              <p className="text-[10px] text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                {message.model}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="font-heading font-semibold text-lg">Halo! Saya ComplianceBot</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Tanyakan apa saja tentang kepatuhan hukum bisnis di Indonesia.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {[
          'Izin usaha apa yang dibutuhkan untuk restoran?',
          'Apa itu NIB dan bagaimana cara mendapatkannya?',
          'Kewajiban pajak UMKM di Indonesia',
        ].map((q) => (
          <span
            key={q}
            className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted cursor-default transition-colors"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}
