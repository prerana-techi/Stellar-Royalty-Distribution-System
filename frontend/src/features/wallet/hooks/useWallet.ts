'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';
import { WALLET_PROVIDERS, getWalletProvider, revalidateFreighterConnection, type SupportedWallet } from '../services/walletService';
import { logger } from '@/shared/lib/logger';
import { toast } from 'sonner';

export function useWallet() {
  const store = useWalletStore();

  // ── Mount-time session revalidation ──
  // On page load, silently check if Freighter is still connected
  // and restore the session with the *current* active address.
  // This prevents showing a stale/persisted address from a previous
  // session or a different user's address.
  useEffect(() => {
    let cancelled = false;

    async function revalidate() {
      try {
        const currentAddress = await revalidateFreighterConnection();
        if (cancelled) return;

        if (currentAddress) {
          // Freighter is connected — restore session with the live address
          logger.info('[Wallet] Session revalidated', { address: currentAddress });
          store.connect(currentAddress, 'Freighter');
        } else {
          // Freighter is not connected — ensure clean disconnected state
          if (store.isConnected) {
            logger.info('[Wallet] Session invalidated — Freighter not connected');
            store.disconnect();
          }
        }
      } catch {
        // Silently fail — user will just see "Connect Wallet"
      }
    }

    revalidate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Account-change listener ──
  // Poll Freighter every 3 seconds while connected to detect if the user
  // switches accounts in the Freighter extension. This is necessary because
  // Freighter v6 doesn't reliably fire change events via postMessage.
  const currentAddressRef = useRef(store.address);
  currentAddressRef.current = store.address;

  useEffect(() => {
    if (!store.isConnected) return;

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
        } else if (!liveAddress && currentAddressRef.current) {
          logger.info('[Wallet] Freighter disconnected externally');
          store.disconnect();
          toast.info('Wallet disconnected');
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isConnected]);

  const connect = useCallback(async (walletId: SupportedWallet) => {
    store.setConnecting(true);
    store.setError(null);

    try {
      const provider = getWalletProvider(walletId);
      if (!provider) {
        throw new Error(`Wallet "${walletId}" is not supported`);
      }

      // For Freighter, skip availability gate — connectFreighter() handles it directly
      if (walletId !== 'freighter') {
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

