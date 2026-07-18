'use client';

import { useEffect, useRef } from 'react';
import { X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { WALLET_PROVIDERS, type SupportedWallet } from '../services/walletService';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (walletId: SupportedWallet) => void;
  isConnecting: boolean;
  connectingWallet: SupportedWallet | null;
}

const WALLET_META: Record<SupportedWallet, { gradient: string; description: string; url: string }> = {
  freighter: {
    gradient: 'from-indigo-500 to-purple-600',
    description: 'Popular Stellar browser extension wallet',
    url: 'https://www.freighter.app',
  },
  xbull: {
    gradient: 'from-amber-500 to-orange-600',
    description: 'Full-featured Stellar wallet & DEX',
    url: 'https://xbull.app',
  },
  albedo: {
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Web-based Stellar signer — no extension needed',
    url: 'https://albedo.link',
  },
};

export function WalletModal({ isOpen, onClose, onSelect, isConnecting, connectingWallet }: WalletModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md glass-card border border-white/10 shadow-2xl glow-purple overflow-hidden"
        style={{ animation: 'modal-slide-up 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="text-xl font-bold">Connect Wallet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a wallet to connect to RoyaltyFlow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet List */}
        <div className="p-6 pt-4 space-y-3" id="wallet-options-list">
          {WALLET_PROVIDERS.map((provider, idx) => {
            const meta = WALLET_META[provider.id];
            const isAvailable = provider.isAvailable();
            const isCurrentlyConnecting = isConnecting && connectingWallet === provider.id;

            return (
              <div key={provider.id} data-idx={idx}>
                <button
                  onClick={() => onSelect(provider.id)}
                  disabled={isConnecting}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                    ${isCurrentlyConnecting
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }
                    ${isConnecting && !isCurrentlyConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    group
                  `}
                  id={`wallet-option-${provider.id}`}
                >
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient}
                    flex items-center justify-center text-2xl
                    shadow-lg group-hover:scale-105 transition-transform duration-200
                  `}>
                    {provider.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px]">{provider.name}</span>
                      {isAvailable && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Detected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {isCurrentlyConnecting ? (
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              New to Stellar wallets?{' '}
              <a
                href="https://www.freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                Get Freighter <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
