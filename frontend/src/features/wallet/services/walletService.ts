import { NETWORK_PASSPHRASE, NETWORK } from '@/shared/lib/stellar';
import { logger } from '@/shared/lib/logger';
import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
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

// ─────────────────────────────────────────────────────
// Freighter v6 (@stellar/freighter-api 6.x)
//
// API shape from the actual type definitions:
//   isConnected()    → { isConnected: boolean, error?: FreighterApiError }
//   requestAccess()  → { address: string,      error?: FreighterApiError }
//   getAddress()     → { address: string,      error?: FreighterApiError }
//   signTransaction  → { signedTxXdr: string, signerAddress: string, error?: ... }
//
// FreighterApiError is a string message, NOT a JS Error.
// The extension communicates via window.postMessage, not window.freighter.
// ─────────────────────────────────────────────────────

/**
 * Synchronous availability check — looks for legacy window globals.
 * Modern Freighter v5+ may NOT inject window.freighter at all,
 * so this can return false even when the extension is present.
 */
function isFreighterAvailableSync(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).freighter ||
    (window as any).freighterApi ||
    (window as any).Freighter
  );
}

/**
 * Async availability check via @stellar/freighter-api postMessage.
 * If the extension is installed, isConnected() will resolve with
 * { isConnected: true/false } — either way, a response means
 * the extension exists. An error (timeout / no listener) means
 * the extension is NOT installed.
 */
async function isFreighterAvailableAsync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Quick sync check first
  if (isFreighterAvailableSync()) return true;

  try {
    const res = await freighterIsConnected();
    // Any response (even { isConnected: false }) means extension is present
    if (res && typeof res === 'object') return true;
    if (typeof res === 'boolean') return true;
  } catch {
    // No response = extension not installed
  }
  return false;
}

/**
 * Connect to Freighter — called when user clicks the Freighter button.
 *
 * Strategy:
 *  1. Call requestAccess() directly (triggers Freighter popup)
 *  2. If that returns an error, fall back to getAddress()
 *  3. Legacy window.freighter fallback as last resort
 */
async function connectFreighter(): Promise<string> {
  // Ensure the extension is actually present before triggering a popup.
  // This avoids showing the Freighter popup when the extension isn't installed
  // (common in browsers where the user removed/disabled the extension).
  const present = await isFreighterAvailableAsync();
  if (!present) {
    throw new Error(
      'Freighter extension not detected. Please install/enable Freighter and try again (click the Freighter icon in your toolbar before connecting).'
    );
  }

  // ── Step 1: requestAccess() via @stellar/freighter-api ──
  try {
    logger.info('[Freighter] Calling requestAccess()...');
    const result = await freighterRequestAccess();
    logger.info('[Freighter] requestAccess() returned:', { result: JSON.stringify(result) });

    // v6 returns { address: string, error?: string }
    if (result && typeof result === 'object') {
      if (result.error) {
        const errMsg = String(result.error);
        logger.warn('[Freighter] requestAccess returned error field:', { error: errMsg });
        if (/user declined|reject|cancel|denied/i.test(errMsg)) {
          throw new Error('You declined the connection request in Freighter.');
        }
        // Don't throw yet — try getAddress fallback
      } else if (result.address && typeof result.address === 'string') {
        logger.info('[Freighter] Connected via requestAccess', { address: result.address });
        return result.address;
      }
    }

    // Older API might return a raw string
    if (typeof result === 'string' && result.startsWith('G')) {
      logger.info('[Freighter] Connected via requestAccess (string)', { address: result });
      return result as string;
    }
  } catch (err: any) {
    const msg = String(err?.message || '');
    logger.warn('[Freighter] requestAccess() threw:', { error: msg });

    // If user explicitly declined, don't retry
    if (/declined|reject|cancel|denied/i.test(msg)) {
      throw err;
    }
    // Otherwise fall through to getAddress
  }

  // ── Step 2: getAddress() fallback ──
  try {
    logger.info('[Freighter] Trying getAddress()...');
    const result = await freighterGetAddress();
    logger.info('[Freighter] getAddress() returned:', { result: JSON.stringify(result) });

    if (result && typeof result === 'object') {
      if (result.error) {
        const errMsg = String(result.error);
        logger.warn('[Freighter] getAddress returned error:', { error: errMsg });
      } else if (result.address && typeof result.address === 'string') {
        logger.info('[Freighter] Connected via getAddress', { address: result.address });
        return result.address;
      }
    }

    if (typeof result === 'string' && result.startsWith('G')) {
      return result as string;
    }
  } catch (err: any) {
    logger.warn('[Freighter] getAddress() threw:', { error: err?.message });
  }

  // ── Step 3: Legacy window.freighter fallback ──
  const freighterGlobal = (typeof window !== 'undefined')
    ? (window as any).freighter || (window as any).freighterApi
    : null;

  if (freighterGlobal) {
    logger.info('[Freighter] Trying legacy window.freighter API...');
    try {
      if (typeof freighterGlobal.requestAccess === 'function') {
        const res = await freighterGlobal.requestAccess();
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      }
    } catch {}

    try {
      if (typeof freighterGlobal.setAllowed === 'function') {
        await freighterGlobal.setAllowed();
      }
      if (typeof freighterGlobal.getAddress === 'function') {
        const res = await freighterGlobal.getAddress();
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      }
    } catch {}
  }

  throw new Error(
    'Could not connect to Freighter. Please make sure:\n' +
    '1. Freighter extension is installed and enabled\n' +
    '2. You are logged in to Freighter\n' +
    '3. Try clicking the Freighter icon in your toolbar first, then click Connect here'
  );
}

/**
 * Sign a transaction XDR with Freighter
 */
async function signWithFreighter(xdr: string): Promise<string> {
  try {
    const result = await freighterSignTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: undefined,
    });

    if (result && typeof result === 'object') {
      if (result.error) {
        throw new Error(String(result.error));
      }
      if (result.signedTxXdr) {
        return result.signedTxXdr;
      }
    }

    if (typeof result === 'string') return result;
  } catch (err: any) {
    logger.error('[Freighter] signTransaction failed:', { error: err?.message });
    throw new Error(err?.message || 'Transaction signing failed in Freighter.');
  }

  throw new Error('Unexpected response from Freighter signTransaction');
}

// ─────────────────────────────────────────────────────
// Wallet provider registry
// ─────────────────────────────────────────────────────

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Freighter',
    id: 'freighter',
    icon: '🦊',
    isAvailable: isFreighterAvailableSync,
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
    signTransaction: async () => {
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
