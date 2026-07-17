# RoyaltyFlow Frontend

The frontend is a Next.js 15 application that provides wallet integration, contract interactions, and a royalty distribution dashboard for the Stellar Royalty Distribution System.

## Overview

This app enables users to:
- connect with Stellar wallets
- create and manage royalty agreements
- track payment distributions
- view analytics and transaction history
- interact with Soroban smart contracts on Stellar Testnet

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Zustand for state management
- TanStack React Query
- Stellar SDK
- Vitest for tests

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment

Copy `.env.example` to `.env.local` and update the values as needed.

Example variables:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ROYALTY_REGISTRY_CONTRACT_ID=<your-registry-id>
NEXT_PUBLIC_PAYMENT_DISTRIBUTOR_CONTRACT_ID=<your-distributor-id>
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run test` - run Vitest tests
- `npm run test:watch` - run Vitest in watch mode
- `npm run test:integration` - run integration tests

## Code Structure

- `src/app/` - application pages and routes
- `src/features/` - feature modules such as wallet integration
- `src/shared/` - shared components, utilities, and types
- `src/providers/` - React providers and app context
- `__tests__/` - frontend tests

## Notes

The frontend is designed to work with Soroban smart contracts deployed on Stellar Testnet. Make sure contract IDs are configured correctly before using the app.
