use crate::api::inter_canister::get_balance;
use crate::constants::constant_variables::constants::PERCENTAGE_FACTOR;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::structs::{
    ReserveCache, ReserveData, ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
};
use crate::guards::access_control::guard_prevent_anonymous;
use crate::protocol::libraries::reserve::{burn_scaled, mint_scaled};
use crate::protocol::libraries::user::calculate_user_account_data;
use crate::protocol::utils::math_utils::{current_timestamp, ScalingMath};
use crate::declarations::datatypes::{UserData, UserReserveData};
use crate::stable_storage::{
        state_handler::{mutate_state,read_state},
        storable::Candid,
    };

use candid::{Nat, Principal};
use crate::protocol::utils::price::get_exchange_rates;
use ic_cdk::update;

pub struct UpdateLogic;

impl UpdateLogic {
    /*
     * @functionality asset-supply
     * @title Update User Data for Supplying Assets
     * @notice Updates user data and mints dTokens when assets are supplied.
     *
     * @dev Steps:
     * 1. Fetch user data.
     * 2. Update reserve data and collateral status.
     * 3. Mint dTokens using `mint_scaled()`.
     * 4. Save updated user profile.
     *
     * @param user_principal The user's principal.
     * @param reserve_cache Reference to `ReserveCache`.
     * @param params Asset supply parameters.
     * @param reserve Mutable reference to `ReserveData`.
     *
     * @return `Ok(())` if successful.
     */
    pub async fn update_user_data_supply(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteSupplyParams,
        reserve: &mut ReserveData,
    ) -> Result<(), Error> {
        let mut user_data = user_data(user_principal)?;

        let user_reserve = user_reserve(&mut user_data, &params.asset);

        let platform_principal = ic_cdk::api::id();

        let mut user_reserve_data = if let Some((_, reserve_data)) = user_reserve {
            reserve_data.reserve = params.asset.clone();
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
            reserve_data
        } else {
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
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

            let new_reserve_data: &mut UserReserveData = if let Some((_, reserve_data)) =
                user_data.reserves.as_mut().and_then(|reserves| {
                    reserves
                        .iter_mut()
                        .find(|(asset, _)| *asset == params.asset.clone())
                }) {
                reserve_data
            } else {
                return Err(Error::NoUserReserveDataFound);
            };
            new_reserve_data
        };

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

        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully");
        Ok(())
    }

    /*
     * @functionality asset-borrow
     * @title Update User Data for Borrowing
     * @notice Updates user data and mints debt tokens when borrowing assets.
     *
     * @dev Steps:
     * 1. Fetch user and reserve data.
     * 2. Update reserve data and mark it as borrowed.
     * 3. Mint debt tokens using `mint_scaled()`.
     * 4. Save updated user profile.
     *
     * @param user_principal The user's principal.
     * @param reserve_cache Reference to `ReserveCache`.
     * @param params Asset borrowing parameters.
     * @param reserve Mutable reference to `ReserveData`.
     *
     * @return `Ok(())` if successful.
     */
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

        let mut user_data = user_data(user_principal)?;

        let user_reserve = user_reserve(&mut user_data, &params.asset);
        ic_cdk::println!("User reserve: {:?}", user_reserve);

        let mut user_reserve_data = match user_reserve {
            Some((_, reserve_data)) => {
                reserve_data.is_borrowed = true;
                reserve_data.is_using_as_collateral_or_borrow = true;
                reserve_data.last_update_timestamp = current_timestamp();

                reserve_data
            }
            None => {
                // Create a new reserve if it does not exist
                let new_reserve = UserReserveData {
                    reserve: params.asset.clone(),
                    is_borrowed: true,
                    is_using_as_collateral_or_borrow: true,
                    last_update_timestamp: current_timestamp(),

                    ..Default::default()
                };

                match user_data.reserves {
                    Some(ref mut reserves) => {
                        reserves.push((params.asset.clone(), new_reserve));
                    }
                    None => {
                        user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
                    }
                }

                let new_reserve_data: &mut UserReserveData = if let Some((_, reserve_data)) =
                    user_data.reserves.as_mut().and_then(|reserves| {
                        reserves
                            .iter_mut()
                            .find(|(asset, _)| *asset == params.asset.clone())
                    }) {
                    reserve_data
                } else {
                    return Err(Error::NoUserReserveDataFound);
                };
                new_reserve_data
            }
        };

        mint_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_debt_index.clone(),
            user_principal,
            Principal::from_text(reserve.debt_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            false,
        )
        .await?;

        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()))
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    /*
     * @functionality asset-withdraw
     * @title Update User Data for Withdrawals
     * @notice Handles user data updates when withdrawing assets.
     *
     * @dev Steps:
     * 1. Fetch user and reserve data.
     * 2. Update reserve and collateral status.
     * 3. Burn dTokens using `burn_scaled()`.
     * 4. Save updated reserve details.
     *
     * @param user_principal The user's principal.
     * @param reserve_cache Reference to `ReserveCache`.
     * @param params Asset withdrawal parameters.
     * @param reserve Mutable reference to `ReserveData`.
     *
     * @return `Ok(())` if successful.
     */
    pub async fn update_user_data_withdraw(
        user_principal: Principal,
        reserve_cache: &ReserveCache,
        params: ExecuteWithdrawParams,
        reserve: &mut ReserveData,
    ) -> Result<(), Error> {
        let platform_principal = ic_cdk::api::id();

        // Fetching user data
        let mut user_data = user_data(user_principal)?;

        // Function to check if the user has a reserve for the asset
        let user_reserve = user_reserve(&mut user_data, &params.asset);

        let mut user_reserve_data = match user_reserve {
            Some((_, reserve_data)) => reserve_data,
            None => return Err(Error::NoUserReserveDataFound),
        };

        ic_cdk::println!("Update user state before burn: {:?}", user_reserve_data);

        let is_borrowed = user_reserve_data.is_borrowed.clone();

        burn_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_liquidity_index.clone(),
            user_principal,
            Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap(),
            platform_principal,
            true,
        )
        .await?;

        match user_reserve {
            Some((_, reserve_data)) => {
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
            }
            None => {
                return Err(Error::NoReserveDataFound);
            }
        }

        let dtoken_balance = get_balance(
            Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap(),
            user_principal,
        )
        .await?;

        if params.is_collateral == false && dtoken_balance == zero_nat_value() {
            if let Some((_, reserve_data)) = user_reserve {
                reserve_data.is_collateral = true;
            }
        }

        // Save the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()))
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    /*
     * @functionality asset-repay
     * @title Update User Data for Repayments
     * @notice Handles user data updates when repaying borrowed assets.
     *
     * @dev Steps:
     * 1. Fetch user data.
     * 2. Update debt status.
     * 3. Burn debt tokens using `burn_scaled()`.
     * 4. Update user state.
     *
     * @param user_principal The user's principal.
     * @param reserve_cache Reference to `ReserveCache`.
     * @param params Asset repayment parameters.
     * @param reserve Mutable reference to `ReserveData`.
     *
     * @return `Ok(())` if successful.
     */
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
        let debt_token = reserve.debt_token_canister.clone().unwrap();

        let _is_collateral = user_reserve_data.is_collateral.clone();
        let burn_scaled_result = burn_scaled(
            reserve,
            &mut user_reserve_data,
            params.amount.clone(),
            reserve_cache.next_debt_index.clone(),
            user_principal,
            Principal::from_text(debt_token).unwrap(),
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
        let balance_result = get_balance(
            Principal::from_text(reserve.debt_token_canister.clone().unwrap()).unwrap(),
            user_principal,
        )
        .await;

        let debttoken_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };
        if let Some((_, reserve_data)) = user_reserve {
            reserve_data.last_update_timestamp = reserve.last_update_timestamp;
            if debttoken_balance == zero_nat_value() {
                reserve_data.is_borrowed = false;
                if !reserve_data.is_collateral {
                    reserve_data.is_using_as_collateral_or_borrow = false;
                }
            }
        } else {
            return Err(Error::NoUserReserveDataFound);
        }

        ic_cdk::println!("Saving updated user data to state");

        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully");
        Ok(())
    }
}

/*
 * @functionality collateral-management
 * @title Toggle Collateral Status
 * @notice Allows a user to toggle the collateral status of an asset.
 *
 * @dev Steps:
 * 1. Validate input parameters.
 * 2. Check collateral and debt status.
 * 3. Update the user's reserve data.
 *
 * @param asset The asset name.
 * @param amount The amount removed from collateral.
 * @param added_amount The amount added as collateral.
 *
 * @return `Ok(())` if successful.
 */
#[update]
pub async fn toggle_collateral(asset: String, amount: Nat, added_amount: Nat) -> Result<(), Error> {
    // prevent anonymous access
    guard_prevent_anonymous()?;
    validate_asset_name(&asset)?;
    validate_zero_value(&amount)?;
    validate_zero_value(&added_amount)?;

    let user_principal = ic_cdk::caller();

    let mut user_data = user_data(user_principal)?;

    let reserve_data = read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
    })
    .ok_or_else(|| Error::NoReserveDataFound)?;

    let (added_usd_amount, _) = get_exchange_rates(asset.clone(), None, added_amount).await?;

    let (usd_amount, _) = get_exchange_rates(asset.clone(), None, amount.clone()).await?;

    let (
        total_collateral,
        total_debt,
        _ltv,
        liquidation_threshold_var,
        _health_factor,
        _a_borrow,
        _zero_ltv_collateral,
    ) = calculate_user_account_data(None).await?;

    if total_debt != zero_nat_value() {
        // bhanu should ltv and adjusted_collateral be same as the res from calculate_user_account_data ?
        let mut ltv = zero_nat_value();
        if amount != zero_nat_value() {
            let mut adjusted_collateral = zero_nat_value();
            if total_collateral < usd_amount.clone() {
                adjusted_collateral = zero_nat_value();
            } else {
                adjusted_collateral = total_collateral.clone() - usd_amount.clone();
            }

            if total_debt == zero_nat_value() {
                ltv = zero_nat_value();
            } else {
                ltv = total_debt.scaled_div(adjusted_collateral);
            }
        } else {
            let adjusted_collateral = total_collateral.clone() + added_usd_amount;
            ic_cdk::println!("adjusted amount = {}", adjusted_collateral);
            if total_debt == zero_nat_value() {
                ltv = zero_nat_value();
            } else {
                ltv = total_debt.scaled_div(adjusted_collateral);
            }
        }

        ltv = ltv * Nat::from(PERCENTAGE_FACTOR);
        ic_cdk::println!("New ltv: {}", ltv);
        if ltv >= liquidation_threshold_var {
            return Err(Error::LTVGreaterThanThreshold);
        }
    }

    // bhanu else me kuch nhi hona tha ?
    match user_reserve(&mut user_data, &asset) {
        Some((_, user_reserve_data)) => {
            user_reserve_data.is_collateral = !user_reserve_data.is_collateral;

            if user_reserve_data.is_using_as_collateral_or_borrow {
                if user_reserve_data.is_borrowed {
                    user_reserve_data.is_using_as_collateral_or_borrow = true;
                } else {
                    user_reserve_data.is_using_as_collateral_or_borrow = false;
                }
            } else {
                user_reserve_data.is_using_as_collateral_or_borrow =
                    user_reserve_data.is_collateral;
            }
        }
        None => {
            // else logic to be placed here
        }
    }

    // Save the updated user data back to state
    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()))
    });

    ic_cdk::println!("User data updated successfully: {:?}", user_data);
    Ok(())
}

/*
 * @functionality user-data-access
 * @title Fetch User Data
 * @notice Retrieves user data from state.
 *
 * @param user_principal The principal ID of the user.
 *
 * @return `UserData` if found.
 */
pub fn user_data(user_principal: Principal) -> Result<UserData, Error> {
    read_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|user| user.0.clone())
    })
    .ok_or_else(|| Error::NoUserReserveDataFound)
}

/*
 * @functionality user-reserve-access
 * @title Fetch User Reserve Data
 * @notice Retrieves reserve data for a specific asset from the user's profile.
 *
 * @param user_data A mutable reference to `UserData`.
 * @param asset_name The asset name for which reserve data is required.
 *
 * @return `Option<&mut (String, UserReserveData)>` containing the asset name and its reserve data.
 */
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
