use crate::errors::RegistryError;
use crate::types::{DataKey, RoyaltyAgreement};
use soroban_sdk::{Address, Env, Vec};

pub struct Storage;

impl Storage {
    // --- Admin ---
    pub fn has_admin(env: &Env) -> bool {
        env.storage().instance().has(&DataKey::Admin)
    }

    pub fn set_admin(env: &Env, admin: &Address) {
        env.storage().instance().set(&DataKey::Admin, admin);
    }

    pub fn get_admin(env: &Env) -> Result<Address, RegistryError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RegistryError::NotInitialized)
    }

    // --- Agreement Counter ---
    pub fn set_agreement_counter(env: &Env, count: u64) {
        env.storage()
            .instance()
            .set(&DataKey::AgreementCounter, &count);
    }

    pub fn next_agreement_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AgreementCounter)
            .unwrap_or(0);
        let next = current + 1;
        env.storage()
            .instance()
            .set(&DataKey::AgreementCounter, &next);
        next
    }

    // --- Agreements ---
    pub fn set_agreement(env: &Env, id: u64, agreement: &RoyaltyAgreement) {
        env.storage()
            .persistent()
            .set(&DataKey::Agreement(id), agreement);
    }

    pub fn get_agreement(env: &Env, id: u64) -> Result<RoyaltyAgreement, RegistryError> {
        env.storage()
            .persistent()
            .get(&DataKey::Agreement(id))
            .ok_or(RegistryError::AgreementNotFound)
    }

    // --- User Agreements ---
    pub fn add_user_agreement(env: &Env, user: &Address, id: u64) {
        let key = DataKey::UserAgreements(user.clone());
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(env));
        ids.push_back(id);
        env.storage().persistent().set(&key, &ids);
    }

    pub fn get_user_agreements(env: &Env, user: &Address) -> Vec<u64> {
        let key = DataKey::UserAgreements(user.clone());
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(env))
    }
}
