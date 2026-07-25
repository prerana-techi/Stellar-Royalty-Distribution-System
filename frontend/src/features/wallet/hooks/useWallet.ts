'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';
import { WALLET_PROVIDERS, getWalletProvider, revalidateFreighterConnection, type SupportedWallet } from '../services/walletService';
import { logger } from '@/shared/lib/logger';
import { toast } from 'sonner';

export function useWallet() {
  const store = useWalletStore();

  // ── Mount-time session revalidation ──
  // On page load, if connected via Freighter, check if the address was updated
  useEffect(() => {
    let cancelled = false;

    async function revalidate() {
      if (store.walletName === 'Freighter') {
        try {
          const liveAddress = await revalidateFreighterConnection();
          if (cancelled) return;
          if (liveAddress && liveAddress !== store.address) {
            logger.info('[Wallet] Session revalidated with updated address', { address: liveAddress });
            store.connect(liveAddress, 'Freighter');
          }
        } catch {}
      }
    }

    revalidate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Account-change listener ──
  // Check if Freighter address changes while connected
  const currentAddressRef = useRef(store.address);
  currentAddressRef.current = store.address;

  useEffect(() => {
    if (!store.isConnected || store.walletName !== 'Freighter') return;

    const interval = setInterval(async () => {
      try {
        const liveAddress = await revalidateFreighterConnection();
        if (liveAddress && liveAddress !== currentAddressRef.current) {
          logger.info('[Wallet] Account changed in Freighter', {
            from: currentAddressRef.current,
            to: liveAddress,
          });
          store.connect(liveAddress, 'Freighter');
          toast.info('Wallet account changed', {
            description: `${liveAddress.slice(0, 8)}...${liveAddress.slice(-8)}`,
          });
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isConnected, store.walletName]);

  const connect = useCallback(async (walletId: SupportedWallet) => {
    store.setConnecting(true);
    store.setError(null);

    try {
      const provider = getWalletProvider(walletId);
      if (!provider) {
        throw new Error(`Wallet "${walletId}" is not supported`);
      }

      // For Freighter and Demo, skip availability gate — connect handles it directly
      if (walletId !== 'freighter' && walletId !== 'demo') {
        let available = provider.isAvailable();
        if (!available && provider.isAvailableAsync) {
          try {
            available = await provider.isAvailableAsync();
          } catch {}
        }
        if (!available) {
          throw new Error(
            `${provider.name} wallet is not installed. Please install the browser extension and try again.`
          );
        }
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
    } finally {
      store.setConnecting(false);
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

