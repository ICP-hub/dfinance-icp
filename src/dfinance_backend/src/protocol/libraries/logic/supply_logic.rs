// // ----------------------------------- IMPORTS ----------------------------------- //


// // IERC20 -> Interface for ERC20 , IRCRC2 in our case
// // totalSupply(), balanceOf(), transfer(), allowance(), approve(), transferFrom()  

// // GPv2SafeERC20 -> Gnosis Protocol v2 Safe ERC20 Transfer Library
// // Uses the ERC20 interface
// // safeTransfer(), safeTransferFrom(), getLastTransferResult()

// // AToken -> in our case DToken
// // Uses ERC20(ICRC2), ScaledBalanceToken, InitializableAToken
// // mint(), burn(), mintToTreasury(), transferOnLiquidation(), transferUnderlyingTo(), handleRepayment(), permit(), UNDERLYING_ASSET_ADDRESS(), RESERVE_TREASURY_ADDRESS(), DOMAIN_SEPARATOR(), nonces(), rescueTokens()

//     // IScaledBalanceToken -> Defines the basic interface for a scaled-balance token.
//     // scaledBalanceOf(), getScaledUserBalanceAndSupply(), scaledTotalSupply(), getPreviousIndex()

//     // IInitializableAToken -> Interface for the initialize function on AToken
//     // Uses IAaveIncentivesController, IPool
//     // initialize()

//         // IAaveIncentivesController -> It only contains one single function, needed as a hook on aToken and debtToken transfers.
//         // handleAction()

//         // IPool -> Defines the basic interface for an Aave Pool.
//         // Uses IPoolAddressesProvider, DataTypes
//         // mintUnbacked(), backUnbacked(), supply(), supplyWithPermit(), withdraw(), borrow(), repay(), repayWithPermit(), repayWithATokens(), swapBorrowRateMode(), rebalanceStableBorrowRate(), setUserUseReserveAsCollateral(), liquidationCall(), flashLoan(), flashLoanSimple(), getUserAccountData(), initReserve(), dropReserve(), setReserveInterestRateStrategyAddress(), setConfiguration(), getConfiguration(), getUserConfiguration(), getReserveNormalizedIncome(), getReserveNormalizedVariableDebt(), getReserveData(), finalizeTransfer(), getReservesList(), getReserveAddressById(), ADDRESSES_PROVIDER(), updateBridgeProtocolFee(), updateFlashloanPremiums(), configureEModeCategory(), getEModeCategoryData(), setUserEMode(), getUserEMode(), resetIsolationModeTotalDebt(), MAX_STABLE_RATE_BORROW_SIZE_PERCENT(), FLASHLOAN_PREMIUM_TOTAL(), BRIDGE_PROTOCOL_FEE(), FLASHLOAN_PREMIUM_TO_PROTOCOL(), MAX_NUMBER_RESERVES(), mintToTreasury(), rescueTokens(), deposit()      

//             // IPoolAddressesProvider -> Defines the basic interface for a Pool Addresses Provider.
//             // getMarketId(), setMarketId(), getAddress(), setAddressAsProxy(), setAddress(), getPool(), setPoolImpl(), getPoolConfigurator(), setPoolConfiguratorImpl(), getPriceOracle(), setPriceOracle(), getACLManager(), setACLManager(), getACLAdmin(), setACLAdmin(), getPriceOracleSentinel(), setPriceOracleSentinel(), getPoolDataProvider(), setPoolDataProvider()    

// // Errors -> Errors library

// // UserConfiguration -> Implements the bitmap logic to handle the user configuration
// // Uses Errors, DataTypes, ReserveConfiguration
// // setBorrowing(), setUsingAsCollateral(), isUsingAsCollateralOrBorrowing(), isBorrowing(), isUsingAsCollateral(), isUsingAsCollateralOne(), isUsingAsCollateralAny(), isBorrowingOne(), isBorrowingAny(), isEmpty(), getIsolationModeState(), getSiloedBorrowingState(), _getFirstAssetIdByMask()  

//     // ReserveConfiguration -> Implements the bitmap logic to handle the reserve configuration
//     // setLtv(), getLtv(), setLiquidationThreshold(), getLiquidationThreshold(), setLiquidationBonus(), getLiquidationBonus(), setDecimals(), getDecimals(), setActive(), getActive(), setFrozen(), getFrozen(), setPaused(), getPaused(), setBorrowableInIsolation(), getBorrowableInIsolation(), setSiloedBorrowing(), getSiloedBorrowing(), setBorrowingEnabled(), getBorrowingEnabled(), setStableRateBorrowingEnabled(), getStableRateBorrowingEnabled(), setReserveFactor(), getReserveFactor(), setBorrowCap(), getBorrowCap(), setSupplyCap(), getSupplyCap(), setDebtCeiling(), getDebtCeiling(), setLiquidationProtocolFee(), getLiquidationProtocolFee(), setUnbackedMintCap(), getUnbackedMintCap(), setEModeCategory(), getEModeCategory, setFlashLoanEnabled, getFlashLoanEnabled, getFlags, getParams, getCaps   

// // DataTypes -> Library for defining structs and types

// // WadRayMath -> Provides mul and div function for wads (decimal numbers with 18 digits of precision) and rays (decimal numbers* with 27 digits of precision)
// // wadMul, wadDiv, rayMul, rayDiv, rayToWad, wadToRay

// // PercentageMath -> Percentages are defined by default with 2 decimals of precision (100.00). The precision is indicated by PERCENTAGE_FACTOR
// // percentMul, percentDiv

// // ReserveConfiguration -> Implements the bitmap logic to handle the reserve configuration
// // setLtv(), getLtv(), setLiquidationThreshold(), getLiquidationThreshold(), setLiquidationBonus(), getLiquidationBonus(), setDecimals(), getDecimals(), setActive(), getActive(), setFrozen(), getFrozen(), setPaused(), getPaused(), setBorrowableInIsolation(), getBorrowableInIsolation(), setSiloedBorrowing(), getSiloedBorrowing(), setBorrowingEnabled(), getBorrowingEnabled(), setStableRateBorrowingEnabled(), getStableRateBorrowingEnabled(), setReserveFactor(), getReserveFactor(), setBorrowCap(), getBorrowCap(), setSupplyCap(), getSupplyCap(), setDebtCeiling(), getDebtCeiling(), setLiquidationProtocolFee(), getLiquidationProtocolFee(), setUnbackedMintCap(), getUnbackedMintCap(), setEModeCategory(), getEModeCategory, setFlashLoanEnabled, getFlashLoanEnabled, getFlags, getParams, getCaps   

// // ValidationLogic

// // ReserveLogic


// // ----------------------------------- FUNCTIONS ----------------------------------- //


// // executeSupply(reserveData, reservesList, userConfig, params)
// // executeWithdraw(reserveData, reservesList, eModeCategories, userConfig, params)
// // executeFinalizeTransfer(reserveData, reservesList, eModeCategories, userConfig, params)
// // executeUseReserveAsCollateral(reservesData, reservesList, eModeCategories, userConfig, asset, useAsCollateral, reservesCount, priceOracle, userEModeCategory)

use std::collections::HashMap;

use crate::dependencies::{
    icrc2::*,
    safe_icrc2::{self, *},
};

use crate::protocol::libraries::{
    configuration::user_configuration::*,
    helpers::errors::*,
    logic::{validation_logic::*, reserve_logic::*},
    math::{wadray::WadRayMath, percentage::PercentageMath},
    types::datatypes::*,
};

use crate::interfaces::d_token;

struct SupplyLogic;

impl SupplyLogic {
    
    pub fn execute_supply(
        reserves_data: &mut HashMap<String, data_types::ReserveData>,
        reserves_list: &mut HashMap<u64, String>,
        user_config: &mut data_types::UserConfigurationMap,
        params:data_types::ExecuteSupplyParams,
    ) {
        let reserve = reserves_data.get_mut(&params.asset).unwrap();
        let reserve_cache = reserve.cache();

        reserve.update_state(&reserve_cache);

        ValidationLogic::validate_supply(&reserve_cache, reserve, params.amount);

        reserve.update_interest_rates(&reserve_cache, &params.asset, params.amount, 0);

        safe_icrc2::gpv2_safe_icrc2::safe_transfer_from(&params.asset, &reserve_cache.a_token_address, params.amount);

        let is_first_supply = d_token::mint(
            &reserve_cache.a_token_address,
            &params.user,
            &params.on_behalf_of,
            params.amount,
            reserve_cache.next_liquidity_index,
        );

        if is_first_supply {
            if ValidationLogic::validate_automatic_use_as_collateral(
                reserves_data,
                reserves_list,
                user_config,
                &reserve_cache.reserve_configuration,
                &reserve_cache.a_token_address,
            ) {
                user_config.set_using_as_collateral(reserve.id, true);
                println!("{:?}", ReserveUsedAsCollateralEnabled {
                    reserve: params.asset.clone(),
                    user: params.on_behalf_of.clone(),
                });
            }
        }

        println!("{:?}", Supply {
            reserve: params.asset.clone(),
            user: params.user.clone(),
            on_behalf_of: params.on_behalf_of.clone(),
            amount: params.amount,
            referral_code: params.referral_code,
        });
    }

    pub fn execute_withdraw(
        reserves_data: &mut HashMap<String, DataTypes::ReserveData>,
        reserves_list: &HashMap<u64, String>,
        e_mode_categories: &HashMap<u8, DataTypes::EModeCategory>,
        user_config: &mut DataTypes::UserConfigurationMap,
        params: DataTypes::ExecuteWithdrawParams,
    ) -> u64 {
        let reserve = reserves_data.get_mut(&params.asset).unwrap();
        let reserve_cache = reserve.cache();

        reserve.update_state(&reserve_cache);

        let user_balance = IAToken::scaled_balance_of(&reserve_cache.a_token_address, &params.user)
            .ray_mul(reserve_cache.next_liquidity_index);

        let mut amount_to_withdraw = params.amount;

        if params.amount == u64::MAX {
            amount_to_withdraw = user_balance;
        }

        ValidationLogic::validate_withdraw(&reserve_cache, amount_to_withdraw, user_balance);

        reserve.update_interest_rates(&reserve_cache, &params.asset, 0, amount_to_withdraw);

        let is_collateral = user_config.is_using_as_collateral(reserve.id);

        if is_collateral && amount_to_withdraw == user_balance {
            user_config.set_using_as_collateral(reserve.id, false);
            println!("{:?}", ReserveUsedAsCollateralDisabled {
                reserve: params.asset.clone(),
                user: params.user.clone(),
            });
        }

        IAToken::burn(
            &reserve_cache.a_token_address,
            &params.user,
            &params.to,
            amount_to_withdraw,
            reserve_cache.next_liquidity_index,
        );

        if is_collateral && user_config.is_borrowing_any() {
            ValidationLogic::validate_hf_and_ltv(
                reserves_data,
                reserves_list,
                e_mode_categories,
                user_config,
                &params.asset,
                &params.user,
                params.reserves_count,
                params.oracle,
                params.user_e_mode_category,
            );
        }

        println!("{:?}", Withdraw {
            reserve: params.asset.clone(),
            user: params.user.clone(),
            to: params.to.clone(),
            amount: amount_to_withdraw,
        });

        amount_to_withdraw
    }

    pub fn execute_finalize_transfer(
        reserves_data: &mut HashMap<String, DataTypes::ReserveData>,
        reserves_list: &HashMap<u64, String>,
        e_mode_categories: &HashMap<u8, DataTypes::EModeCategory>,
        users_config: &mut HashMap<String, DataTypes::UserConfigurationMap>,
        params: DataTypes::FinalizeTransferParams,
    ) {
        let reserve = reserves_data.get_mut(&params.asset).unwrap();

        ValidationLogic::validate_transfer(reserve);

        let reserve_id = reserve.id;

        if params.from != params.to && params.amount != 0 {
            let from_config = users_config.get_mut(&params.from).unwrap();

            if from_config.is_using_as_collateral(reserve_id) {
                if from_config.is_borrowing_any() {
                    ValidationLogic::validate_hf_and_ltv(
                        reserves_data,
                        reserves_list,
                        e_mode_categories,
                        from_config,
                        &params.asset,
                        &params.from,
                        params.reserves_count,
                        params.oracle,
                        params.from_e_mode_category,
                    );
                }
                if params.balance_from_before == params.amount {
                    from_config.set_using_as_collateral(reserve_id, false);
                    println!("{:?}", ReserveUsedAsCollateralDisabled {
                        reserve: params.asset.clone(),
                        user: params.from.clone(),
                    });
                }
            }

            if params.balance_to_before == 0 {
                let to_config = users_config.get_mut(&params.to).unwrap();
                if ValidationLogic::validate_automatic_use_as_collateral(
                    reserves_data,
                    reserves_list,
                    to_config,
                    &reserve.configuration,
                    &reserve.a_token_address,
                ) {
                    to_config.set_using_as_collateral(reserve_id, true);
                    println!("{:?}", ReserveUsedAsCollateralEnabled {
                        reserve: params.asset.clone(),
                        user: params.to.clone(),
                    });
                }
            }
        }
    }

    pub fn execute_use_reserve_as_collateral(
        reserves_data: &mut HashMap<String, DataTypes::ReserveData>,
        reserves_list: &HashMap<u64, String>,
        e_mode_categories: &HashMap<u8, DataTypes::EModeCategory>,
        user_config: &mut DataTypes::UserConfigurationMap,
        asset: String,
        use_as_collateral: bool,
        reserves_count: u64,
        price_oracle: String,
        user_e_mode_category: u8,
    ) {
        let reserve = reserves_data.get_mut(&asset).unwrap();
        let reserve_cache = reserve.cache();

        let user_balance = IERC20::balance_of(&reserve_cache.a_token_address, &user_config);

        ValidationLogic::validate_set_use_reserve_as_collateral(&reserve_cache, user_balance);

        if use_as_collateral == user_config.is_using_as_collateral(reserve.id) {
            return;
        }

        if use_as_collateral {
            assert!(
                ValidationLogic::validate_use_as_collateral(
                    reserves_data,
                    reserves_list,
                    user_config,
                    &reserve_cache.reserve_configuration,
                ),
                Errors::USER_IN_ISOLATION_MODE_OR_LTV_ZERO,
            );

            user_config.set_using_as_collateral(reserve.id, true);
            println!("{:?}", ReserveUsedAsCollateralEnabled {
                reserve: asset.clone(),
                user: user_config.clone(),
            });
        } else {
            user_config.set_using_as_collateral(reserve.id, false);
            ValidationLogic::validate_hf_and_ltv(
                reserves_data,
                reserves_list,
                e_mode_categories,
                user_config,
                &asset,
                &user_config,
                reserves_count,
                price_oracle,
                user_e_mode_category,
            );

            println!("{:?}", ReserveUsedAsCollateralDisabled {
                reserve: asset.clone(),
                user: user_config.clone(),
            });
        }
    }
}