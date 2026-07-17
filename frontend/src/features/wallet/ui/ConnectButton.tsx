'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { shortenAddress } from '@/shared/lib/stellar';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectButton() {
  const { address, isConnected, isConnecting, walletName, connect, disconnect, availableWallets } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [, setTick] = useState(0);

  // Periodically re-check availability while modal is open in case browser extension injects asynchronously
  useEffect(() => {
    if (!showWalletSelect) return;
    const timer = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(timer);
  }, [showWalletSelect]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  if (isConnecting) {
    return (
      <button className="btn-primary opacity-80 cursor-wait" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-4 py-2.5 glass-card hover:bg-white/10 transition-all duration-200 cursor-pointer"
          id="wallet-connected-button"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
            {address.slice(0, 2)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs text-muted-foreground">{walletName}</p>
            <p className="text-sm font-medium">{shortenAddress(address, 6)}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-2 w-64 glass-card border border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-fade-in">
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" /> Copy Address
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" /> View on Explorer
              </a>
              <hr className="border-white/5 my-1" />
              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-sm"
                id="disconnect-button"
              >
                <LogOut className="w-4 h-4" /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowWalletSelect(true)}
        className="btn-primary"
        id="connect-wallet-button"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showWalletSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowWalletSelect(false)}
          />
          <div className="relative w-full max-w-md glass-card border border-white/15 rounded-2xl shadow-2xl z-50 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Connect Wallet</h3>
                  <p className="text-xs text-muted-foreground">Select a Stellar wallet to continue</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletSelect(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availableWallets.map((wallet) => {
                const available = wallet.isAvailable();
                return (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all group cursor-pointer"
                    onClick={() => {
                      connect(wallet.id);
                      setShowWalletSelect(false);
                    }}
                    id={`connect-${wallet.id}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform flex items-center justify-center">
                        {wallet.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{wallet.name}</p>
                        <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${available ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                          {available && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {available ? 'Available' : 'Not installed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!available && wallet.id === 'freighter' && (
                        <a
                          href="https://www.freighter.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-colors flex items-center gap-1"
                        >
                          Install <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {available && (
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                          Connect &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-muted-foreground">
                New to Stellar?{' '}
                <a
                  href="https://www.freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Download Freighter Wallet
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
