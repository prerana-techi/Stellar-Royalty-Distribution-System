'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { Settings, Globe, Bell, Shield, Check } from 'lucide-react';

export default function SettingsPage() {
  const { network, setNetwork, address, isConnected, walletName } = useWallet();
  const [notifications, setNotifications] = useState({ payments: true, agreements: true, status: false });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage preferences and wallet configuration</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Wallet</h2>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm text-muted-foreground">Wallet</span>
              <span className="text-sm font-medium">{walletName}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm text-muted-foreground">Address</span>
              <code className="text-sm font-mono text-primary">{address?.slice(0, 8)}...{address?.slice(-8)}</code>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No wallet connected.</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Network</h2>
        <div className="space-y-3">
          {[
            { id: 'testnet', name: 'Stellar Testnet', desc: 'Development', ok: true },
            { id: 'mainnet', name: 'Stellar Mainnet', desc: 'Coming Soon', ok: false },
          ].map((n) => (
            <button key={n.id} onClick={() => n.ok && setNetwork(n.id)} disabled={!n.ok}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${network === n.id ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/[0.02]'} ${!n.ok ? 'opacity-50 cursor-not-allowed' : ''}`}
              id={`network-${n.id}`}>
              <div className="text-left"><p className="font-medium text-sm">{n.name}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
              {network === n.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</h2>
        <div className="space-y-3">
          {([
            { key: 'payments' as const, label: 'Payment Distributions' },
            { key: 'agreements' as const, label: 'Agreement Changes' },
            { key: 'status' as const, label: 'Network Status' },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
              <p className="text-sm font-medium">{item.label}</p>
              <button onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-primary' : 'bg-white/10'}`} id={`toggle-${item.key}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[item.key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
