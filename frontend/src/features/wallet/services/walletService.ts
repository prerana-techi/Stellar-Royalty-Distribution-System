import { NETWORK_PASSPHRASE, NETWORK } from '@/shared/lib/stellar';
import { logger } from '@/shared/lib/logger';
import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  setAllowed as freighterSetAllowed,
  isAllowed as freighterIsAllowed,
  getAddress as freighterGetAddress,
  getPublicKey as freighterGetPublicKey,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export type SupportedWallet = 'freighter' | 'xbull' | 'albedo' | 'demo';

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
 *  0. Warm up: call isConnected() to wake the extension's content script
 *  1. Call requestAccess() (triggers Freighter popup)
 *  2. If that returns an error, fall back to getAddress()
 *  3. Try SEP-43 window.stellar API
 *  4. Legacy window.freighter fallback as last resort
 */
async function connectFreighter(): Promise<string> {
  console.log('[Freighter] ── Initiating connection ──');
  logger.info('[Freighter] Initiating connection...');

  // ── Step 0: Warm up the extension content script ──
  // The extension injects a content script that listens for postMessage.
  // On first load, it may not be ready yet. Calling isConnected() wakes it up.
  try {
    console.log('[Freighter] Step 0: Warming up extension with isConnected()...');
    const warmup = await withTimeout(freighterIsConnected(), 3000, null);
    console.log('[Freighter] isConnected result:', warmup);

    if (warmup === null) {
      console.log('[Freighter] isConnected timed out — extension may not be ready, continuing anyway...');
    } else {
      console.log('[Freighter] Extension responded to isConnected — content script is alive');
    }
  } catch (e) {
    console.log('[Freighter] isConnected threw (non-fatal):', e);
  }

  // Small delay to let content script fully initialize after warm-up
  await new Promise(resolve => setTimeout(resolve, 500));

  // ── Step 1: Grant permissions & call requestAccess() via @stellar/freighter-api ──
  try {
    console.log('[Freighter] Step 1: Setting allowed permissions and calling requestAccess()...');
    try { await freighterSetAllowed(); } catch (e) { console.log('[Freighter] setAllowed non-fatal:', e); }
    const result = await withTimeout(freighterRequestAccess(), 30000, null);
    console.log('[Freighter] requestAccess() returned:', result);

    if (result === null) {
      console.warn('[Freighter] requestAccess() timed out after 30s');
    } else {
      // Handle v6 object response: { address: string, error?: string }
      if (result && typeof result === 'object') {
        if (result.error) {
          const errMsg = String(result.error);
          console.warn('[Freighter] requestAccess returned error:', errMsg);
          if (/user declined|reject|cancel|denied/i.test(errMsg)) {
            throw new Error('You declined the connection request in Freighter.');
          }
        } else if (result.address && typeof result.address === 'string' && result.address.startsWith('G')) {
          console.log('[Freighter] ✅ Connected via requestAccess:', result.address);
          return result.address;
        }
      }

      // Handle legacy string response
      if (typeof result === 'string' && (result as string).startsWith('G')) {
        console.log('[Freighter] ✅ Connected via requestAccess (string):', result);
        return result as string;
      }
    }
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    console.warn('[Freighter] requestAccess() threw:', msg);

    if (/declined|reject|cancel|denied/i.test(msg)) {
      throw (err instanceof Error ? err : new Error(msg));
    }
  }

  // ── Step 2: getAddress() fallback ──
  try {
    console.log('[Freighter] Step 2: Trying getAddress()...');
    const result = await withTimeout(freighterGetAddress(), 10000, null);
    console.log('[Freighter] getAddress() returned:', result);

    if (result !== null) {
      if (result && typeof result === 'object') {
        if (result.address && typeof result.address === 'string' && result.address.startsWith('G')) {
          console.log('[Freighter] ✅ Connected via getAddress:', result.address);
          return result.address;
        }
      }
      if (typeof result === 'string' && (result as string).startsWith('G')) {
        console.log('[Freighter] ✅ Connected via getAddress (string):', result);
        return result as string;
      }
    }
  } catch (err: any) {
    console.warn('[Freighter] getAddress() threw:', err?.message);
  }

  // ── Step 3: SEP-43 window.stellar API ──
  if (typeof window !== 'undefined' && (window as any).stellar) {
    const stellar = (window as any).stellar;
    console.log('[Freighter] Step 3: Found window.stellar (SEP-43), trying...');
    try {
      if (typeof stellar.requestAccess === 'function') {
        const res = await stellar.requestAccess();
        console.log('[Freighter] window.stellar.requestAccess returned:', res);
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      }
      if (typeof stellar.getAddress === 'function') {
        const res = await stellar.getAddress();
        console.log('[Freighter] window.stellar.getAddress returned:', res);
        if (typeof res === 'string' && res.startsWith('G')) return res;
        if (res?.address) return res.address;
      }
    } catch (e) {
      console.warn('[Freighter] window.stellar API failed:', e);
    }
  }

  // ── Step 4: Legacy window.freighter fallback ──
  if (typeof window !== 'undefined') {
    const freighterGlobal = (window as any).freighter || (window as any).freighterApi || (window as any).Freighter;
    if (freighterGlobal) {
      console.log('[Freighter] Step 4: Found window.freighter global, trying...');
      try {
        if (typeof freighterGlobal.requestAccess === 'function') {
          const res = await freighterGlobal.requestAccess();
          console.log('[Freighter] window.freighter.requestAccess returned:', res);
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
  }

  // Log what globals are available for debugging
  if (typeof window !== 'undefined') {
    console.log('[Freighter] DEBUG — Available globals:', {
      'window.freighter': !!(window as any).freighter,
      'window.freighterApi': !!(window as any).freighterApi,
      'window.Freighter': !!(window as any).Freighter,
      'window.stellar': !!(window as any).stellar,
    });
  }

  throw new Error(
    'Could not connect to Freighter. Please try:\n' +
    '1. Click the Freighter icon in your browser toolbar to unlock it\n' +
    '2. Make sure Freighter is set to Testnet (Settings → Network → Test Net)\n' +
    '3. Click "Connect Wallet" again after unlocking\n' +
    '4. If it still fails, try refreshing the page first'
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

    if (connResult && typeof connResult === 'object' && !connResult.isConnected) {
      return null;
    }

    const addrResult = await withTimeout(freighterGetAddress(), 3000, null);
    if (addrResult === null) return null;

    if (addrResult && typeof addrResult === 'object') {
      if (addrResult.error) return null;
      if (addrResult.address && typeof addrResult.address === 'string') {
        return addrResult.address;
      }
    }

    if (typeof addrResult === 'string' && String(addrResult).startsWith('G')) {
      return String(addrResult);
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
    name: 'Demo Testnet Account',
    id: 'demo',
    icon: '⚡',
    isAvailable: () => true,
    connect: async () => {
      logger.info('[Demo Wallet] Connected demo testnet account');
      return 'GBXGQJWVLWOYHFLVTKWV5FGHA3LNYR2RGC274UQ56N634N657I2NZLZE';
    },
    signTransaction: async (xdr: string) => {
      logger.info('[Demo Wallet] Signed transaction (demo mode)');
      return xdr;
    },
  },
  {
    name: 'Freighter',
    id: 'freighter',
    icon: '🚀',
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
      if (!xBull) throw new Error('xBull wallet is not installed. Please install the xBull browser extension.');
      const { publicKey } = await xBull.connect({ canRequestPublicKey: true, canRequestSign: true });
      return publicKey;
    },
    signTransaction: async (xdr: string) => {
      const xBull = (window as any).xBullSDK;
      if (!xBull) throw new Error('xBull wallet not available');
      return await xBull.signXDR(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
    },
  },
  {
    name: 'Albedo',
    id: 'albedo',
    icon: '🌟',
    isAvailable: () => true, // Albedo is web-based, always "available"
    connect: async () => {
      const albedo = typeof window !== 'undefined' ? (window as any).albedo : null;
      if (!albedo) {
        throw new Error('Albedo web signer is not loaded. Please try again or use Freighter.');
      }
      const result = await albedo.publicKey({});
      return result.pubkey;
    },
    signTransaction: async (xdr: string) => {
      const albedo = (window as any).albedo;
      if (!albedo) throw new Error('Albedo not available');
      const result = await albedo.tx({ xdr, network: NETWORK === 'testnet' ? 'testnet' : 'public' });
      return result.signed_envelope_xdr;
    },
  },
];

export function getWalletProvider(id: SupportedWallet): WalletProvider | undefined {
  return WALLET_PROVIDERS.find(w => w.id === id);
}

export function getAvailableWallets(): WalletProvider[] {
  return WALLET_PROVIDERS.filter(w => w.isAvailable());
}
