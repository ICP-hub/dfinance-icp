pub mod constants {

    // ------------------- Interest Rate Constants -------------------
    pub const CKBTC_OPTIMAL_USAGE_RATIO: u128 = 45;
    pub const CKBTC_MAX_EXCESS_USAGE_RATIO: u128 = 55;
    pub const CKBTC_BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const CKBTC_VARIABLE_RATE_SLOPE1: u128 = 7;
    pub const CKBTC_VARIABLE_RATE_SLOPE2: u128 = 30;

    pub const CKETH_OPTIMAL_USAGE_RATIO: u128 = 45;
    pub const CKETH_MAX_EXCESS_USAGE_RATIO: u128 = 55;
    pub const CKETH_BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const CKETH_VARIABLE_RATE_SLOPE1: u128 = 7;
    pub const CKETH_VARIABLE_RATE_SLOPE2: u128 = 30;

    pub const ICP_OPTIMAL_USAGE_RATIO: u128 = 45;
    pub const ICP_MAX_EXCESS_USAGE_RATIO: u128 = 55;
    pub const ICP_BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const ICP_VARIABLE_RATE_SLOPE1: u128 = 7;
    pub const ICP_VARIABLE_RATE_SLOPE2: u128 = 30; 

    pub const CKUSDC_OPTIMAL_USAGE_RATIO: u128 = 90;
    pub const CKUSDC_MAX_EXCESS_USAGE_RATIO: u128 = 10;
    pub const CKUSDC_BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const CKUSDC_VARIABLE_RATE_SLOPE1: u128 = 4;
    pub const CKUSDC_VARIABLE_RATE_SLOPE2: u128 = 60;

    pub const CKUSDT_OPTIMAL_USAGE_RATIO: u128 = 90;
    pub const CKUSDT_MAX_EXCESS_USAGE_RATIO: u128 = 10;
    pub const CKUSDT_BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const CKUSDT_VARIABLE_RATE_SLOPE1: u128 = 4;
    pub const CKUSDT_VARIABLE_RATE_SLOPE2: u128 = 60;

    pub const OPTIMAL_USAGE_RATIO: u128 = 80;
    pub const MAX_EXCESS_USAGE_RATIO: u128 = 20;
    pub const BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const VARIABLE_RATE_SLOPE1: u128 = 4;
    pub const VARIABLE_RATE_SLOPE2: u128 = 75;

    // ------------------- Token canister Constants -------------------

    pub const DEFAULT_CYCLES: u128 = 900_000_000_000;
    pub const TRANSFER_FEE: u64 = 0;
    pub const DECIMALS: u8 = 8;
    pub const MAX_MEMO_LENGTH: u16 = 256;
    pub const MAX_NUMBER_OF_ACCOUNTS: u64 = 1000;
    pub const ACCOUNTS_OVERFLOW_TRIM_QUANTITY: u64 = 100;
    pub const NUM_BLOCKS_TO_ARCHIVE: usize = 1000;
    pub const TRIGGER_THRESHOLD: usize = 2000;
    pub const MAX_TRANSACTIONS_PER_RESPONSE: u64 = 200;
    pub const MAX_MESSAGE_SIZE_BYTES: u64 = 1024;
    pub const CYCLES_FOR_ARCHIVE_CREATION: u64 = 100_000_000_000;
    pub const NODE_MAX_MEMORY_SIZE_BYTES: u64 = 2000;

    // ------------------- Test Token Canister Constants -------------------

    pub const TEST_DEFAULT_CYCLES: u128 = 900_000_000_000;
    pub const TEST_TRANSFER_FEE: u64 = 0;
    pub const TEST_DECIMALS: u8 = 8;
    pub const TEST_MAX_MEMO_LENGTH: u16 = 256;
    pub const TEST_MAX_NUMBER_OF_ACCOUNTS: u64 = 1000;
    pub const TEST_ACCOUNTS_OVERFLOW_TRIM_QUANTITY: u64 = 100;
    pub const TEST_NUM_BLOCKS_TO_ARCHIVE: usize = 1000;
    pub const TEST_TRIGGER_THRESHOLD: usize = 2000;
    pub const TEST_MAX_TRANSACTIONS_PER_RESPONSE: u64 = 200;
    pub const TEST_MAX_MESSAGE_SIZE_BYTES: u64 = 1024;
    pub const TEST_CYCLES_FOR_ARCHIVE_CREATION: u64 = 100_000_000_000;
    pub const TEST_NODE_MAX_MEMORY_SIZE_BYTES: u64 = 2000;

    // ------------------- General Constants -------------------
    pub const INITIAL_DEBT_INDEX: u128 = 100000000;
    pub const SCALING_FACTOR: u128 = 100000000;
    pub const MIN_BORROW: u128 = 100;
}
