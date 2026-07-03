# Deployment Guide

## Prerequisites

- **Rust**: Install via [rustup.rs](https://rustup.rs) (v1.84.0+)
- **WebAssembly target**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: `brew install stellar-cli` or [install guide](https://developers.stellar.org/docs/tools/cli)
- **Node.js**: v20+ with npm

## Deploy Contracts to Stellar Testnet

### Automated Deployment

```bash
# Make the script executable
chmod +x scripts/deploy-testnet.sh

# Run deployment
./scripts/deploy-testnet.sh
```

This will:
1. Generate a deployer identity (or reuse existing)
2. Fund the account via Friendbot
3. Build both contracts
4. Deploy RoyaltyRegistry
5. Deploy PaymentDistributor
6. Initialize both contracts (with cross-contract reference)
7. Save metadata to `.deployment-metadata.json`

### Manual Deployment

```bash
# 1. Generate identity
stellar keys generate deployer --network testnet

# 2. Fund account
curl "https://friendbot.stellar.org/?addr=$(stellar keys address deployer)"

# 3. Build
cd contracts && cargo build --release --target wasm32-unknown-unknown && cd ..

# 4. Deploy Registry
REGISTRY_ID=$(stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/royalty_registry.wasm \
  --source deployer --network testnet)

# 5. Deploy Distributor
DISTRIBUTOR_ID=$(stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/payment_distributor.wasm \
  --source deployer --network testnet)

# 6. Initialize Registry
stellar contract invoke --id $REGISTRY_ID --source deployer --network testnet \
  -- initialize --admin $(stellar keys address deployer)

# 7. Initialize Distributor with registry reference
stellar contract invoke --id $DISTRIBUTOR_ID --source deployer --network testnet \
  -- initialize --admin $(stellar keys address deployer) --registry_contract_id $REGISTRY_ID
```

### Post-Deployment

1. Copy the contract IDs to `.env`:
   ```
   NEXT_PUBLIC_ROYALTY_REGISTRY_CONTRACT_ID=<REGISTRY_ID>
   NEXT_PUBLIC_PAYMENT_DISTRIBUTOR_CONTRACT_ID=<DISTRIBUTOR_ID>
   ```

2. Update `README.md` with the actual contract addresses

## Deploy Frontend to Vercel

```bash
cd frontend
npm install
npm run build
npx vercel --prod
```

## Contract Upgrades

```bash
chmod +x scripts/upgrade-contract.sh
./scripts/upgrade-contract.sh testnet royalty-registry
./scripts/upgrade-contract.sh testnet payment-distributor
```
