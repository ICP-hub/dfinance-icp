use serde::Serialize;
use candid::{Deserialize, Principal};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InitReserveInput {
    pub a_token_impl: Principal,
    pub stable_debt_token_impl: Principal,
    pub variable_debt_token_impl: Principal,
    pub underlying_asset_decimals: u8,
    pub interest_rate_strategy_address: Principal,
    pub underlying_asset: Principal,
    pub treasury: Principal,
    pub incentives_controller: Principal,
    pub a_token_name: String,
    pub a_token_symbol: String,
    pub variable_debt_token_name: String,
    pub variable_debt_token_symbol: String,
    pub stable_debt_token_name: String,
    pub stable_debt_token_symbol: String,
    pub params: Vec<u8>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UserConfigurationMap{

}