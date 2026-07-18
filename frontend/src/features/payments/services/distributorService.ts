import { buildContractTransaction } from '@/shared/lib/contracts';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Address, xdr } from '@stellar/stellar-sdk';

const DISTRIBUTOR_CONTRACT_ID = process.env.NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID || 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

export const distributePayment = async (payer: string, agreementId: number, amount: number, tokenAddress: string) => {
  const tx = await buildContractTransaction({
    contractId: DISTRIBUTOR_CONTRACT_ID,
    method: 'distribute_payment',
    args: [
      new Address(payer).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(agreementId.toString())),
      xdr.ScVal.scvI128(new xdr.Int128Parts({
        hi: xdr.Int64.fromString("0"),
        lo: xdr.Uint64.fromString(amount.toString())
      })),
      new Address(tokenAddress).toScVal()
    ],
    sourceAccount: payer
  });
  return tx.toXDR();
};
