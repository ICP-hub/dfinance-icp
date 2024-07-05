// use ic_cdk::export::candid::{CandidType, Deserialize};
// use ic_cdk_macros::*;
// use std::cell::RefCell;
// use std::collections::HashMap;
// // mod protocol;
// use crate::protocol::libraries::types::ConfiguratorInputTypes::InitReserveInput;
// use protocol::libraries::logic::config_logic::ConfigLogic;
// // mod errors;
// // mod percentage_math;
// // mod data_types;
// // mod configurator_logic;
// // mod configurator_input_types;

// // use errors::Errors;
// // use percentage_math::PercentageMath;
// // use data_types::DataTypes;
// // use configurator_logic::ConfiguratorLogic;
// // use configurator_input_types::ConfiguratorInputTypes;

// thread_local! {
//     static ADDRESSES_PROVIDER: RefCell<Option<Principal>> = RefCell::new(None);
//     static POOL: RefCell<Option<Principal>> = RefCell::new(None);
//     static RESERVES: RefCell<HashMap<String, ReserveConfigurationMap>> = RefCell::new(HashMap::new());
// }



// #[init]
// fn initialize(provider: Principal) {
//     ADDRESSES_PROVIDER.with(|p| *p.borrow_mut() = Some(provider));
//     // Initialize POOL with the pool address from the provider
//     POOL.with(|p| *p.borrow_mut() = Some(get_pool_from_provider(provider)));
// }

// // #[update]
// // fn init_reserves(input: Vec<InitReserveInput>) {
// //     // Only allow asset listing or pool admins
// //     // Check for admin permissions 

// //     POOL.with(|p| {
// //         if let Some(pool) = *p.borrow() {
// //             for reserve_input in input {
// //                 ConfigLogic::execute_init_reserve(pool, reserve_input);
// //             }
// //         }
// //     });
// // }

// #[update]
// async fn init_reserves(input: Vec<InitReserveInput>) {
//     let caller = ic_cdk::caller();
//     if !is_asset_listing_or_pool_admin(&caller) {
//         ic_cdk::trap("Caller is not an asset listing or pool admin.");
//     }
//     protocol::libraries::logic::config_logic::POOL.with(|pool| {
//         let pool = pool.borrow();
//         for reserve in input {
//             ConfigLogic::execute_init_reserve(&pool, reserve);
//         }
//     });
// }
// //is_asset_listing_or_pool_admin func -> acl_manager? 


// #[update]
// fn drop_reserve(asset: String) {
//     // Only allow pool admin
//     // Check for admin permissions here

//     RESERVES.with(|reserves| {
//         reserves.borrow_mut().remove(&asset);
//     });

//     emit_reserve_dropped(asset);
// }

// #[update]
// fn update_a_token(input: UpdateATokenInput) {
//     // Only allow pool admin
//     // Check for admin permissions here

//     POOL.with(|p| {
//         if let Some(pool) = *p.borrow() {
//             execute_update_a_token(pool, input);
//         }
//     });
// }

// #[update]
// fn update_stable_debt_token(input: UpdateDebtTokenInput) {
//     // Only allow pool admin
//     // Check for admin permissions here

//     POOL.with(|p| {
//         if let Some(pool) = *p.borrow() {
//             execute_update_stable_debt_token(pool, input);
//         }
//     });
// }

// #[update]
// fn update_variable_debt_token(input: UpdateDebtTokenInput) {
//     // Only allow pool admin
//     // Check for admin permissions here

//     POOL.with(|p| {
//         if let Some(pool) = *p.borrow() {
//             execute_update_variable_debt_token(pool, input);
//         }
//     });
// }

// fn get_pool_from_provider(provider: Principal) -> Principal {
//     // Fetch the pool address from the provider
//     // Placeholder function, implement as needed
//     Principal::anonymous()
// }


use ic_cdk_macros::{query, update};
use ic_cdk::export::{candid::{CandidType, Deserialize, Principal}};
use serde::Serialize;
use std::vec::Vec;

use ipool::IPool;
use iinitializableatoken::IInitializableAToken;
use iinitializabledebttoken::IInitializableDebtToken;
use versioned_initializable::VersionedInitializable;
use reserve_configuration::ReserveConfiguration;
use ipool_addresses_provider::IPoolAddressesProvider;
use errors::Errors;
use percentage_math::PercentageMath;
use data_types::{DataTypes, ReserveConfigurationMap};
use configurator_logic::ConfiguratorLogic;
use configurator_input_types::{InitReserveInput, UpdateATokenInput, UpdateDebtTokenInput};
use iacl_manager::IACLManager;
use ipool_data_provider::IPoolDataProvider;

#[derive(CandidType, Serialize, Deserialize)]
pub struct PoolConfigurator {
    addresses_provider: Principal,
    pool: Principal,
}

impl PoolConfigurator {
    pub const CONFIGURATOR_REVISION: u64 = 0x1;

    #[query]
    pub fn get_revision(&self) -> u64 {
        Self::CONFIGURATOR_REVISION
    }

    #[update]
    pub async fn initialize(&mut self, provider: Principal) {
        self.addresses_provider = provider;
        self.pool = call!(provider, get_pool).await.unwrap().0;
    }

    #[update]
    pub async fn init_reserves(&self, input: Vec<InitReserveInput>) {
        self.only_asset_listing_or_pool_admins().await;
        let cached_pool = self.pool;
        for reserve_input in input {
            ConfiguratorLogic::execute_init_reserve(cached_pool, reserve_input).await;
        }
    }

    #[update]
    pub async fn drop_reserve(&self, asset: Principal) {
        self.only_pool_admin().await;
        call!(self.pool, drop_reserve, asset).await.unwrap();
        self.emit_reserve_dropped(asset).await;
    }

    #[update]
    pub async fn update_a_token(&self, input: UpdateATokenInput) {
        self.only_pool_admin().await;
        ConfiguratorLogic::execute_update_a_token(self.pool, input).await;
    }

    #[update]
    pub async fn update_stable_debt_token(&self, input: UpdateDebtTokenInput) {
        self.only_pool_admin().await;
        ConfiguratorLogic::execute_update_stable_debt_token(self.pool, input).await;
    }

    #[update]
    pub async fn update_variable_debt_token(&self, input: UpdateDebtTokenInput) {
        self.only_pool_admin().await;
        ConfiguratorLogic::execute_update_variable_debt_token(self.pool, input).await;
    }

    #[update]
    pub async fn set_reserve_borrowing(&self, asset: Principal, enabled: bool) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        if !enabled {
            assert!(
                !current_config.get_stable_rate_borrowing_enabled(),
                "{}",
                Errors::STABLE_BORROWING_ENABLED
            );
        }
        current_config.set_borrowing_enabled(enabled);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_borrowing(asset, enabled).await;
    }

    #[update]
    pub async fn configure_reserve_as_collateral(
        &self,
        asset: Principal,
        ltv: u64,
        liquidation_threshold: u64,
        liquidation_bonus: u64,
    ) {
        self.only_risk_or_pool_admins().await;
        assert!(ltv <= liquidation_threshold, "{}", Errors::INVALID_RESERVE_PARAMS);

        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;

        if liquidation_threshold != 0 {
            assert!(liquidation_bonus > PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::INVALID_RESERVE_PARAMS);
            assert!(
                liquidation_threshold.percent_mul(liquidation_bonus) <= PercentageMath::PERCENTAGE_FACTOR,
                "{}",
                Errors::INVALID_RESERVE_PARAMS
            );
        } else {
            assert!(liquidation_bonus == 0, "{}", Errors::INVALID_RESERVE_PARAMS);
            self.check_no_suppliers(asset).await;
        }

        current_config.set_ltv(ltv);
        current_config.set_liquidation_threshold(liquidation_threshold);
        current_config.set_liquidation_bonus(liquidation_bonus);

        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_collateral_configuration_changed(asset, ltv, liquidation_threshold, liquidation_bonus).await;
    }

    #[update]
    pub async fn set_reserve_stable_rate_borrowing(&self, asset: Principal, enabled: bool) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        if enabled {
            assert!(current_config.get_borrowing_enabled(), "{}", Errors::BORROWING_NOT_ENABLED);
        }
        current_config.set_stable_rate_borrowing_enabled(enabled);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_stable_rate_borrowing(asset, enabled).await;
    }

    #[update]
    pub async fn set_reserve_flash_loaning(&self, asset: Principal, enabled: bool) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        current_config.set_flash_loan_enabled(enabled);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_flash_loaning(asset, enabled).await;
    }

    #[update]
    pub async fn set_reserve_active(&self, asset: Principal, active: bool) {
        self.only_pool_admin().await;
        if !active {
            self.check_no_suppliers(asset).await;
        }
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        current_config.set_active(active);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_active(asset, active).await;
    }

    #[update]
    pub async fn set_reserve_freeze(&self, asset: Principal, freeze: bool) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        current_config.set_frozen(freeze);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_frozen(asset, freeze).await;
    }

    #[update]
    pub async fn set_borrowable_in_isolation(&self, asset: Principal, borrowable: bool) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        current_config.set_borrowable_in_isolation(borrowable);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_borrowable_in_isolation_changed(asset, borrowable).await;
    }

    #[update]
    pub async fn set_reserve_pause(&self, asset: Principal, paused: bool) {
        self.only_emergency_or_pool_admin().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        current_config.set_paused(paused);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_paused(asset, paused).await;
    }

    #[update]
    pub async fn set_reserve_factor(&self, asset: Principal, new_reserve_factor: u64) {
        self.only_risk_or_pool_admins().await;
        assert!(new_reserve_factor <= PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::INVALID_RESERVE_FACTOR);
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_reserve_factor = current_config.get_reserve_factor();
        current_config.set_reserve_factor(new_reserve_factor);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_reserve_factor_changed(asset, old_reserve_factor, new_reserve_factor).await;
    }

    #[update]
    pub async fn set_debt_ceiling(&self, asset: Principal, new_debt_ceiling: u64) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_debt_ceiling = current_config.get_debt_ceiling();
        if old_debt_ceiling == 0 {
            self.check_no_suppliers(asset).await;
        }
        current_config.set_debt_ceiling(new_debt_ceiling);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        if new_debt_ceiling == 0 {
            call!(self.pool, reset_isolation_mode_total_debt, asset).await.unwrap();
        }
        self.emit_debt_ceiling_changed(asset, old_debt_ceiling, new_debt_ceiling).await;
    }

    #[update]
    pub async fn set_siloed_borrowing(&self, asset: Principal, new_siloed: bool) {
        self.only_risk_or_pool_admins().await;
        if new_siloed {
            self.check_no_borrowers(asset).await;
        }
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_siloed = current_config.get_siloed_borrowing();
        current_config.set_siloed_borrowing(new_siloed);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_siloed_borrowing_changed(asset, old_siloed, new_siloed).await;
    }

    #[update]
    pub async fn set_borrow_cap(&self, asset: Principal, new_borrow_cap: u64) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_borrow_cap = current_config.get_borrow_cap();
        current_config.set_borrow_cap(new_borrow_cap);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_borrow_cap_changed(asset, old_borrow_cap, new_borrow_cap).await;
    }

    #[update]
    pub async fn set_supply_cap(&self, asset: Principal, new_supply_cap: u64) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_supply_cap = current_config.get_supply_cap();
        current_config.set_supply_cap(new_supply_cap);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_supply_cap_changed(asset, old_supply_cap, new_supply_cap).await;
    }

    #[update]
    pub async fn set_liquidation_protocol_fee(&self, asset: Principal, new_fee: u64) {
        self.only_risk_or_pool_admins().await;
        assert!(new_fee <= PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::INVALID_LIQUIDATION_PROTOCOL_FEE);
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_fee = current_config.get_liquidation_protocol_fee();
        current_config.set_liquidation_protocol_fee(new_fee);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_liquidation_protocol_fee_changed(asset, old_fee, new_fee).await;
    }

    #[update]
    pub async fn set_emode_category(
        &self,
        category_id: u8,
        ltv: u16,
        liquidation_threshold: u16,
        liquidation_bonus: u16,
        oracle: Principal,
        label: String,
    ) {
        self.only_risk_or_pool_admins().await;
        assert!(ltv != 0, "{}", Errors::INVALID_EMODE_CATEGORY_PARAMS);
        assert!(liquidation_threshold != 0, "{}", Errors::INVALID_EMODE_CATEGORY_PARAMS);
        assert!(ltv <= liquidation_threshold, "{}", Errors::INVALID_EMODE_CATEGORY_PARAMS);
        assert!(liquidation_bonus > PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::INVALID_EMODE_CATEGORY_PARAMS);
        assert!(
            (liquidation_threshold as u64).percent_mul(liquidation_bonus as u64) <= PercentageMath::PERCENTAGE_FACTOR,
            "{}",
            Errors::INVALID_EMODE_CATEGORY_PARAMS
        );

        let reserves: Vec<Principal> = call!(self.pool, get_reserves_list).await.unwrap().0;
        for reserve in reserves {
            let mut current_config = call!(self.pool, get_configuration, reserve).await.unwrap().0;
            if category_id == current_config.get_emode_category() {
                assert!(ltv > current_config.get_ltv(), "{}", Errors::INVALID_EMODE_CATEGORY_PARAMS);
                assert!(
                    liquidation_threshold > current_config.get_liquidation_threshold(),
                    "{}",
                    Errors::INVALID_EMODE_CATEGORY_PARAMS
                );
            }
        }

        call!(self.pool, configure_emode_category, category_id, DataTypes::EModeCategory {
            ltv,
            liquidation_threshold,
            liquidation_bonus,
            price_source: oracle,
            label,
        }).await.unwrap();

        self.emit_emode_category_added(category_id, ltv, liquidation_threshold, liquidation_bonus, oracle, label).await;
    }

    #[update]
    pub async fn set_asset_emode_category(&self, asset: Principal, new_category_id: u8) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;

        if new_category_id != 0 {
            let category_data = call!(self.pool, get_emode_category_data, new_category_id).await.unwrap().0;
            assert!(
                category_data.liquidation_threshold > current_config.get_liquidation_threshold(),
                "{}",
                Errors::INVALID_EMODE_CATEGORY_ASSIGNMENT
            );
        }
        let old_category_id = current_config.get_emode_category();
        current_config.set_emode_category(new_category_id);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_emode_asset_category_changed(asset, old_category_id, new_category_id).await;
    }

    #[update]
    pub async fn set_unbacked_mint_cap(&self, asset: Principal, new_unbacked_mint_cap: u64) {
        self.only_risk_or_pool_admins().await;
        let mut current_config = call!(self.pool, get_configuration, asset).await.unwrap().0;
        let old_unbacked_mint_cap = current_config.get_unbacked_mint_cap();
        current_config.set_unbacked_mint_cap(new_unbacked_mint_cap);
        call!(self.pool, set_configuration, asset, current_config).await.unwrap();
        self.emit_unbacked_mint_cap_changed(asset, old_unbacked_mint_cap, new_unbacked_mint_cap).await;
    }

    #[update]
    pub async fn set_reserve_interest_rate_strategy_address(&self, asset: Principal, new_rate_strategy_address: Principal) {
        self.only_risk_or_pool_admins().await;
        let reserve = call!(self.pool, get_reserve_data, asset).await.unwrap().0;
        let old_rate_strategy_address = reserve.interest_rate_strategy_address;
        call!(self.pool, set_reserve_interest_rate_strategy_address, asset, new_rate_strategy_address).await.unwrap();
        self.emit_reserve_interest_rate_strategy_changed(asset, old_rate_strategy_address, new_rate_strategy_address).await;
    }

    #[update]
    pub async fn set_pool_pause(&self, paused: bool) {
        self.only_emergency_admin().await;
        let reserves: Vec<Principal> = call!(self.pool, get_reserves_list).await.unwrap().0;

        for reserve in reserves {
            if reserve != Principal::anonymous() {
                self.set_reserve_pause(reserve, paused).await;
            }
        }
    }

    #[update]
    pub async fn update_bridge_protocol_fee(&self, new_bridge_protocol_fee: u64) {
        self.only_pool_admin().await;
        assert!(new_bridge_protocol_fee <= PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::BRIDGE_PROTOCOL_FEE_INVALID);
        let old_bridge_protocol_fee = call!(self.pool, get_bridge_protocol_fee).await.unwrap().0;
        call!(self.pool, update_bridge_protocol_fee, new_bridge_protocol_fee).await.unwrap();
        self.emit_bridge_protocol_fee_updated(old_bridge_protocol_fee, new_bridge_protocol_fee).await;
    }

    #[update]
    pub async fn update_flashloan_premium_total(&self, new_flashloan_premium_total: u128) {
        self.only_pool_admin().await;
        assert!(new_flashloan_premium_total <= PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::FLASHLOAN_PREMIUM_INVALID);
        let old_flashloan_premium_total = call!(self.pool, get_flashloan_premium_total).await.unwrap().0;
        call!(self.pool, update_flashloan_premiums, new_flashloan_premium_total, call!(self.pool, get_flashloan_premium_to_protocol).await.unwrap().0).await.unwrap();
        self.emit_flashloan_premium_total_updated(old_flashloan_premium_total, new_flashloan_premium_total).await;
    }

    #[update]
    pub async fn update_flashloan_premium_to_protocol(&self, new_flashloan_premium_to_protocol: u128) {
        self.only_pool_admin().await;
        assert!(new_flashloan_premium_to_protocol <= PercentageMath::PERCENTAGE_FACTOR, "{}", Errors::FLASHLOAN_PREMIUM_INVALID);
        let old_flashloan_premium_to_protocol = call!(self.pool, get_flashloan_premium_to_protocol).await.unwrap().0;
        call!(self.pool, update_flashloan_premiums, call!(self.pool, get_flashloan_premium_total).await.unwrap().0, new_flashloan_premium_to_protocol).await.unwrap();
        self.emit_flashloan_premium_to_protocol_updated(old_flashloan_premium_to_protocol, new_flashloan_premium_to_protocol).await;
    }

    async fn check_no_suppliers(&self, asset: Principal) {
        let (accrued_to_treasury, total_a_tokens, ..) = call!(self.pool, get_reserve_data, asset).await.unwrap().0;
        assert!(total_a_tokens == 0 && accrued_to_treasury == 0, "{}", Errors::RESERVE_LIQUIDITY_NOT_ZERO);
    }

    async fn check_no_borrowers(&self, asset: Principal) {
        let total_debt = call!(self.pool, get_total_debt, asset).await.unwrap().0;
        assert!(total_debt == 0, "{}", Errors::RESERVE_DEBT_NOT_ZERO);
    }

    async fn only_pool_admin(&self) {
        let acl_manager: Principal = call!(self.addresses_provider, get_acl_manager).await.unwrap().0;
        assert!(call!(acl_manager, is_pool_admin, ic_cdk::caller()).await.unwrap().0, "{}", Errors::CALLER_NOT_POOL_ADMIN);
    }

    async fn only_emergency_admin(&self) {
        let acl_manager: Principal = call!(self.addresses_provider, get_acl_manager).await.unwrap().0;
        assert!(call!(acl_manager, is_emergency_admin, ic_cdk::caller()).await.unwrap().0, "{}", Errors::CALLER_NOT_EMERGENCY_ADMIN);
    }

    async fn only_pool_or_emergency_admin(&self) {
        let acl_manager: Principal = call!(self.addresses_provider, get_acl_manager).await.unwrap().0;
        let is_pool_admin = call!(acl_manager, is_pool_admin, ic_cdk::caller()).await.unwrap().0;
        let is_emergency_admin = call!(acl_manager, is_emergency_admin, ic_cdk::caller()).await.unwrap().0;
        assert!(is_pool_admin || is_emergency_admin, "{}", Errors::CALLER_NOT_POOL_OR_EMERGENCY_ADMIN);
    }

    async fn only_asset_listing_or_pool_admins(&self) {
        let acl_manager: Principal = call!(self.addresses_provider, get_acl_manager).await.unwrap().0;
        let is_asset_listing_admin = call!(acl_manager, is_asset_listing_admin, ic_cdk::caller()).await.unwrap().0;
        let is_pool_admin = call!(acl_manager, is_pool_admin, ic_cdk::caller()).await.unwrap().0;
        assert!(is_asset_listing_admin || is_pool_admin, "{}", Errors::CALLER_NOT_ASSET_LISTING_OR_POOL_ADMIN);
    }

    async fn only_risk_or_pool_admins(&self) {
        let acl_manager: Principal = call!(self.addresses_provider, get_acl_manager).await.unwrap().0;
        let is_risk_admin = call!(acl_manager, is_risk_admin, ic_cdk::caller()).await.unwrap().0;
        let is_pool_admin = call!(acl_manager, is_pool_admin, ic_cdk::caller()).await.unwrap().0;
        assert!(is_risk_admin || is_pool_admin, "{}", Errors::CALLER_NOT_RISK_OR_POOL_ADMIN);
    }

    // Emit events
    async fn emit_reserve_dropped(&self, asset: Principal) {
        ic_cdk::api::print(format!("ReserveDropped event: {:?}", asset));
    }

    async fn emit_reserve_borrowing(&self, asset: Principal, enabled: bool) {
        ic_cdk::api::print(format!("ReserveBorrowing event: {:?}, {}", asset, enabled));
    }

    async fn emit_collateral_configuration_changed(&self, asset: Principal, ltv: u64, liquidation_threshold: u64, liquidation_bonus: u64) {
        ic_cdk::api::print(format!("CollateralConfigurationChanged event: {:?}, {}, {}, {}", asset, ltv, liquidation_threshold, liquidation_bonus));
    }

    async fn emit_reserve_stable_rate_borrowing(&self, asset: Principal, enabled: bool) {
        ic_cdk::api::print(format!("ReserveStableRateBorrowing event: {:?}, {}", asset, enabled));
    }

    async fn emit_reserve_flash_loaning(&self, asset: Principal, enabled: bool) {
        ic_cdk::api::print(format!("ReserveFlashLoaning event: {:?}, {}", asset, enabled));
    }

    async fn emit_reserve_active(&self, asset: Principal, active: bool) {
        ic_cdk::api::print(format!("ReserveActive event: {:?}, {}", asset, active));
    }

    async fn emit_reserve_frozen(&self, asset: Principal, freeze: bool) {
        ic_cdk::api::print(format!("ReserveFrozen event: {:?}, {}", asset, freeze));
    }

    async fn emit_borrowable_in_isolation_changed(&self, asset: Principal, borrowable: bool) {
        ic_cdk::api::print(format!("BorrowableInIsolationChanged event: {:?}, {}", asset, borrowable));
    }

    async fn emit_reserve_paused(&self, asset: Principal, paused: bool) {
        ic_cdk::api::print(format!("ReservePaused event: {:?}, {}", asset, paused));
    }

    async fn emit_reserve_factor_changed(&self, asset: Principal, old_reserve_factor: u64, new_reserve_factor: u64) {
        ic_cdk::api::print(format!("ReserveFactorChanged event: {:?}, {}, {}", asset, old_reserve_factor, new_reserve_factor));
    }

    async fn emit_debt_ceiling_changed(&self, asset: Principal, old_debt_ceiling: u64, new_debt_ceiling: u64) {
        ic_cdk::api::print(format!("DebtCeilingChanged event: {:?}, {}, {}", asset, old_debt_ceiling, new_debt_ceiling));
    }

    async fn emit_siloed_borrowing_changed(&self, asset: Principal, old_siloed: bool, new_siloed: bool) {
        ic_cdk::api::print(format!("SiloedBorrowingChanged event: {:?}, {}, {}", asset, old_siloed, new_siloed));
    }

    async fn emit_borrow_cap_changed(&self, asset: Principal, old_borrow_cap: u64, new_borrow_cap: u64) {
        ic_cdk::api::print(format!("BorrowCapChanged event: {:?}, {}, {}", asset, old_borrow_cap, new_borrow_cap));
    }

    async fn emit_supply_cap_changed(&self, asset: Principal, old_supply_cap: u64, new_supply_cap: u64) {
        ic_cdk::api::print(format!("SupplyCapChanged event: {:?}, {}, {}", asset, old_supply_cap, new_supply_cap));
    }

    async fn emit_liquidation_protocol_fee_changed(&self, asset: Principal, old_fee: u64, new_fee: u64) {
        ic_cdk::api::print(format!("LiquidationProtocolFeeChanged event: {:?}, {}, {}", asset, old_fee, new_fee));
    }

    async fn emit_emode_category_added(&self, category_id: u8, ltv: u16, liquidation_threshold: u16, liquidation_bonus: u16, oracle: Principal, label: String) {
        ic_cdk::api::print(format!("EModeCategoryAdded event: {}, {}, {}, {}, {:?}, {}", category_id, ltv, liquidation_threshold, liquidation_bonus, oracle, label));
    }

    async fn emit_emode_asset_category_changed(&self, asset: Principal, old_category_id: u8, new_category_id: u8) {
        ic_cdk::api::print(format!("EModeAssetCategoryChanged event: {:?}, {}, {}", asset, old_category_id, new_category_id));
    }

    async fn emit_unbacked_mint_cap_changed(&self, asset: Principal, old_unbacked_mint_cap: u64, new_unbacked_mint_cap: u64) {
        ic_cdk::api::print(format!("UnbackedMintCapChanged event: {:?}, {}, {}", asset, old_unbacked_mint_cap, new_unbacked_mint_cap));
    }

    async fn emit_reserve_interest_rate_strategy_changed(&self, asset: Principal, old_rate_strategy_address: Principal, new_rate_strategy_address: Principal) {
        ic_cdk::api::print(format!("ReserveInterestRateStrategyChanged event: {:?}, {:?}, {:?}", asset, old_rate_strategy_address, new_rate_strategy_address));
    }

    async fn emit_bridge_protocol_fee_updated(&self, old_bridge_protocol_fee: u64, new_bridge_protocol_fee: u64) {
        ic_cdk::api::print(format!("BridgeProtocolFeeUpdated event: {}, {}", old_bridge_protocol_fee, new_bridge_protocol_fee));
    }

    async fn emit_flashloan_premium_total_updated(&self, old_flashloan_premium_total: u128, new_flashloan_premium_total: u128) {
        ic_cdk::api::print(format!("FlashloanPremiumTotalUpdated event: {}, {}", old_flashloan_premium_total, new_flashloan_premium_total));
    }

    async fn emit_flashloan_premium_to_protocol_updated(&self, old_flashloan_premium_to_protocol: u128, new_flashloan_premium_to_protocol: u128) {
        ic_cdk::api::print(format!("FlashloanPremiumToProtocolUpdated event: {}, {}", old_flashloan_premium_to_protocol, new_flashloan_premium_to_protocol));
    }
}


