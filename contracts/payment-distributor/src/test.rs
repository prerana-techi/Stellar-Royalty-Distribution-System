#![cfg(test)]

use crate::{PaymentDistributorContract, PaymentDistributorContractClient};
use crate::types::PaymentStatus;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String, Vec,
};

// Import the registry contract for cross-contract testing
use royalty_registry::{
    RoyaltyRegistryContract, RoyaltyRegistryContractClient,
    types::Recipient as RegistryRecipient,
};

fn setup_env() -> (
    Env,
    PaymentDistributorContractClient<'static>,
    RoyaltyRegistryContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    // Deploy registry contract
    let registry_id = env.register(RoyaltyRegistryContract, ());
    let registry_client = RoyaltyRegistryContractClient::new(&env, &registry_id);
    registry_client.initialize(&admin);

    // Deploy distributor contract
    let distributor_id = env.register(PaymentDistributorContract, ());
    let distributor_client = PaymentDistributorContractClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &registry_id);

    // Create a test token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_id.address();

    (env, distributor_client, registry_client, admin, token_address, token_admin)
}

fn create_active_agreement(
    env: &Env,
    registry_client: &RoyaltyRegistryContractClient,
    recipients: &[(&Address, u32)],
) -> u64 {
    let owner = Address::generate(env);
    let mut rec_vec: Vec<RegistryRecipient> = Vec::new(env);

    for (addr, bps) in recipients {
        rec_vec.push_back(RegistryRecipient {
            address: (*addr).clone(),
            share_bps: *bps,
            name: String::from_str(env, "Recipient"),
        });
    }

    let id = registry_client.create_agreement(
        &owner,
        &String::from_str(env, "Test Agreement"),
        &rec_vec,
    );
    registry_client.activate_agreement(&owner, &id);
    id
}

#[test]
fn test_distribute_payment() {
    let (env, distributor, registry, _admin, token_address, token_admin) = setup_env();

    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let payer = Address::generate(&env);

    // Create active agreement: 60/40 split
    let agreement_id = create_active_agreement(
        &env,
        &registry,
        &[(&recipient1, 6000), (&recipient2, 4000)],
    );

    // Mint tokens to payer
    let sac_client = StellarAssetClient::new(&env, &token_address);
    sac_client.mint(&payer, &10_000_000);

    // Distribute payment
    let payment_id = distributor.distribute_payment(
        &payer,
        &agreement_id,
        &10_000_000i128,
        &token_address,
    );

    assert_eq!(payment_id, 1);

    // Verify distributions
    let payment = distributor.get_payment(&payment_id);
    assert_eq!(payment.status, PaymentStatus::Distributed);
    assert_eq!(payment.total_amount, 10_000_000);
    assert_eq!(payment.distributions.len(), 2);

    // Verify token balances
    let token_client = TokenClient::new(&env, &token_address);
    assert_eq!(token_client.balance(&recipient1), 6_000_000); // 60%
    assert_eq!(token_client.balance(&recipient2), 4_000_000); // 40%
}

#[test]
fn test_cross_contract_registry_update() {
    let (env, distributor, registry, _admin, token_address, token_admin) = setup_env();

    let recipient1 = Address::generate(&env);
    let payer = Address::generate(&env);

    let agreement_id = create_active_agreement(
        &env,
        &registry,
        &[(&recipient1, 10000)],
    );

    let sac_client = StellarAssetClient::new(&env, &token_address);
    sac_client.mint(&payer, &5_000_000);

    distributor.distribute_payment(
        &payer,
        &agreement_id,
        &5_000_000i128,
        &token_address,
    );

    // Verify the registry was updated via cross-contract call
    let agreement = registry.get_agreement(&agreement_id);
    assert_eq!(agreement.total_distributed, 5_000_000);
}

#[test]
fn test_payment_to_inactive_agreement_fails() {
    let (env, distributor, registry, _admin, token_address, _token_admin) = setup_env();

    let recipient1 = Address::generate(&env);
    let payer = Address::generate(&env);

    // Create agreement but don't activate it (stays Draft)
    let owner = Address::generate(&env);
    let mut rec_vec: Vec<RegistryRecipient> = Vec::new(&env);
    rec_vec.push_back(RegistryRecipient {
        address: recipient1,
        share_bps: 10000,
        name: String::from_str(&env, "Solo Artist"),
    });

    let agreement_id = registry.create_agreement(
        &owner,
        &String::from_str(&env, "Draft Agreement"),
        &rec_vec,
    );

    // Try to distribute to a Draft agreement — should fail
    let result = distributor.try_distribute_payment(
        &payer,
        &agreement_id,
        &1_000_000i128,
        &token_address,
    );
    assert!(result.is_err());
}

#[test]
fn test_agreement_payments_tracking() {
    let (env, distributor, registry, _admin, token_address, token_admin) = setup_env();

    let recipient = Address::generate(&env);
    let payer = Address::generate(&env);

    let agreement_id = create_active_agreement(
        &env,
        &registry,
        &[(&recipient, 10000)],
    );

    let sac_client = StellarAssetClient::new(&env, &token_address);
    sac_client.mint(&payer, &20_000_000);

    // Make two payments
    distributor.distribute_payment(&payer, &agreement_id, &5_000_000i128, &token_address);
    distributor.distribute_payment(&payer, &agreement_id, &3_000_000i128, &token_address);

    let payments = distributor.get_agreement_payments(&agreement_id);
    assert_eq!(payments.len(), 2);
}
