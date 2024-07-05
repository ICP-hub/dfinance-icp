// SPDX-License-Identifier: BUSL-1.1

use crate::data_types::*;
use crate::reserve_configuration::*;
use crate::safe_cast::*;
use crate::user_configuration::*;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

/// Implements the base logic for handling repayments for assets borrowed in isolation mode
pub struct IsolationModeLogic;

impl IsolationModeLogic {
    pub fn update_isolated_debt_if_isolated(
        reserves_data: &RefCell<HashMap<Principal, ReserveData>>,
        reserves_list: &RefCell<HashMap<u32, Principal>>,
        user_config: &mut UserConfigurationMap,
        reserve_cache: &ReserveCache,
        repay_amount: u64,
    ) {
        let (isolation_mode_active, isolation_mode_collateral_address, _) =
            user_config.get_isolation_mode_state(reserves_data, reserves_list);

        if isolation_mode_active {
            let isolation_mode_total_debt = reserves_data
                .borrow()
                .get(&isolation_mode_collateral_address)
                .map(|data| data.isolation_mode_total_debt)
                .unwrap_or(0);

            let isolated_debt_repaid = (repay_amount as u128)
                .checked_div(10u128.pow(
                    (reserve_cache.reserve_configuration.get_decimals() - DEBT_CEILING_DECIMALS)
                        as u32,
                ))
                .unwrap_or(0)
                .to_u128();

            if isolation_mode_total_debt <= isolated_debt_repaid {
                reserves_data
                    .borrow_mut()
                    .get_mut(&isolation_mode_collateral_address)
                    .map(|data| {
                        data.isolation_mode_total_debt = 0;
                    });
                emit_isolation_mode_total_debt_updated(isolation_mode_collateral_address, 0);
            } else {
                let next_isolation_mode_total_debt =
                    isolation_mode_total_debt - isolated_debt_repaid;
                reserves_data
                    .borrow_mut()
                    .get_mut(&isolation_mode_collateral_address)
                    .map(|data| {
                        data.isolation_mode_total_debt = next_isolation_mode_total_debt as u64;
                    });
                emit_isolation_mode_total_debt_updated(
                    isolation_mode_collateral_address,
                    next_isolation_mode_total_debt as u64,
                );
            }
        }
    }
}

fn emit_isolation_mode_total_debt_updated(asset: Principal, total_debt: u64) {
    // Event emission logic (printing to console for simplicity)
    println!(
        "IsolationModeTotalDebtUpdated: asset = {:?}, total_debt = {:?}",
        asset, total_debt
    );
}

// Helper method to convert u128 to u64 safely (to mimic SafeCast in Solidity)
pub trait ToU128 {
    fn to_u128(&self) -> u128;
}

impl ToU128 for u64 {
    fn to_u128(&self) -> u128 {
        *self as u128
    }
}

// Definitions for data_types, reserve_configuration, user_configuration, and safe_cast modules

pub const DEBT_CEILING_DECIMALS: u8 = 18;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveData {
    pub isolation_mode_total_debt: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveConfigurationMap;

impl ReserveConfigurationMap {
    pub fn get_decimals(&self) -> u8 {
        18 // Example implementation
    }
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct ReserveCache {
    pub reserve_configuration: ReserveConfigurationMap,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UserConfigurationMap;

impl UserConfigurationMap {
    pub fn get_isolation_mode_state(
        &mut self,
        reserves_data: &RefCell<HashMap<Principal, ReserveData>>,
        reserves_list: &RefCell<HashMap<u32, Principal>>,
    ) -> (bool, Principal, u8) {
        (true, Principal::anonymous(), 0) // Example implementation
    }
}
