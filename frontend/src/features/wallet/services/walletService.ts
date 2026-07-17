import { NETWORK_PASSPHRASE, NETWORK } from '@/shared/lib/stellar';
import { logger } from '@/shared/lib/logger';
import {
  isConnected as isFreighterConnected,
  requestAccess as requestFreighterAccess,
  getAddress as getFreighterAddress,
  signTransaction as signFreighterTransaction,
} from '@stellar/freighter-api';

export type SupportedWallet = 'freighter' | 'xbull' | 'albedo';

export interface WalletProvider {
  name: string;
  id: SupportedWallet;
  icon: string;
  isAvailable: () => boolean;
  isAvailableAsync?: () => Promise<boolean>;
  connect: () => Promise<string>;
  signTransaction: (xdr: string) => Promise<string>;
}

/**
 * Get Freighter extension API object (supports both v5+ window.freighter and legacy window.freighterApi)
 */
function getFreighter(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).freighter || (window as any).freighterApi || (window as any).Freighter || null;
}

/**
 * Synchronous check if Freighter wallet extension is available via global window
 */
function isFreighterAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getFreighter();
}

/**
 * Asynchronous check via official @stellar/freighter-api postMessage protocol
 */
async function isFreighterAvailableAsync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await isFreighterConnected();
    if (res === true || (typeof res === 'object' && (res as any).isConnected === true) || (typeof res === 'object' && !(res as any).error)) {
      return true;
    }
  } catch (err: any) {
    logger.debug('@stellar/freighter-api isConnected check error or pending', { error: err?.message });
  }
  return isFreighterAvailable();
}

/**
 * Connect to Freighter wallet using official @stellar/freighter-api
 */
async function connectFreighter(): Promise<string> {
  // 1. Directly attempt official @stellar/freighter-api requestAccess() on click!
  // This triggers the official Freighter authorization window in your browser.
  try {
    logger.info('Requesting access via official @stellar/freighter-api...');
    const accessResult = await requestFreighterAccess();
    if (typeof accessResult === 'string' && accessResult.startsWith('G')) {
      logger.info('Connected to Freighter (requestAccess string)', { address: accessResult });
      return accessResult;
    }
    if (accessResult && typeof accessResult === 'object') {
      if ('address' in accessResult && (accessResult as any).address) {
        logger.info('Connected to Freighter (requestAccess object)', { address: (accessResult as any).address });
        return (accessResult as any).address;
      }
      if ('error' in accessResult && (accessResult as any).error) {
        const errorStr = String((accessResult as any).error);
        if (errorStr.toLowerCase().includes('reject') || errorStr.toLowerCase().includes('cancel') || errorStr.toLowerCase().includes('deni')) {
          throw new Error('Wallet connection was cancelled inside your Freighter popup.');
        }
        if (errorStr.toLowerCase().includes('not installed') || errorStr.toLowerCase().includes('not found')) {
          throw new Error('Freighter wallet extension not detected. Please install from https://www.freighter.app and try again.');
        }
        throw new Error(`Freighter connection error: ${errorStr}`);
      }
    }
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (msg.includes('cancelled inside your Freighter popup') || msg.includes('Freighter connection error:') || msg.includes('Freighter wallet extension not detected')) {
      throw err;
    }
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('deni')) {
      throw new Error('Wallet connection was cancelled inside your Freighter popup.');
    }
    logger.warn('requestAccess() threw unexpected error, trying fallback methods...', { error: msg });
  }

  // 2. Try official @stellar/freighter-api getAddress()
  try {
    logger.info('Trying getAddress via official @stellar/freighter-api...');
    const addressResult = await getFreighterAddress();
    if (typeof addressResult === 'string' && addressResult.startsWith('G')) {
      logger.info('Connected to Freighter (getAddress string)', { address: addressResult });
      return addressResult;
    }
    if (addressResult && typeof addressResult === 'object' && 'address' in addressResult && (addressResult as any).address) {
      logger.info('Connected to Freighter (getAddress object)', { address: (addressResult as any).address });
      return (addressResult as any).address;
    }
  } catch (err: any) {
    logger.warn('getAddress() failed', { error: err?.message });
  }

  // 3. Fallback to legacy window API methods if present
  const freighter = getFreighter();
  if (freighter) {
    if (typeof freighter.requestAccess === 'function') {
      try {
        const res = await freighter.requestAccess();
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      } catch {}
    }
    if (typeof freighter.setAllowed === 'function') {
      try { await freighter.setAllowed(); } catch {}
    }
    if (typeof freighter.getAddress === 'function') {
      try {
        const res = await freighter.getAddress();
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      } catch {}
    }
  }

  throw new Error('Could not connect to Freighter. Please click the Freighter icon in your browser toolbar, unlock your wallet, and click Connect again.');
}

/**
 * Sign transaction with Freighter using official @stellar/freighter-api
 */
async function signWithFreighter(xdr: string): Promise<string> {
  try {
    const res = await signFreighterTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      network: NETWORK,
    });
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'signedTxXdr' in res && (res as any).signedTxXdr) {
      return (res as any).signedTxXdr;
    }
    if (res && typeof res === 'object' && 'signedXDR' in res && (res as any).signedXDR) {
      return (res as any).signedXDR;
    }
  } catch (err: any) {
    logger.error('signTransaction failed', { error: err?.message });
    throw new Error(err?.message || 'Transaction signing was rejected in Freighter.');
  }

  // Fallback check on global object
  const freighter = getFreighter();
  if (freighter && typeof freighter.signTransaction === 'function') {
    const res = await freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      network: NETWORK,
    });
    if (typeof res === 'string') return res;
    if (res?.signedTxXdr) return res.signedTxXdr;
  }

  throw new Error('Invalid signature response from Freighter');
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Freighter',
    id: 'freighter',
    icon: '🦊',
    isAvailable: isFreighterAvailable,
    isAvailableAsync: isFreighterAvailableAsync,
    connect: connectFreighter,
    signTransaction: signWithFreighter,
  },
  {
    name: 'xBull',
    id: 'xbull',
    icon: '🐂',
    isAvailable: () => typeof window !== 'undefined' && !!(window as any).xBullSDK,
    connect: async () => {
      const xBull = (window as any).xBullSDK;
      if (!xBull) throw new Error('xBull wallet not found');
      const { address } = await xBull.connect();
      return address;
    },
    signTransaction: async (xdr: string) => {
      const xBull = (window as any).xBullSDK;
      return xBull.signXDR(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
    },
  },
  {
    name: 'Albedo',
    id: 'albedo',
    icon: '🌟',
    isAvailable: () => true, // Web-based, always available
    connect: async () => {
      // Albedo uses web-based popup — simulate for demo
      throw new Error('Albedo integration requires the albedo-link package. Install it for production use.');
    },
    signTransaction: async (xdr: string) => {
      throw new Error('Albedo signing not configured');
    },
  },
];

export function getWalletProvider(id: SupportedWallet): WalletProvider | undefined {
  return WALLET_PROVIDERS.find(w => w.id === id);
}

export function getAvailableWallets(): WalletProvider[] {
  return WALLET_PROVIDERS.filter(w => w.isAvailable());
}
