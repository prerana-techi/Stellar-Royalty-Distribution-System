use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum DistributorError {
    AlreadyInitialized = 101,
    NotInitialized = 102,
    Unauthorized = 103,
    AgreementNotActive = 104,
    InvalidAmount = 105,
    PaymentNotFound = 106,
    DistributionFailed = 107,
    RegistryCallFailed = 108,
}
