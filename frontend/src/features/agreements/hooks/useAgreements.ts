'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useAgreementStore } from '../store/agreementStore';

export function useAgreements() {
  const { address, isConnected } = useWallet();
  const store = useAgreementStore();
  const lastFetchedAddress = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && address && address !== lastFetchedAddress.current) {
      lastFetchedAddress.current = address;
      store.fetchAgreements(address);
    } else if (!isConnected) {
      lastFetchedAddress.current = null;
      store.clearAgreements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const refresh = () => {
    if (address) {
      store.fetchAgreements(address);
    }
  };

  return {
    agreements: store.agreements,
    isLoading: store.isLoading,
    error: store.error,
    refresh,
  };
}
