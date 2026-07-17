'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { WALLET_PROVIDERS, getWalletProvider, type SupportedWallet } from '../services/walletService';
import { logger } from '@/shared/lib/logger';
import { toast } from 'sonner';

export function useWallet() {
  const store = useWalletStore();

  const connect = useCallback(async (walletId: SupportedWallet) => {
    store.setConnecting(true);
    store.setError(null);

    try {
      const provider = getWalletProvider(walletId);
      if (!provider) {
        throw new Error(`Wallet "${walletId}" is not supported`);
      }

      if (!provider.isAvailable()) {
        throw new Error(
          `${provider.name} wallet is not installed. Please install the browser extension and try again.`
        );
      }

      const address = await provider.connect();
      store.connect(address, provider.name);
      toast.success(`Connected to ${provider.name}`, {
        description: `${address.slice(0, 8)}...${address.slice(-8)}`,
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to connect wallet';
      logger.error('Wallet connection failed', { walletId, error: message });
      store.setError(message);
      toast.error('Connection Failed', { description: message });
    }
  }, [store]);

  const disconnect = useCallback(() => {
    store.disconnect();
    toast.info('Wallet disconnected');
  }, [store]);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!store.walletName) {
      throw new Error('No wallet connected');
    }

    const walletId = store.walletName.toLowerCase() as SupportedWallet;
    const provider = getWalletProvider(walletId);
    if (!provider) throw new Error('Wallet provider not found');

    try {
      return await provider.signTransaction(xdr);
    } catch (err: any) {
      logger.error('Transaction signing failed', { error: err?.message });
      throw new Error(err?.message || 'Transaction signing was rejected');
    }
  }, [store.walletName]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    address: mounted ? store.address : null,
    isConnected: mounted ? store.isConnected : false,
    isConnecting: store.isConnecting,
    network: store.network,
    walletName: mounted ? store.walletName : null,
    error: store.error,
    connect,
    disconnect,
    signTransaction,
    setNetwork: store.setNetwork,
    availableWallets: WALLET_PROVIDERS,
  };
}
