use crate::constants::errors::Error;
use crate::declarations::assets::{ReserveCache, ReserveData};
use crate::get_reserve_data;
use crate::protocol::libraries::logic::reserve::{burn_scaled, mint_scaled};
use crate::protocol::libraries::types::datatypes::UserData;
use crate::{
    api::state_handler::mutate_state,
    declarations::{
        assets::{
            ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
        },
        storable::Candid,
    },
    protocol::libraries::{
        math::{
            calculate::{
                cal_average_threshold, calculate_health_factor, calculate_ltv,
                get_exchange_rates, UserPosition,
            },
            math_utils::ScalingMath,
        },
        types::datatypes::UserReserveData,
    },
};
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::update;
fn current_timestamp() -> u64 {
    time() / 1_000_000_000 
}
pub struct UpdateLogic;

impl UpdateLogic {
    // ------------- Update user data function for supply -------------

    pub async fn update_user_data_supply(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteSupplyParams,
        reserve: &mut ReserveData,
        //usd_amount: u128,
    ) -> Result<(), Error> {
        ic_cdk::println!(
            "Starting update_user_data_supply for user: {:?}",
            user_principal
        );

        // Fetch user data
        let user_data_result = user_data(user_principal);
        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found in update_user_data_supply");
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let mut user_reserve = user_reserve(&mut user_data, &params.asset);
        let mut user_reserve_data = match user_reserve.as_mut() {
            Some((_, reserve_data)) => reserve_data,
            None => {
                return Err(Error::NoUserReserveDataFound);
            }
        };
        //TODO remove mint function from here
        let platform_principal = ic_cdk::api::id();
        let minted_result = mint_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_liquidity_index.clone(),
            user_principal,
            Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            true,
        )
        .await;

        match minted_result {
            Ok(()) => {
                ic_cdk::println!("Minting dtokens successfully");
            }
            Err(e) => {
                return Err(e);
            }
        }

        if let Some((_, reserve_data)) = user_reserve {
            reserve_data.reserve = params.asset.clone();
            reserve_data.supply_rate = reserve.current_liquidity_rate.clone();
            reserve_data.borrow_rate = reserve.borrow_rate.clone();
            reserve_data.is_collateral = params.is_collateral;
            reserve_data.last_update_timestamp = current_timestamp();

            if reserve_data.is_using_as_collateral_or_borrow && !reserve_data.is_collateral {
                if reserve_data.is_borrowed {
                    reserve_data.is_using_as_collateral_or_borrow = true;
                } else {
                    reserve_data.is_using_as_collateral_or_borrow = false;
                }
            } else {
                reserve_data.is_using_as_collateral_or_borrow = reserve_data.is_collateral;
            }

            ic_cdk::println!(
                "Updated asset supply for existing reserve: {:?}",
                reserve_data
            );
        } else {
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                supply_rate: reserve.current_liquidity_rate.clone(),

                is_using_as_collateral_or_borrow: true,
                is_collateral: true,
                last_update_timestamp: current_timestamp(),
                ..Default::default()
            };

            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((params.asset.clone(), new_reserve));
            } else {
                user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
            }

            ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
        }

        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully");
        Ok(())
    }

    // ------------- Update user data function for borrow -------------
    pub async fn update_user_data_borrow(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteBorrowParams,
        reserve: &mut ReserveData,
    ) -> Result<(), Error> {
        ic_cdk::println!(
            "Starting update_user_data_borrow for user: {:?}",
            user_principal
        );

        let platform_principal = ic_cdk::api::id();

        let asset_reserve = get_reserve_data(params.asset.clone());
        ic_cdk::println!("Asset reserve read: {:?}", asset_reserve);

        let asset_reserve_data = match asset_reserve {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let user_data_result = user_data(user_principal);

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: update_user_data_borrow");
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let mut user_reserve = user_reserve(&mut user_data, &params.asset);
        ic_cdk::println!("User reserve: {:?}", user_reserve);

        let mut user_reserve_data = match user_reserve.as_mut() {
            Some((_, reserve_data)) => reserve_data,
            None => return Err(Error::NoUserReserveDataFound),
        };

        let minted_result = mint_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_debt_index.clone(),
            user_principal,
            Principal::from_text(reserve.debt_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            false,
        )
        .await;

        match minted_result {
            Ok(()) => {
                ic_cdk::println!("Minting dtokens successfully");
            }
            Err(e) => {
                return Err(e);
            }
        }

        if let Some((_, reserve_data)) = user_reserve {
            reserve_data.supply_rate = asset_reserve_data.current_liquidity_rate;
            reserve_data.borrow_rate = asset_reserve_data.borrow_rate;
            reserve_data.is_borrowed = true;
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.asset_borrow += params.amount;
            reserve_data.last_update_timestamp = current_timestamp();

            ic_cdk::println!(
                "Updated asset borrow for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // Create a new reserve if it does not exist
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                borrow_rate: asset_reserve_data.current_liquidity_rate,
                asset_borrow: params.amount,
                is_borrowed: true,
                is_using_as_collateral_or_borrow: true,
                last_update_timestamp: current_timestamp(),
                ..Default::default()
            };

            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((params.asset.clone(), new_reserve));
            } else {
                user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
            }

            ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
        }

        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    // ------------- Update user data function for withdraw -------------
    pub async fn update_user_data_withdraw(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteWithdrawParams,
        reserve: &mut ReserveData,
    ) -> Result<(), Error> {
        let platform_principal = ic_cdk::api::id();
        // Fetching user data
        let user_data_result = user_data(user_principal);

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found:update_user_data_withdraw");
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        // Function to check if the user has a reserve for the asset
        let mut user_reserve = user_reserve(&mut user_data, &params.asset);
        let mut user_reserve_data = match user_reserve.as_mut() {
            Some((_, reserve_data)) => reserve_data,
            None => return Err(Error::NoUserReserveDataFound),
        };

        ic_cdk::println!("Update user state before burn: {:?}", user_reserve_data);

        let burn_scaled_result = burn_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_liquidity_index.clone(),
            user_principal,
            Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            true,
        )
        .await;

        match burn_scaled_result {
            Ok(()) => {
                ic_cdk::println!("Burning dToken successfully completed");
            }
            Err(e) => {
                return Err(e);
            }
        };

        if let Some((_, reserve_data)) = user_reserve {
            reserve_data.is_collateral = params.is_collateral;
            reserve_data.last_update_timestamp = reserve.last_update_timestamp;
            if reserve_data.is_using_as_collateral_or_borrow && !reserve_data.is_collateral {
                if reserve_data.is_borrowed {
                    reserve_data.is_using_as_collateral_or_borrow = true;
                } else {
                    reserve_data.is_using_as_collateral_or_borrow = false;
                }
            } else {
                reserve_data.is_using_as_collateral_or_borrow = reserve_data.is_collateral;
            }

            if reserve_data.asset_supply == Nat::from(0u128) {
                reserve_data.is_collateral = true;
            }
        } else {
            ic_cdk::println!("Error: Reserve not found for asset: {:?}", params.asset);
            return Err(Error::NoReserveDataFound);
        }

        // Save the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    // ------------- Update user data function for repay -------------
    pub async fn update_user_data_repay(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteRepayParams,
        reserve: &mut ReserveData,
    ) -> Result<(), Error> {
        let platform_principal: Principal = ic_cdk::api::id();
        ic_cdk::println!(
            "Starting update_user_data_repay for user: {:?}",
            user_principal
        );
        let user_data_result = user_data(user_principal);

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: update_user_data_repay");
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        ic_cdk::println!("Repay user update initial data = {:?}", user_data);

        let mut user_reserve = user_reserve(&mut user_data, &params.asset);
        let mut user_reserve_data = match user_reserve.as_mut() {
            Some((_, reserve_data)) => reserve_data,
            None => return Err(Error::NoUserReserveDataFound), // or handle appropriately
        };

        ic_cdk::println!("Calling burn_scaled with params: amount={}, next_debt_index={:?}, user_principal={:?}, debt_token_canister={:?}, platform_principal={:?}",
                         params.amount, reserve_cache.next_debt_index, user_principal, reserve.debt_token_canister.clone().unwrap(), platform_principal);

        let burn_scaled_result = burn_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_debt_index.clone(),
            user_principal,
            Principal::from_text(reserve.debt_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            false,
        )
        .await;

        match burn_scaled_result {
            Ok(()) => {
                ic_cdk::println!("Burning debttoken successfully");
            }
            Err(e) => {
                return Err(e);
            }
        };

        if let Some((_, reserve_data)) = user_reserve {
            reserve_data.supply_rate = reserve.current_liquidity_rate.clone();
            reserve_data.borrow_rate = reserve.borrow_rate.clone();
            reserve_data.last_update_timestamp = reserve.last_update_timestamp;
            if reserve_data.asset_borrow == Nat::from(0u128) {
                reserve_data.is_borrowed = false;
                if !reserve_data.is_collateral {
                    reserve_data.is_using_as_collateral_or_borrow = false;
                }
            }
            ic_cdk::println!(
                "Reduced asset borrow for existing reserve: {:?}",
                reserve_data
            );
        } else {
            return Err(Error::NoUserReserveDataFound);
        }

        ic_cdk::println!("Saving updated user data to state: {:?}", user_data);
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }
}

#[update]
pub async fn toggle_collateral(asset: String, amount: Nat, added_amount: Nat) -> Result<(), Error> {

    if asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if added_amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    if user_principal != ic_cdk::caller() {
        return Err(Error::InvalidUser);
    }

    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found toggle");
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    // Reads the reserve data from the asset
    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {:?}", e);
            return Err(e);
        }
    };

    // exchanging amount to usd.
    let exchange_amount = get_exchange_rates(asset.clone(), None, amount).await;
    let usd_amount = match exchange_amount {
        Ok((amount_in_usd, _timestamp)) => {
            ic_cdk::println!(" amount in USD: {:?}", amount_in_usd);
            amount_in_usd
        }
        Err(e) => {
            ic_cdk::println!("Error getting exchange rate: {:?}", e);
            return Err(e);
        }
    };

    let exchange_rate = get_exchange_rates(asset.clone(), None, added_amount).await;
    let added_usd_amount = match exchange_rate {
        Ok((amount_in_usd, _timestamp)) => {
            // Extracted the amount in USD
            ic_cdk::println!("added amount in USD: {:?}", amount_in_usd);
            amount_in_usd
        }
        Err(e) => {
            ic_cdk::println!("Error getting exchange rate: {:?}", e);
            return Err(e);
        }
    };

    let user_thrs = cal_average_threshold(
        added_usd_amount.clone(),
        usd_amount.clone(),
        reserve_data.configuration.liquidation_threshold,
        user_data.total_collateral.clone().unwrap(),
        user_data.liquidation_threshold.unwrap(),
    );

    user_data.total_collateral = Some(
        (user_data.total_collateral.unwrap() - usd_amount.clone() + added_usd_amount.clone())
            .max(Nat::from(0u128)),
    );
    user_data.liquidation_threshold = Some(user_thrs.clone());
    user_data.available_borrow = Some(
        (user_data.available_borrow.unwrap() - usd_amount.clone() + added_usd_amount.clone())
            .max(Nat::from(0u128)),
    );
    ic_cdk::println!("User liquidation threshold: {:?}", user_thrs);

    let user_position = UserPosition {
        total_collateral_value: user_data
            .total_collateral
            .clone()
            .unwrap_or(Nat::from(0u128)),
        total_borrowed_value: user_data.total_debt.clone().unwrap_or(Nat::from(0u128)),
        liquidation_threshold: user_thrs,
    };

    let user_ltv = calculate_ltv(&user_position);
    user_data.ltv = Some(user_ltv);

    let user_health = calculate_health_factor(&user_position);
    user_data.health_factor = Some(user_health);

    // Function to check if the user has a reserve for the asset
    let user_reserve = user_reserve(&mut user_data, &asset);

    if let Some((_, user_reserve_data)) = user_reserve {
        user_reserve_data.is_collateral = !user_reserve_data.is_collateral;

        if user_reserve_data.is_using_as_collateral_or_borrow {
            if user_reserve_data.is_borrowed {
                user_reserve_data.is_using_as_collateral_or_borrow = true;
            } else {
                user_reserve_data.is_using_as_collateral_or_borrow = false;
            }
        } else {
            user_reserve_data.is_using_as_collateral_or_borrow = user_reserve_data.is_collateral;
        }

        ic_cdk::println!(
            "Updated asset borrow for existing reserve: {:?}",
            user_reserve_data
        );
    }

    // Save the updated user data back to state
    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

    ic_cdk::println!("User data updated successfully: {:?}", user_data);
    Ok(())
}

pub fn user_data(user_principal: Principal) -> Result<UserData, Error> {
    let user_data_result = mutate_state(|state| {
        let user_profile_data = &mut state.user_profile;
        user_profile_data
            .get(&user_principal)
            .map(|user| user.0.clone())
            .ok_or_else(|| Error::NoUserReserveDataFound)
    });
    user_data_result
}

pub fn user_reserve<'a>(
    user_data: &'a mut UserData,
    asset_name: &'a String,
) -> std::option::Option<&'a mut (std::string::String, UserReserveData)> {
    let user_reserve = match user_data.reserves {
        Some(ref mut reserves) => reserves.iter_mut().find(|(name, _)| name == asset_name),
        None => None,
    };
    user_reserve
}
