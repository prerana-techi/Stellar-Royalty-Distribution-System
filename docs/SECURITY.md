# Security Considerations

## Smart Contract Security

### Access Control (RBAC)
- **Admin role**: Set during `initialize()` — can terminate agreements and upgrade contracts
- **Owner role**: Agreement creator — can create, update, activate, pause their own agreements
- **All state-changing functions** require `require_auth()` on the caller

### Input Validation
- Recipient shares must sum to exactly 10,000 basis points (100%)
- Maximum 10 recipients per agreement to prevent gas exhaustion
- Zero-amount payments are rejected
- Empty recipient lists are rejected

### State Machine Enforcement
- Agreements follow strict state transitions: `Draft → Active → Paused → Terminated`
- Only Active agreements can receive payments
- Terminated agreements cannot be reactivated

### Upgrade Strategy
- Contracts support WASM upgrades via `update_current_contract_wasm()`
- Only the admin can trigger upgrades
- Upgrade function validates admin authorization before proceeding

### Cross-Contract Safety
- PaymentDistributor validates agreement status from Registry before distributing
- Token transfers use the standard SAC (Stellar Asset Contract) interface
- Cross-contract calls are atomic within the transaction

## Frontend Security

### Wallet Security
- Private keys never leave the wallet extension
- Transaction signing happens in the wallet, not the app
- XDR is displayed for user verification before signing

### Data Handling
- Only public blockchain data is displayed
- No sensitive data stored in localStorage (only public address and wallet name)
- Environment variables prefixed with `NEXT_PUBLIC_` are safe for client exposure

### Network Security
- All RPC calls go to official Stellar endpoints over HTTPS
- Network passphrase prevents cross-network transaction replay

## Best Practices Followed
1. No hardcoded private keys or secrets
2. All contract interactions require explicit user approval via wallet
3. Error boundaries catch and log failures without exposing internals
4. Input sanitization on all user-facing forms
5. Rate limiting on RPC polling (5-second intervals)
