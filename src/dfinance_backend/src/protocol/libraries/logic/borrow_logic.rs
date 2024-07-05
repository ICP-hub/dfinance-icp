use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use crate::events::*;
use crate::interfaces::*;
use crate::isolation_mode_logic::*;
use crate::protocol::libraries::helpers::*;
use crate::protocol::libraries::{
    configuration::user_configuration::*,
    helpers::errors::*,
    logic::{reserve_logic::*, validation_logic::*},
    math::{percentage::PercentageMath, wadray::WadRayMath},
    types::datatypes::*,
};
use crate::validation_logic::*;

pub struct BorrowLogic {
    reserves_data: RefCell<HashMap<Principal, ReserveData>>,
    reserves_list: RefCell<HashMap<u64, Principal>>,
    e_mode_categories: RefCell<HashMap<u8, EModeCategory>>,
    user_config: RefCell<UserConfigurationMap>,
}

impl BorrowLogic {
    pub fn new() -> Self {
        Self {
            reserves_data: RefCell::new(HashMap::new()),
            reserves_list: RefCell::new(HashMap::new()),
            e_mode_categories: RefCell::new(HashMap::new()),
            user_config: RefCell::new(UserConfigurationMap::new()),
        }
    }

    pub fn execute_borrow(&self, params: ExecuteBorrowParams) {
        let mut reserves_data = self.reserves_data.borrow_mut();
        let mut reserve = reserves_data.get_mut(&params.asset).unwrap();
        let mut reserve_cache = reserve.cache();

        reserve.update_state(&reserve_cache);

        let (isolation_mode_active, isolation_mode_collateral_address, isolation_mode_debt_ceiling) =
            self.user_config
                .borrow()
                .get_isolation_mode_state(&reserves_data, &self.reserves_list.borrow());

        ValidationLogic::validate_borrow(
            &reserves_data,
            &self.reserves_list.borrow(),
            &self.e_mode_categories.borrow(),
            ValidateBorrowParams {
                reserve_cache: &reserve_cache,
                user_config: &self.user_config.borrow(),
                asset: params.asset,
                user_address: params.on_behalf_of,
                amount: params.amount,
                interest_rate_mode: params.interest_rate_mode,
                max_stable_loan_percent: params.max_stable_rate_borrow_size_percent,
                reserves_count: params.reserves_count,
                oracle: params.oracle,
                user_e_mode_category: params.user_e_mode_category,
                price_oracle_sentinel: params.price_oracle_sentinel,
                isolation_mode_active,
                isolation_mode_collateral_address,
                isolation_mode_debt_ceiling,
            },
        );

        let mut current_stable_rate = 0;
        let mut is_first_borrowing = false;

        if params.interest_rate_mode == InterestRateMode::Stable {
            current_stable_rate = reserve.current_stable_borrow_rate;

            let result = IStableDebtToken::mint(
                &reserve_cache.stable_debt_token_address,
                params.user,
                params.on_behalf_of,
                params.amount,
                current_stable_rate,
            );

            is_first_borrowing = result.0;
            reserve_cache.next_total_stable_debt = result.1;
            reserve_cache.next_avg_stable_borrow_rate = result.2;
        } else {
            let result = IVariableDebtToken::mint(
                &reserve_cache.variable_debt_token_address,
                params.user,
                params.on_behalf_of,
                params.amount,
                reserve_cache.next_variable_borrow_index,
            );

            is_first_borrowing = result.0;
            reserve_cache.next_scaled_variable_debt = result.1;
        }

        if is_first_borrowing {
            self.user_config
                .borrow_mut()
                .set_borrowing(reserve.id, true);
        }

        if isolation_mode_active {
            let next_isolation_mode_total_debt = reserves_data
                .get_mut(&isolation_mode_collateral_address)
                .unwrap()
                .isolation_mode_total_debt += (params.amount
                / 10_u64.pow(
                    reserve_cache.reserve_configuration.get_decimals()
                        - ReserveConfiguration::DEBT_CEILING_DECIMALS,
                ))
                as u128;

            let event = IsolationModeTotalDebtUpdatedEvent {
                asset: isolation_mode_collateral_address,
                total_debt: next_isolation_mode_total_debt,
            };
            ic_cdk::println!("{:?}", event);
        }

        reserve.update_interest_rates(
            &reserve_cache,
            params.asset,
            0,
            if params.release_underlying {
                params.amount
            } else {
                0
            },
        );

        if params.release_underlying {
            IAToken::transfer_underlying_to(
                &reserve_cache.a_token_address,
                params.user,
                params.amount,
            );
        }

        let event = BorrowEvent {
            reserve: params.asset,
            user: params.user,
            on_behalf_of: params.on_behalf_of,
            amount: params.amount,
            interest_rate_mode: params.interest_rate_mode as u8,
            borrow_rate: if params.interest_rate_mode == InterestRateMode::Stable {
                current_stable_rate
            } else {
                reserve.current_variable_borrow_rate
            },
            referral_code: params.referral_code,
        };
        ic_cdk::println!("{:?}", event);
    }

    pub fn execute_repay(&self, params: ExecuteRepayParams) -> u64 {
        let mut reserves_data = self.reserves_data.borrow_mut();
        let mut reserve = reserves_data.get_mut(&params.asset).unwrap();
        let mut reserve_cache = reserve.cache();
        reserve.update_state(&reserve_cache);

        let (stable_debt, variable_debt) =
            Helpers::get_user_current_debt(params.on_behalf_of, &reserve_cache);

        ValidationLogic::validate_repay(
            &reserve_cache,
            params.amount,
            params.interest_rate_mode,
            params.on_behalf_of,
            stable_debt,
            variable_debt,
        );

        let mut payback_amount = if params.interest_rate_mode == InterestRateMode::Stable {
            stable_debt
        } else {
            variable_debt
        };

        if params.use_a_tokens && params.amount == u64::MAX {
            params.amount = IAToken::balance_of(&reserve_cache.a_token_address, ic_cdk::caller());
        }

        if params.amount < payback_amount {
            payback_amount = params.amount;
        }

        if params.interest_rate_mode == InterestRateMode::Stable {
            let result = IStableDebtToken::burn(
                &reserve_cache.stable_debt_token_address,
                params.on_behalf_of,
                payback_amount,
            );

            reserve_cache.next_total_stable_debt = result.0;
            reserve_cache.next_avg_stable_borrow_rate = result.1;
        } else {
            reserve_cache.next_scaled_variable_debt = IVariableDebtToken::burn(
                &reserve_cache.variable_debt_token_address,
                params.on_behalf_of,
                payback_amount,
                reserve_cache.next_variable_borrow_index,
            );
        }

        reserve.update_interest_rates(
            &reserve_cache,
            params.asset,
            if params.use_a_tokens {
                0
            } else {
                payback_amount
            },
            0,
        );

        if stable_debt + variable_debt - payback_amount == 0 {
            self.user_config
                .borrow_mut()
                .set_borrowing(reserve.id, false);
        }

        IsolationModeLogic::update_isolated_debt_if_isolated(
            &mut reserves_data,
            &self.reserves_list.borrow(),
            &self.user_config.borrow(),
            &reserve_cache,
            payback_amount,
        );

        if params.use_a_tokens {
            IAToken::burn(
                &reserve_cache.a_token_address,
                ic_cdk::caller(),
                reserve_cache.a_token_address,
                payback_amount,
                reserve_cache.next_liquidity_index,
            );
        } else {
            GPv2SafeERC20::safe_transfer_from(
                &params.asset,
                ic_cdk::caller(),
                &reserve_cache.a_token_address,
                payback_amount,
            );
            IAToken::handle_repayment(
                &reserve_cache.a_token_address,
                ic_cdk::caller(),
                params.on_behalf_of,
                payback_amount,
            );
        }

        let event = RepayEvent {
            reserve: params.asset,
            user: params.on_behalf_of,
            repayer: ic_cdk::caller(),
            amount: payback_amount,
            use_a_tokens: params.use_a_tokens,
        };
        ic_cdk::println!("{:?}", event);

        payback_amount
    }

    pub fn execute_rebalance_stable_borrow_rate(
        &self,
        reserve: &mut ReserveData,
        asset: Principal,
        user: Principal,
    ) {
        let mut reserve_cache = reserve.cache();
        reserve.update_state(&reserve_cache);

        ValidationLogic::validate_rebalance_stable_borrow_rate(reserve, &reserve_cache, asset);

        let stable_debt_token = IStableDebtToken::new(&reserve_cache.stable_debt_token_address);
        let stable_debt = IERC20::balance_of(&stable_debt_token, user);

        stable_debt_token.burn(user, stable_debt);

        let result =
            stable_debt_token.mint(user, user, stable_debt, reserve.current_stable_borrow_rate);

        reserve_cache.next_total_stable_debt = result.1;
        reserve_cache.next_avg_stable_borrow_rate = result.2;

        reserve.update_interest_rates(&reserve_cache, asset, 0, 0);

        let event = RebalanceStableBorrowRateEvent {
            reserve: asset,
            user,
        };
        ic_cdk::println!("{:?}", event);
    }

    pub fn execute_swap_borrow_rate_mode(
        &self,
        reserve: &mut ReserveData,
        user_config: &mut UserConfigurationMap,
        asset: Principal,
        interest_rate_mode: InterestRateMode,
    ) {
        let mut reserve_cache = reserve.cache();
        reserve.update_state(&reserve_cache);

        let (stable_debt, variable_debt) =
            Helpers::get_user_current_debt(ic_cdk::caller(), &reserve_cache);

        ValidationLogic::validate_swap_rate_mode(
            reserve,
            &reserve_cache,
            user_config,
            stable_debt,
            variable_debt,
            interest_rate_mode,
        );

        if interest_rate_mode == InterestRateMode::Stable {
            let result = IStableDebtToken::burn(
                &reserve_cache.stable_debt_token_address,
                ic_cdk::caller(),
                stable_debt,
            );

            reserve_cache.next_total_stable_debt = result.0;
            reserve_cache.next_avg_stable_borrow_rate = result.1;

            let result = IVariableDebtToken::mint(
                &reserve_cache.variable_debt_token_address,
                ic_cdk::caller(),
                ic_cdk::caller(),
                stable_debt,
                reserve_cache.next_variable_borrow_index,
            );

            reserve_cache.next_scaled_variable_debt = result.1;
        } else {
            reserve_cache.next_scaled_variable_debt = IVariableDebtToken::burn(
                &reserve_cache.variable_debt_token_address,
                ic_cdk::caller(),
                variable_debt,
                reserve_cache.next_variable_borrow_index,
            );

            let result = IStableDebtToken::mint(
                &reserve_cache.stable_debt_token_address,
                ic_cdk::caller(),
                ic_cdk::caller(),
                variable_debt,
                reserve.current_stable_borrow_rate,
            );

            reserve_cache.next_total_stable_debt = result.1;
            reserve_cache.next_avg_stable_borrow_rate = result.2;
        }

        reserve.update_interest_rates(&reserve_cache, asset, 0, 0);

        let event = SwapBorrowRateModeEvent {
            reserve: asset,
            user: ic_cdk::caller(),
            interest_rate_mode: interest_rate_mode as u8,
        };
        ic_cdk::println!("{:?}", event);
    }
}
