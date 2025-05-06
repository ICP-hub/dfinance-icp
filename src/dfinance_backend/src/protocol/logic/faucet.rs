use std::cell::RefCell;
use std::collections::HashMap;

use crate::api::inter_canister::asset_transfer_from;
use crate::api::inter_canister::get_balance;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::debug;
use crate::declarations::datatypes::{FaucetReserve, FaucetReserves};
use crate::error;
use crate::guards::access_control::guard_prevent_anonymous;
use crate::guards::api_limiter::request_limiter;
use crate::guards::locks_handler::CallerGuard;
use crate::protocol::utils::log::LogFlusher;
use crate::info;
use crate::protocol::libraries::update::{get_faucet_reserve_for_asset, get_user_faucet_reserves};
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::protocol::utils::math_utils::ScalingMath;
use crate::stable_storage::state_handler::mutate_state;
use crate::stable_storage::state_handler::read_state;
use crate::stable_storage::storable::Candid;
use candid::{Nat, Principal};
use ic_cdk_macros::update;
use ic_captcha::CaptchaBuilder;
use crate::stable_storage::state_handler::insert_certified_value;
use crate::protocol::utils::price::get_cached_exchange_rate;
use crate::stable_storage::state_handler::get_certificate_witness;
use crate::declarations::datatypes::Certificate;

thread_local! {
    // static RATE_LIMITER: RefCell<HashMap<Principal, VecDeque<u64>>> = RefCell::new(HashMap::new());
    static CAPTCHA_STATE: RefCell<HashMap<Principal, CaptchaEntry>> = RefCell::new(HashMap::new());

}
const CAPTCHA_LIFETIME: u64 = 1 * 60 * 1_000_000_000; // 1 minutes in nanoseconds
const CAPTCHA_THRESHOLD: usize = 5;
const CAPTCHA_HARDNESS: u8 = 32;

#[derive(Debug, Clone)]
pub struct CaptchaEntry {
    pub data: String,
    pub created_at: u64,
}

#[derive(candid::CandidType, serde::Serialize)]
pub struct Challenge {
    pub base64_img: String,
}
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
#[cfg(feature = "testnet")]
#[update]
pub async fn faucet(asset: String, amount: Nat) -> Result<Nat, Error> {
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
    debug!("faucet data = {:?}", user_faucet_reserves);

    let ledger_canister_id = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let platform_principal = ic_cdk::api::id();
    debug!("Platform principal: {:?}", platform_principal);

    let balance = get_balance(ledger_canister_id, platform_principal).await?;

    debug!("balance of wallet = {}", balance);

    if amount > balance {
        error!("platform have not enough balance");
        return Err(Error::LowPlatformBalance);
    }

    let asset_price = get_cached_exchange_rate(asset.clone())?;
    debug!("asset price = {}", asset_price);

    let usd_amount = ScalingMath::scaled_mul(amount.clone(), asset_price.clone());

    debug!("usd amount of the facut = {}, {}", usd_amount, asset_price);

    let faucet_reserve = get_faucet_reserve_for_asset(&mut user_faucet_reserves, &asset);
    debug!("faucet reserve = {:?}", faucet_reserve);

    if let Some((_, reserve)) = faucet_reserve {
        debug!("inside if statement");

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
 * # Parameters
 * - `user_principal` - The principal of the user whose faucet usage is to be reset.
 *
 * # Returns
 * - `Ok(())` - If the faucet usage is successfully reset.
 */
pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {
    if user_principal == Principal::anonymous() {
        error!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

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

    info!("user faucet reserve updated successfully");
    mutate_state(|state| {
        state
            .faucet_data
            .insert(user_principal, Candid(user_faucet_reserves.clone()));
    });
    insert_certified_value(user_principal.to_string(), user_faucet_reserves.clone());

    info!(
        "updated user data after facuet reset = {:?}",
        user_faucet_reserves
    );
    Ok(())
}
#[update]
async fn create_captcha() -> Result<Challenge, Error> {
    guard_prevent_anonymous()?;
    let caller_id = ic_cdk::api::caller();
    let now = ic_cdk::api::time();

    // Apply CAPTCHA filtering before creating a new CAPTCHA
    CAPTCHA_STATE.with(|state| {
        let mut state = state.borrow_mut();
        ic_cdk::println!("length of the state = {:?}", state.len());

        // Apply filtering based on time and user
        captcha_filter(&mut state, true, false); // Filter expired CAPTCHAs and retain others

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
    ic_cdk::println!("solution test = {}", solution_text);

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

    // Optionally: log the solution for debugging (disable in prod)
    ic_cdk::println!("CAPTCHA solution for {:?}: {}", caller_id, solution_text);

    Ok(Challenge {
        base64_img: captcha.to_base64(CAPTCHA_HARDNESS),
    })
}

#[update]
fn verify_captcha(user_input: String) -> Result<(), Error> {
    let caller_id = ic_cdk::api::caller();
    let now = ic_cdk::api::time();

    // Debugging print to check caller ID and time
    ic_cdk::println!("Caller ID: {:?}", caller_id);
    ic_cdk::println!("Current time: {}", now);

    // Log the user input to console
    ic_cdk::println!("User input: {:?}", user_input); // This will log the input from the user

    CAPTCHA_STATE.with(|state| {
        let mut state = state.borrow_mut();

        // Apply CAPTCHA filtering before verifying
        ic_cdk::println!("Filtering CAPTCHA states...");
        captcha_filter(&mut state, true, false); // Filter expired CAPTCHAs and retain others

        // Check if CAPTCHA exists for this user
        if let Some(entry) = state.get(&caller_id) {
            ic_cdk::println!("Captcha found for caller: {:?}", caller_id);

            // Check if CAPTCHA has expired
            if entry.created_at + CAPTCHA_LIFETIME <= now {
                ic_cdk::println!("Captcha expired for caller: {:?}", caller_id);
                state.remove(&caller_id); // Clean up expired CAPTCHA
                return Err(Error::CaptchaExpired);
            }

            // Compare solution text
            if entry.data == user_input {
                ic_cdk::println!("Captcha verified successfully for caller: {:?}", caller_id);
                state.remove(&caller_id); // Clean up on success
                return Ok(());
            } else {
                ic_cdk::println!("Invalid captcha input for caller: {:?}", caller_id);
                return Err(Error::InvalidCaptcha);
            }
        }

        ic_cdk::println!("Captcha not found for caller: {:?}", caller_id);
        Err(Error::CaptchaNotFound)
    })
}

// Function to filter out expired and user-specific CAPTCHA
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
 * @title Get All Faucet
 * @dev Retrieves a list of all users with their faucet reserves.
 * @returns A vector of tuples containing user principals and their faucet reserves.
 * @functionality This function returns a list of all users and their respective faucet reserves.
 */
#[cfg(feature = "testnet")]
pub async fn get_all_faucet() -> (Vec<(Principal, FaucetReserves)>, Certificate) {
    let res = read_state(|state| {
        state
            .faucet_data
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });
    let cer = get_certificate_witness("all_faucet".to_string());
    (res, cer)

}