use soroban_sdk::{Address, Env, Symbol, symbol_short};

pub struct RegistryEvents;

impl RegistryEvents {
    pub fn agreement_created(env: &Env, id: u64, owner: &Address) {
        env.events()
            .publish((Symbol::new(env, "agreement_created"), id), owner.clone());
    }

    pub fn agreement_updated(env: &Env, id: u64) {
        env.events()
            .publish((Symbol::new(env, "agreement_updated"),), id);
    }

    pub fn agreement_activated(env: &Env, id: u64) {
        env.events()
            .publish((Symbol::new(env, "agrmnt_activated"),), id);
    }

    pub fn agreement_paused(env: &Env, id: u64) {
        env.events()
            .publish((Symbol::new(env, "agreement_paused"),), id);
    }

    pub fn agreement_terminated(env: &Env, id: u64) {
        env.events()
            .publish((Symbol::new(env, "agrmnt_terminated"),), id);
    }
}
