use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    AgreementNotFound = 4,
    InvalidStateTransition = 5,
    NoRecipients = 6,
    TooManyRecipients = 7,
    InvalidShareAmount = 8,
    SharesNotComplete = 9,
}
