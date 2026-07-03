use soroban_sdk::{contracttype, Address, String, Vec};

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
    pub name: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RoyaltyAgreement {
    pub id: u64,
    pub owner: Address,
    pub title: String,
    pub recipients: Vec<Recipient>,
    pub total_distributed: i128,
    pub status: AgreementStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    AgreementCounter,
    Agreement(u64),
    UserAgreements(Address),
}
