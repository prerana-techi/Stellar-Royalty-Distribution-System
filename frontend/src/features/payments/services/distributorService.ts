import { buildContractTransaction } from '@/shared/lib/contracts';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Address, xdr } from '@stellar/stellar-sdk';
import { DISTRIBUTOR_CONTRACT_ID } from '@/shared/lib/stellar';

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
