#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use errors::DistributorError;
use events::DistributorEvents;
use soroban_sdk::{
    contract, contractimpl, token, Address, BytesN, Env, IntoVal, Symbol, Vec,
};
use storage::Storage;
use types::{AgreementStatus, Distribution, PaymentRecord, PaymentStatus, RoyaltyAgreement};

#[contract]
pub struct PaymentDistributorContract;

#[contractimpl]
impl PaymentDistributorContract {
    /// Initialize the distributor with admin and a reference to the registry contract.
    pub fn initialize(
        env: Env,
        admin: Address,
        registry_contract_id: Address,
    ) -> Result<(), DistributorError> {
        if Storage::has_admin(&env) {
            return Err(DistributorError::AlreadyInitialized);
        }
        admin.require_auth();
        Storage::set_admin(&env, &admin);
        Storage::set_registry(&env, &registry_contract_id);
        env.storage()
            .instance()
            .set(&types::StorageKey::PaymentCounter, &0u64);
        Ok(())
    }

    /// Distribute a payment for a given agreement.
    /// This function performs a CROSS-CONTRACT CALL to the RoyaltyRegistry
    /// to fetch the agreement details, validates it's active, then distributes
    /// tokens to each recipient according to their share.
    pub fn distribute_payment(
        env: Env,
        payer: Address,
        agreement_id: u64,
        amount: i128,
        token_address: Address,
    ) -> Result<u64, DistributorError> {
        payer.require_auth();

        if amount <= 0 {
            return Err(DistributorError::InvalidAmount);
        }

        let registry_id = Storage::get_registry(&env)?;

        // --- CROSS-CONTRACT CALL ---
        // Call the RoyaltyRegistry contract's get_agreement function
        let agreement: RoyaltyAgreement = env.invoke_contract(
            &registry_id,
            &Symbol::new(&env, "get_agreement"),
            soroban_sdk::vec![&env, agreement_id.into_val(&env)],
        );

        // Validate agreement is active
        if agreement.status != AgreementStatus::Active {
            return Err(DistributorError::AgreementNotActive);
        }

        let payment_id = Storage::next_payment_id(&env);
        let now = env.ledger().timestamp();

        DistributorEvents::payment_received(&env, payment_id, agreement_id, amount);

        // Calculate and execute distributions
        let token_client = token::Client::new(&env, &token_address);
        let mut distributions = soroban_sdk::Vec::new(&env);

        for i in 0..agreement.recipients.len() {
            let recipient = agreement.recipients.get(i).unwrap();
            let share_amount = (amount * recipient.share_bps as i128) / 10_000i128;

            if share_amount > 0 {
                // Transfer tokens from payer to recipient
                token_client.transfer(&payer, &recipient.address, &share_amount);

                DistributorEvents::distribution_sent(
                    &env,
                    payment_id,
                    &recipient.address,
                    share_amount,
                );

                distributions.push_back(Distribution {
                    recipient: recipient.address.clone(),
                    amount: share_amount,
                    share_bps: recipient.share_bps,
                });
            }
        }

        // --- CROSS-CONTRACT CALL ---
        // Record the distribution total back on the registry
        let _: () = env.invoke_contract(
            &registry_id,
            &Symbol::new(&env, "record_distribution"),
            soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                agreement_id.into_val(&env),
                amount.into_val(&env)
            ],
        );

        let record = PaymentRecord {
            id: payment_id,
            agreement_id,
            payer: payer.clone(),
            total_amount: amount,
            token: token_address,
            status: PaymentStatus::Distributed,
            distributions,
            created_at: now,
        };

        Storage::set_payment(&env, payment_id, &record);
        Storage::add_agreement_payment(&env, agreement_id, payment_id);

        DistributorEvents::payment_distributed(&env, payment_id, agreement_id);

        Ok(payment_id)
    }

    /// Get a payment record by ID.
    pub fn get_payment(env: Env, id: u64) -> Result<PaymentRecord, DistributorError> {
        Storage::get_payment(&env, id)
    }

    /// Get all payment IDs for a given agreement.
    pub fn get_agreement_payments(env: Env, agreement_id: u64) -> Vec<u64> {
        Storage::get_agreement_payments(&env, agreement_id)
    }

    /// Get the registry contract address.
    pub fn get_registry(env: Env) -> Result<Address, DistributorError> {
        Storage::get_registry(&env)
    }

    /// Upgrade contract WASM. Admin only.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), DistributorError> {
        let admin = Storage::get_admin(&env)?;
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
