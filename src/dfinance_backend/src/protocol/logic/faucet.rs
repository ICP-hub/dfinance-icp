use crate::stable_storage::state_handler::mutate_state;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::stable_storage::storable::Candid;
use crate::api::query::get_cached_exchange_rate;
use crate::guards::access_control::guard_prevent_anonymous;
use crate::protocol::libraries::update::{user_data, user_reserve};
use crate::protocol::utils::math_utils::ScalingMath;
use crate::declarations::datatypes::UserReserveData;
use candid::{Nat, Principal};
use ic_cdk_macros::update;
use crate::api::inter_canister::get_balance;
use crate::api::inter_canister::asset_transfer_from;
use crate::guards::locks_handler::CallerGuard;
use crate::guards::api_limiter::request_limiter;

/*
 * @title Token Faucet
 * @notice This function allows users to request tokens from the faucet for a specified asset and amount.
 * @dev The function performs several validation checks, updates user data, and transfers tokens from the platform to the user.
 * @functionality Test token distribution functionality that provides users with tokens for testing purposes with rate limiting
 *
 * # Parameters
 * - `asset` - The asset symbol (e.g., "ETH", "BTC"). Must be non-empty and <= 7 characters.
 * - `amount` - The amount of tokens to request. Must be greater than zero.
 *
 * # Returns
 * - `Ok(Nat)` - The new balance after the transfer.
 */
#[update]
pub async fn faucet(asset: String, amount: Nat) -> Result<Nat, Error> {
    request_limiter()?;
    guard_prevent_anonymous()?;
    let user_principal = ic_cdk::caller();
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;

    // input asset validator
    validate_asset_name(&asset)?;
    validate_zero_value(&amount)?;

    let mut user_data = user_data(user_principal)?;

    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let balance = get_balance(ledger_canister_id, platform_principal).await?;

    ic_cdk::println!("balance of wallet = {}", balance);

    if amount > balance {
        ic_cdk::println!("wallet balance is low");
        return Err(Error::LowWalletBalance);
    }

    let asset_price = get_cached_exchange_rate(asset.clone())?;
    ic_cdk::println!("asset price = {}", asset_price);

    let usd_amount = ScalingMath::scaled_mul(amount.clone(), asset_price.clone());

    ic_cdk::println!("usd amount of the facut = {}, {}", usd_amount, asset_price);

    let user_reserve = user_reserve(&mut user_data, &asset);
    ic_cdk::println!("user reserve = {:?}", user_reserve);

    if let Some((_, user_reserve_data)) = user_reserve {
        ic_cdk::println!("inside if statement");

        if usd_amount.clone() > user_reserve_data.faucet_limit {
            return Err(Error::AmountExceedsLimit);
        }

        if (user_reserve_data.faucet_usage.clone() + usd_amount.clone())
            > user_reserve_data.faucet_limit
        {
            return Err(Error::ExceedsRemainingLimit);
        }
        user_reserve_data.faucet_usage += usd_amount;
        ic_cdk::println!("if faucet usage = {}", user_reserve_data.faucet_usage);
    } else {
        let mut new_reserve = UserReserveData {
            reserve: asset.clone(),
            is_collateral: true,
            ..Default::default()
        };

        if usd_amount > new_reserve.faucet_limit {
            return Err(Error::AmountExceedsLimit);
        }

        if (new_reserve.faucet_usage.clone() + usd_amount.clone())
            > new_reserve.faucet_limit.clone()
        {
            return Err(Error::ExceedsRemainingLimit);
        }

        new_reserve.faucet_usage += usd_amount;
        ic_cdk::println!("else faucet usage = {}", new_reserve.faucet_usage);

        if let Some(ref mut reserves) = user_data.reserves {
            reserves.push((asset.clone(), new_reserve.clone()));
        } else {
            user_data.reserves = Some(vec![(asset.clone(), new_reserve.clone())]);
        }

        ic_cdk::println!(
            "faucet new_reserve.faucet_usage = {}",
            new_reserve.faucet_usage
        );
    }

    ic_cdk::println!("user data before submit = {:?}", user_data);

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

    ic_cdk::println!("updated user data = {:?}", user_data);

    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!("Asset transfer from backend to user executed successfully");
            Ok(new_balance)
        }
        Err(_) => {
            return Err(Error::ErrorFaucetTokens);
        }
    }
}

/*
 * @title Reset Faucet Usage
 * @notice This function resets the faucet usage for a specified user by setting their faucet usage to zero.
 * @dev It validates the caller, retrieves the user data, resets the faucet usage, and updates the state.
 * @functionality Administrative functionality that allows resetting a user's faucet usage to enable additional token requests
 *
 * # Parameters
 * - `user_principal` - The principal of the user whose faucet usage is to be reset.
 *
 * # Returns
 * - `Ok(())` - If the faucet usage is successfully reset.
 */
pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {
    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let mut user_data = user_data(user_principal)?;

    // Access and mutate reserves
    if let Some(user_data_reserves) = user_data.reserves.as_mut() {
        for (_reserve_name, user_reserve_data) in user_data_reserves.iter_mut() {
            user_reserve_data.faucet_usage = zero_nat_value();
        }
    } else {
        return Err(Error::NoUserReserveDataFound);
    }

    ic_cdk::println!("User data after faucet reset = {:?}", user_data);

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

    ic_cdk::println!("updated user data after facuet reset = {:?}", user_data);
    Ok(())
}
