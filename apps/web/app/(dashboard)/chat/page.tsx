'use client';

import './chat.css';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Send message to ComplianceBot API */
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
      const token = getCookie('access_token');
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error('Gagal mendapatkan respons dari AI');
      }

      const data = await res.json();
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.data?.reply ?? data.reply ?? 'Maaf, saya tidak dapat memproses permintaan Anda.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setError('Gagal menghubungi ComplianceBot. Coba lagi.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  /** Handle Enter key */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
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

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <EmptyState />
        )}
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
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
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
  );
}

/** Smart markdown → HTML renderer for bot responses.
 *  Handles both proper newline markdown AND inline lists (common with small LLMs). */
function renderMarkdown(text: string): string {
  let processed = text
    // Pre-process: split inline numbered lists ("1. foo 2. bar" → newlines)
    .replace(/(\S)\s+(\d+)\.\s+/g, '$1\n$2. ')
    // Pre-process: split inline bullets ("* foo * bar" → newlines)
    .replace(/(\S)\s+\*\s+/g, '$1\n* ')
    .replace(/(\S)\s+-\s+/g, '$1\n- ');

  return processed
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="chat-md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="chat-md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h3 class="chat-md-h3">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Numbered lists: "1. item"
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="chat-md-li"><span class="chat-md-num">$1.</span> $2</div>')
    // Bullet lists: "- item" or "* item"
    .replace(/^[-*]\s+(.+)$/gm, '<div class="chat-md-li"><span class="chat-md-bullet">•</span> $1</div>')
    // Double newlines → paragraph break
    .replace(/\n{2,}/g, '<div class="chat-md-break"></div>')
    // Single newlines → line break
    .replace(/\n/g, '<br/>');
}

/** Single chat bubble */
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
          <div
            className="chat-bot-bubble rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted rounded-bl-md"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
      </div>
    </div>
  );
}

/** Empty state with suggestion chips */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="font-heading font-semibold text-lg">
          Halo! Saya ComplianceBot 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Tanyakan apa saja tentang kepatuhan hukum bisnis di Indonesia.
          Saya siap membantu Anda memahami kewajiban legal.
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
