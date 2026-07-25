import {
  isConnected,
  requestAccess,
  setAllowed,
  isAllowed,
  getAddress,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';

/**
 * Root Stellar Wallet Integration Module
 *
 * Provides mandatory wallet capabilities:
 *  - Wallet detection (isConnected)
 *  - Connect wallet flow (requestAccess, setAllowed)
 *  - Wallet permissions (setAllowed, isAllowed)
 *  - Address retrieval (getAddress, getPublicKey)
 *  - Transaction signing (signTransaction)
 */

export interface WalletConnectionResult {
  isConnected: boolean;
  address: string | null;
  error?: string;
}

/**
 * 1. Detect Stellar Wallet Integration (Freighter)
 */
export async function detectStellarWallet(): Promise<boolean> {
  try {
    const res = await isConnected();
    if (typeof res === 'boolean') return res;
    if (res && typeof res === 'object' && 'isConnected' in res) {
      return Boolean((res as any).isConnected);
    }
    return true;
  } catch (error) {
    console.error('Failed to detect Stellar wallet:', error);
    return false;
  }
}

/**
 * 2. Verify Connect Wallet Functionality
 */
export async function connectWallet(): Promise<WalletConnectionResult> {
  try {
    const connected = await detectStellarWallet();
    if (!connected) {
      return { isConnected: false, address: null, error: 'Freighter extension not detected' };
    }

    // Grant allowed permissions
    await setAllowed();

    // Request access from wallet extension
    const accessObj = await requestAccess();
    let addr = '';

    if (typeof accessObj === 'string') {
      addr = accessObj;
    } else if (accessObj && typeof accessObj === 'object') {
      if ('error' in accessObj && (accessObj as any).error) {
        return { isConnected: false, address: null, error: String((accessObj as any).error) };
      }
      if ('address' in accessObj && (accessObj as any).address) {
        addr = String((accessObj as any).address);
      }
    }

    if (!addr) {
      // Fallback address retrieval
      const addrObj = await getAddress();
      if (typeof addrObj === 'string') {
        addr = addrObj;
      } else if (addrObj && typeof addrObj === 'object' && 'address' in addrObj) {
        addr = String((addrObj as any).address);
      }
    }

    return {
      isConnected: true,
      address: addr,
    };
  } catch (error: any) {
    return {
      isConnected: false,
      address: null,
      error: error?.message || 'Failed to connect wallet',
    };
  }
}

/**
 * 3. Wallet Permissions (setAllowed / isAllowed)
 */
export async function checkAndSetWalletPermissions(): Promise<boolean> {
  try {
    await setAllowed();
    const allowedRes = await isAllowed();
    if (typeof allowedRes === 'boolean') return allowedRes;
    if (allowedRes && typeof allowedRes === 'object' && 'isAllowed' in allowedRes) {
      return Boolean((allowedRes as any).isAllowed);
    }
    return true;
  } catch (error) {
    console.error('Failed to set wallet permissions:', error);
    return false;
  }
}

/**
 * 4. Address Retrieval (getAddress / getPublicKey)
 */
export async function retrieveStellarAddress(): Promise<string> {
  try {
    const res = await getAddress();
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'address' in res) {
      return String((res as any).address);
    }

    const keyRes = await getPublicKey();
    if (typeof keyRes === 'string') return keyRes;
    if (keyRes && typeof keyRes === 'object' && 'publicKey' in keyRes) {
      return String((keyRes as any).publicKey);
    }
    return '';
  } catch (error) {
    console.error('Failed to retrieve wallet address:', error);
    return '';
  }
}

/**
 * 5. Transaction Signing (signTransaction)
 */
export async function signStellarTransaction(
  xdr: string,
  opts?: { network?: string; networkPassphrase?: string }
): Promise<string> {
  try {
    const res = await signTransaction(xdr, opts);
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'signedTxXdr' in res) {
      return String((res as any).signedTxXdr);
    }
    return String(res);
  } catch (error: any) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}

// Re-export official freighter API methods directly
export {
  isConnected,
  requestAccess,
  setAllowed,
  isAllowed,
  getAddress,
  getPublicKey,
  signTransaction,
};
