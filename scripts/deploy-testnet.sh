#!/bin/bash
set -euo pipefail

echo "============================================"
echo "  RoyaltyFlow — Testnet Deployment Script"
echo "============================================"

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-deployer}"
CONTRACTS_DIR="contracts"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Network: ${NETWORK}${NC}"

# Step 1: Generate deployer identity if not exists
echo -e "\n${YELLOW}Step 1: Setting up deployer identity...${NC}"
if ! stellar keys show ${SOURCE_ACCOUNT} 2>/dev/null; then
  echo "Generating new deployer identity..."
  stellar keys generate ${SOURCE_ACCOUNT} --network ${NETWORK}
  echo -e "${GREEN}✓ Identity created${NC}"
else
  echo -e "${GREEN}✓ Identity already exists${NC}"
fi

DEPLOYER_ADDRESS=$(stellar keys address ${SOURCE_ACCOUNT})
echo -e "Deployer address: ${DEPLOYER_ADDRESS}"

# Step 2: Fund the account via Friendbot
echo -e "\n${YELLOW}Step 2: Funding account via Friendbot...${NC}"
curl -s "https://friendbot.stellar.org/?addr=${DEPLOYER_ADDRESS}" > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Account funded${NC}"

# Step 3: Build contracts
echo -e "\n${YELLOW}Step 3: Building contracts...${NC}"
cd ${CONTRACTS_DIR}
cargo build --release --target wasm32-unknown-unknown
cd ..
echo -e "${GREEN}✓ Contracts built${NC}"

# Step 4: Deploy RoyaltyRegistry
echo -e "\n${YELLOW}Step 4: Deploying RoyaltyRegistry contract...${NC}"
REGISTRY_WASM="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/royalty_registry.wasm"
REGISTRY_ID=$(stellar contract deploy \
  --wasm ${REGISTRY_WASM} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK})
echo -e "${GREEN}✓ RoyaltyRegistry deployed: ${REGISTRY_ID}${NC}"

# Step 5: Deploy PaymentDistributor
echo -e "\n${YELLOW}Step 5: Deploying PaymentDistributor contract...${NC}"
DISTRIBUTOR_WASM="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/payment_distributor.wasm"
DISTRIBUTOR_ID=$(stellar contract deploy \
  --wasm ${DISTRIBUTOR_WASM} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK})
echo -e "${GREEN}✓ PaymentDistributor deployed: ${DISTRIBUTOR_ID}${NC}"

# Step 6: Initialize RoyaltyRegistry
echo -e "\n${YELLOW}Step 6: Initializing RoyaltyRegistry...${NC}"
stellar contract invoke \
  --id ${REGISTRY_ID} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK} \
  -- initialize \
  --admin ${DEPLOYER_ADDRESS}
echo -e "${GREEN}✓ Registry initialized${NC}"

# Step 7: Initialize PaymentDistributor with registry reference
echo -e "\n${YELLOW}Step 7: Initializing PaymentDistributor...${NC}"
stellar contract invoke \
  --id ${DISTRIBUTOR_ID} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK} \
  -- initialize \
  --admin ${DEPLOYER_ADDRESS} \
  --registry_contract_id ${REGISTRY_ID}
echo -e "${GREEN}✓ Distributor initialized with registry reference${NC}"

# Step 8: Save deployment metadata
echo -e "\n${YELLOW}Step 8: Saving deployment metadata...${NC}"
METADATA_FILE=".deployment-metadata.json"
cat > ${METADATA_FILE} << EOF
{
  "network": "${NETWORK}",
  "deployer": "${DEPLOYER_ADDRESS}",
  "contracts": {
    "royalty_registry": "${REGISTRY_ID}",
    "payment_distributor": "${DISTRIBUTOR_ID}"
  },
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "explorer": {
    "registry": "https://stellar.expert/explorer/testnet/contract/${REGISTRY_ID}",
    "distributor": "https://stellar.expert/explorer/testnet/contract/${DISTRIBUTOR_ID}"
  }
}
EOF
echo -e "${GREEN}✓ Metadata saved to ${METADATA_FILE}${NC}"

# Summary
echo -e "\n============================================"
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo -e "============================================"
echo -e ""
echo -e "Registry Contract:     ${REGISTRY_ID}"
echo -e "Distributor Contract:  ${DISTRIBUTOR_ID}"
echo -e ""
echo -e "Explorer Links:"
echo -e "  Registry:    https://stellar.expert/explorer/testnet/contract/${REGISTRY_ID}"
echo -e "  Distributor: https://stellar.expert/explorer/testnet/contract/${DISTRIBUTOR_ID}"
echo -e ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Update .env with the contract IDs above"
echo -e "2. Update README.md with contract addresses"
echo -e "3. Run the frontend: cd frontend && npm run dev"
