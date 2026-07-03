export type AgreementStatus = 'Draft' | 'Active' | 'Paused' | 'Terminated';

export interface Recipient {
  address: string;
  share_bps: number;
  name: string;
}

export interface RoyaltyAgreement {
  id: number;
  owner: string;
  title: string;
  recipients: Recipient[];
  total_distributed: number;
  status: AgreementStatus;
  created_at: number;
  updated_at: number;
}

export type PaymentStatus = 'Pending' | 'Distributed' | 'Failed';

export interface Distribution {
  recipient: string;
  amount: number;
  share_bps: number;
}

export interface PaymentRecord {
  id: number;
  agreement_id: number;
  payer: string;
  total_amount: number;
  token: string;
  status: PaymentStatus;
  distributions: Distribution[];
  created_at: number;
}

export type TransactionLifecycle = 'pending' | 'processing' | 'confirmed' | 'failed';

export interface TransactionRecord {
  id: string;
  hash?: string;
  type: 'create_agreement' | 'activate' | 'pause' | 'terminate' | 'distribute' | 'update';
  description: string;
  status: TransactionLifecycle;
  timestamp: number;
  error?: string;
  retryCount: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  contractId: string;
  txHash: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  walletName: string | null;
}
