use std::f32::consts::E;

use candid::{Nat, Principal};
use ic_cdk::api::call;
use ic_cdk::update;
use icrc_ledger_types::icrc2::approve::{ApproveArgs, ApproveError};
use icrc_ledger_types::icrc1::account::Account;


use crate::api::functions::asset_transfer_from;
use crate::get_asset_principal;
use crate::guards::to_check_controller;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::declarations::assets::{
    AddPoolReply, SwapReply, SwapArgs, AddPoolArgs,
};
use crate::constants::errors::Error;


#[update]
pub async fn call_swap(from_token:String, to_token:String, amount:Nat , slippage_percent:u64) -> Result<SwapReply, Error> {
    let caller_id = ic_cdk::caller();
    let platform_principal = ic_cdk::api::id();

    // TODO: need to apply anonymous check now it not applied for testing purpose
    // if caller_id == Principal::anonymous() {
    //     ic_cdk::println!("Anonymous principals are not allowed");
    //     return Err("Anonymous principals are not allowed".to_string());
    // }
    // if !to_check_controller(){
    //     ic_cdk::println!("Only controller allowed");
    //     return Err(Error::ErrorNotController);
    // }
    // if caller_id != platform_principal {
    //     ic_cdk::println!("Only platform can call this function");
    //     return Err(Error::InvalidUser);
    // }

    
    let slippage_float:f64 = slippage_percent as f64;
    let kong_canister_id = Principal::from_text("2ipq2-uqaaa-aaaar-qailq-cai").unwrap();

    //TODO: This both will make dynamic by set_canister_id and get_canister_id function
    let from_token_ledger = if from_token == "ksUSDT" {
        Principal::from_text("zdzgz-siaaa-aaaar-qaiba-cai").unwrap()
    }else if from_token == "ksICP"{
        Principal::from_text("nppha-riaaa-aaaal-ajf2q-cai").unwrap()
    }else{
        ic_cdk::println!("Invalid token it must be either ksUSDT or ksICP");
        return Err(Error::InvalidVariableName);
    };

    let swap_args = SwapArgs {
        pay_token: from_token,
        pay_amount: amount.clone(),
        pay_tx_id: None,
        receive_token: to_token,
        receive_amount: None,
        receive_address: None,
        max_slippage: Some(slippage_float / 100.0),
        referred_by: None,
    };
    let approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: amount.clone() + Nat::from(10000u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        from_token_ledger,
        "icrc2_approve",
        (approve_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("Approve successful: {:?}", reply);
            // Ok(reply)
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("Approve failed: {:?}", err);
            return Err(Error::ICRC2ApproveError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
            return Err(Error::ICRC2ApproveError);
        }
    }
    let approve_args_if_swap_fails = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: Nat::from(0u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(SwapArgs,), (Result<SwapReply, String>,)>(
        kong_canister_id,
        "swap",
        (swap_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("Swap successful: {:?}", reply);
            return Ok(reply);
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("Swap failed: {}", err);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                from_token_ledger,
                "icrc2_approve",
                (approve_args_if_swap_fails.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("Approve successful: {:?}", reply);
                    // Ok(reply)
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
                }
            }
            return Err(Error::KongSwapError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("kongswap canister call failed ({}): {}", code as u64, msg);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                from_token_ledger,
                "icrc2_approve",
                (approve_args_if_swap_fails.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("Approve successful: {:?}", reply);
                    // Ok(reply)
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
                }
            }
            return Err(Error::KongSwapError);
        }
    }
}


#[update]
pub async fn call_swap_mainnet(from_token:String, to_token:String, amount:Nat , slippage_percent:u64) -> Result<SwapReply, Error> {
    let caller_id = ic_cdk::caller();
    let platform_principal = ic_cdk::api::id();

    // TODO: need to apply anonymous check now it not applied for testing purpose
    // if caller_id == Principal::anonymous() {
    //     ic_cdk::println!("Anonymous principals are not allowed");
    //     return Err("Anonymous principals are not allowed".to_string());
    // }
    // if !to_check_controller(){
    //     ic_cdk::println!("Only controller allowed");
    //     return Err(Error::ErrorNotController);
    // }

    let from_asset_principal = get_asset_principal(from_token.clone()).unwrap();
    let to_asset_principal = get_asset_principal(to_token.clone()).unwrap();
    
    let transfer_result = match asset_transfer_from(
        from_asset_principal,
        caller_id,
        platform_principal,
        amount.clone(),
    )
    .await {
        Ok(new_balance) => {
            ic_cdk::println!(
                "Asset transfer from user to backend executed successfully, new balance: {:?}",
                new_balance
            );
            Ok(new_balance)
        }
        Err(e) => {
            ic_cdk::println!("inside the error");
            Err(Error::TransferAssetError)
        }
    };
    if let Err(e) = &transfer_result {
        ic_cdk::println!("Returning error due to transfer failure: {:?}", e);
        return Err(Error::TransferAssetError);
    }

    let slippage_float:f64 = slippage_percent as f64;
    let kong_canister_id = Principal::from_text("2ipq2-uqaaa-aaaar-qailq-cai").unwrap();

    //TODO: This both will make dynamic by set_canister_id and get_canister_id function
    let from_token_ledger = if from_token == "ksUSDT" {
        Principal::from_text("zdzgz-siaaa-aaaar-qaiba-cai").unwrap()
    }else if from_token == "ksICP"{
        Principal::from_text("nppha-riaaa-aaaal-ajf2q-cai").unwrap()
    }else{
        ic_cdk::println!("Invalid token it must be either ksUSDT or ksICP");
        return Err(Error::InvalidVariableName);
    };

    let swap_args = SwapArgs {
        pay_token: from_token,
        pay_amount: amount.clone(),
        pay_tx_id: None,
        receive_token: to_token,
        receive_amount: None,
        receive_address: None,
        max_slippage: Some(slippage_float / 100.0),
        referred_by: None,
    };
    let approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: amount.clone() + Nat::from(10000u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        from_token_ledger,
        "icrc2_approve",
        (approve_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("Approve successful: {:?}", reply);
            // Ok(reply)
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("Approve failed: {:?}", err);
            return Err(Error::ICRC2ApproveError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
            return Err(Error::ICRC2ApproveError);
        }
    }
    let approve_args_if_swap_fails = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: Nat::from(0u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(SwapArgs,), (Result<SwapReply, String>,)>(
        kong_canister_id,
        "swap",
        (swap_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("Swap successful: {:?}", reply);
            return Ok(reply);
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("Swap failed: {}", err);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                from_token_ledger,
                "icrc2_approve",
                (approve_args_if_swap_fails.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("Approve successful: {:?}", reply);
                    // Ok(reply)
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
                }
            }
            return Err(Error::KongSwapError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("kongswap canister call failed ({}): {}", code as u64, msg);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                from_token_ledger,
                "icrc2_approve",
                (approve_args_if_swap_fails.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("Approve successful: {:?}", reply);
                    // Ok(reply)
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("approve Call failed ({}): {}", code as u64, msg);
                }
            }
            return Err(Error::KongSwapError);
        }
    }
}


#[update]
pub async fn add_pool_local(   // KongSwap canister
    primary_token: String,  // Token_0 symbol
    amount_0: Nat,                  // Amount of token_0 to add
    // amount_1: Nat,                  // Amount of token_1 to add
    secondary_token: String, // secondary token symbol
) -> Result< AddPoolReply, Error> {
    
    let caller_id = ic_cdk::caller();
    let platform_principal = ic_cdk::api::id();
    // TODO: need to apply anonymous check now it not applied for testing purpose
    // if caller_id == Principal::anonymous() {
    //     ic_cdk::println!("Anonymous principals are not allowed");
    //     return Err("Anonymous principals are not allowed".to_string());
    // }
    // if !to_check_controller(){
    //     ic_cdk::println!("Only controller allowed");
    //     return Err(Error::ErrorNotController);
    // }
    // if caller_id != platform_principal {
    //     ic_cdk::println!("Only platform can call this function");
    //     return Err(Error::InvalidUser);
    // }
    
    let kong_canister_id = Principal::from_text("2ipq2-uqaaa-aaaar-qailq-cai").unwrap();

    //TODO: this will be replaced with the DFIN ledger once it's set up
    let primary_ledger_id = match primary_token.as_str() {
        "ksBTC" => "zeyan-7qaaa-aaaar-qaibq-cai".to_string(),
        "ksICP" => "nppha-riaaa-aaaal-ajf2q-cai".to_string(),
        "ksUSDT" => "zdzgz-siaaa-aaaar-qaiba-cai".to_string(),
        "ksETH" => "zr7ra-6yaaa-aaaar-qaica-cai".to_string(),
        "ksKONG" => "o7oak-iyaaa-aaaaq-aadzq-cai".to_string(),
        _ => "not_found".to_string(),
    };

    let secondary_ledger_id = match secondary_token.as_str() {
        "ksICP" => "nppha-riaaa-aaaal-ajf2q-cai".to_string(),
        "ksUSDT" => "zdzgz-siaaa-aaaar-qaiba-cai".to_string(),
        _ => "not_found".to_string()
    };
    if secondary_ledger_id == "not_found"{
        ic_cdk::println!("Secondry token must either ksICP or ksUSDT");
        return Err(Error::InvalidVariableName);
    }
    //TODO: This value is price of 1 ksEth in ksICP here will be price of 1 DEFIN in ksICP or ksUSDT
    let ksETH_ksICP_price = Nat::from(181800000000u128);
    let ksETH_ksUSDT_price = Nat::from(245000000000u128);
    
    let scaled_amount_0: Nat = amount_0.clone();
    let scaled_amount_1 = amount_0.scaled_mul(ksETH_ksICP_price);

    // Constructing token_0 name string
    let token_0 = format!("IC.{}", primary_ledger_id);
    let token_1 = format!("IC.{}", secondary_ledger_id);


    let token0_approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: scaled_amount_0.clone()+ Nat::from(10000u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        Principal::from_text(primary_ledger_id.clone()).unwrap(),
        "icrc2_approve",
        (token0_approve_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("token_0 Approve successful: {:?}", reply);
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("token_0 Approve failed: {:?}", err);
            return Err(Error::ICRC2ApproveError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("token_0 approve Call failed ({}): {}", code as u64, msg);
            return Err(Error::ICRC2ApproveError);
        }
    }
    let token1_approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: scaled_amount_1.clone() + Nat::from(10000u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        Principal::from_text(secondary_ledger_id.clone()).unwrap(),
        "icrc2_approve",
        (token1_approve_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("token_1 Approve successful: {:?}", reply);
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("token_1 Approve failed: {:?}", err);
            return Err(Error::ICRC2ApproveError);
        }
        Err((code, msg)) => {
            ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
            return Err(Error::ICRC2ApproveError);
        }
    }
    // Step 2: Prepare AddPoolArgs
    let add_pool_args = AddPoolArgs {
        token_0, 
        amount_0: scaled_amount_0, 
        tx_id_0: None,
        token_1,                   
        amount_1: scaled_amount_1, 
        tx_id_1: None,
        lp_fee_bps: None,
        kong_fee_bps: None,
        on_kong: None,
    };
    let approve_args_if_addpool_fail = ApproveArgs{
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: Nat::from(0u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: kong_canister_id,
            subaccount: None,
        },
    };
    // Step 3: Call the inter-canister `add_pool` function on KongSwap
    match ic_cdk::call::<(AddPoolArgs,), (Result<AddPoolReply, String>,)>(
        kong_canister_id, 
        "add_pool", 
        (add_pool_args,)
    ).await {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("Addpool successful: {:?}", reply);
            Ok(reply)
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("Addpool failed: {:?}", err);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                Principal::from_text(primary_ledger_id.clone()).unwrap(),
                "icrc2_approve",
                (approve_args_if_addpool_fail.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("token_1 Approve successful: {:?}", reply);
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("token_1 Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
                }
            }
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                Principal::from_text(secondary_ledger_id.clone()).unwrap(),
                "icrc2_approve",
                (approve_args_if_addpool_fail.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("token_1 Approve successful: {:?}", reply);
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("token_1 Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
                }
            }
            Err(Error::AddPoolError)
        }
        Err((code, message)) => {
            let error_message = format!(
                "Failed to add liquidity to KongSwap. Error Code: {}, Message: {}",
                code as u32, message
            );
            ic_cdk::println!("{}", error_message);
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                Principal::from_text(primary_ledger_id.clone()).unwrap(),
                "icrc2_approve",
                (approve_args_if_addpool_fail.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("token_1 Approve successful: {:?}", reply);
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("token_1 Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
                }
            }
            match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
                Principal::from_text(secondary_ledger_id.clone()).unwrap(),
                "icrc2_approve",
                (approve_args_if_addpool_fail.clone(),),
            )
            .await
            {
                Ok((Ok(reply),)) => {
                    ic_cdk::println!("token_1 Approve successful: {:?}", reply);
                }
                Ok((Err(err),)) => {
                    ic_cdk::println!("token_1 Approve failed: {:?}", err);
                }
                Err((code, msg)) => {
                    ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
                }
            }
            Err(Error::AddPoolError) // Return error with additional details
        }
    }
}

async fn call_icrc2_approve(ledger_id:Principal,approve_args:ApproveArgs)->bool{
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        ledger_id,
        "icrc2_approve",
        (approve_args,),
    )
    .await
    {
        Ok((Ok(reply),)) => {
            ic_cdk::println!("token_1 Approve successful: {:?}", reply);
            return true;
        }
        Ok((Err(err),)) => {
            ic_cdk::println!("token_1 Approve failed: {:?}", err);
            return false;
        }
        Err((code, msg)) => {
            ic_cdk::println!("token_1 approve Call failed ({}): {}", code as u64, msg);
            return false;
        }
    }
}
