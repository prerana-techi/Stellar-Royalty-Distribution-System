use soroban_sdk::{Address, Env, Symbol};

pub struct DistributorEvents;

impl DistributorEvents {
    pub fn payment_received(env: &Env, payment_id: u64, agreement_id: u64, amount: i128) {
        env.events().publish(
            (Symbol::new(env, "payment_received"), payment_id),
            (agreement_id, amount),
        );
    }

    pub fn payment_distributed(env: &Env, payment_id: u64, agreement_id: u64) {
        env.events().publish(
            (Symbol::new(env, "payment_distd"), payment_id),
            agreement_id,
        );
    }

    pub fn distribution_sent(
        env: &Env,
        payment_id: u64,
        recipient: &Address,
        amount: i128,
    ) {
        env.events().publish(
            (Symbol::new(env, "distrib_sent"), payment_id),
            (recipient.clone(), amount),
        );
    }
}
