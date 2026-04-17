'use client';

import { Bell } from 'lucide-react';

export function Topbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: mobile menu + breadcrumb placeholder */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {/* Badge placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </button>

        <button
          type="button"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          aria-label="User menu"
        >
          U
        </button>
      </div>
    </header>
  );
}
