use std::thread::current;

use crate::{
    api::*,
    math::{lending_borrowing::*, timing::*},
};
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};

pub const BORROW_APR: f64 = INTEREST_RATE;

pub const DFINANCE_PRICE: f64 = 0.01;
pub const DFINANCE_GROWTH_RATE: f64 = 0.1;
pub const DEPOSIT_GROWTH_RATE: f64 = 1.0;
pub const DECAY_FACTOR: f64 = 0.35;

pub const EMISSIONS: usize = 2000000;

#[query]
pub fn fees_generated() -> f64 {
    let fees_generated = ((INTEREST_RATE * amount_available_for_borrowing()) / 12.0) * 1.0;

    fees_generated
}

#[query]
pub fn get_lender_fees() -> f64 {
    let current_phase = get_current_phase();
    let mut lender_fees = 0.0;
    if current_phase == 1 {
        lender_fees = fees_generated() * 0.85;
    } else if current_phase == 2 || current_phase == 3 {
        lender_fees = get_rewards_value() * 0.3;
    }
    lender_fees
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_lp_fees() -> f64 {
    let current_phase = get_current_phase();
    let mut lp_fees = 0.0;
    if current_phase == 2 || current_phase == 3 {
        lp_fees = get_rewards_value() * 0.7;
    }
    lp_fees
}

#[query]
pub fn get_team_fees() -> f64 {
    let current_phase = get_current_phase();
    let mut team_fees = 0.0;
    if current_phase == 1 {
        team_fees = fees_generated() * 0.15;
    } else if current_phase == 2 || current_phase == 3 {
        team_fees = fees_generated() * 0.10;
    }

    team_fees
}

#[query]
pub fn get_lending_apr() -> f64 {
    let lending_apr = (get_lender_fees() / get_current_deposist()) * 12.0;

    lending_apr
}

//phase 2 and 3

#[query]
pub fn get_current_dfinance_price() -> f64 {
    let current_price = DFINANCE_PRICE * (1.0 + (DFINANCE_GROWTH_RATE * get_total_months() as f64));
    current_price
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_monthly_emission() -> f64 {
    let monthly_emissions = get_current_dfinance_price() * EMISSIONS as f64;
    monthly_emissions
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_rewards_value() -> f64 {
    let current_phase = get_current_phase();
    let mut rewards = 0.0;
    if current_phase == 2 || current_phase == 3 {
        rewards = fees_generated() * 0.85;
    }
    rewards
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_buy_and_burn() -> f64 {
    let current_phase = get_current_phase();
    let mut buy_and_burn = 0.0;
    if current_phase == 2 || current_phase == 3 {
        buy_and_burn = fees_generated() * 0.05;
    }
    buy_and_burn
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_borrow_lp_yield() -> f64 {
    let borrow_lp_yield =
        (get_rewards_for_borrowers() * 12.0) / (amount_available_for_borrowing() * 0.3);
    borrow_lp_yield
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_lender_lp_yield() -> f64 {
    let lender_lp_yield = (get_rewards_for_lenders() * 12.0) / (get_current_deposist() * 0.3);
    lender_lp_yield
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_rewards_for_lenders() -> f64 {
    let reward = (get_monthly_emission() * (1.0 - UTILIZATION_RATE))
        + (get_lp_fees() * (1.0 - UTILIZATION_RATE));
    reward
}

#[query(guard = "is_phase2_or_phase3_active")]
pub fn get_rewards_for_borrowers() -> f64 {
    let reward = (get_monthly_emission() * UTILIZATION_RATE) + (get_lp_fees() * UTILIZATION_RATE);
    reward
}

#[query]
pub fn get_current_growth_rate() -> f64 {
    let growth_rate = DEPOSIT_GROWTH_RATE / (1.0 + (DECAY_FACTOR * get_total_months() as f64));
    growth_rate
}
