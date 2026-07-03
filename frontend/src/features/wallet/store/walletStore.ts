import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/shared/lib/logger';

interface WalletStore {
  address: string | null;
  isConnected: boolean;
  network: string;
  walletName: string | null;
  isConnecting: boolean;
  error: string | null;

  connect: (address: string, walletName: string) => void;
  disconnect: () => void;
  setNetwork: (network: string) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      network: 'testnet',
      walletName: null,
      isConnecting: false,
      error: null,

      connect: (address, walletName) => {
        logger.info('Wallet connected', { address, walletName });
        set({
          address,
          isConnected: true,
          walletName,
          isConnecting: false,
          error: null,
        });
      },

      disconnect: () => {
        logger.info('Wallet disconnected');
        set({
          address: null,
          isConnected: false,
          walletName: null,
          isConnecting: false,
          error: null,
        });
      },

      setNetwork: (network) => {
        logger.info('Network changed', { network });
        set({ network });
      },

      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setError: (error) => set({ error, isConnecting: false }),
    }),
    {
      name: 'royaltyflow-wallet',
      partialize: (state) => ({
        address: state.address,
        isConnected: state.isConnected,
        network: state.network,
        walletName: state.walletName,
      }),
    }
  )
);
