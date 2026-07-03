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
 * Check if Freighter wallet extension is available
 */
function isFreighterAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).freighterApi;
}

/**
 * Connect to Freighter wallet
 */
async function connectFreighter(): Promise<string> {
  const freighter = (window as any).freighterApi;
  if (!freighter) throw new Error('Freighter wallet not found. Please install the extension.');

  await freighter.setAllowed();
  const { address } = await freighter.getAddress();
  if (!address) throw new Error('No address returned from Freighter');

  logger.info('Connected to Freighter', { address });
  return address;
}

/**
 * Sign transaction with Freighter
 */
async function signWithFreighter(xdr: string): Promise<string> {
  const freighter = (window as any).freighterApi;
  if (!freighter) throw new Error('Freighter wallet not available');

  const { signedTxXdr } = await freighter.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    network: NETWORK,
  });

  return signedTxXdr;
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
      const albedo = await import('/* dynamic */').catch(() => null);
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
