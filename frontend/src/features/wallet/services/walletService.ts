import { NETWORK_PASSPHRASE, NETWORK } from '@/shared/lib/stellar';
import { logger } from '@/shared/lib/logger';

export type SupportedWallet = 'freighter' | 'xbull' | 'albedo';

interface WalletProvider {
  name: string;
  id: SupportedWallet;
  icon: string;
  isAvailable: () => boolean;
  connect: () => Promise<string>;
  signTransaction: (xdr: string) => Promise<string>;
}

/**
 * Get Freighter extension API object (supports both v5+ window.freighter and legacy window.freighterApi)
 */
function getFreighter(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).freighter || (window as any).freighterApi || null;
}

/**
 * Check if Freighter wallet extension is available
 */
function isFreighterAvailable(): boolean {
  return !!getFreighter();
}

/**
 * Connect to Freighter wallet
 */
async function connectFreighter(): Promise<string> {
  const freighter = getFreighter();
  if (!freighter) {
    throw new Error('Freighter wallet not found. Please install or enable the browser extension.');
  }

  // Try modern Freighter API (v5+) first: requestAccess()
  try {
    if (typeof freighter.requestAccess === 'function') {
      const res = await freighter.requestAccess();
      if (typeof res === 'string' && res.startsWith('G')) {
        logger.info('Connected to Freighter (requestAccess string)', { address: res });
        return res;
      }
      if (res && typeof res === 'object' && res.address) {
        logger.info('Connected to Freighter (requestAccess object)', { address: res.address });
        return res.address;
      }
    }
  } catch (err: any) {
    logger.warn('freighter.requestAccess() failed or rejected, trying fallback...', { error: err?.message });
    if (err?.message && err.message.toLowerCase().includes('reject')) {
      throw new Error('Wallet connection was rejected in Freighter.');
    }
  }

  // Fallback to legacy Freighter API: setAllowed / getAddress
  if (typeof freighter.setAllowed === 'function') {
    await freighter.setAllowed();
  }

  if (typeof freighter.getAddress === 'function') {
    const res = await freighter.getAddress();
    if (typeof res === 'string' && res.startsWith('G')) {
      logger.info('Connected to Freighter (getAddress string)', { address: res });
      return res;
    }
    if (res && typeof res === 'object' && res.address) {
      logger.info('Connected to Freighter (getAddress object)', { address: res.address });
      return res.address;
    }
  }

  throw new Error('Could not retrieve account address from Freighter. Please unlock your wallet and try again.');
}

/**
 * Sign transaction with Freighter
 */
async function signWithFreighter(xdr: string): Promise<string> {
  const freighter = getFreighter();
  if (!freighter) throw new Error('Freighter wallet not available');

  const res = await freighter.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    network: NETWORK,
  });

  if (typeof res === 'string') return res;
  if (res && typeof res === 'object' && res.signedTxXdr) return res.signedTxXdr;

  throw new Error('Invalid signature response from Freighter');
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Freighter',
    id: 'freighter',
    icon: '🦊',
    isAvailable: isFreighterAvailable,
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
