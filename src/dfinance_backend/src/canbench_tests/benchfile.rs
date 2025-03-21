use super::*;
use canbench_rs::bench;
use crate::protocol::libraries::logic::supply::*;
use crate::protocol::libraries::logic::borrow::*;
use crate::protocol::libraries::logic::user::{register_user, get_liquidation_users_concurrent};
use crate::api::functions::*;
use crate::{get_all_assets};
use candid::{Nat, Principal};
use ic_cdk::api;
use crate::constants::errors::Error;
use crate::declarations::assets::{
    ExecuteSupplyParams, 
    ExecuteWithdrawParams,
    ReserveData,
    ReserveConfiguration,
    ExecuteBorrowParams,
    ExecuteRepayParams,
};
use crate::constants::asset_data::*;

#[bench]
fn bench_get_liquidity_concurrent(){
    let total_pages = 4usize;
    let page_size = 50usize;
    ic_cdk::spawn(async move{
    let _result = get_liquidation_users_concurrent(total_pages.clone(), page_size.clone()).await;
    });
}

#[bench]
fn cycle_checker_bench() {
    ic_cdk::spawn(async {
        let result = cycle_checker().await;
        match result {
            Ok(balance) => ic_cdk::println!("Cycle balance: {:?}", balance),
            Err(e) => ic_cdk::println!("Error: {:?}", e),
        }
    });
}

#[bench]
fn initialize_bench() {
    ic_cdk::println!("Starting initialize benchmark");

    // 🔹 Define test input (token name + reserve data)
    let ICP_token_name = "ICP".to_string();
    let ICP_reserve_data = ReserveData {
        asset_name: Some(ICP_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(5800000000u128),
            liquidation_threshold: Nat::from(6300000000u128),
            liquidation_bonus: Nat::from(100000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, 
        accure_to_platform: Nat::from(0u128), 
    };

    ic_cdk::spawn(async {
        let result = initialize(ICP_token_name, ICP_reserve_data).await;
    
        match result {
            Ok(_) => ic_cdk::println!("initialize success"),
            Err(e) => ic_cdk::println!("initialize error: {:?}", e),
        }
    });
    

}
    
#[bench]
fn register_user_bench() {
    ic_cdk::println!("Starting register_user benchmark");

    let result = register_user();

    match result {
        Ok(message) => ic_cdk::println!("register_user success: {}", message),
        Err(e) => ic_cdk::println!("register_user error: {:?}", e),
    }
}


#[bench]
fn faucet_bench() {
    // Define test parameters
    let test_asset = "ICP".to_string();
    let test_amount = Nat::from(40000000u128);


    ic_cdk::spawn(async move{
        let result = faucet(test_asset.clone(), test_amount.clone()).await;
    
        // Log results
        match result {
            Ok(balance) => ic_cdk::println!("Faucet successful. New balance: {:?} ", balance),
            Err(e) => ic_cdk::println!("Faucet error: {:?} ", e),
        }
    });
}


#[bench]
fn execute_supply_bench() {

    // Define test parameters
    let params = ExecuteSupplyParams {
        asset: "ICP".to_string(),
        amount: Nat::from(40000000u128),
        is_collateral: true,
    };
    
    ic_cdk::spawn(async {
        // Call the execute_supply function
        let result = execute_supply( params).await;
    
        match result {
            Ok(balance) => {
                ic_cdk::println!("Benchmark executed successfully, new balance: {}", balance);
            }
            Err(e) => {
                ic_cdk::println!("Benchmark failed: {:?}", e);
            }
        }
    });
}

#[bench]
fn execute_borrow_bench() {

    // Define test parameters
    let borrow_params = ExecuteBorrowParams {
        asset: "ICP".to_string(),
        amount: Nat::from(10000000u128),
    };
    
    ic_cdk::spawn(async {
        // Call the execute_supply function
        let result = execute_borrow(borrow_params).await;
    
        match result {
            Ok(balance) => {
                ic_cdk::println!("Benchmark executed successfully, new balance: {}", balance);
            }
            Err(e) => {
                ic_cdk::println!("Benchmark failed: {:?}", e);
            }
        }
    });
}

#[bench]
fn execute_repay_bench() {

    // Define test parameters
    let repay_param = ExecuteRepayParams {
        asset: "ICP".to_string(),
        amount: Nat::from(10000000u128),
        on_behalf_of: None,
    };
    
    ic_cdk::spawn(async {
        // Call the execute_supply function
        let result = execute_repay(repay_param).await;
    
        match result {
            Ok(balance) => {
                ic_cdk::println!("Benchmark executed successfully, new balance: {}", balance);
            }
            Err(e) => {
                ic_cdk::println!("Benchmark failed: {:?}", e);
            }
        }
    });
}


#[bench]
fn execute_withdraw_bench() {

    // Define test parameters
    let withdraw_param = ExecuteWithdrawParams {
        asset: "ICP".to_string(),
        is_collateral: true,
        on_behalf_of: None,
        amount: Nat::from(40000000u128),
    };
    
    ic_cdk::spawn(async {
        // Call the execute_supply function
        let result = execute_withdraw(withdraw_param).await;
    
        match result {
            Ok(balance) => {
                ic_cdk::println!("Benchmark executed successfully, new balance: {}", balance);
            }
            Err(e) => {
                ic_cdk::println!("Benchmark failed: {:?}", e);
            }
        }
    });
}

fn process_numbers(count: usize) -> usize {
    
    let mut numbers = Vec::new();
    for i in 0..count {
        numbers.push(i);
    }
    numbers.len()  
}

#[bench]
fn process_numbers_bench() {
    let count = 10_000;
    let result = process_numbers(count);
    ic_cdk::println!("Benchmark result: {:?}", result);
}