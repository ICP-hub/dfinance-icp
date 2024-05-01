use candid::Nat;

use crate::constants::ALLOWED_TOKENS;


use crate::types::{
    Account, Allowance, AllowanceArgs, LiquidityEvent, TransferArg, TransferFromArgs,
    TransferFromResult, TransferResult,
};

use crate::{caller, with_state, CallResult, Principal, time};

// #[ic_cdk::update]
pub async fn adding_liquidity_to_canister(
    token_name: String,
    amount: u128,
) -> Result<TransferFromResult, String> {
    let liquidity_provider = caller();

    let mut found_token = false;

    for token in ALLOWED_TOKENS {
        if token.name.to_string() == token_name {
            found_token = true;
            ic_cdk::println!("Allowed to provide liquidity");

            let account = Account {
                owner: liquidity_provider.clone(),
                subaccount: None,
            };

            let spender = Account {
                owner: Principal::from_text("bkyz2-fmaaa-aaaaa-qaaaq-cai")
                    .expect("Failed to parse principal"),
                subaccount: None,
            };

            let args = AllowanceArgs { account, spender };

            //let state = with_state(|state| state);

            return call_check_for_allowance_and_deposit(args, amount, token_name)
                .await;
        }
    }

    if !found_token {
        ic_cdk::println!("Liquidity is not being accepted for this given token");
        Err(format!("Token '{}' is not allowed", token_name))
    } else {
        Err("Unexpected error occurred".to_string())
    }

    // let provider = state.provider_deposits.entry(liquidy_provider).or_default();

    // let token_deposits = provider.entry(token_name.to_string()).or_default();

    // let liq_event = LiquidityEvent {
    //     token_amount: amount,
    //     timestamp: SystemTime::now(),
    // };

    // token_deposits.push(liq_event);
}

// #[ic_cdk::update]
pub async fn call_check_for_allowance_and_deposit(
    args: AllowanceArgs,
    amount: u128,
    token_name: String,
) -> Result<TransferFromResult, String> {
    let liquidity_provider = caller();

    match check_for_allowance(args.clone(), token_name.clone()).await {
        Ok(allowance) => {
            if allowance.allowance <= 0 {
                ic_cdk::println!("allowance amount : {}", allowance.allowance);

                return Err(format!(
                    "you seems not to be allowed to deposit tokens in liquidity pool"
                ));
            } else {
                let from_account = Account {
                    owner: args.account.owner.clone(),
                    subaccount: None,
                };

                let to_account = Account {
                    owner: Principal::from_text("bkyz2-fmaaa-aaaaa-qaaaq-cai").unwrap(), // stays specified
                    subaccount: None,
                };

                let transfer_amount = amount.clone();

                match transfer_bucks(
                    from_account.clone(),
                    to_account,
                    transfer_amount,
                    token_name.clone(),
                )
                .await
                {
                    Ok(transfer_result) => {
                        let mut provider_deposits = with_state(|state| state.provider_deposits.clone());

                        let provider = provider_deposits.entry(liquidity_provider).or_default();

                        let token_deposits = provider.entry(token_name.to_string()).or_default();

                        let liq_event = LiquidityEvent {
                            token_amount: amount,
                            timestamp: time(),
                        };

                        token_deposits.push(liq_event);

                        Ok(transfer_result)
                    }
                    Err(e) => Err(format!("Err calling tranfer bucks: {:?}", e)),
                }
            }
        }
        Err(e) => return Err(format!("Failed to fetch allowance: {:?}", e)),
    }
}

// #[ic_cdk::update]
async fn check_for_allowance(args: AllowanceArgs, token_name: String) -> Result<Allowance, String> {
    let canister_id = match token_name.as_str() {
        "ICP" => Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        "ckETH" => Principal::from_text("ss2fx-dyaaa-aaaar-qacoq-cai").unwrap(),
        "ckBTC" => Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai").unwrap(),
        "PANJABTOKEN" => Principal::from_text("br5f7-7uaaa-aaaaa-qaaca-cai").unwrap(),
        _ => return Err(format!("Unsupported token type: {}", token_name)),
    };

    ic_cdk::println!("canister id being used : {}", canister_id);

    let result: CallResult<(Allowance,)> =
        ic_cdk::call(canister_id, "icrc2_allowance", (args,)).await;

    match result {
        Ok(result) => Ok(result.0),
        Err(err) => Err(format!("Err while checking allowance {:?}", err)),
    }
}

// #[ic_cdk::update]
async fn transfer_bucks(
    from: Account,
    to: Account,
    amount: u128,
    token_name: String,
) -> Result<TransferFromResult, String> {
    let transfer_args = TransferFromArgs {
        from: from.clone(),
        to,
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let canister_id = match token_name.as_str() {
        "ICP" => Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        "ckETH" => Principal::from_text("ss2fx-dyaaa-aaaar-qacoq-cai").unwrap(),
        "ckBTC" => Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai").unwrap(),
        "PANJABTOKEN" => Principal::from_text("br5f7-7uaaa-aaaaa-qaaca-cai").unwrap(),
        _ => return Err(format!("Unsupported token type: {}", token_name)),
    };

    let result: CallResult<(TransferFromResult,)> =
        ic_cdk::call(canister_id, "icrc2_transfer_from", (transfer_args,)).await;

    match result {
        Ok(result) => {
            let lp_token_given =
                give_out_lp_tokens_to_liquidity_provider(token_name, amount, from.clone()).await;

            ic_cdk::println!(
                "status of the token provided to liquidity provider{:?}",
                lp_token_given
            );
            Ok(result.0)
        }
        Err(err) => Err(format!("Transfer failed: {:?}", err)),
    }
}

// #[ic_cdk::update]
async fn give_out_lp_tokens_to_liquidity_provider(
    token_name: String,
    amount: u128,
    sender: Account,
) -> Result<TransferResult, String> {
    //check which token they have deposited
    let dtoken_canister_id = match token_name.as_str() {
        "ICP" => Principal::from_text("xxx").unwrap(),
        "ckETH" => Principal::from_text("xxx").unwrap(),
        "ckBTC" => Principal::from_text("xxx").unwrap(),
        "PANJABTOKEN" => Principal::from_text("be2us-64aaa-aaaaa-qaabq-cai").unwrap(),
        _ => {
            return Err(format!(
                "We are currently not accepting liquidity for: {}",
                token_name
            ))
        }
    };

    //then give out the corresponding tokens
    let to = Account {
        owner: sender.owner,
        subaccount: None,
    };

    let transfer_args = TransferArg {
        to,
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: Nat::from(amount),
    };

    let result: CallResult<(TransferResult,)> =
        ic_cdk::call(dtoken_canister_id, "icrc1_transfer", (transfer_args,)).await;
    match result {
        Ok(result) => Ok(result.0),
        Err(e) => Err(format!("err accessing tuple element:{:?}", e)),
    }
}
