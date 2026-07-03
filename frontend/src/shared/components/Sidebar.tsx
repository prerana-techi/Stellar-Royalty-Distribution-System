'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Activity,
  ArrowLeftRight,
  Settings,
  BarChart3,
  Gem,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Gem },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activity', label: 'Activity Feed', icon: Activity },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-white/5 bg-background/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-600/25">
          <Gem className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">RoyaltyFlow</h1>
          <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Stellar Powered</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">Stellar Testnet</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Connected to Soroban RPC
          </p>
        </div>
      </div>
    </aside>
  );
}
