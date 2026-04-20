'use client';

import { useState } from 'react';
import { Message } from '@/hooks/use-chat';
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  onFeedback: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => void;
}

export function ChatBubble({ message, onFeedback }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`relative rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-accent text-accent-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content || (
              <span className="animate-pulse">...</span>
            )}
          </div>
        </div>

        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-1 ml-1">
            <button
              onClick={() => onFeedback(message.id, 'thumbs_up')}
              className={`p-1.5 rounded-full hover:bg-muted transition-colors ${
                message.feedback === 'thumbs_up' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground'
              }`}
              title="Membantu"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'thumbs_down')}
              className={`p-1.5 rounded-full hover:bg-muted transition-colors ${
                message.feedback === 'thumbs_down' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground'
              }`}
              title="Tidak membantu"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              title="Salin"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}