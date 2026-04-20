'use client';

import { useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { MessageSquarePlus, Trash2, MoreVertical } from 'lucide-react';
import { Conversation } from '@/hooks/use-chat';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatGroupDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hari ini';
  if (isYesterday(date)) return 'Kemarin';
  return format(date, 'd MMM yyyy', { locale: id });
}

function groupByDate(convs: Conversation[]): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {};
  for (const conv of convs) {
    const key = formatGroupDate(conv.updatedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(conv);
  }
  return groups;
}

export function ChatSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
}: ChatSidebarProps) {
  const groups = groupByDate(conversations);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <aside className="w-72 h-full bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Percakapan Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Belum ada percakapan. Mulaipercakapan baru!
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {date}
              </div>
              {items.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    currentId === conv.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelect(conv.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate text-foreground">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv._count.messages} pesan
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === conv.id ? null : conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-border transition-all"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {menuOpen === conv.id && (
                    <div className="absolute right-4 top-10 z-10 bg-popover border border-border rounded-lg shadow-lg py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Hapus percakapan ini?')) {
                            onDelete(conv.id);
                          }
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}