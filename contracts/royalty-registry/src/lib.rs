#![no_std]

mod errors;
mod events;
mod storage;
pub mod types;

#[cfg(test)]
mod test;

use errors::RegistryError;
use events::RegistryEvents;
use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, String, Vec};
use storage::Storage;
use types::{AgreementStatus, Recipient, RoyaltyAgreement};

#[contract]
pub struct RoyaltyRegistryContract;

#[contractimpl]
impl RoyaltyRegistryContract {
    /// Initialize the contract with an admin address.
    /// Can only be called once.
    pub fn initialize(env: Env, admin: Address) -> Result<(), RegistryError> {
        if Storage::has_admin(&env) {
            return Err(RegistryError::AlreadyInitialized);
        }
        admin.require_auth();
        Storage::set_admin(&env, &admin);
        Storage::set_agreement_counter(&env, 0);
        Ok(())
    }

    /// Create a new royalty agreement.
    /// The caller becomes the owner. Recipients' shares must sum to 10000 basis points (100%).
    pub fn create_agreement(
        env: Env,
        owner: Address,
        title: String,
        recipients: Vec<Recipient>,
    ) -> Result<u64, RegistryError> {
        owner.require_auth();

        // Validate recipients
        if recipients.is_empty() {
            return Err(RegistryError::NoRecipients);
        }
        if recipients.len() > 10 {
            return Err(RegistryError::TooManyRecipients);
        }

        // Validate shares sum to 10000 bps (100%)
        let mut total_bps: u32 = 0;
        for i in 0..recipients.len() {
            let r = recipients.get(i).unwrap();
            if r.share_bps == 0 {
                return Err(RegistryError::InvalidShareAmount);
            }
            total_bps = total_bps
                .checked_add(r.share_bps)
                .ok_or(RegistryError::InvalidShareAmount)?;
        }
        if total_bps != 10_000 {
            return Err(RegistryError::SharesNotComplete);
        }

        let id = Storage::next_agreement_id(&env);
        let now = env.ledger().timestamp();

        let agreement = RoyaltyAgreement {
            id,
            owner: owner.clone(),
            title,
            recipients,
            total_distributed: 0,
            status: AgreementStatus::Draft,
            created_at: now,
            updated_at: now,
        };

        Storage::set_agreement(&env, id, &agreement);
        Storage::add_user_agreement(&env, &owner, id);

        RegistryEvents::agreement_created(&env, id, &owner);

        Ok(id)
    }

    /// Update recipients of an agreement. Only the owner can update.
    /// Agreement must be in Draft or Paused status.
    pub fn update_agreement(
        env: Env,
        caller: Address,
        id: u64,
        recipients: Vec<Recipient>,
    ) -> Result<(), RegistryError> {
        caller.require_auth();

        let mut agreement = Storage::get_agreement(&env, id)?;

        if agreement.owner != caller {
            return Err(RegistryError::Unauthorized);
        }

        match agreement.status {
            AgreementStatus::Draft | AgreementStatus::Paused => {}
            _ => return Err(RegistryError::InvalidStateTransition),
        }

        // Validate shares
        if recipients.is_empty() {
            return Err(RegistryError::NoRecipients);
        }
        let mut total_bps: u32 = 0;
        for i in 0..recipients.len() {
            let r = recipients.get(i).unwrap();
            if r.share_bps == 0 {
                return Err(RegistryError::InvalidShareAmount);
            }
            total_bps = total_bps
                .checked_add(r.share_bps)
                .ok_or(RegistryError::InvalidShareAmount)?;
        }
        if total_bps != 10_000 {
            return Err(RegistryError::SharesNotComplete);
        }

        agreement.recipients = recipients;
        agreement.updated_at = env.ledger().timestamp();

        Storage::set_agreement(&env, id, &agreement);
        RegistryEvents::agreement_updated(&env, id);

        Ok(())
    }

    /// Activate an agreement. Only the owner can activate.
    /// Agreement must be in Draft status.
    pub fn activate_agreement(env: Env, caller: Address, id: u64) -> Result<(), RegistryError> {
        caller.require_auth();
        let mut agreement = Storage::get_agreement(&env, id)?;

        if agreement.owner != caller {
            return Err(RegistryError::Unauthorized);
        }
        if agreement.status != AgreementStatus::Draft {
            return Err(RegistryError::InvalidStateTransition);
        }

        agreement.status = AgreementStatus::Active;
        agreement.updated_at = env.ledger().timestamp();
        Storage::set_agreement(&env, id, &agreement);

        RegistryEvents::agreement_activated(&env, id);
        Ok(())
    }

    /// Pause an agreement. Owner or admin can pause.
    /// Agreement must be Active.
    pub fn pause_agreement(env: Env, caller: Address, id: u64) -> Result<(), RegistryError> {
        caller.require_auth();
        let mut agreement = Storage::get_agreement(&env, id)?;
        let admin = Storage::get_admin(&env)?;

        if agreement.owner != caller && admin != caller {
            return Err(RegistryError::Unauthorized);
        }
        if agreement.status != AgreementStatus::Active {
            return Err(RegistryError::InvalidStateTransition);
        }

        agreement.status = AgreementStatus::Paused;
        agreement.updated_at = env.ledger().timestamp();
        Storage::set_agreement(&env, id, &agreement);

        RegistryEvents::agreement_paused(&env, id);
        Ok(())
    }

    /// Terminate an agreement. Only admin can terminate.
    pub fn terminate_agreement(env: Env, caller: Address, id: u64) -> Result<(), RegistryError> {
        caller.require_auth();
        let admin = Storage::get_admin(&env)?;

        if admin != caller {
            return Err(RegistryError::Unauthorized);
        }

        let mut agreement = Storage::get_agreement(&env, id)?;
        if agreement.status == AgreementStatus::Terminated {
            return Err(RegistryError::InvalidStateTransition);
        }

        agreement.status = AgreementStatus::Terminated;
        agreement.updated_at = env.ledger().timestamp();
        Storage::set_agreement(&env, id, &agreement);

        RegistryEvents::agreement_terminated(&env, id);
        Ok(())
    }

    /// Record a distribution amount against an agreement.
    /// Called by the payment distributor contract.
    pub fn record_distribution(
        env: Env,
        caller: Address,
        id: u64,
        amount: i128,
    ) -> Result<(), RegistryError> {
        caller.require_auth();
        let mut agreement = Storage::get_agreement(&env, id)?;

        agreement.total_distributed = agreement
            .total_distributed
            .checked_add(amount)
            .ok_or(RegistryError::InvalidShareAmount)?;
        agreement.updated_at = env.ledger().timestamp();
        Storage::set_agreement(&env, id, &agreement);

        Ok(())
    }

    /// Get a single agreement by ID.
    pub fn get_agreement(env: Env, id: u64) -> Result<RoyaltyAgreement, RegistryError> {
        Storage::get_agreement(&env, id)
    }

    /// Get all agreement IDs for a user.
    pub fn get_user_agreements(env: Env, user: Address) -> Vec<u64> {
        Storage::get_user_agreements(&env, &user)
    }

    /// Get the admin address.
    pub fn get_admin(env: Env) -> Result<Address, RegistryError> {
        Storage::get_admin(&env)
    }

    /// Upgrade the contract WASM. Admin only.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), RegistryError> {
        let admin = Storage::get_admin(&env)?;
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
