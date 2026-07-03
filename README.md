<p align="center">
  <h1 align="center">💎 RoyaltyFlow</h1>
  <p align="center">
    <strong>On-Chain Royalty Distribution System</strong><br/>
    Transparent, automated royalty agreements & payment distribution on Stellar
  </p>
  <p align="center">
    <a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-Testnet-7C3AED?style=flat-square&logo=stellar" alt="Stellar"></a>
    <a href="https://soroban.stellar.org"><img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-3B82F6?style=flat-square" alt="Soroban"></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs" alt="Next.js"></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
    <a href="#license"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"></a>
  </p>
</p>

---

## 📋 Problem Statement

Content creators, artists, and IP holders rely on opaque, slow, and error-prone royalty distribution systems. Existing solutions lack transparency, are prone to disputes, and involve manual payment processing that can take months.

**RoyaltyFlow** solves this by putting royalty agreements on-chain:

- ✅ **Immutable agreements** — no more "he said, she said"
- ✅ **Automated splits** — payments distribute instantly to all recipients
- ✅ **Full audit trail** — every transaction is publicly verifiable
- ✅ **Sub-second settlement** — powered by Stellar's 5-second finality

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Frontend["Next.js 15 Frontend"]
        LP[Landing Page]
        DB[Dashboard]
        AF[Activity Feed]
        TC[Transaction Center]
        ST[Settings]
        AN[Analytics]
    end

    subgraph Services["Service Layer"]
        WS[Wallet Service]
        CS[Contract Service]
        ES[Event Service]
        TS[Transaction Service]
    end

    subgraph State["State Management"]
        ZS[Zustand Stores]
        RQ[React Query Cache]
    end

    subgraph Wallets["StellarWalletsKit"]
        FR[Freighter]
        XB[xBull]
        AL[Albedo]
    end

    subgraph Contracts["Soroban Smart Contracts"]
        RR["RoyaltyRegistry<br/>(Agreements, RBAC, State Machine)"]
        PD["PaymentDistributor<br/>(Cross-Contract Calls, Token Transfers)"]
    end

    subgraph Stellar["Stellar Network"]
        RPC[Soroban RPC]
        SAC[Stellar Asset Contract]
        TN[Testnet]
    end

    Frontend --> Services
    Services --> State
    Services --> Wallets
    Services --> Contracts
    PD -->|"get_agreement()"| RR
    PD -->|"record_distribution()"| RR
    PD -->|"transfer()"| SAC
    Contracts --> Stellar
```

---

## 🔗 Inter-Contract Communication

```mermaid
sequenceDiagram
    participant User
    participant PD as PaymentDistributor
    participant RR as RoyaltyRegistry
    participant SAC as Stellar Asset Contract

    User->>PD: distribute_payment(agreement_id, amount, token)
    PD->>RR: get_agreement(agreement_id)
    RR-->>PD: RoyaltyAgreement {recipients, status: Active}
    PD->>PD: Validate status == Active
    PD->>PD: Calculate per-recipient amounts (basis points)
    loop For each recipient
        PD->>SAC: transfer(payer → recipient, amount)
    end
    PD->>RR: record_distribution(agreement_id, total_amount)
    PD-->>User: payment_id + events emitted
```

---

## 📝 Smart Contract Design

### Contract 1: `RoyaltyRegistry`
Manages royalty agreements with full RBAC and state machine.

| Function | Access | Description |
|---|---|---|
| `initialize(admin)` | Once | Set contract admin |
| `create_agreement(owner, title, recipients)` | Owner | Create new agreement (Draft) |
| `update_agreement(caller, id, recipients)` | Owner | Update recipients (Draft/Paused only) |
| `activate_agreement(caller, id)` | Owner | Draft → Active |
| `pause_agreement(caller, id)` | Owner/Admin | Active → Paused |
| `terminate_agreement(caller, id)` | Admin | Any → Terminated |
| `upgrade(new_wasm_hash)` | Admin | Upgrade contract WASM |

**State Machine:** `Draft` → `Active` → `Paused` → `Terminated`

### Contract 2: `PaymentDistributor`
Handles payment distribution with **cross-contract calls** to the Registry.

| Function | Access | Description |
|---|---|---|
| `initialize(admin, registry_id)` | Once | Set admin + link to registry |
| `distribute_payment(payer, agreement_id, amount, token)` | Any | Distribute payment to recipients |
| `get_payment(id)` | Any | Get payment record |
| `upgrade(new_wasm_hash)` | Admin | Upgrade contract WASM |

---

## ✨ Features

- **🔐 Multi-Wallet Support** — Freighter, xBull, Albedo via StellarWalletsKit
- **📊 Real-Time Activity Feed** — Live contract event streaming with 5s polling
- **🔄 Transaction Lifecycle UI** — Pending → Processing → Confirmed → Failed + retry
- **📈 Analytics Dashboard** — Distribution charts, recipient earnings, performance metrics
- **🌙 Dark Mode Design** — Premium glassmorphism UI with gradient accents
- **📱 Mobile Responsive** — Full mobile support across all pages
- **⚡ Feature-Based Architecture** — Clean separation: service/hooks/ui/contract/state layers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Rust + Soroban SDK v22 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| State | Zustand + TanStack React Query |
| Wallet | StellarWalletsKit (multi-wallet) |
| Network | Stellar Testnet, Soroban RPC |
| Testing | Soroban test harness, Vitest, React Testing Library |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend), Stellar CLI (contracts) |

---

## 🚀 Getting Started

### Prerequisites

- Rust (v1.84+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- WASM target: `rustup target add wasm32-unknown-unknown`
- Stellar CLI: `brew install stellar-cli`
- Node.js (v20+): `brew install node`

### Local Development

```bash
# Clone the repo
git clone https://github.com/prerana-techi/Stellar-Royalty-Distribution-System.git
cd Stellar-Royalty-Distribution-System

# Build smart contracts
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test

# Start frontend
cd ../frontend
cp ../.env.example .env.local
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` and fill in:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ROYALTY_REGISTRY_CONTRACT_ID=<your-registry-id>
NEXT_PUBLIC_PAYMENT_DISTRIBUTOR_CONTRACT_ID=<your-distributor-id>
```

---

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts && cargo test
```
- Agreement creation + share validation
- State machine transitions (Draft → Active → Paused → Terminated)
- Cross-contract payment distribution
- RBAC enforcement (unauthorized access)
- User agreement tracking

### Frontend Tests
```bash
cd frontend && npm run test
```
- Wallet connect/disconnect flows
- Stellar utility functions
- Transaction lifecycle state machine

---

## 🚢 Deployment

### Deploy Contracts to Testnet

```bash
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

### Deploy Frontend to Vercel

```bash
cd frontend
npx vercel --prod
```

### Contract Upgrades

```bash
chmod +x scripts/upgrade-contract.sh
./scripts/upgrade-contract.sh testnet royalty-registry
```

---

## 🔒 Security

See [docs/SECURITY.md](docs/SECURITY.md) for full security documentation.

Key practices:
- RBAC with `require_auth()` on all state-changing functions
- State machine enforcement prevents invalid transitions
- Admin-only contract upgrades
- No private keys in frontend — all signing via wallet extensions
- Cross-contract call validation before token transfers

---

## 📍 Contract Addresses

> **Testnet Deployment**
>
> After running `./scripts/deploy-testnet.sh`, update these with actual values:

| Contract | Address | Explorer |
|---|---|---|
| RoyaltyRegistry | `<DEPLOY_AND_PASTE_HERE>` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/<ADDRESS>) |
| PaymentDistributor | `<DEPLOY_AND_PASTE_HERE>` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/<ADDRESS>) |

**Sample Transaction Hash:** `<PASTE_TX_HASH_AFTER_DEPLOYMENT>`
[View on Explorer](https://stellar.expert/explorer/testnet/tx/<PASTE_TX_HASH>)

---

## 📸 Screenshots

> Screenshots will be added after deployment. The app features:
> - Landing page with hero section and feature grid
> - Dashboard with agreement cards and payment history
> - Real-time activity feed with event filtering
> - Transaction center with lifecycle status tracking
> - Analytics with distribution charts
> - Settings with wallet/network management

---

## 🎥 Demo

> Demo video/link will be added after deployment.

---

## 📁 Project Structure

```
├── contracts/                    # Soroban smart contracts
│   ├── royalty-registry/         # Agreement management + RBAC
│   │   └── src/
│   │       ├── lib.rs            # Main contract logic
│   │       ├── types.rs          # Data structures
│   │       ├── errors.rs         # Custom errors
│   │       ├── events.rs         # Event emission
│   │       ├── storage.rs        # Storage helpers
│   │       └── test.rs           # Unit tests
│   ├── payment-distributor/      # Payment distribution + cross-contract
│   │   └── src/
│   │       ├── lib.rs            # Main contract + cross-contract calls
│   │       ├── types.rs          # Data structures
│   │       ├── errors.rs         # Custom errors
│   │       ├── events.rs         # Event emission
│   │       ├── storage.rs        # Storage helpers
│   │       └── test.rs           # Integration tests
│   └── Cargo.toml                # Workspace manifest
├── frontend/                     # Next.js 15 frontend
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── features/             # Feature modules
│   │   │   ├── wallet/           # Wallet integration
│   │   │   └── ...
│   │   ├── shared/               # Shared components + utilities
│   │   └── providers/            # React providers
│   └── __tests__/                # Frontend tests
├── scripts/                      # Deployment + upgrade scripts
├── docs/                         # Documentation
├── .github/workflows/            # CI/CD
└── .env.example                  # Environment template
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ on <a href="https://stellar.org">Stellar</a> & <a href="https://soroban.stellar.org">Soroban</a>
</p>
