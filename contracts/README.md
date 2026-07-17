# RoyaltyFlow Contracts

The contracts workspace contains two Soroban smart contracts for royalty agreement management and payment distribution on Stellar.

## Contracts

### `royalty-registry`
Manages royalty agreements, recipients, status transitions, and access control.

### `payment-distributor`
Performs payment distribution using cross-contract calls to the registry and transfers assets to recipients.

## Tech Stack

- Rust
- Soroban SDK
- Cargo workspace
- Wasm target: `wasm32-unknown-unknown`

## Getting Started

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test
```

## Workspace Layout

- `contracts/Cargo.toml` - workspace manifest
- `contracts/royalty-registry/` - royalty agreement contract sources
- `contracts/payment-distributor/` - distribution contract sources

Each contract includes:
- `src/lib.rs` - contract entry points and logic
- `src/types.rs` - data types and structures
- `src/errors.rs` - custom error definitions
- `src/events.rs` - event emission helpers
- `src/storage.rs` - persistent storage helpers
- `src/test.rs` - contract tests

## Deployment

Deploy contracts using the repository scripts:

```bash
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh
```

For contract upgrades:

```bash
chmod +x scripts/upgrade-contract.sh
./scripts/upgrade-contract.sh testnet royalty-registry
```

## Notes

The contracts are intended for Stellar Testnet and require the WASM build target and Soroban-compatible runtime.
