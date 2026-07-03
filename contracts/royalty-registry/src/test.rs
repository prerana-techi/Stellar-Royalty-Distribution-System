#![cfg(test)]

use crate::types::{AgreementStatus, Recipient};
use crate::{RoyaltyRegistryContract, RoyaltyRegistryContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec};

fn setup_env() -> (Env, RoyaltyRegistryContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(RoyaltyRegistryContract, ());
    let client = RoyaltyRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);

    (env, client, admin)
}

fn make_recipients(env: &Env) -> Vec<Recipient> {
    let r1 = Recipient {
        address: Address::generate(env),
        share_bps: 5000,
        name: String::from_str(env, "Artist"),
    };
    let r2 = Recipient {
        address: Address::generate(env),
        share_bps: 3000,
        name: String::from_str(env, "Producer"),
    };
    let r3 = Recipient {
        address: Address::generate(env),
        share_bps: 2000,
        name: String::from_str(env, "Label"),
    };
    Vec::from_array(env, [r1, r2, r3])
}

#[test]
fn test_create_agreement() {
    let (env, client, _admin) = setup_env();
    let owner = Address::generate(&env);
    let recipients = make_recipients(&env);

    let id = client.create_agreement(
        &owner,
        &String::from_str(&env, "Test Song Royalties"),
        &recipients,
    );

    assert_eq!(id, 1);

    let agreement = client.get_agreement(&id);
    assert_eq!(agreement.id, 1);
    assert_eq!(agreement.owner, owner);
    assert_eq!(agreement.status, AgreementStatus::Draft);
    assert_eq!(agreement.total_distributed, 0);
    assert_eq!(agreement.recipients.len(), 3);
}

#[test]
fn test_state_transitions() {
    let (env, client, admin) = setup_env();
    let owner = Address::generate(&env);
    let recipients = make_recipients(&env);

    let id = client.create_agreement(
        &owner,
        &String::from_str(&env, "Album Royalties"),
        &recipients,
    );

    // Draft -> Active
    client.activate_agreement(&owner, &id);
    let agreement = client.get_agreement(&id);
    assert_eq!(agreement.status, AgreementStatus::Active);

    // Active -> Paused
    client.pause_agreement(&owner, &id);
    let agreement = client.get_agreement(&id);
    assert_eq!(agreement.status, AgreementStatus::Paused);

    // Paused -> Terminated (admin only)
    client.terminate_agreement(&admin, &id);
    let agreement = client.get_agreement(&id);
    assert_eq!(agreement.status, AgreementStatus::Terminated);
}

#[test]
fn test_invalid_shares() {
    let (env, client, _admin) = setup_env();
    let owner = Address::generate(&env);

    // Shares don't sum to 10000
    let r1 = Recipient {
        address: Address::generate(&env),
        share_bps: 5000,
        name: String::from_str(&env, "Artist"),
    };
    let r2 = Recipient {
        address: Address::generate(&env),
        share_bps: 3000,
        name: String::from_str(&env, "Producer"),
    };
    let recipients = Vec::from_array(&env, [r1, r2]); // Only 8000 bps

    let result = client.try_create_agreement(
        &owner,
        &String::from_str(&env, "Bad Agreement"),
        &recipients,
    );
    assert!(result.is_err());
}

#[test]
fn test_update_agreement_recipients() {
    let (env, client, _admin) = setup_env();
    let owner = Address::generate(&env);
    let recipients = make_recipients(&env);

    let id = client.create_agreement(
        &owner,
        &String::from_str(&env, "Updatable Agreement"),
        &recipients,
    );

    // Update recipients while Draft
    let new_r1 = Recipient {
        address: Address::generate(&env),
        share_bps: 6000,
        name: String::from_str(&env, "New Artist"),
    };
    let new_r2 = Recipient {
        address: Address::generate(&env),
        share_bps: 4000,
        name: String::from_str(&env, "New Producer"),
    };
    let new_recipients = Vec::from_array(&env, [new_r1, new_r2]);

    client.update_agreement(&owner, &id, &new_recipients);
    let agreement = client.get_agreement(&id);
    assert_eq!(agreement.recipients.len(), 2);
}

#[test]
fn test_user_agreements_tracking() {
    let (env, client, _admin) = setup_env();
    let owner = Address::generate(&env);
    let recipients = make_recipients(&env);

    client.create_agreement(
        &owner,
        &String::from_str(&env, "Agreement 1"),
        &recipients,
    );
    client.create_agreement(
        &owner,
        &String::from_str(&env, "Agreement 2"),
        &recipients,
    );

    let user_agreements = client.get_user_agreements(&owner);
    assert_eq!(user_agreements.len(), 2);
    assert_eq!(user_agreements.get(0).unwrap(), 1);
    assert_eq!(user_agreements.get(1).unwrap(), 2);
}
