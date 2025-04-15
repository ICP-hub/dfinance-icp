pub mod constants {
    use std::time::Duration;

    pub const INITIAL_TEST_TOKEN_BALANCE: u128 = 100_000_000_000_000u128;
    pub const REQUEST_LIMIT: u32 = 100;// Maximum allowed requests within the defined time window
    pub const TIME_WINDOW: u64 = 3600; // Time window in seconds (one hour)
    pub const BLOCK_DURATION: u64 = 43200; // Block duration in seconds (12 hours = 43200 seconds)
    pub const ZERO_VALUE: u128 = 0;
    pub const ONE_VALUE: u128 = 1;
    pub const TWO_VALUE: u128 = 2;
    pub const TOLERANCE_FACTOR: u128 = 1000;
    pub const MIN_UNIT: u128 = 10;
    pub const PERCENTAGE_FACTOR : u128 = 100;
    pub const SCALING_FACTOR : u128 = 100_000_000;   //This is 1*10^8
    pub const HEALTH_FACTOR_BARRIER : u128 = 100_000_000u128;  // This is health factor 1 scaled with 10^8
    pub const TEST_CKBTC_PRICE: u128 = 10934116666666u128;
    pub const TEST_CKETH_PRICE: u128 = 302148333333u128;
    pub const TEST_ICP_PRICE: u128 = 819611111u128;
    pub const TEST_CKUSDC_PRICE: u128 = 111094444u128;
    pub const TEST_CKUSDT_PRICE: u128 = 111111111u128;
    pub const NANOS_PER_SECOND: u128 = 1_000_000_000u128;
    pub const FAUCET_LIMIT : u128 = 50000000000u128;
    pub const ONE_DAY: Duration = Duration::from_secs(86400);
}