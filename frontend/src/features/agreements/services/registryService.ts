import { buildContractTransaction, simulateContractCall } from '@/shared/lib/contracts';
import { RoyaltyAgreement, Recipient } from '@/shared/types';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Address, xdr, scValToNative } from '@stellar/stellar-sdk';

const REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID || 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

export const createAgreement = async (owner: string, title: string, recipients: Recipient[]) => {
  const recipientsScVal = xdr.ScVal.scvVec(
    recipients.map(r => 
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('address'),
          val: new Address(r.address).toScVal()
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
