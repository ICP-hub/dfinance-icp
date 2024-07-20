use candid::candid_method;
use candid::types::number::Nat;
use ic_canister_log::{declare_log_buffer, export};
use ic_canisters_http_types::{HttpRequest, HttpResponse, HttpResponseBuilder};
use ic_cdk::api::stable::{StableReader, StableWriter};
use ic_cdk_macros::{export_candid, init, post_upgrade, pre_upgrade, query, update};
use ic_icrc1::{endpoints::convert_transfer_error, Operation, Transaction};
use ic_icrc1_ledger::{Ledger, LedgerArgument};
use ic_ledger_canister_core::ledger::{
    apply_transaction, archive_blocks, LedgerAccess, LedgerContext, LedgerData,
    TransferError as CoreTransferError,
};
use ic_ledger_canister_core::runtime::total_memory_size_bytes;
use ic_ledger_core::tokens::Zero;
use ic_ledger_core::{approvals::Approvals, timestamp::TimeStamp};
use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue as Value;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::Memo;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use num_traits::ToPrimitive;

use std::cell::RefCell;

const MAX_MESSAGE_SIZE: u64 = 1024 * 1024;

#[cfg(not(feature = "u256-tokens"))]
pub type Tokens = ic_icrc1_tokens_u64::U64;

#[cfg(feature = "u256-tokens")]
pub type Tokens = ic_icrc1_tokens_u256::U256;

thread_local! {
    static LEDGER: RefCell<Option<Ledger<Tokens>>> = const { RefCell::new(None) };
}

declare_log_buffer!(name = LOG, capacity = 1000);

struct Access;
impl LedgerAccess for Access {
    type Ledger = Ledger<Tokens>;

    fn with_ledger<R>(f: impl FnOnce(&Self::Ledger) -> R) -> R {
        LEDGER.with(|cell| {
            f(cell
                .borrow()
                .as_ref()
                .expect("ledger state not initialized"))
        })
    }

    fn with_ledger_mut<R>(f: impl FnOnce(&mut Self::Ledger) -> R) -> R {
        LEDGER.with(|cell| {
            f(cell
                .borrow_mut()
                .as_mut()
                .expect("ledger state not initialized"))
        })
    }
}

#[candid_method(init)]
#[init]
fn init(args: LedgerArgument) {
    match args {
        LedgerArgument::Init(init_args) => {
            let now = TimeStamp::from_nanos_since_unix_epoch(ic_cdk::api::time());
            LEDGER.with(|cell| {
                *cell.borrow_mut() = Some(Ledger::<Tokens>::from_init_args(&LOG, init_args, now))
            })
        }
        LedgerArgument::Upgrade(_) => {
            panic!("Cannot initialize the canister with an Upgrade argument. Please provide an Init argument.");
        }
    }
    ic_cdk::api::set_certified_data(&Access::with_ledger(Ledger::root_hash));
}

#[pre_upgrade]
fn pre_upgrade() {
    Access::with_ledger(|ledger| ciborium::ser::into_writer(ledger, StableWriter::default()))
        .expect("failed to encode ledger state");
}

#[post_upgrade]
fn post_upgrade(args: Option<LedgerArgument>) {
    LEDGER.with(|cell| {
        *cell.borrow_mut() = Some(
            ciborium::de::from_reader(StableReader::default())
                .expect("failed to decode ledger state"),
        );
    });

    if let Some(args) = args {
        match args {
            LedgerArgument::Init(_) => panic!("Cannot upgrade the canister with an Init argument. Please provide an Upgrade argument."),
            LedgerArgument::Upgrade(upgrade_args) => {
                if let Some(upgrade_args) = upgrade_args {
                    Access::with_ledger_mut(|ledger| ledger.upgrade(&LOG, upgrade_args));
                }
            }
        }
    }
}

fn encode_metrics(w: &mut ic_metrics_encoder::MetricsEncoder<Vec<u8>>) -> std::io::Result<()> {
    w.encode_gauge(
        "ledger_stable_memory_pages",
        ic_cdk::api::stable::stable_size() as f64,
        "Size of the stable memory allocated by this canister measured in 64K Wasm pages.",
    )?;
    w.encode_gauge(
        "ledger_stable_memory_bytes",
        (ic_cdk::api::stable::stable_size() * 64 * 1024) as f64,
        "Size of the stable memory allocated by this canister.",
    )?;
    w.encode_gauge(
        "ledger_total_memory_bytes",
        total_memory_size_bytes() as f64,
        "Total amount of memory (heap, stable memory, etc) that has been allocated by this canister.",
    )?;

    let cycle_balance = ic_cdk::api::canister_balance128() as f64;
    w.encode_gauge(
        "ledger_cycle_balance",
        cycle_balance,
        "Cycle balance on the ledger canister.",
    )?;
    w.gauge_vec("cycle_balance", "Cycle balance on the ledger canister.")?
        .value(&[("canister", "icrc1-ledger")], cycle_balance)?;

    Access::with_ledger(|ledger| {
        w.encode_gauge(
            "ledger_transactions_by_hash_cache_entries",
            ledger.transactions_by_hash().len() as f64,
            "Total number of entries in the transactions_by_hash cache.",
        )?;
        w.encode_gauge(
            "ledger_transactions_by_height_entries",
            ledger.transactions_by_height().len() as f64,
            "Total number of entries in the transaction_by_height queue.",
        )?;
        w.encode_gauge(
            "ledger_transactions",
            ledger.blockchain().blocks.len() as f64,
            "Total number of transactions stored in the main memory.",
        )?;
        w.encode_gauge(
            "ledger_archived_transactions",
            ledger.blockchain().num_archived_blocks as f64,
            "Total number of transactions sent to the archive.",
        )?;
        // The sum of the two gauges above. It is necessary to have this metric explicitly exported
        // in order to be able to accurately calculate the total transaction rate.
        w.encode_gauge(
            "ledger_total_transactions",
            ledger.blockchain().num_archived_blocks.saturating_add(ledger.blockchain().blocks.len() as u64) as f64,
            "Total number of transactions stored in the main memory, plus total number of transactions sent to the archive.",
        )?;
        let token_pool: Nat = ledger.balances().token_pool.into();
        w.encode_gauge(
            "ledger_balances_token_pool",
            token_pool.0.to_f64().unwrap_or(f64::INFINITY),
            "Total number of Tokens in the pool.",
        )?;
        let total_supply: Nat = ledger.balances().total_supply().into();
        w.encode_gauge(
            "ledger_total_supply",
            total_supply.0.to_f64().unwrap_or(f64::INFINITY),
            "Total number of tokens in circulation.",
        )?;
        w.encode_gauge(
            "ledger_balance_store_entries",
            ledger.balances().store.len() as f64,
            "Total number of accounts in the balance store.",
        )?;
        w.encode_gauge(
            "ledger_most_recent_block_time_seconds",
            (ledger
                .blockchain()
                .last_timestamp
                .as_nanos_since_unix_epoch()
                / 1_000_000_000) as f64,
            "IC timestamp of the most recent block.",
        )?;
        match ledger.blockchain().archive.read() {
            Ok(archive_guard) => {
                let num_archives = archive_guard
                    .as_ref()
                    .iter()
                    .fold(0, |sum, archive| sum + archive.nodes().iter().len());
                w.encode_counter(
                    "ledger_num_archives",
                    num_archives as f64,
                    "Total number of archives.",
                )?;
            }
            Err(err) => Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to read number of archives: {}", err),
            ))?,
        }
        w.encode_gauge(
            "ledger_num_approvals",
            ledger.approvals().get_num_approvals() as f64,
            "Total number of approvals.",
        )?;
        Ok(())
    })
}

#[query(hidden = true)]
fn http_request(req: HttpRequest) -> HttpResponse {
    if req.path() == "/metrics" {
        let mut writer =
            ic_metrics_encoder::MetricsEncoder::new(vec![], ic_cdk::api::time() as i64 / 1_000_000);

        match encode_metrics(&mut writer) {
            Ok(()) => HttpResponseBuilder::ok()
                .header("Content-Type", "text/plain; version=0.0.4")
                .with_body_and_content_length(writer.into_inner())
                .build(),
            Err(err) => {
                HttpResponseBuilder::server_error(format!("Failed to encode metrics: {}", err))
                    .build()
            }
        }
    } else if req.path() == "/logs" {
        use std::io::Write;
        let mut buf = vec![];
        for entry in export(&LOG) {
            writeln!(
                &mut buf,
                "{} {}:{} {}",
                entry.timestamp, entry.file, entry.line, entry.message
            )
            .unwrap();
        }
        HttpResponseBuilder::ok()
            .header("Content-Type", "text/plain; charset=utf-8")
            .with_body_and_content_length(buf)
            .build()
    } else {
        HttpResponseBuilder::not_found().build()
    }
}

#[query]
#[candid_method(query)]
fn icrc1_name() -> String {
    Access::with_ledger(|ledger| ledger.token_name().to_string())
}

#[query]
#[candid_method(query)]
fn icrc1_symbol() -> String {
    Access::with_ledger(|ledger| ledger.token_symbol().to_string())
}

#[query]
#[candid_method(query)]
fn icrc1_decimals() -> u8 {
    Access::with_ledger(|ledger| ledger.decimals())
}

#[query]
#[candid_method(query)]
fn icrc1_fee() -> Nat {
    Access::with_ledger(|ledger| ledger.transfer_fee().into())
}

#[query]
#[candid_method(query)]
fn icrc1_metadata() -> Vec<(String, Value)> {
    Access::with_ledger(|ledger| ledger.metadata())
}

#[query]
#[candid_method(query)]
fn icrc1_minting_account() -> Option<Account> {
    Access::with_ledger(|ledger| Some(*ledger.minting_account()))
}

#[query(name = "icrc1_balance_of")]
#[candid_method(query, rename = "icrc1_balance_of")]
fn icrc1_balance_of(account: Account) -> Nat {
    Access::with_ledger(|ledger| ledger.balances().account_balance(&account).into()) 
    //we can add the total interest accrued to this
}

#[query(name = "icrc1_total_supply")]
#[candid_method(query, rename = "icrc1_total_supply")]
fn icrc1_total_supply() -> Nat {
    Access::with_ledger(|ledger| ledger.balances().total_supply().into())
}

async fn execute_transfer(
    from_account: Account,
    to: Account,
    spender: Option<Account>,
    fee: Option<Nat>,
    amount: Nat,
    memo: Option<Memo>,
    created_at_time: Option<u64>,
) -> Result<Nat, CoreTransferError<Tokens>> {
    let block_idx = Access::with_ledger_mut(|ledger| {
        let now = TimeStamp::from_nanos_since_unix_epoch(ic_cdk::api::time());
        let created_at_time = created_at_time.map(TimeStamp::from_nanos_since_unix_epoch);

        match memo.as_ref() {
            Some(memo) if memo.0.len() > ledger.max_memo_length() as usize => {
                ic_cdk::trap(&format!(
                    "the memo field size of {} bytes is above the allowed limit of {} bytes",
                    memo.0.len(),
                    ledger.max_memo_length()
                ))
            }
            _ => {}
        };
        let amount = match Tokens::try_from(amount.clone()) {
            Ok(n) => n,
            Err(_) => {
                // No one can have so many tokens
                let balance_tokens = ledger.balances().account_balance(&from_account);
                let balance = Nat::from(balance_tokens);
                assert!(balance < amount);
                return Err(CoreTransferError::InsufficientFunds {
                    balance: balance_tokens,
                });
            }
        };

        let (tx, effective_fee) = if &to == ledger.minting_account() {
            let expected_fee = Tokens::zero();
            if fee.is_some() && fee.as_ref() != Some(&expected_fee.into()) {
                return Err(CoreTransferError::BadFee { expected_fee });
            }

            let balance = ledger.balances().account_balance(&from_account);
            let min_burn_amount = ledger.transfer_fee().min(balance);
            if amount < min_burn_amount {
                return Err(CoreTransferError::BadBurn { min_burn_amount });
            }
            if Tokens::is_zero(&amount) {
                return Err(CoreTransferError::BadBurn {
                    min_burn_amount: ledger.transfer_fee(),
                });
            }

            (
                Transaction {
                    operation: Operation::Burn {
                        from: from_account,
                        spender,
                        amount,
                    },
                    created_at_time: created_at_time.map(|t| t.as_nanos_since_unix_epoch()),
                    memo,
                },
                Tokens::zero(),
            )
        } else if &from_account == ledger.minting_account() {
            if spender.is_some() {
                ic_cdk::trap("the minter account cannot delegate mints")
            }
            let expected_fee = Tokens::zero();
            if fee.is_some() && fee.as_ref() != Some(&expected_fee.into()) {
                return Err(CoreTransferError::BadFee { expected_fee });
            }
            (
                Transaction::mint(to, amount, created_at_time, memo),
                Tokens::zero(),
            )
        } else {
            let expected_fee_tokens = ledger.transfer_fee();
            if fee.is_some() && fee.as_ref() != Some(&expected_fee_tokens.into()) {
                return Err(CoreTransferError::BadFee {
                    expected_fee: expected_fee_tokens,
                });
            }
            (
                Transaction::transfer(
                    from_account,
                    to,
                    spender,
                    amount,
                    fee.map(|_| expected_fee_tokens),
                    created_at_time,
                    memo,
                ),
                expected_fee_tokens,
            )
        };

        let (block_idx, _) = apply_transaction(ledger, tx, now, effective_fee)?;
        Ok(block_idx)
    })?;

    // NB. we need to set the certified data before the first async call to make sure that the
    // blockchain state agrees with the certificate while archiving is in progress.
    ic_cdk::api::set_certified_data(&Access::with_ledger(Ledger::root_hash));

    archive_blocks::<Access>(&LOG, MAX_MESSAGE_SIZE).await;
    Ok(Nat::from(block_idx))
}

#[update]
#[candid_method(update)]
async fn icrc1_transfer(arg: TransferArg, lock: bool) -> Result<Nat, TransferError> {
    if lock {
        return Err(TransferError::GenericError {
            message: "Transfers are currently locked.".to_string(),
            error_code: Nat::from(1u32),
        });
    }

    let from_account = Account {
        owner: ic_cdk::api::caller(),
        subaccount: arg.from_subaccount,
    };
    execute_transfer(
        from_account,
        arg.to,
        None,
        arg.fee,
        arg.amount,
        arg.memo,
        arg.created_at_time,
    )
    .await
    .map_err(convert_transfer_error)
    .map_err(|err| {
        let err: TransferError = match err.try_into() {
            Ok(err) => err,
            Err(err) => ic_cdk::trap(&err),
        };
        err
    })
}

export_candid!();

#[query]
fn __get_candid_interface_tmp_hack() -> String {
    __export_service()
}

fn main() {}

#[test]
fn check_candid_interface() {
    use candid_parser::utils::{service_equal, CandidSource};

    let new_interface = __export_service();
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let old_interface = manifest_dir.join("ledger.did");
    service_equal(
        CandidSource::Text(&new_interface),
        CandidSource::File(old_interface.as_path()),
    )
    .unwrap_or_else(|e| {
        panic!(
            "the ledger interface is not compatible with {}: {:?}",
            old_interface.display(),
            e
        )
    });
}
