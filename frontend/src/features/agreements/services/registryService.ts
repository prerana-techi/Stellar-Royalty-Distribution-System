import { buildContractTransaction, simulateContractCall } from '@/shared/lib/contracts';
import { RoyaltyAgreement, Recipient } from '@/shared/types';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Address, xdr, scValToNative } from '@stellar/stellar-sdk';
import { REGISTRY_CONTRACT_ID } from '@/shared/lib/stellar';

export const createAgreement = async (owner: string, title: string, recipients: Recipient[]) => {
  const recipientsScVal = xdr.ScVal.scvVec(
    recipients.map(r => 
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('address'),
          val: new Address(r.address).toScVal()
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('name'),
          val: xdr.ScVal.scvString(r.name)
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('share_bps'),
          val: xdr.ScVal.scvU32(r.share_bps)
        })
      ])
    )
  );

  const tx = await buildContractTransaction({
    contractId: REGISTRY_CONTRACT_ID,
    method: 'create_agreement',
    args: [
      new Address(owner).toScVal(),
      xdr.ScVal.scvString(title),
      recipientsScVal
    ],
    sourceAccount: owner
  });
  // We just return the XDR string. The UI will pass this to Freighter to sign.
  return tx.toXDR();
};

export const getAgreement = async (id: number, sourceAccount: string): Promise<RoyaltyAgreement | null> => {
  try {
    const result = await simulateContractCall({
      contractId: REGISTRY_CONTRACT_ID,
      method: 'get_agreement',
      args: [
        xdr.ScVal.scvU64(xdr.Uint64.fromString(id.toString()))
      ],
      sourceAccount
    });
    if (!result || !StellarSdk.rpc.Api.isSimulationSuccess(result) || !result.result) return null;

    const raw = scValToNative(result.result!.retval) as Record<string, unknown>;

    // Map Soroban struct fields to our TypeScript type
    const agreement: RoyaltyAgreement = {
      id: Number(raw.id),
      owner: String(raw.owner),
      title: String(raw.title),
      recipients: (raw.recipients as Array<Record<string, unknown>>).map(r => ({
        address: String(r.address),
        name: String(r.name),
        share_bps: Number(r.share_bps),
      })),
      total_distributed: Number(raw.total_distributed),
      status: String(raw.status) as RoyaltyAgreement['status'],
      created_at: Number(raw.created_at),
      updated_at: Number(raw.updated_at),
    };
    return agreement;
  } catch (e) {
    console.error(`Failed to fetch agreement #${id}:`, e);
    return null;
  }
};

export const getUserAgreements = async (owner: string): Promise<number[]> => {
  try {
    const result = await simulateContractCall({
      contractId: REGISTRY_CONTRACT_ID,
      method: 'get_user_agreements',
      args: [new Address(owner).toScVal()],
      sourceAccount: owner
    });
    if (!result || !StellarSdk.rpc.Api.isSimulationSuccess(result) || !result.result) return [];
    return scValToNative(result.result!.retval) as number[];
  } catch (e) {
    console.error('Failed to fetch agreements:', e);
    return [];
  }
};
