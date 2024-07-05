use ic_cdk::export::{candid::CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct InitializedEvent {
    pub underlying_asset: Principal,
    pub pool: Principal,
    pub incentives_controller: Principal,
    pub debt_token_decimals: u8,
    pub debt_token_name: String,
    pub debt_token_symbol: String,
    pub params: Vec<u8>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct InitializeParams {
    pub pool: Principal,
    pub underlying_asset: Principal,
    pub incentives_controller: Principal,
    pub debt_token_decimals: u8,
    pub debt_token_name: String,
    pub debt_token_symbol: String,
    pub params: Vec<u8>,
}

pub trait IInitializableDebtToken {
    fn initialize(&self, params: InitializeParams);
}

pub struct DebtToken {
    pub initialized: Option<InitializedEvent>,
}

impl DebtToken {
    pub fn new() -> Self {
        Self { initialized: None }
    }
}

impl IInitializableDebtToken for DebtToken {
    fn initialize(&self, params: InitializeParams) {
        let event = InitializedEvent {
            underlying_asset: params.underlying_asset,
            pool: params.pool,
            incentives_controller: params.incentives_controller,
            debt_token_decimals: params.debt_token_decimals,
            debt_token_name: params.debt_token_name.clone(),
            debt_token_symbol: params.debt_token_symbol.clone(),
            params: params.params.clone(),
        };

        // Emit the Initialized event
        ic_cdk::println!("{:?}", event);

        // Set the initialized state
        self.initialized = Some(event);
    }
}
