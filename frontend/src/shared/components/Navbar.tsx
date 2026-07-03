'use client';

import { ConnectButton } from '@/features/wallet/ui/ConnectButton';
import { Bell, Search } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:hidden">
          <h1 className="text-lg font-bold gradient-text">RoyaltyFlow</h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agreements, payments..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              id="global-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            id="notifications-button"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
          </button>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
