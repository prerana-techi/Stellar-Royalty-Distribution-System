const sdk = require('@stellar/stellar-sdk');

async function test() {
  const RPC_URL = 'https://soroban-testnet.stellar.org';
  const server = new sdk.rpc.Server(RPC_URL);
  
  const kp = sdk.Keypair.random();
  const owner = kp.publicKey();
  const title = 'Test';
  const recipients = [{ address: owner, share_bps: 10000, name: 'Myself' }];

  const manual = sdk.xdr.ScVal.scvVec(
    recipients.map(r => 
      sdk.xdr.ScVal.scvMap([
        new sdk.xdr.ScMapEntry({
          key: sdk.xdr.ScVal.scvSymbol('address'),
          val: new sdk.Address(r.address).toScVal()
        }),
        new sdk.xdr.ScMapEntry({
          key: sdk.xdr.ScVal.scvSymbol('name'),
          val: sdk.xdr.ScVal.scvString(r.name)
        }),
        new sdk.xdr.ScMapEntry({
          key: sdk.xdr.ScVal.scvSymbol('share_bps'),
          val: sdk.xdr.ScVal.scvU32(r.share_bps)
        })
      ])
    )
  );

  const contractId = 'CCYC4OZFAQ63A6JNMZOT4HMPSEUA7L4DKHH7SCOYM2T6RSBF2TCBEVVD';
  const contract = new sdk.Contract(contractId);
  const operation = contract.call('create_agreement', new sdk.Address(owner).toScVal(), sdk.xdr.ScVal.scvString(title), manual);

  const account = new sdk.Account(owner, '1');
  const tx = new sdk.TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: sdk.Networks.TESTNET,
  }).addOperation(operation).setTimeout(30).build();

  console.log('Simulating...');
  try {
    const sim = await server.simulateTransaction(tx);
    console.log('Sim result:', sim.status, sim.error);
    if (sim.result) {
      console.log('Retval:', sim.result.retval.toXDR('base64'));
    }
  } catch(e) {
    console.error('SIM ERROR:', e.message, e.stack);
  }
}
test();
