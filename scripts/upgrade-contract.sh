#!/bin/bash
set -euo pipefail

echo "============================================"
echo "  RoyaltyFlow — Contract Upgrade Script"
echo "============================================"

NETWORK="${1:-testnet}"
CONTRACT_NAME="${2:?Usage: ./upgrade-contract.sh <network> <contract-name> (royalty-registry|payment-distributor)}"
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-deployer}"

CONTRACTS_DIR="contracts"

echo "Network: ${NETWORK}"
echo "Contract: ${CONTRACT_NAME}"

# Build the contract
echo "Building ${CONTRACT_NAME}..."
cd ${CONTRACTS_DIR}
cargo build --release --target wasm32-unknown-unknown
cd ..

# Determine WASM path
WASM_NAME=$(echo ${CONTRACT_NAME} | tr '-' '_')
WASM_PATH="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/${WASM_NAME}.wasm"

if [ ! -f "${WASM_PATH}" ]; then
  echo "ERROR: WASM file not found: ${WASM_PATH}"
  exit 1
fi

# Install the new WASM
echo "Installing new WASM..."
NEW_WASM_HASH=$(stellar contract install \
  --wasm ${WASM_PATH} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK})

echo "New WASM hash: ${NEW_WASM_HASH}"

# Read current contract ID from metadata
METADATA_FILE=".deployment-metadata.json"
if [ ! -f "${METADATA_FILE}" ]; then
  echo "ERROR: ${METADATA_FILE} not found. Deploy first."
  exit 1
fi

CONTRACT_KEY=$(echo ${CONTRACT_NAME} | tr '-' '_')
CONTRACT_ID=$(python3 -c "import json; print(json.load(open('${METADATA_FILE}'))['contracts']['${CONTRACT_KEY}'])")

echo "Upgrading contract ${CONTRACT_ID}..."

# Invoke the upgrade function
stellar contract invoke \
  --id ${CONTRACT_ID} \
  --source ${SOURCE_ACCOUNT} \
  --network ${NETWORK} \
  -- upgrade \
  --new_wasm_hash ${NEW_WASM_HASH}

echo "✓ Contract upgraded successfully!"
echo "  Contract ID: ${CONTRACT_ID}"
echo "  New WASM Hash: ${NEW_WASM_HASH}"
