import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the wallet store
const mockStore = {
  address: null as string | null,
  isConnected: false,
  isConnecting: false,
  walletName: null as string | null,
  network: 'testnet',
  error: null as string | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  setNetwork: vi.fn(),
  setConnecting: vi.fn(),
  setError: vi.fn(),
};

vi.mock('@/features/wallet/store/walletStore', () => ({
  useWalletStore: () => mockStore,
}));

vi.mock('@/features/wallet/services/walletService', () => ({
  WALLET_PROVIDERS: [
    {
      name: 'Freighter',
      id: 'freighter',
      icon: '🦊',
      isAvailable: () => true,
      connect: vi.fn().mockResolvedValue('GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF'),
      signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
    },
  ],
  getWalletProvider: vi.fn().mockReturnValue({
    name: 'Freighter',
    id: 'freighter',
    isAvailable: () => true,
    connect: vi.fn().mockResolvedValue('GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF'),
    signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Import after mocks
import { useWallet } from '@/features/wallet/hooks/useWallet';

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.address = null;
    mockStore.isConnected = false;
    mockStore.isConnecting = false;
    mockStore.error = null;
  });

  it('should return initial disconnected state', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it('should call connect with wallet provider', async () => {
    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect('freighter');
    });
    expect(mockStore.setConnecting).toHaveBeenCalledWith(true);
  });

  it('should call disconnect', () => {
    mockStore.isConnected = true;
    mockStore.address = 'GABCDEF...';
    const { result } = renderHook(() => useWallet());
    act(() => {
      result.current.disconnect();
    });
    expect(mockStore.disconnect).toHaveBeenCalled();
  });

  it('should expose available wallets', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.availableWallets).toHaveLength(1);
    expect(result.current.availableWallets[0].name).toBe('Freighter');
  });
});
