use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveData;
use crate::declarations::storable::Candid;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::{query, update};

#[update]
pub async fn initialize(token_name: String, mut reserve_data: ReserveData) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous()
        || !ic_cdk::api::is_controller(&ic_cdk::api::caller())
    {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let result = read_state(|state| {
        if state.reserve_list.contains_key(&token_name) {
            ic_cdk::println!("Token exists");
            return Err(Error::TokenAlreadyExist);
        }
        Ok(())
    });
    
    if let Err(e) = result {
        ic_cdk::println!("Error: {:?}", e);
        return Err(e); 
    }

    let token_canister_id =
        match create_testtoken_canister(token_name.clone(), token_name.clone()).await {
            Ok(principal) => principal,
            Err(e) => return Err(e),
        };
    let d_token_name = format!("d{}", token_name.clone());
    let debt_token_name = format!("debt{}", token_name.clone());

    reserve_data.asset_name = Some(token_name.clone());
    reserve_data.d_token_canister =
        match create_token_canister(d_token_name.clone(), d_token_name).await {
            Ok(principal) => Some(principal.to_string()),
            Err(e) => return Err(e),
        };
    reserve_data.debt_token_canister =
        match create_token_canister(debt_token_name.clone(), debt_token_name).await {
            Ok(principal) => Some(principal.to_string()),
            Err(e) => return Err(e),
        };

    reserve_data.last_update_timestamp = time();    

    mutate_state(|state| {
        state
            .reserve_list
            .insert(token_name.clone(), token_canister_id);
        let reserve_data_e = &mut state.asset_index;

        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
        ic_cdk::println!("Reserve for {} initialized successfully", token_name);
    });

    Ok(())
}

#[update]
pub async fn reset_reserve_value(
    asset_name: String,
    variable_name: String,
    reset_value: Nat,
) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous()
        || !ic_cdk::api::is_controller(&ic_cdk::api::caller())
    {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&asset_name)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let mut reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    match variable_name.as_str() {
        "liquidity_index" => reserve_data.liquidity_index = reset_value,
        "ltv" => reserve_data.configuration.ltv =reset_value,
        "liquidation_threshold" => {
            reserve_data.configuration.liquidation_threshold = reset_value
        }
        "liquidation_bonus" => {
            reserve_data.configuration.liquidation_bonus = reset_value
        }
        "borrow_cap" => reserve_data.configuration.borrow_cap = reset_value,
        "supply_cap" => reserve_data.configuration.supply_cap =reset_value,
        "reserve_factor" => {
            reserve_data.configuration.reserve_factor = reset_value
        }
        _ => return Err(Error::InvalidVariableName),
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(asset_name, Candid(reserve_data));
    });
    Ok(())
}

#[query]
pub fn to_check_controller() -> bool {
    ic_cdk::api::is_controller(&ic_cdk::api::caller())
}

