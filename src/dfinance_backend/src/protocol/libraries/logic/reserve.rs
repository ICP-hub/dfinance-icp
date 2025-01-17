use crate::api::functions::asset_transfer;
use crate::api::functions::get_balance;
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::logic::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::libraries::math::math_utils;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use candid::{Nat, Principal};
use ic_cdk::api::time;

fn current_timestamp() -> u64 {
    time() / 1_000_000_000
}

pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,

        curr_liquidity_index: reserve_data.liquidity_index.clone(),
        next_liquidity_index: reserve_data.liquidity_index.clone(),
        curr_liquidity_rate: reserve_data.current_liquidity_rate.clone(),

        curr_debt_index: reserve_data.debt_index.clone(),
        curr_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_index: reserve_data.debt_index.clone(),
        debt_last_update_timestamp: 0,

        reserve_factor: reserve_data.configuration.reserve_factor.clone(),

        curr_debt: reserve_data.asset_borrow.clone(), //TODO take from total_supply of debt token or update this while minting and burning the tokens
        next_debt: reserve_data.asset_borrow.clone(),
        curr_supply: reserve_data.asset_supply.clone(), //TODO take from total_supply of d token or update this while minting and burning the tokens
    }
}

pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);
    accrue_to_treasury(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != Nat::from(0u128) {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
        );
        reserve_cache.next_liquidity_index =
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index.clone());

        reserve_data.liquidity_index = reserve_cache.next_liquidity_index.clone();
    }

    if reserve_cache.curr_debt != Nat::from(0u128) {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        ic_cdk::println!(
            "cumulated borrow interest when performing action {}",
            cumulated_borrow_interest
        );
        reserve_cache.next_debt_index =
            cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index.clone());
        ic_cdk::println!("next debt index {}", reserve_cache.next_debt_index);
        reserve_data.debt_index = reserve_cache.next_debt_index.clone();
    }
}

pub async fn update_interest_rates(
    reserve_data: &mut ReserveData,
    reserve_cache: &mut ReserveCache,
    liq_taken: Nat,
    liq_added: Nat,
) -> Result<(), Error> {
    let total_debt = reserve_cache
        .curr_debt
        .clone()
        .scaled_mul(reserve_cache.next_debt_index.clone());
    let asset = reserve_data
        .asset_name
        .clone()
        .unwrap_or("no token".to_string());
    let interest_rate_params = initialize_interest_rate_params(&asset);
    ic_cdk::println!("interest rate params {:?}", interest_rate_params);
    ic_cdk::println!("total debt: {:?}", total_debt);
    let calculated_interest_rates = calculate_interest_rates(
        liq_added,
        liq_taken,
        total_debt,
        &interest_rate_params,
        reserve_cache.reserve_factor.clone(),
        reserve_data.asset_name.clone().expect("no name"),
    )
    .await;

    let (next_liquidity_rate, next_debt_rate) = match calculated_interest_rates {
        Ok((liquidity_rate, debt_rate)) => {
            ic_cdk::println!("liquidity rate: {:?}", liquidity_rate);
            ic_cdk::println!("debt rate: {:?}", debt_rate);
            (liquidity_rate, debt_rate)
        }
        Err(e) => {
            ic_cdk::println!("Error calculating interest rates: {:?}", e);
            return Err(e);
        }
    };

    reserve_data.current_liquidity_rate = next_liquidity_rate;
    reserve_data.borrow_rate = next_debt_rate;
    Ok(())
}

pub async fn burn_scaled(
    reserve: &mut ReserveData,
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    burn_dtoken: bool,
) -> Result<(), Error> {
    ic_cdk::println!("Starting burn_scaled function...");
    ic_cdk::println!("Initial parameters:");
    ic_cdk::println!("  Amount: {}", amount);
    ic_cdk::println!("  Index: {}", index);
    ic_cdk::println!("  User Principal: {}", user_principal);
    ic_cdk::println!("  Token Canister Principal: {}", token_canister_principal);
    ic_cdk::println!("  Platform Principal: {}", platform_principal);
    ic_cdk::println!("  Burn DToken: {}", burn_dtoken);

    ic_cdk::println!("Checking if amount has a remainder when divided by index...");
    ic_cdk::println!("Amount remainder: {}", amount.clone() % index.clone());

    let mut adjusted_amount = if amount.clone() % index.clone() != Nat::from(0u128)
        && amount.clone() < Nat::from(10u128)
    {
        ic_cdk::println!("Rounding up due to remainder and amount < 10");
        amount.clone().scaled_div(index.clone()) + Nat::from(1u128)
    } else {
        ic_cdk::println!("No rounding required");
        amount.clone().scaled_div(index.clone())
    };

    ic_cdk::println!("Adjusted amount calculated: {}", adjusted_amount);

    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Adjusted amount is zero");
        return Err(Error::InvalidBurnAmount);
    }

    ic_cdk::println!("Fetching user balance...");
    let balance_result = get_balance(token_canister_principal, user_principal).await;

    let balance = match balance_result {
        Ok(bal) => {
            ic_cdk::println!("Balance fetched successfully: {}", bal);
            bal
        }
        Err(err) => {
            ic_cdk::println!("Error fetching balance: {:?}", err);
            return Err(err);
        }
    };

    ic_cdk::println!("Comparing balance and adjusted amount...");
    if balance.clone() > adjusted_amount.clone()
        && balance.clone() - adjusted_amount.clone() < Nat::from(1000u128)
    {
        ic_cdk::println!("Adjusting amount to balance");
        adjusted_amount = balance.clone();
    }

    ic_cdk::println!("Final adjusted amount: {}", adjusted_amount);

    let mut balance_increase = Nat::from(0u128);
    if burn_dtoken {
        ic_cdk::println!("Processing DToken burn...");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.liquidity_index.clone()));

        ic_cdk::println!("Balance increase calculated: {}", balance_increase);

        if user_state.d_token_balance == adjusted_amount {
            ic_cdk::println!("Setting DToken balance to zero");
            user_state.d_token_balance = Nat::from(0u128);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from DToken balance");
            user_state.d_token_balance -= adjusted_amount.clone();
        }

        ic_cdk::println!("Updated DToken balance: {}", user_state.d_token_balance);
        ic_cdk::println!("before updating asset borrow = {:?}", reserve.asset_borrow);

        if reserve.asset_supply == adjusted_amount {
            ic_cdk::println!("Setting asset supply to zero");
            reserve.asset_supply = Nat::from(0u128);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from asset supply");
            reserve.asset_supply -= adjusted_amount;
        }

        ic_cdk::println!("Updated asset supply: {}", reserve.asset_supply);
        user_state.liquidity_index = index.clone();
    } else {
        ic_cdk::println!("Processing variable borrow burn...");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.variable_borrow_index.clone()));

        ic_cdk::println!("Balance increase calculated: {}", balance_increase);

        if user_state.debt_token_blance == adjusted_amount {
            ic_cdk::println!("Setting debt token balance to zero");
            user_state.debt_token_blance = Nat::from(0u128);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from debt token balance");
            user_state.debt_token_blance -= adjusted_amount.clone();
        }

        ic_cdk::println!(
            "Updated debt token balance: {}",
            user_state.debt_token_blance
        );
        ic_cdk::println!("before updating asset borrow = {:?}", reserve.asset_borrow);

        if reserve.asset_borrow == adjusted_amount {
            ic_cdk::println!("Setting asset borrow to zero");
            reserve.asset_borrow = Nat::from(0u128);
        } else {
            ic_cdk::println!("Subtracting adjusted amount from asset borrow");
            reserve.asset_borrow -= adjusted_amount;
        }

        ic_cdk::println!("Updated asset borrow: {}", reserve.asset_borrow);
        user_state.variable_borrow_index = index;
    }

    if balance_increase > amount {
        let amount_to_mint = balance_increase - amount;
        ic_cdk::println!("Minting tokens, amount: {}", amount_to_mint);

        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            amount_to_mint,
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("Minting successful");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error during minting: {:?}", err);
                Err(Error::ErrorMintTokens)
            }
        }
    } else {
        let mut amount_to_burn = amount - balance_increase;
        ic_cdk::println!("Burning tokens, initial amount: {}", amount_to_burn);

        if balance.clone() > amount_to_burn.clone()
            && balance.clone() - amount_to_burn.clone() < Nat::from(1000u128)
        {
            ic_cdk::println!("Adjusting burn amount to balance");
            amount_to_burn = balance.clone();
            if burn_dtoken {
                user_state.d_token_balance = Nat::from(0u128);
            } else {
                user_state.debt_token_blance = Nat::from(0u128);
            }
        }

        ic_cdk::println!("Final burn amount: {}", amount_to_burn);

        match asset_transfer(
            platform_principal,
            token_canister_principal,
            user_principal,
            Nat::from(amount_to_burn),
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("Burning successful");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error during burning: {:?}", err);
                Err(Error::ErrorBurnTokens)
            }
        }
    }
}

pub async fn mint_scaled(
    reserve: &mut ReserveData,
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    minting_dtoken: bool,
) -> Result<(), Error> {
    ic_cdk::println!("--- mint_scaled_modified called ---");
    ic_cdk::println!("Initial user state: {:?}", user_state);
    ic_cdk::println!("Amount value: {}", amount);
    ic_cdk::println!("current index value = {}", index);

    let mut adjusted_amount = if amount.clone() % index.clone() != Nat::from(0u128)
        && amount.clone() < Nat::from(10u128)
    {
        amount.clone().scaled_div(index.clone()) + Nat::from(1u128) // Round up if there's a remainder
    } else {
        amount.clone().scaled_div(index.clone())
    };
    ic_cdk::println!("Adjusted amount: {}", adjusted_amount.clone());
    if amount.clone() > adjusted_amount.clone()
        && amount.clone() - adjusted_amount.clone() < Nat::from(1000u128)
    {
        adjusted_amount = amount.clone();
    }

    ic_cdk::println!("Adjusted amount: {}", adjusted_amount);
    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    let balance_result = get_balance(token_canister_principal, user_principal).await;
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            ic_cdk::println!("Error converting balance to u128: {:?}", err);
            return Err(Error::ErrorGetBalance);
        }
    };
    ic_cdk::println!("Fetched balance in Nat: {:?}", balance);
    ic_cdk::println!("mint balance = {}", balance);

    let mut balance_increase = Nat::from(0u128);
    if minting_dtoken {
        println!("minting dtoken");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.liquidity_index.clone())); //fetch from user
        println!("balance incr dtoken{}", balance_increase);
        if user_state.liquidity_index == Nat::from(0u128) {
            user_state.d_token_balance = amount.clone();
        } else {
            user_state.d_token_balance += adjusted_amount.clone();
        }
        ic_cdk::println!("new dtoken balance {}", user_state.d_token_balance);
        reserve.asset_supply += adjusted_amount;
        println!("updated asset supply{}", reserve.asset_supply);
        println!("user new dtoken balance {}", user_state.d_token_balance);
        user_state.liquidity_index = index;
        println!("user new liq index {}", user_state.liquidity_index);
    } else {
        println!("minting debttoken");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.variable_borrow_index.clone()));
        println!("balance incr debttoken{}", balance_increase);
        if user_state.variable_borrow_index == Nat::from(0u128) {
            user_state.debt_token_blance = amount.clone();
        } else {
            user_state.debt_token_blance += adjusted_amount.clone();
        }

        println!("new debt balance {}", user_state.debt_token_blance);
        reserve.asset_borrow += adjusted_amount;
        user_state.variable_borrow_index = index;
        println!("new debt index {}", user_state.variable_borrow_index);
    }

    let newmint = amount + balance_increase;
    println!("minted token {}", newmint);
    // Perform token transfer to the user with the newly minted aTokens
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        newmint,
    )
    .await
    {
        Ok(_) => {
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
            Ok(())
        }
        Err(err) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
            Err(Error::ErrorMintTokens)
        }
    }
}

pub fn accrue_to_treasury(reserve_data: &mut ReserveData, reserve_cache: &ReserveCache) {
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == Nat::from(0u128) {
        return;
    }

    vars.prev_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.curr_debt_index.clone(),
    );
    ic_cdk::println!(
        "prev_total_variable_debt in accure: {:?}",
        vars.prev_total_variable_debt
    );

    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );
    ic_cdk::println!(
        "curr_total_variable_debt in accure: {:?}",
        vars.curr_total_variable_debt
    );

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;
    ic_cdk::println!(
        "total_debt_accrued in accure: {:?}",
        vars.total_debt_accrued
    );
    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone(),
    ); //percent
    ic_cdk::println!("amount_to_mint in accure: {:?}", vars.amount_to_mint);
    if vars.amount_to_mint != Nat::from(0u128) {
        reserve_data.accure_to_platform += (ScalingMath::scaled_mul(
            vars.amount_to_mint,
            reserve_cache.next_liquidity_index.clone(),
        )) / 100 as u128;
        ic_cdk::println!(
            "accure_to_platform in accure: {:?}",
            reserve_data.accure_to_platform
        );
    }
}

struct AccrueToTreasuryLocalVars {
    prev_total_variable_debt: Nat,
    curr_total_variable_debt: Nat,
    total_debt_accrued: Nat,
    amount_to_mint: Nat,
}

impl Default for AccrueToTreasuryLocalVars {
    fn default() -> Self {
        AccrueToTreasuryLocalVars {
            prev_total_variable_debt: Nat::from(0u128),
            curr_total_variable_debt: Nat::from(0u128),
            total_debt_accrued: Nat::from(0u128),
            amount_to_mint: Nat::from(0u128),
        }
    }
}
