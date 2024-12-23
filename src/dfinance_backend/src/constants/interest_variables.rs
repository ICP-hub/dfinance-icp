pub mod constants {

    pub const OPTIMAL_USAGE_RATIO: u128 = 45;
    pub const MAX_EXCESS_USAGE_RATIO: u128 = 55;
    pub const BASE_VARIABLE_BORROW_RATE: u128 = 0;
    pub const VARIABLE_RATE_SLOPE1: u128 = 4;
    pub const VARIABLE_RATE_SLOPE2: u128 = 30;

    pub const CKUSDC_OPTIMAL_USAGE_RATIO: u128 = 80;
    pub const CKUSDC_MAX_EXCESS_USAGE_RATIO: u128 = 20;
    pub const CKUSDC_VARIABLE_RATE_SLOPE2: u128 = 75;

    pub const CKUSDT_OPTIMAL_USAGE_RATIO: u128 = 92;
    pub const CKUSDT_MAX_EXCESS_USAGE_RATIO: u128 = 20;
    pub const CKUSDT_VARIABLE_RATE_SLOPE2: u128 = 75;

    pub const CKBTC_LIQUIDITY_INDEX: u128 = 1;
    pub const CKBTC_LTV: u128 = 73;
    pub const CKBTC_LIQUIDATION_THRESHOLD: u128 = 78;
    pub const CKBTC_LIQUIDATION_BONUS: u128 = 5;
    pub const CKBTC_BORROW_CAP: u128 = 10_000_000_000;
    pub const CKBTC_SUPPLY_CAP: u128 = 10_000_000_000;
    pub const CKBTC_RESERVE_FACTOR: u128 = 15;

    pub const CKETH_LIQUIDITY_INDEX: u128 = 1;
    pub const CKETH_LTV: u128 = 80;
    pub const CKETH_LIQUIDATION_THRESHOLD: u128 = 83;
    pub const CKETH_LIQUIDATION_BONUS: u128 = 5;
    pub const CKETH_BORROW_CAP: u128 = 10_000_000_000;
    pub const CKETH_SUPPLY_CAP: u128 = 10_000_000_000;
    pub const CKETH_RESERVE_FACTOR: u128 = 15;

    pub const CKUSDC_LIQUIDITY_INDEX: u128 = 1;
    pub const CKUSDC_LTV: u128 = 75;
    pub const CKUSDC_LIQUIDATION_THRESHOLD: u128 = 78;
    pub const CKUSDC_LIQUIDATION_BONUS: u128 = 5;
    pub const CKUSDC_BORROW_CAP: u128 = 10_000_000_000;
    pub const CKUSDC_SUPPLY_CAP: u128 = 10_000_000_000;
    pub const CKUSDC_RESERVE_FACTOR: u128 = 15;

    pub const ICP_LIQUIDITY_INDEX: u128 = 1;
    pub const ICP_LTV: u128 = 58;
    pub const ICP_LIQUIDATION_THRESHOLD: u128 = 63;
    pub const ICP_LIQUIDATION_BONUS: u128 = 0;
    pub const ICP_BORROW_CAP: u128 = 10_000_000_000;
    pub const ICP_SUPPLY_CAP: u128 = 10_000_000_000;
    pub const ICP_RESERVE_FACTOR: u128 = 15;

    pub const CKUSDT_LIQUIDITY_INDEX: u128 = 1;
    pub const CKUSDT_LTV: u128 = 75;
    pub const CKUSDT_LIQUIDATION_THRESHOLD: u128 = 78;
    pub const CKUSDT_LIQUIDATION_BONUS_1: u128 = 45;
    pub const CKUSDT_LIQUIDATION_BONUS_2: u128 = 10;
    pub const CKUSDT_BORROW_CAP: u128 = 10_000_000_000;
    pub const CKUSDT_SUPPLY_CAP: u128 = 10_000_000_000;
    pub const CKUSDT_RESERVE_FACTOR: u128 = 15;

    pub const  DEBT_INDEX : u128 = 100000000; //FIXME initial_debt_index
    pub const  PERCENTAGE_SCALE : u128 = 100000000; //FIXME yeh kya hai

}
