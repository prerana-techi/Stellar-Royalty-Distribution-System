import * as StellarSdk from '@stellar/stellar-sdk';

const REGISTRY_CONTRACT_ID = 'CCYC4OZFAQ63A6JNMZOT4HMPSEUA7L4DKHH7SCOYM2T6RSBF2TCBEVVD';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new StellarSdk.rpc.Server(RPC_URL);

async function test() {
  const kp = StellarSdk.Keypair.random();
  const owner = kp.publicKey();
  const title = 'Test';
  const recipients = [{ address: owner, share_bps: 10000, name: 'Myself' }];

  const recipientsScVal = StellarSdk.xdr.ScVal.scvVec(
    recipients.map(r => 
      StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('address'),
          val: new StellarSdk.Address(r.address).toScVal()
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('name'),
          val: StellarSdk.xdr.ScVal.scvString(r.name)
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('share_bps'),
          val: StellarSdk.xdr.ScVal.scvU32(r.share_bps)
        })
      ])
    )
  );

  console.log('Building transaction...');
  try {
    const contract = new StellarSdk.Contract(REGISTRY_CONTRACT_ID);
    const operation = contract.call('create_agreement', new StellarSdk.Address(owner).toScVal(), StellarSdk.xdr.ScVal.scvString(title), recipientsScVal);
    
    // We can't actually build it without an existing account on testnet, 
    // so we'll just check if the operation builds correctly.
    console.log('Operation built:', operation);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
