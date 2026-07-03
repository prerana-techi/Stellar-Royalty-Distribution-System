'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { shortenAddress } from '@/shared/lib/stellar';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectButton() {
  const { address, isConnected, isConnecting, walletName, connect, disconnect, availableWallets } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletSelect, setShowWalletSelect] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setShowWalletSelect(!showWalletSelect)}
        className="btn-primary"
        id="connect-wallet-button"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showWalletSelect && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowWalletSelect(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 glass-card border border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-fade-in">
            <h3 className="text-sm font-semibold mb-3">Select Wallet</h3>
            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => {
                    connect(wallet.id);
                    setShowWalletSelect(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left"
                  id={`connect-${wallet.id}`}
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.isAvailable() ? 'Available' : 'Not installed'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
