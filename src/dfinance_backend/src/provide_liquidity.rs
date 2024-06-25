use std::clone;

use candid::CandidType;
use candid::Deserialize;
use candid::Nat;
use candid::Principal;
use ic_cdk::api::call::CallResult;
use serde_bytes::ByteBuf;

#[derive(CandidType, Deserialize, Debug)]
struct AllowedTokens {
    name: &'static str,
    canister_id: &'static str,
}

const ALLOWED_TOKENS: &[AllowedTokens] = &[
    AllowedTokens {
        name: "ICP",
        canister_id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    },
    AllowedTokens {
        name: "ckETH",
        canister_id: "ss2fx-dyaaa-aaaar-qacoq-cai",
    },
    AllowedTokens {
        name: "ckBTC",
        canister_id: "mxzaz-hqaaa-aaaar-qaada-cai",
    },
    AllowedTokens {
        name: "PANJABTOKENS",
        canister_id: "mxzaz-hqaaa-aaaar-qaada-cai",
    },
];

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct AllowanceArgs {
    account: Account,
    spender: Account,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Allowance {
    allowance: u128,
    expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    from: Account,
    to: Account,
    amount: u128, // Using u128 for large number representation
    fee: Option<u128>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromError {
    BadFee { expected_fee: u128 },
    BadBurn { min_burn_amount: u128 },
    InsufficientFunds { balance: u128 },
    InsufficientAllowance { allowance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: u128 },
    TemporarilyUnavailable,
    GenericError { error_code: u128, message: String },
}
#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(u128), // Assuming `Ok` returns a block index
    Err(TransferFromError),
}

#[ic_cdk::update]
async fn check_for_allowance(args: AllowanceArgs, token_name: String) -> Result<Allowance, String> {
    let canister_id = match token_name.as_str() {
        "ICP" => Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        "ckETH" => Principal::from_text("ss2fx-dyaaa-aaaar-qacoq-cai").unwrap(),
        "ckBTC" => Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai").unwrap(),
        "PANJABTOKENS" => Principal::from_text("cbopz-duaaa-aaaaa-qaaka-cai").unwrap(),
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

#[ic_cdk::update]
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
        "PANJABTOKENS" => Principal::from_text("cbopz-duaaa-aaaaa-qaaka-cai").unwrap(),
        _ => return Err(format!("Unsupported token type: {}", token_name)),
    };

    let result: CallResult<(TransferFromResult,)> =
        ic_cdk::call(canister_id, "icrc2_transfer_from", (transfer_args,)).await;

    match result {
        Ok(result) => {
            let lp_token_given = give_out_lp_tokens_to_liquidity_provider(token_name, amount, from.clone()).await;

            ic_cdk::println!("status of the token provided to liquidity provider{:?}", lp_token_given);
            Ok(result.0)
        }
        Err(err) => Err(format!("Transfer failed: {:?}", err)),
    }
}

async fn give_out_lp_tokens_to_liquidity_provider(token_name: String, amount: u128, sender : Account) -> Result<TransferResult, String>{
    //check which token they have deposited
    let dtoken_canister_id = match token_name.as_str() {
        "ICP" => Principal::from_text("xxx").unwrap(),
        "ckETH" => Principal::from_text("xxx").unwrap(),
        "ckBTC" => Principal::from_text("xxx").unwrap(),
        "PANJABTOKENS" => Principal::from_text("cgpjn-omaaa-aaaaa-qaakq-cai").unwrap(),
        _ => return Err(format!("We are currently not accepting liquidity for: {}", token_name))
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

    let result: CallResult<(TransferResult,)> = ic_cdk::call(dtoken_canister_id, "icrc1_transfer", (transfer_args,)).await;
    match result{
        Ok(result)=> {
            Ok(result.0)
        }
        Err(e) =>{
            Err(format!("err accessing tuple element:{:?}", e))
        }
    
    }
}

#[derive(CandidType, Deserialize)]
pub struct TransferArg {
    to: Account,
    fee: Option<Nat>,
    memo: Option<ByteBuf>,
    from_subaccount: Option<ByteBuf>,
    created_at_time: Option<u64>,
    amount: Nat,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferResult {
    Ok(Nat),
    Err(String),
}


#[ic_cdk::update]
async fn provide_liquidity(
    token_name: String,
    amount: u128,
    liquidity_provider: Principal,
) -> Result<TransferFromResult, String> {
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
                owner: Principal::from_text("aovwi-4maaa-aaaaa-qaagq-cai")
                    .expect("Failed to parse principal"),
                subaccount: None,
            };

            let args = AllowanceArgs { account, spender };

            // Assuming call_check_for_allowance_and_deposit is implemented correctly
            return call_check_for_allowance_and_deposit(args, amount, token_name).await;
        }
    }

    if !found_token {
        ic_cdk::println!("Liquidity is not being accepted for this given token");
        Err(format!("Token '{}' is not allowed", token_name))
    } else {
        // If somehow it goes through without triggering any of the above, ensure you return an error or Ok
        Err("Unexpected error occurred".to_string())
    }
}

async fn call_check_for_allowance_and_deposit(
    args: AllowanceArgs,
    amount: u128,
    token_name: String,
) -> Result<TransferFromResult, String> {
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
                    owner: Principal::from_text("be2us-64aaa-aaaaa-qaabq-cai").unwrap(), // stays specified
                    subaccount: None,
                };

                let transfer_amount = amount;

                match transfer_bucks(
                    from_account.clone(),
                    to_account,
                    transfer_amount,
                    token_name.clone(),
                )
                .await
                {
                    Ok(transfer_result) => Ok(transfer_result),
                    Err(e) => Err(format!("Err calling tranfer bucks: {:?}", e)),
                }
            }
        }
        Err(e) => return Err(format!("Failed to fetch allowance: {:?}", e)),
    }
}
