import * as StellarSdk from '@stellar/stellar-sdk';

export const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
export const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

export const REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_ROYALTY_REGISTRY_CONTRACT_ID || '';
export const DISTRIBUTOR_CONTRACT_ID = process.env.NEXT_PUBLIC_PAYMENT_DISTRIBUTOR_CONTRACT_ID || '';
export const NATIVE_TOKEN_ID = process.env.NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export const server = new StellarSdk.SorobanRpc.Server(RPC_URL);

export function getExplorerTxUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAccountUrl(address: string): string {
  return `${EXPLORER_URL}/account/${address}`;
}

export function getExplorerContractUrl(contractId: string): string {
  return `${EXPLORER_URL}/contract/${contractId}`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXLM(stroops: bigint | number | string): string {
  const val = Number(stroops) / 10_000_000;
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}
