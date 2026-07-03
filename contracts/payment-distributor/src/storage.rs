use crate::errors::DistributorError;
use crate::types::{PaymentRecord, StorageKey};
use soroban_sdk::{Address, Env, Vec};

pub struct Storage;

impl Storage {
    pub fn has_admin(env: &Env) -> bool {
        env.storage().instance().has(&StorageKey::Admin)
    }

    pub fn set_admin(env: &Env, admin: &Address) {
        env.storage().instance().set(&StorageKey::Admin, admin);
    }

    pub fn get_admin(env: &Env) -> Result<Address, DistributorError> {
        env.storage()
            .instance()
            .get(&StorageKey::Admin)
            .ok_or(DistributorError::NotInitialized)
    }

    pub fn set_registry(env: &Env, registry: &Address) {
        env.storage()
            .instance()
            .set(&StorageKey::RegistryId, registry);
    }

    pub fn get_registry(env: &Env) -> Result<Address, DistributorError> {
        env.storage()
            .instance()
            .get(&StorageKey::RegistryId)
            .ok_or(DistributorError::NotInitialized)
    }

    pub fn next_payment_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .instance()
            .get(&StorageKey::PaymentCounter)
            .unwrap_or(0);
        let next = current + 1;
        env.storage()
            .instance()
            .set(&StorageKey::PaymentCounter, &next);
        next
    }

    pub fn set_payment(env: &Env, id: u64, record: &PaymentRecord) {
        env.storage()
            .persistent()
            .set(&StorageKey::Payment(id), record);
    }

    pub fn get_payment(env: &Env, id: u64) -> Result<PaymentRecord, DistributorError> {
        env.storage()
            .persistent()
            .get(&StorageKey::Payment(id))
            .ok_or(DistributorError::PaymentNotFound)
    }

    pub fn add_agreement_payment(env: &Env, agreement_id: u64, payment_id: u64) {
        let key = StorageKey::AgreementPayments(agreement_id);
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(env));
        ids.push_back(payment_id);
        env.storage().persistent().set(&key, &ids);
    }

    pub fn get_agreement_payments(env: &Env, agreement_id: u64) -> Vec<u64> {
        let key = StorageKey::AgreementPayments(agreement_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(env))
    }
}
