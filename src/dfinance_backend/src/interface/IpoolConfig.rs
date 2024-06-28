
mod configurator_input_types;
use configurator_input_types::{InitReserveInput, UpdateATokenInput, UpdateDebtTokenInput};
use ic_cdk::export::candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};


#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct EModeCategory {
    pub category_id: u8,
    pub ltv: u256,
    pub liquidation_threshold: u256,
    pub liquidation_bonus: u256,
    pub oracle: Principal,
    pub label: String,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveInterestRateStrategyChange {
    pub asset: Principal,
    pub old_strategy: Principal,
    pub new_strategy: Principal,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveUpgraded {
    pub asset: Principal,
    pub proxy: Principal,
    pub implementation: Principal,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveFactorChange {
    pub asset: Principal,
    pub old_reserve_factor: u256,
    pub new_reserve_factor: u256,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct CapChange {
    pub asset: Principal,
    pub old_cap: u256,
    pub new_cap: u256,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct FlashloanPremiumChange {
    pub old_premium: u128,
    pub new_premium: u128,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct BorrowableInIsolationChange {
    pub asset: Principal,
    pub borrowable: bool,
}

pub trait IPoolConfigurator {
    fn init_reserves(&self, input: Vec<InitReserveInput>);
    fn update_a_token(&self, input: UpdateATokenInput);
    fn update_stable_debt_token(&self, input: UpdateDebtTokenInput);
    fn update_variable_debt_token(&self, input: UpdateDebtTokenInput);
    fn set_reserve_borrowing(&self, asset: Principal, enabled: bool);
    fn configure_reserve_as_collateral(&self, asset: Principal, ltv: u256, liquidation_threshold: u256, liquidation_bonus: u256);
    fn set_reserve_stable_rate_borrowing(&self, asset: Principal, enabled: bool);
    fn set_reserve_flash_loaning(&self, asset: Principal, enabled: bool);
    fn set_reserve_active(&self, asset: Principal, active: bool);
    fn set_reserve_freeze(&self, asset: Principal, freeze: bool);
    fn set_borrowable_in_isolation(&self, asset: Principal, borrowable: bool);
    fn set_reserve_pause(&self, asset: Principal, paused: bool);
    fn set_reserve_factor(&self, asset: Principal, new_reserve_factor: u256);
    fn set_reserve_interest_rate_strategy_address(&self, asset: Principal, new_rate_strategy_address: Principal);
    fn set_pool_pause(&self, paused: bool);
    fn set_borrow_cap(&self, asset: Principal, new_borrow_cap: u256);
    fn set_supply_cap(&self, asset: Principal, new_supply_cap: u256);
    fn set_liquidation_protocol_fee(&self, asset: Principal, new_fee: u256);
    fn set_unbacked_mint_cap(&self, asset: Principal, new_unbacked_mint_cap: u256);
    fn set_asset_e_mode_category(&self, asset: Principal, new_category_id: u8);
    fn set_e_mode_category(&self, category_id: u8, ltv: u256, liquidation_threshold: u256, liquidation_bonus: u256, oracle: Principal, label: String);
    fn drop_reserve(&self, asset: Principal);
    fn update_bridge_protocol_fee(&self, new_bridge_protocol_fee: u256);
    fn update_flashloan_premium_total(&self, new_flashloan_premium_total: u128);
    fn update_flashloan_premium_to_protocol(&self, new_flashloan_premium_to_protocol: u128);
    fn set_debt_ceiling(&self, asset: Principal, new_debt_ceiling: u256);
    fn set_siloed_borrowing(&self, asset: Principal, siloed: bool);
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub enum IPoolConfiguratorEvent {
    ReserveInitialized {
        asset: Principal,
        a_token: Principal,
        stable_debt_token: Principal,
        variable_debt_token: Principal,
        interest_rate_strategy_address: Principal,
    },
    ReserveBorrowing {
        asset: Principal,
        enabled: bool,
    },
    ReserveFlashLoaning {
        asset: Principal,
        enabled: bool,
    },
    CollateralConfigurationChanged {
        asset: Principal,
        ltv: u256,
        liquidation_threshold: u256,
        liquidation_bonus: u256,
    },
    ReserveStableRateBorrowing {
        asset: Principal,
        enabled: bool,
    },
    ReserveActive {
        asset: Principal,
        active: bool,
    },
    ReserveFrozen {
        asset: Principal,
        frozen: bool,
    },
    ReservePaused {
        asset: Principal,
        paused: bool,
    },
    ReserveDropped {
        asset: Principal,
    },
    ReserveFactorChanged(ReserveFactorChange),
    BorrowCapChanged(CapChange),
    SupplyCapChanged(CapChange),
    LiquidationProtocolFeeChanged(CapChange),
    UnbackedMintCapChanged(CapChange),
    EModeAssetCategoryChanged {
        asset: Principal,
        old_category_id: u8,
        new_category_id: u8,
    },
    EModeCategoryAdded(EModeCategory),
    ReserveInterestRateStrategyChanged(ReserveInterestRateStrategyChange),
    ATokenUpgraded(ReserveUpgraded),
    StableDebtTokenUpgraded(ReserveUpgraded),
    VariableDebtTokenUpgraded(ReserveUpgraded),
    DebtCeilingChanged(CapChange),
    SiloedBorrowingChanged {
        asset: Principal,
        old_state: bool,
        new_state: bool,
    },
    BridgeProtocolFeeUpdated(CapChange),
    FlashloanPremiumTotalUpdated(FlashloanPremiumChange),
    FlashloanPremiumToProtocolUpdated(FlashloanPremiumChange),
    BorrowableInIsolationChanged(BorrowableInIsolationChange),
}
