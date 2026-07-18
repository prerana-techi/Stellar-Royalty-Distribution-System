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
 * Race a promise against a timeout. If the promise doesn't resolve
 * within `ms` milliseconds, resolve with `fallback` instead.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Synchronous availability check — looks for browser globals.
 * Modern Freighter v6+ may use window.stellar (SEP-43) instead of
 * window.freighter, so we check both. This can still return false
 * even when the extension is present (postMessage-only mode).
 */
function isFreighterAvailableSync(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).freighter ||
    (window as any).freighterApi ||
    (window as any).Freighter ||
    (window as any).stellar
  );
}

/**
 * Async availability check via @stellar/freighter-api postMessage.
 * If the extension is installed, isConnected() will resolve with
 * { isConnected: true/false } — either way, a response means
 * the extension exists. We use a 3-second timeout so the UI
 * doesn't hang indefinitely when the extension is not installed.
 */
async function isFreighterAvailableAsync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Quick sync check first
  if (isFreighterAvailableSync()) return true;

  try {
    // Wrap in a timeout — freighterIsConnected() uses postMessage
    // which can hang forever if the extension is not present
    const res = await withTimeout(freighterIsConnected(), 3000, null);
    if (res === null) {
      logger.info('[Freighter] isConnected() timed out — extension likely not installed');
      return false;
    }
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
 *  1. Call requestAccess() directly (triggers Freighter popup).
 *     We skip the availability pre-check because:
 *     - The isConnected() postMessage can be unreliable/slow
 *     - requestAccess() itself will fail clearly if the extension is absent
 *     - If the extension IS installed, requesting access is the right action
 *  2. If that returns an error, fall back to getAddress()
 *  3. Legacy window.freighter fallback as last resort
 */
async function connectFreighter(): Promise<string> {
  // ── Step 1: requestAccess() via @stellar/freighter-api ──
  try {
    logger.info('[Freighter] Calling requestAccess()...');
    const result = await withTimeout(
      freighterRequestAccess(),
      15000,
      null
    );

    if (result === null) {
      logger.warn('[Freighter] requestAccess() timed out');
      // Fall through to getAddress
    } else {
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
    const result = await withTimeout(freighterGetAddress(), 10000, null);

    if (result === null) {
      logger.warn('[Freighter] getAddress() timed out');
    } else {
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
    }
  } catch (err: any) {
    logger.warn('[Freighter] getAddress() threw:', { error: err?.message });
  }

  // ── Step 3: Legacy window.freighter / window.stellar fallback ──
  const freighterGlobal = (typeof window !== 'undefined')
    ? (window as any).freighter || (window as any).freighterApi || (window as any).stellar
    : null;

  if (freighterGlobal) {
    logger.info('[Freighter] Trying legacy window global API...');
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
// Session revalidation
// ─────────────────────────────────────────────────────

/**
 * Silently check if Freighter is still connected and return
 * the active address. Returns null if the extension is absent,
 * locked, or the user has revoked access. This never triggers
 * a popup — it only reads existing permissions.
 */
export async function revalidateFreighterConnection(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const connResult = await withTimeout(freighterIsConnected(), 3000, null);
    if (connResult === null) return null;

    // v6 object shape
    if (connResult && typeof connResult === 'object' && !connResult.isConnected) {
      return null;
    }

    // Extension is connected — get the active address
    const addrResult = await withTimeout(freighterGetAddress(), 3000, null);
    if (addrResult === null) return null;

    if (addrResult && typeof addrResult === 'object') {
      if (addrResult.error) return null;
      if (addrResult.address && typeof addrResult.address === 'string') {
        return addrResult.address;
      }
    }

    if (typeof addrResult === 'string' && addrResult.startsWith('G')) {
      return addrResult as string;
    }
  } catch {
    // Extension not available or locked
  }

  return null;
}

// ─────────────────────────────────────────────────────
// Wallet provider registry
// ─────────────────────────────────────────────────────

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Freighter',
    id: 'freighter',
    icon: '🚀', // Optional fallback icon
    isAvailable: isFreighterAvailableSync,
    connect: connectFreighter,
    signTransaction: signWithFreighter,
  }
];

export function getWalletProvider(id: SupportedWallet): WalletProvider | undefined {
  return WALLET_PROVIDERS.find(w => w.id === id);
}

export function getAvailableWallets(): WalletProvider[] {
  return WALLET_PROVIDERS.filter(w => w.isAvailable());
}

