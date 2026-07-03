use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Distributed,
    Failed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Distribution {
    pub recipient: Address,
    pub amount: i128,
    pub share_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRecord {
    pub id: u64,
    pub agreement_id: u64,
    pub payer: Address,
    pub total_amount: i128,
    pub token: Address,
    pub status: PaymentStatus,
    pub distributions: Vec<Distribution>,
    pub created_at: u64,
}

#[contracttype]
pub enum StorageKey {
    Admin,
    RegistryId,
    PaymentCounter,
    Payment(u64),
    AgreementPayments(u64),
}

/// Interface for calling the RoyaltyRegistry contract
/// We define the types we need from the registry here to avoid circular deps in production
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum AgreementStatus {
    Draft,
    Active,
    Paused,
    Terminated,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Recipient {
    pub address: Address,
    pub share_bps: u32,
    pub name: soroban_sdk::String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RoyaltyAgreement {
    pub id: u64,
    pub owner: Address,
    pub title: soroban_sdk::String,
    pub recipients: Vec<Recipient>,
    pub total_distributed: i128,
    pub status: AgreementStatus,
    pub created_at: u64,
    pub updated_at: u64,
}
