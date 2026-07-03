import * as StellarSdk from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, REGISTRY_CONTRACT_ID, DISTRIBUTOR_CONTRACT_ID } from './stellar';

export interface ContractCallOptions {
  contractId: string;
  method: string;
  args: StellarSdk.xdr.ScVal[];
  sourceAccount: string;
}

/**
 * Build a Soroban transaction for contract invocation
 */
export async function buildContractTransaction({
  contractId,
  method,
  args,
  sourceAccount,
}: ContractCallOptions): Promise<StellarSdk.Transaction> {
  const account = await server.getAccount(sourceAccount);
  
  const contract = new StellarSdk.Contract(contractId);
  const operation = contract.call(method, ...args);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return prepared as StellarSdk.Transaction;
}

/**
 * Submit a signed transaction and poll for result
 */
export async function submitTransaction(
  signedXdr: string
): Promise<StellarSdk.SorobanRpc.Api.GetTransactionResponse> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );

  const response = await server.sendTransaction(tx);

  if (response.status === 'ERROR') {
    throw new Error(`Transaction submission failed: ${JSON.stringify(response)}`);
  }

  // Poll for completion
  let getResponse: StellarSdk.SorobanRpc.Api.GetTransactionResponse;
  let attempts = 0;
  const maxAttempts = 30;

  do {
    await new Promise((r) => setTimeout(r, 2000));
    getResponse = await server.getTransaction(response.hash);
    attempts++;
  } while (
    getResponse.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < maxAttempts
  );

  if (getResponse.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    return getResponse;
  }

  throw new Error(
    `Transaction failed with status: ${getResponse.status}`
  );
}

/**
 * Read-only contract call (no transaction needed)
 */
export async function simulateContractCall({
  contractId,
  method,
  args,
  sourceAccount,
}: ContractCallOptions) {
  const account = await server.getAccount(sourceAccount);
  const contract = new StellarSdk.Contract(contractId);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  return server.simulateTransaction(tx);
}

// Helper to convert native types to ScVal
export const toScVal = {
  address: (addr: string) => StellarSdk.Address.fromString(addr).toScVal(),
  u64: (n: number) => StellarSdk.nativeToScVal(n, { type: 'u64' }),
  i128: (n: bigint | number) => StellarSdk.nativeToScVal(n, { type: 'i128' }),
  string: (s: string) => StellarSdk.nativeToScVal(s, { type: 'string' }),
  symbol: (s: string) => StellarSdk.nativeToScVal(s, { type: 'symbol' }),
};
