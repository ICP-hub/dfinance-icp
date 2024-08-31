use crate::api::state_handler::mutate_state;
// use crate::api::state_handler::read_state;
use crate::declarations::storable::Candid;
// use candid::Principal;
// use ic_cdk::api::call::call;
use ic_cdk_macros::*;

#[update]
fn set_reserve_borrowing(asset: String, enabled: bool) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        // if !enabled && reserve_data.configuration.get_stable_borrowing_enabled() {
        //     return Err("Stable rate borrowing is enabled".to_string());
        // }

        reserve_data.configuration.set_borrowing_enabled(enabled);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}



#[update]
fn set_reserve_active(asset: String, active: bool) -> Result<(), String> {
    mutate_state(|state| {
        if !active {
            check_no_suppliers(&asset)?;
        }

        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        reserve_data.configuration.set_active(active);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

#[update]
fn set_reserve_freeze(asset: String, freeze: bool) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        reserve_data.configuration.set_frozen(freeze);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

#[update]
fn set_reserve_pause(asset: String, paused: bool) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        reserve_data.configuration.set_paused(paused);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

// #[update]
// fn set_reserve_factor(asset: String, new_reserve_factor: u128) -> Result<(), String> {
//     if new_reserve_factor > 10000 {
//         return Err("Invalid reserve factor".to_string());
//     }

//     mutate_state(|state| {
//         let mut reserve_data = state
//             .asset_index
//             .get(&asset)
//             .map(|reserve| reserve.0.clone())
//             .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

//         let old_reserve_factor = reserve_data.configuration.get_reserve_factor();
//         reserve_data.configuration.set_reserve_factor(new_reserve_factor);
//         state.asset_index.insert(asset, Candid(reserve_data));

//         Ok(())
//     })
// }



#[update]
fn set_borrow_cap(asset: String, new_borrow_cap: u64) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        reserve_data.configuration.set_borrow_cap(new_borrow_cap);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

#[update]
fn set_supply_cap(asset: String, new_supply_cap: u64) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        reserve_data.configuration.set_supply_cap(new_supply_cap);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

#[update]
fn set_liquidation_protocol_fee(asset: String, new_fee: u16) -> Result<(), String> {
    if new_fee > 10000 {
        return Err("Invalid liquidation protocol fee".to_string());
    }

    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        let old_fee = reserve_data.configuration.get_liquidation_protocol_fee();
        reserve_data
            .configuration
            .set_liquidation_protocol_fee(new_fee);
        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

#[update]
fn configure_reserve_as_collateral(
    asset: String,
    ltv: u16,
    liquidation_threshold: u16,
    liquidation_bonus: u16,
) -> Result<(), String> {
    mutate_state(|state| {
        let mut reserve_data = state
            .asset_index
            .get(&asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        if ltv > liquidation_threshold {
            return Err("LTV must be less than or equal to liquidation threshold".to_string());
        }

        if liquidation_threshold != 0 {
            if liquidation_bonus <= 10000 {
                return Err("Liquidation bonus must be greater than 100%".to_string());
            }
            if liquidation_threshold as u128 * liquidation_bonus as u128 / 10000 > 10000 {
                return Err("Invalid liquidation threshold or bonus".to_string());
            }
        } else {
            if liquidation_bonus != 0 {
                return Err("Liquidation bonus must be zero when threshold is zero".to_string());
            }
            check_no_suppliers(&asset)?;
        }

        reserve_data.configuration.set_ltv(ltv);
        reserve_data
            .configuration
            .set_liquidation_threshold(liquidation_threshold);
        reserve_data
            .configuration
            .set_liquidation_bonus(liquidation_bonus);

        state.asset_index.insert(asset, Candid(reserve_data));

        Ok(())
    })
}

fn check_no_suppliers(asset: &String) -> Result<(), String> {
    mutate_state(|state| {
        let reserve_data = state
            .asset_index
            .get(asset)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset))?;

        if reserve_data.configuration.get_supply_cap() > 0 {
            return Err("Reserve liquidity is not zero".to_string());
        }

        Ok(())
    })
}

// async fn check_no_borrowers(asset: &String) -> Result<(), String> {
//     let total_debt: u128 = get_total_debt(asset.to_string()).await?;

//     if total_debt != 0 {
//         return Err("Reserve debt is not zero".to_string());
//     }

//     Ok(())
// }

// async fn get_total_debt(asset: String) -> Result<u128, String> {
//     let reserve_data = read_state(|state| {
//         state.asset_index.get(&asset)
//             .map(|reserve| reserve.0.clone())
//             .ok_or_else(|| format!("Reserve not found for asset: {}", asset))
//     })?;

//     let stable_debt_token_address = reserve_data.stable_debt_token_address;
//     let variable_debt_token_address = reserve_data.variable_debt_token_address;

//     let (stable_total_supply,): (u128,) = call(Principal::from(stable_debt_token_address), "icrc1_total_supply", ()).await
//         .map_err(|e| format!("Failed to call total_supply on stable debt token: {:?}", e))?;

//     let (variable_total_supply,): (u128,) = call(Principal::from(variable_debt_token_address), "icrc1_total_supply", ()).await
//         .map_err(|e| format!("Failed to call total_supply on variable debt token: {:?}", e))?;

//     Ok(stable_total_supply + variable_total_supply)
// }



#[update]
fn set_pool_pause(paused: bool) -> Result<(), String> {
    mutate_state(|state| {
        // Iterate over the keys in the `asset_index` without cloning the map
        let keys: Vec<String> = state
            .asset_index
            .iter()
            .map(|(key, _)| key.clone())
            .collect();

        for asset in keys {
            set_reserve_pause(asset, paused)?;
        }

        Ok(())
    })
}
