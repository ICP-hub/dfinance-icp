use crate::api::functions::get_balance;
use crate::constants::errors::Error;
use crate::protocol::libraries::math::math_utils;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use ic_cdk::api::time;
use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::logic::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::api::functions::asset_transfer;
use candid::{Nat, Principal};

fn current_timestamp() -> u64 {
    time() / 1_000_000_000
}

pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
        d_token_canister: reserve_data.d_token_canister.clone(),
        debt_token_canister: reserve_data.debt_token_canister.clone(),
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
        //next_debt
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
    accrue_to_treasury(reserve_data, reserve_cache); //TODO review this code

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
    //TODO compare the total_debt
    if reserve_cache.curr_debt_index != Nat::from(0u128) {
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
) -> Result<(), Error>{
    let total_debt = reserve_cache
        .curr_debt
        .clone()
        .scaled_mul(reserve_cache.next_debt_index.clone());
    // let total_supply= total_supplies.scaled_mul(reserve_cache.curr_liquidity_index);
    let asset = reserve_data
        .asset_name
        .clone()
        .unwrap_or("no token".to_string());
    //let user = caller();
    //let dtoken = reserve_data.d_token_canister.clone().unwrap();
    //let dtoken_principal = Principal::from_text(dtoken).unwrap();
    let interest_rate_params = initialize_interest_rate_params(&asset);
    ic_cdk::println!("interest rate params {:?}", interest_rate_params);
    ic_cdk::println!("total debt: {:?}", total_debt);
    // Ask: did some changes here. Check if it is correct
    let calculated_interest_rates = calculate_interest_rates(
        liq_added,
        liq_taken,
        total_debt,
        &interest_rate_params,
        reserve_cache.reserve_factor.clone(),
        reserve_data.asset_name.clone().expect("no name"),
        // dtoken_principal,
        // user,
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
    ic_cdk::println!(
        "reserve_data.total_borrowed: {:?}",
        reserve_data.total_borrowed
    );
    Ok(())
}


//TODO change the param of burn function according to mint.
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
    //TODO if user is not caller, then
    //TODO if to is not backend, transfer it to other
    ic_cdk::println!("burn user state value = {:?}", user_state);
    ic_cdk::println!("burn amount value = {}", amount);
    ic_cdk::println!("burn index value = {}", index);
    ic_cdk::println!("burn user_principal value = {}", user_principal);
    ic_cdk::println!(
        "burn token_canister_principal value = {}",
        token_canister_principal
    );
    ic_cdk::println!("burn platform_principal value = {}", platform_principal);

    let mut adjusted_amount = amount.clone().scaled_div(index.clone());
    ic_cdk::println!("adjusted_amount calculated = {}", adjusted_amount);

    if adjusted_amount == Nat::from(0u128) {
        return Err(Error::InvalidBurnAmount);
    }

    let balance_result = get_balance(token_canister_principal, user_principal).await;
    ic_cdk::println!("balance_nat retrieved = {:?}", balance_result);

    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            ic_cdk::println!("Error converting balance to u128: {:?}", err);
            return Err(err);
        }
    };
    if balance.clone() > adjusted_amount.clone()
        && balance.clone() - adjusted_amount.clone() < Nat::from(1000u128)
    {
        adjusted_amount = balance.clone();
    }
    let mut balance_increase = Nat::from(0u128);
    if burn_dtoken {
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.liquidity_index.clone()));//fetch from user
        ic_cdk::println!("balance_increase calculated = {}", balance_increase);

        user_state.d_token_balance -= adjusted_amount.clone();
        reserve.asset_supply -= adjusted_amount;
        user_state.liquidity_index = index.clone();
    } else {
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.variable_borrow_index.clone())); 
        ic_cdk::println!("balance_increase calculated = {}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.debt_token_blance -= adjusted_amount.clone();
        reserve.asset_borrow -= adjusted_amount;
        user_state.variable_borrow_index = index;
    }

    if balance_increase > amount {
        let amount_to_mint = balance_increase - amount;
        ic_cdk::println!(
            "balance_increase is greater than amount, amount_to_mint = {}",
            amount_to_mint
        );

        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            amount_to_mint,
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("token transfer from backend to user executed successfully");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
                Err(Error::ErrorMintTokens)
            }
        }
    } else {
        let mut amount_to_burn = amount - balance_increase;
        //TODO handle negative
        if balance.clone() - amount_to_burn.clone() < Nat::from(1000u128) {
            amount_to_burn = balance;
        }
        ic_cdk::println!(
            "balance_increase is not greater than amount, amount_to_burn = {}",
            amount_to_burn
        );

        match asset_transfer(
            platform_principal,
            token_canister_principal,
            user_principal,
            Nat::from(amount_to_burn),
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("token transfer from user to backend executed successfully");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error: Burning failed. Error: {:?}", err);
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
    ic_cdk::println!("Current liquidity index value: {}", index);
    ic_cdk::println!("User principal value: {}", user_principal);
    ic_cdk::println!("current_liquidity_index value = {}", index);
    ic_cdk::println!("user_principal value = {}", user_principal);
    ic_cdk::println!("current index value = {}", index);
    ic_cdk::println!("Platform principal value: {}", platform_principal);

    let adjusted_amount = amount.clone().scaled_div(index.clone());
    ic_cdk::println!("Adjusted amount: {}", adjusted_amount);
    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Invalid mint amount");
        return Err(Error::InvalidMintAmount);
    }

    // Calculate interest accrued since the last liquidity index update
    // let balance_increase = (user_state
    //     .adjusted_balance
    //     .scaled_mul(current_liquidity_index))
    //     - (user_state
    //         .adjusted_balance
    //         .scaled_mul(user_state.index));

    // user_state.adjusted_balance += adjusted_amount + balance_increase;

    // user_state.index = current_liquidity_index;

    // ic_cdk::println!("updated user state value = {:?}", user_state);

    // let newmint: u128 = adjusted_amount as u128;

    // // Perform token transfer to the user with the newly minted aTokens
    // match asset_transfer(
    //     user_principal,
    //     token_canister_principal,
    //     platform_principal,
    //     Nat::from(newmint),
    // )
    // .await
    // {
    //     Ok(_) => {
    //         ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
    //         Ok(())
    //     }
    //     Err(err) => Err(format!("Minting failed. Error: {:?}", err)),
    // }
    let balance_result = get_balance(token_canister_principal, user_principal).await;
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            ic_cdk::println!("Error converting balance to u128: {:?}", err);
            return Err(Error::ErrorGetBalance);
        }
    };
    ic_cdk::println!("Fetched balance in Nat: {:?}", balance);

    //let balance = nat_to_u128(balance_nat).unwrap();
    ic_cdk::println!("mint balance = {}", balance);
    println!("Balance as u128: {}", balance);
    let mut balance_increase = Nat::from(0u128);
    if minting_dtoken {
        println!("minting dtoken**************");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.liquidity_index.clone())); //fetch from user
        println!("balance incr dtoken{}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.d_token_balance += adjusted_amount.clone();
        reserve.asset_supply += adjusted_amount;
        println!("updated asset supply{}", reserve.asset_supply);
        //TODO add adjusted_amount in reservedata asset_supply
        println!("user new dtoken balance {}", user_state.d_token_balance);
        user_state.liquidity_index = index;
        println!("user new liq index {}", user_state.liquidity_index);
    } else {
        println!("minting debttoken*************");
        balance_increase = (balance.clone().scaled_mul(index.clone()))
            - (balance
                .clone()
                .scaled_mul(user_state.variable_borrow_index.clone())); //fetch from user
        println!("balance incr debttoken{}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.debt_token_blance += adjusted_amount.clone();
        println!("new debt balance {}", user_state.debt_token_blance);
        reserve.asset_borrow += adjusted_amount;
        user_state.variable_borrow_index = index;
        println!("new debt index {}", user_state.variable_borrow_index);
    }

    //same
    //TODO add into total supply also
    //update balance with oldbalance +adjusted_amount
    // let _ = update_balance(token_canister_principal, user_principal, balance+adjusted_amount);
    // ic_cdk::println!("updated user state value = {:?}", user_state);

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

    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;

    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone(),
    ); //percent

    if vars.amount_to_mint != Nat::from(0u128) {
        reserve_data.accure_to_platform += (ScalingMath::scaled_mul(
            vars.amount_to_mint,
            reserve_cache.next_liquidity_index.clone(),
        )) / 100 as u128;
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
