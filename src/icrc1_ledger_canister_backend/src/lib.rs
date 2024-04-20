use candid::CandidType;
use candid::Deserialize;
use candid::Principal;
use ic_cdk::api::call::CallResult;
use ic_cdk::export_candid;

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[derive(CandidType, Deserialize, Debug)]
struct AllowanceArgs {
    account: Account,
    spender: Account,
}

#[derive(CandidType, Deserialize, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
struct Allowance {
    allowance: u128,
    expires_at: Option<u64>,
}

#[ic_cdk::update]
async fn deposit_to_smart_contract() -> Result<(TransferFromResult,), String> {
    let account = Account {
        owner: Principal::from_text(
            "b5p7m-si2ig-xo4us-iqu6c-q4rql-w6pfk-l6qat-wgmjf-id2av-z3te7-gqe",
        )
        .expect("Failed to parse principal"),
        subaccount: None,
    };

    let spender = Account {
        owner: Principal::from_text("bd3sg-teaaa-aaaaa-qaaba-cai")
            .expect("Failed to parse principal"),
        subaccount: None,
    };

    let args = AllowanceArgs { account, spender };

    match check_for_allowance(args).await {
        Ok(allowance) => {
            if !allowance.0.allowance <= 0 {
                return Err(format!("nothing in there in allowance"));
            } else {
                
                let from_account = Account {
                    owner: Principal::from_text("b5p7m-si2ig-xo4us-iqu6c-q4rql-w6pfk-l6qat-wgmjf-id2av-z3te7-gqe").expect("Failed to parse principal"),
                    subaccount: None,  // Not using a subaccount for this account
                };

                let to_account = Account {
                    owner: Principal::from_text("be2us-64aaa-aaaaa-qaabq-cai").unwrap(),  // Target account principal
                    subaccount: None,  // No subaccount specified
                };

                let transfer_amount = 1000u128;

                match transfer_bucks(from_account, to_account, transfer_amount).await {
                    Ok(transfer_result) => Ok(transfer_result),
                    Err(e) => Err(format!("Transfer failed: {:?}", e)),
                }
            }
            
        }
        Err(e) => Err(format!("Failed to fetch allowance: {:?}", e)),
    }
}

async fn check_for_allowance(args: AllowanceArgs) -> CallResult<(Allowance,)> {

    let result: CallResult<(Allowance,)> = ic_cdk::call(
        Principal::from_text("bkyz2-fmaaa-aaaaa-qaaaq-cai").unwrap(),
        "icrc2_allowance",
        (args,),
    )
    .await;
    ic_cdk::println!("{:?}", result);
    result
}

#[ic_cdk::update]
async fn transfer_bucks(from: Account, to: Account, amount: u128) -> CallResult<(TransferFromResult,)> {


    let transfer_args = TransferFromArgs {
        from,
        to,
        amount,
        fee: None,  // Assuming no fee is required
        memo: None,  // No memo provided
        created_at_time: None,  // No specific creation time
    };

    let canister_id = Principal::from_text("bkyz2-fmaaa-aaaaa-qaaaq-cai").unwrap();

    let result: CallResult<(TransferFromResult,)> =
        ic_cdk::call(canister_id, "icrc2_transfer_from", (transfer_args,)).await;
        ic_cdk::println!("{:?}", result);   

    result
}

export_candid!();

#[derive(CandidType, Deserialize)]
struct Subaccount(Vec<u8>);

#[derive(CandidType, Deserialize)]
struct TransferFromArgs {
    from: Account,
    to: Account,
    amount: u128,  // Using u128 for large number representation
    fee: Option<u128>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Debug)]
enum TransferFromError {
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
enum TransferFromResult {
    Ok(u128),  // Assuming `Ok` returns a block index
    Err(TransferFromError),
}


