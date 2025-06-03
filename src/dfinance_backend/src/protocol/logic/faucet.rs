use std::cell::RefCell;
use std::collections::HashMap;
use crate::api::inter_canister::{asset_transfer_from, get_balance};
use crate::constants::{
    data_types::zero_nat_value,
    constant_variables::constants::{CAPTCHA_HARDNESS, CAPTCHA_LIFETIME, CAPTCHA_THRESHOLD},
    errors::Error,
    validators::{validate_asset_name, validate_zero_value}
};
use crate::debug;
use crate::declarations::datatypes::{FaucetReserve, FaucetReserves};
use crate::declarations::structs::{CaptchaEntry,Challenge};
use crate::error;
use crate::guards::{
    access_control::guard_prevent_anonymous,
    api_limiter::request_limiter,
    locks_handler::CallerGuard
};
use crate::info;
use crate::protocol::libraries::update::{get_faucet_reserve_for_asset, get_user_faucet_reserves};
use crate::protocol::utils::{
    log::{log_internal, LogLevel, LogFlusher},
    math_utils::ScalingMath,
    price::get_cached_exchange_rate
};
use crate::stable_storage::state_handler::{mutate_state,read_state, insert_certified_value};
use crate::stable_storage::storable::Candid;
use candid::{Nat, Principal};
use ic_cdk_macros::update;
use ic_captcha::CaptchaBuilder;

thread_local! {
    static CAPTCHA_STATE: RefCell<HashMap<Principal, CaptchaEntry>> = RefCell::new(HashMap::new());

}



/*
 * @title Token Faucet (Only for Testnet)
 * @notice This function allows users to request tokens from the faucet for a specified asset and amount.
 * @dev The function performs several validation checks, updates user data, and transfers tokens from the platform to the user.
 * @functionality Test token distribution functionality that provides users with tokens for testing purposes with rate limiting
 *
 * @params
 * - `asset` - The asset symbol (e.g., "ETH", "BTC"). Must be non-empty and <= 7 characters.
 * - `amount` - The amount of tokens to request. Must be greater than zero.
 *
 * @returns
 * - `Ok(Nat)` - The new balance after the transfer.
 */
#[cfg(feature = "testnet")]
#[update]
pub async fn faucet(asset: String, amount: Nat) -> Result<Nat, Error> {
    use crate::protocol::libraries::reserve::get_asset_principal;

    request_limiter()?;
    
    let user_principal = ic_cdk::caller();
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(), // or whatever user_key you need
    };

    // input asset validator
    validate_asset_name(&asset)?;
    validate_zero_value(&amount)?;

    let mut user_faucet_reserves = get_user_faucet_reserves(user_principal)?;

    let ledger_canister_id = get_asset_principal(asset.clone())?;

    let platform_principal = ic_cdk::api::id();

    let balance = get_balance(ledger_canister_id, platform_principal).await?;

    if amount > balance {
        error!("platform have not enough balance");
        return Err(Error::LowPlatformBalance);
    }

    let asset_price = get_cached_exchange_rate(asset.clone())?;

    let usd_amount = ScalingMath::scaled_mul(amount.clone(), asset_price.clone());

    debug!("balance, usd amount  = {}, {}", balance, usd_amount);

    let faucet_reserve = get_faucet_reserve_for_asset(&mut user_faucet_reserves, &asset);
    debug!("faucet reserve = {:?}", faucet_reserve);

    if let Some((_, reserve)) = faucet_reserve {

        if usd_amount.clone() > reserve.faucet_limit {
            error!("Faucet request amount exceeds the faucet limit",);
            return Err(Error::AmountExceedsLimit);
        }

        if (reserve.faucet_usage.clone() + usd_amount.clone()) > reserve.faucet_limit {
            error!(
                "Faucet request exceeds limit: requested = {}, available = {}",
                reserve.faucet_usage.clone() + usd_amount.clone(),
                reserve.faucet_limit
            );
            return Err(Error::ExceedsRemainingLimit);
        }
        reserve.faucet_usage += usd_amount;
        info!("updated faucet usage = {}", reserve.faucet_usage);
    } else {
        let mut new_reserve = FaucetReserve {
            ..Default::default()
        };

        if usd_amount > new_reserve.faucet_limit {
            error!("Faucet request amount exceeds the faucet limit",);
            return Err(Error::AmountExceedsLimit);
        }

        if (new_reserve.faucet_usage.clone() + usd_amount.clone())
            > new_reserve.faucet_limit.clone()
        {
            error!(
                "Faucet request exceeds limit: requested = {}, available = {}",
                new_reserve.faucet_usage.clone() + usd_amount.clone(),
                new_reserve.faucet_limit
            );
            return Err(Error::ExceedsRemainingLimit);
        }

        new_reserve.faucet_usage += usd_amount;

        if let Some(ref mut reserves) = user_faucet_reserves.reserves {
            reserves.push((asset.clone(), new_reserve.clone()));
        } else {
            user_faucet_reserves.reserves = Some(vec![(asset.clone(), new_reserve.clone())]);
        }

        info!(
            "faucet new_reserve.faucet_usage = {}",
            new_reserve.faucet_usage
        );
    }

    info!("user faucet reserve updated successfully");
    mutate_state(|state| {
        state
            .faucet_data
            .insert(user_principal, Candid(user_faucet_reserves.clone()));
    });
    insert_certified_value(user_principal.to_string(), user_faucet_reserves.clone());

    debug!("updated user data = {:?}", user_faucet_reserves);

    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            info!("Asset transfer from backend to user executed successfully");
            Ok(new_balance)
        }
        Err(_) => {
            error!("error faucet tokens");
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
 * @params
 * - `user_principal` - The principal of the user whose faucet usage is to be reset.
 *
 * @returns
 * - `Ok(())` - If the faucet usage is successfully reset.
 */
pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {
    if user_principal == Principal::anonymous() {
        error!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(), // or whatever user_key you need
    };

    let mut user_faucet_reserves = get_user_faucet_reserves(user_principal)?;

    // Access and mutate reserves
    if let Some(reserve) = user_faucet_reserves.reserves.as_mut() {
        for (_reserve_name, reserve_data) in reserve.iter_mut() {
            reserve_data.faucet_usage = zero_nat_value();
        }
    } else {
        error!("no user reserve data found");
        return Err(Error::NoUserReserveDataFound);
    }

    mutate_state(|state| {
        state
            .faucet_data
            .insert(user_principal, Candid(user_faucet_reserves.clone()));
    });
    insert_certified_value(user_principal.to_string(), user_faucet_reserves.clone());

    Ok(())
}

/**
 * @title Create CAPTCHA Challenge
 * @dev Generates a CAPTCHA challenge for the caller and stores the CAPTCHA solution with the user principal.
 * @returns A `Challenge` containing the CAPTCHA image in base64 format.
 * @throws Error::CaptchaAlreadyExists if the caller already has a valid CAPTCHA.
 * @throws Error::CaptchaLimitReached if the CAPTCHA threshold is exceeded.
 *
 * @functionality Prevents anonymous users from creating CAPTCHA challenges, checks if the caller already has a valid CAPTCHA, and ensures that the CAPTCHA threshold is not exceeded. It then generates a new CAPTCHA challenge and stores the solution for verification.
 */
#[cfg(feature = "testnet")]
#[update]
async fn create_captcha() -> Result<Challenge, Error> {
    guard_prevent_anonymous()?;
    let caller_id = ic_cdk::api::caller();
    let now = ic_cdk::api::time();

    CAPTCHA_STATE.with(|state| {
        let mut state = state.borrow_mut();

        // Apply filtering based on time and user
        captcha_filter(&mut state, true, false);

        // Check if the caller already has a valid CAPTCHA
        if let Some(existing) = state.get(&caller_id) {
            if existing.created_at + CAPTCHA_LIFETIME > now {
                return Err(Error::CaptchaAlreadyExists);
            }
        }

        // Check threshold limit
        if state.len() >= CAPTCHA_THRESHOLD {
            return Err(Error::CaptchaLimitReached);
        }

        Ok(())
    })?;

    // Generate CAPTCHA
    let (seed,) = ic_cdk::api::management_canister::main::raw_rand()
        .await
        .unwrap();
    let captcha = CaptchaBuilder::new().generate(&seed, None);
    let solution_text = captcha.text();

    // Store CAPTCHA solution with user principal
    CAPTCHA_STATE.with(|state| {
        state.borrow_mut().insert(
            caller_id,
            CaptchaEntry {
                data: solution_text.clone(),
                created_at: now,
            },
        );
    });

    Ok(Challenge {
        base64_img: captcha.to_base64(CAPTCHA_HARDNESS),
    })
}

/**
 * @title Verify CAPTCHA Solution
 * @dev Verifies the user-provided solution for the CAPTCHA challenge.
 * @param user_input The solution text provided by the user to verify.
 * @returns `Ok(())` if the CAPTCHA is correctly solved, or an error if the solution is incorrect or expired.
 * @throws Error::CaptchaExpired if the CAPTCHA has expired.
 * @throws Error::InvalidCaptcha if the solution is incorrect.
 * @throws Error::CaptchaNotFound if no CAPTCHA exists for the caller.
 *
 * @functionality Checks if the caller's CAPTCHA has expired or is invalid, then compares the user input to the stored solution to determine if the CAPTCHA is solved correctly.
 */
#[cfg(feature = "testnet")]
#[update]
fn verify_captcha(user_input: String) -> Result<(), Error> {
    let caller_id = ic_cdk::api::caller();
    let now = ic_cdk::api::time();

    CAPTCHA_STATE.with(|state| {
        let mut state = state.borrow_mut();

        // Filter expired CAPTCHAs and retain others
        captcha_filter(&mut state, true, false);

        if let Some(entry) = state.get(&caller_id) {

            // Check if CAPTCHA has expired
            if entry.created_at + CAPTCHA_LIFETIME <= now {
                state.remove(&caller_id);
                return Err(Error::CaptchaExpired);
            }

            // Compare solution text
            if entry.data == user_input {
                state.remove(&caller_id);
                return Ok(());
            } else {
                return Err(Error::InvalidCaptcha);
            }
        }
        Err(Error::CaptchaNotFound)
    })
}

/**
 * @title CAPTCHA Filter
 * @dev Filters the stored CAPTCHA entries based on time validity and user identity.
 * @param state The mutable reference to the `HashMap` containing the CAPTCHA entries.
 * @param time_based A flag indicating whether to filter based on time validity (CAPTCHA expiration).
 * @param usr_based A flag indicating whether to remove CAPTCHA entries created by the current user.
 *
 * @functionality Removes expired CAPTCHA entries if `time_based` is true, and removes CAPTCHAs created by the current user if `usr_based` is true. This helps in managing the validity of CAPTCHA challenges.
 */
pub fn captcha_filter(
    state: &mut std::collections::HashMap<Principal, CaptchaEntry>,
    time_based: bool,
    usr_based: bool,
) {
    let now = ic_cdk::api::time();

    if time_based {
        // Retain only those CAPTCHAs that are still valid (not expired)
        state.retain(|_, entry| entry.created_at + CAPTCHA_LIFETIME > now);
    }

    if usr_based {
        // Remove CAPTCHAs created by the current user (caller)
        state.retain(|principal, _| *principal != ic_cdk::api::caller());
    }
}

/*
 * @title Get All Faucet (Only for Testnet)
 * @dev Retrieves a list of all users with their faucet reserves.
 * @returns A vector of tuples containing user principals and their faucet reserves.
 * @functionality This function returns a list of all users and their respective faucet reserves.
 */
#[cfg(feature = "testnet")]
pub async fn get_all_faucet() -> Vec<(Principal, FaucetReserves)> {
    let res = read_state(|state| {
        state
            .faucet_data
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });
    res

}