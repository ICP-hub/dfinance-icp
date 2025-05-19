pub mod constants {
    use std::time::Duration;

    // ------------------- Token Constants -------------------
    pub const INITIAL_TEST_TOKEN_BALANCE: u128 = 100_000_000_000_000u128;
    pub const ZERO_VALUE: u128 = 0;
    pub const ONE_VALUE: u128 = 1;
    pub const TWO_VALUE: u128 = 2;
    pub const SCALING_FACTOR: u128 = 100_000_000; //This is 1*10^8
    pub const HEALTH_FACTOR_BARRIER: u128 = 100_000_000u128; // This is health factor 1 scaled with 10^8
    pub const TOLERANCE_FACTOR: u128 = 1_000;
    pub const PERCENTAGE_FACTOR: u128 = 100;

    // ------------------- Token Prices (Test Values) -------------------
    pub const TEST_CKBTC_PRICE: u128 = 10_934_116_666_666u128;
    pub const TEST_CKETH_PRICE: u128 = 302_148_333_333u128;
    pub const TEST_ICP_PRICE: u128 = 819_611_111u128;
    pub const TEST_CKUSDC_PRICE: u128 = 111_094_444u128;
    pub const TEST_CKUSDT_PRICE: u128 = 111_111_111u128;

    // ------------------- Faucet Constants -------------------
    pub const FAUCET_LIMIT: u128 = 50_000_000_000u128;

    // ------------------- Time Constants -------------------
    pub const WINDOW_SIZE_VAR: u64 = 60;
    pub const SECOND_PER_DAY: Duration = Duration::from_secs(86_400);
    pub const NANOS_PER_SECOND: u128 = 1_000_000_000u128;

    // ------------------- Request Limit Constants -------------------
    pub const REQUEST_LIMIT: usize = 5; // Maximum allowed requests within the defined time window

    // ------------------- Asset and Admin Constants -------------------
    pub const MAX_ASSET_LENGTH: usize = 7;
    pub const ADMIN: &str = "admin";
    pub const MAIN_CONTROLLER: &str = "main_controller";

    // ------------------- XRC Service Fee -------------------
    pub const XRC_CYCLES_FEE: u128 = 1_000_000_000u128;
    pub const XRC_CANISTER_NAME: &str = "xrc";

    // ------------------- Logs Constants -------------------
    pub const BATCH_SIZE: usize = 1000;
    pub const LOG_CANISTER_NAME: &str = "logs";
    pub const SECONDS_PER_DAY: u64 = 24 * 60 * 60;
    pub const LOGS_LIMIT: u64 = 1000u64;


    // ------------------- Token canister Constants -------------------

    pub const DEFAULT_CYCLES: u128 = 900_000_000_000;
    pub const TRANSFER_FEE: u64 = 0;
    pub const DECIMALS: u8 = 8;
    pub const MAX_MEMO_LENGTH: u16 = 256;
    pub const MAX_NUMBER_OF_ACCOUNTS: u64 = 1_000;
    pub const ACCOUNTS_OVERFLOW_TRIM_QUANTITY: u64 = 100;
    pub const NUM_BLOCKS_TO_ARCHIVE: usize = 1_000;
    pub const TRIGGER_THRESHOLD: usize = 2_000;
    pub const MAX_TRANSACTIONS_PER_RESPONSE: u64 = 200;
    pub const MAX_MESSAGE_SIZE_BYTES: u64 = 1024;
    pub const CYCLES_FOR_ARCHIVE_CREATION: u64 = 100_000_000_000;
    pub const NODE_MAX_MEMORY_SIZE_BYTES: u64 = 2_000;

    // ------------------- Test Token Canister Constants -------------------

    pub const TEST_DEFAULT_CYCLES: u128 = 900_000_000_000;
    pub const TEST_TRANSFER_FEE: u64 = 10;
    pub const TEST_DECIMALS: u8 = 8;
    pub const TEST_MAX_MEMO_LENGTH: u16 = 256;
    pub const TEST_MAX_NUMBER_OF_ACCOUNTS: u64 = 1_000;
    pub const TEST_ACCOUNTS_OVERFLOW_TRIM_QUANTITY: u64 = 100;
    pub const TEST_NUM_BLOCKS_TO_ARCHIVE: usize = 1_000;
    pub const TEST_TRIGGER_THRESHOLD: usize = 2_000;
    pub const TEST_MAX_TRANSACTIONS_PER_RESPONSE: u64 = 200;
    pub const TEST_MAX_MESSAGE_SIZE_BYTES: u64 = 1024;
    pub const TEST_CYCLES_FOR_ARCHIVE_CREATION: u64 = 100_000_000_000;
    pub const TEST_NODE_MAX_MEMORY_SIZE_BYTES: u64 = 2_000;

    // ------------------- General Constants -------------------
    pub const INITIAL_DEBT_INDEX: u128 = 100_000_000;
    pub const MIN_BORROW: u128 = 100;

    // -------------------Token Transfer Fees -------------------
    pub const TOKEN_TRANSFER_FEE: u128 = 345_000;


    // -------------------Max Value Constants -------------------
    pub const MAX_VALUE: u128 = 340_282_366_920_938_463_463_374_607_431_768_211_455u128;

    // -------------------Seconds Per Year Constants -------------------
    pub const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 365 days
                                                          //leap year calculation left
    // ------------------- Threshold limit Constants -------------------
    pub const CYCLE_EXHAUSTED_LIMIT: u128 = 5_000_000_000_000u128;
    pub const CYCLE_THRESHOLD_LIMIT: u128 = 7_000_000_000_000u128;

    pub const TOKEN_BALANCE_EXHAUSTED_LIMIT: u128 = 10_000u128;
    pub const TOKEN_BALANCE_THRESHOLD_LIMIT: u128 = 11_000u128;
}
