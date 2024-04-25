use crate::{types::*, with_state};
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};

use time::OffsetDateTime;

//global constant for utilization rate
pub const UTILIZATION_RATE: f64 = 0.5;

//global constant for interest rate
pub const INTEREST_RATE: f64 = 0.1;



//this function returns the current deposit
#[query]
pub fn get_current_deposist() -> f64 {
    let total_balance = {
        let total_deposits = with_state(|state| state.total_deposits);
        total_deposits
    };
    total_balance
}

//this function gets called internally to add total deposits per month
pub fn add_monthly_deposit(month: u32, amount: f64) {
    with_state(|state| {
        let current_deposit = state.total_deposit.entry(month).or_insert(0.0);
        *current_deposit += amount;
        state.total_deposits += amount;
    })
}

//this function is used to add deposits
#[update]
pub fn add_deposit(deposit: Deposit) -> String {
    let key = if cfg!(test) {
        Principal::anonymous() // Assume a default for tests
    } else {
        caller()
    };

    let now = if cfg!(test) {
        1609459200000 // Fixed time for tests
    } else {
        time()
    };
    let month_number = timestamp_to_month(now);

    //handle per user deposit
    with_state(|state| {
        let deposits_list = state.deposits.entry(key.clone()).or_insert_with(Vec::new);
        deposits_list.push(deposit.clone());
    });

    //handles monthly deposit
    add_monthly_deposit(month_number.clone(), deposit.amount);
    let total_balance = get_current_deposist();

    format!(
        "Added deposit for {} in the month of {}. Now total balance is {}",
        key, month_number, total_balance
    )
}

//this function gets called internally and is used to change timestamp into month
pub fn timestamp_to_month(timestamp_ns: u64) -> u32 {
    //ic_cdk::api::time() returns ns of timestamp
    let timestamp_s = timestamp_ns / 1_000_000_000;
    // core funtion here : from_unix_timestamp()
    let date = OffsetDateTime::from_unix_timestamp(timestamp_s as i64).unwrap();

    date.month() as u32
}

//this function returns the total amount available for borrowing
#[query]
pub fn amount_available_for_borrowing() -> f64 {
    let total_deposit = get_current_deposist();
    total_deposit * UTILIZATION_RATE
}

//for testing

#[cfg(test)]
mod test {
    use super::{add_deposit, amount_available_for_borrowing, get_current_deposist};
    use crate::types::*;

    #[test]
    fn check_add_deposit() {
        let new_deposit = Deposit {
            wallet_address: "12323232".to_string(),
            amount: 15000.0,
        };
        let result_message = add_deposit(new_deposit);
        println!("{}", result_message);
    }

    #[test]
    fn check_borrowing_amount() {
        let amount = amount_available_for_borrowing();
        println!("{}", amount)
    }

    #[test]
    fn check_current_deposit() {
        let amount = get_current_deposist();
        println!("{}", amount)
    }
}
