use crate::api::functions::{get_balance, get_fees, get_total_supply};
use crate::api::state_handler::mutate_state;
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::logic::user::{nat_to_u128, GenericLogic};
use crate::protocol::libraries::math::calculate::{
    cal_average_threshold, calculate_health_factor, calculate_ltv, UserPosition,
};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use core::panic;

pub struct ValidationLogic;

impl ValidationLogic {
    //     // -------------------------------------
    //     // -------------- SUPPLY ---------------
    //     // -------------------------------------

    pub async fn validate_supply(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        if user == Principal::anonymous() {
            println!("Anonymous principals are not allowed.");
            return Err(Error::UnauthorizedAccess);
        }

        ic_cdk::println!("validation amount = {}", amount);
        ic_cdk::println!("validation reserve = {:?}", reserve);

        if user != ic_cdk::caller() {
            ic_cdk::println!("Invalid user: Caller does not match the user.");
            return Err(Error::InvalidUser);
        }

        if amount <= Nat::from(0u128) {
            ic_cdk::println!("Invalid amount: Amount must be greater than zero.");
            return Err(Error::InvalidAmount);
        }

        // validating amount
        let user_balance = get_balance(ledger_canister, user).await?;
        ic_cdk::println!("User balance: {:?}", user_balance);

        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount.clone() + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        if final_amount > user_balance {
            return Err(Error::MaxAmount);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (
            reserve.configuration.active,
            reserve.configuration.frozen,
            reserve.configuration.paused,
        );

        if !is_active {
            ic_cdk::println!("Reserve is inactive.");
            return Err(Error::ReserveInactive);
        }
        if is_paused {
            ic_cdk::println!("Reserve is paused.");
            return Err(Error::ReservePaused);
        }
        if is_frozen {
            ic_cdk::println!("Reserve is frozen.");
            return Err(Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // Validating supply cap limit
        let supply_cap = reserve.configuration.supply_cap.clone();
        ic_cdk::println!("supply_cap : {:?}", supply_cap);

        let d_token_canister_id: Result<Principal, candid::types::principal::PrincipalError> =
            Principal::from_text(reserve.d_token_canister.clone().unwrap());
        let d_token_canister_id_result = match d_token_canister_id {
            Ok(id) => id,
            Err(_) => return Err(Error::NoCanisterIdFound),
        };

        let total_supply = get_total_supply(d_token_canister_id_result).await?;

        // let total_supply_u128 = match nat_to_u128(total_supply) {
        //     Ok(bal) => {
        //         ic_cdk::println!("balance converted to u128: {}", bal);
        //         bal
        //     }
        //     Err(err) => {
        //         ic_cdk::println!("Error converting balance to u128: {:?}", err);
        //         return Err(Error::ConversionErrorToU128);
        //     }
        // };

        ic_cdk::println!("validation reserve accure = {}", reserve.accure_to_platform);

        // Ask: is it okk to comment these line (i think because supply cap is total number of tokens not amount in usd).
        // let final_total_supply = final_amount + reserve.total_supply as u128; //usd
        // ic_cdk::println!("final_total_supply : {:?}", final_total_supply);

        //Ask: this is okk with.
        let total_supply_amount_accure = total_supply + reserve.accure_to_platform.clone() + amount;
        ic_cdk::println!(
            "total supply with amount and accrue = {}",
            total_supply_amount_accure
        );

        if total_supply_amount_accure >= supply_cap {
            ic_cdk::println!("Supply cap exceeded: Final total supply exceeds the supply cap.");
            return Err(Error::SupplyCapExceeded);
        }
        Ok(())

        // if final_total_supply >= supply_cap {
        //     ic_cdk::println!("Supply cap exceeded: Final total supply exceeds the supply cap.");
        //     panic!("{:?}", Error::SupplyCapExceeded);
        // }
    }

    // -------------------------------------
    // ------------- WITHDRAW --------------
    // -------------------------------------

    pub async fn validate_withdraw(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        ic_cdk::println!("withdraw amount for validation = {}", amount);
        // Anonymous user check
        if user == Principal::anonymous() {
            ic_cdk::println!("Unauthorized access attempt by an anonymous user.");
            return Err(Error::UnauthorizedAccess);
        }

        if user != ic_cdk::caller() {
            ic_cdk::println!("Invalid user: Caller does not match the user.");
            return Err(Error::InvalidUser);
        }

        if amount <= Nat::from(0u128) {
            ic_cdk::println!("Invalid amount: Amount must be greater than zero.");
            return Err(Error::InvalidAmount);
        }

        // validating amount
        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetching user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user)
                .map(|user| user.0.clone())
                .ok_or_else(|| {
                    ic_cdk::println!("User not found: {}", user.to_string());
                })
        });

        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(_e) => {
                return Err(Error::UserNotFound);
            }
        };

        // let user_reserve_data = match user_data.reserves {
        //     Some(ref mut reserves) => reserves
        //         .iter_mut()
        //         .find(|(asset_name, _)| *asset_name == *reserve.asset_name.as_ref().unwrap()),
        //     None => None,
        // };

        //let mut user_current_supply = 0;
        let mut user_dtokens: Nat = Nat::from(0u128);

        //if let Some((_, reserve_data)) = user_reserve_data {
        //user_current_supply = reserve_data.asset_supply;
        let d_token_canister = Principal::from_text(reserve.d_token_canister.clone().unwrap());
        let d_token_canister_id = match d_token_canister {
            Ok(id) => id,
            Err(_) => return Err(Error::ConversionErrorFromTextToPrincipal),
        };
        user_dtokens = get_balance(d_token_canister_id, user).await?;
        // }

        ic_cdk::println!("withdraw user dtokens = {}", user_dtokens);

        // TODO: get balance dtoken call user , compare final amount.
        if final_amount > user_dtokens {
            ic_cdk::println!("Withdraw amount exceeds current supply.");
            return Err(Error::WithdrawMoreThanSupply);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (
            reserve.configuration.active,
            reserve.configuration.frozen,
            reserve.configuration.paused,
        );

        if !is_active {
            return Err(Error::ReserveInactive);
        }
        if is_paused {
            return Err(Error::ReservePaused);
        }
        if is_frozen {
            return Err(Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // let mut total_collateral: u128 = 0;
        // let mut total_debt: u128 = 0;
        let mut avg_ltv  = Nat::from(0u128);
        // let mut avg_liquidation_threshold: u128 = 0;
        let mut health_factor = Nat::from(0u128);
        // let mut available_borrow: u128 = 0;
        //let mut has_zero_ltv_collateral: bool = false;

        let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
            GenericLogic::calculate_user_account_data(None).await;

        match user_data_result {
            Ok((
                _t_collateral,
                _t_debt,
                ltv,
                _liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => {
                // Assign the values to the previously declared variables
                // total_collateral = t_collateral;
                // total_debt = t_debt;
                avg_ltv = ltv;
                // avg_liquidation_threshold = liquidation_threshold;
                health_factor = h_factor;
                // available_borrow = a_borrow;
                // has_zero_ltv_collateral = zero_ltv_collateral;

                // Use the values
                // println!("Total Collateral: {}", total_collateral);
                // println!("Total Debt: {}", total_debt);
                println!("Average LTV: {}", avg_ltv);
                // println!(
                //     "Average Liquidation Threshold: {}",
                //     avg_liquidation_threshold
                // );
                println!("Health Factor: {}", health_factor);
                //println!("Available Borrow: {}", available_borrow);
                // println!("Has Zero LTV Collateral: {}", has_zero_ltv_collateral);
            }
            Err(_) => {
                // Handle the error case
                return Err(Error::CalculateUserAccountDataError);
            }
        }

        //let user_total_collateral = user_data.total_collateral.unwrap_or(0) - amount;

        //let next_collateral = user_total_collateral - amount;

        // Ask: is it a write to not let user withdraw there assets on the basis of general ltv and health factor validation because may be in frontend things are different.
        // Calculating user liquidation threshold
        // let user_thrs = cal_average_threshold(
        //     amount,
        //     0,
        //     reserve.configuration.liquidation_threshold,
        //     user_data.total_collateral.unwrap_or(0),
        //     user_data.liquidation_threshold.unwrap_or(0),
        // );
        // ic_cdk::println!("user_thr {:?}", user_thrs);

        // let user_position = UserPosition {
        //     total_collateral_value: next_collateral,
        //     total_borrowed_value: user_data.total_debt.unwrap_or(0),
        //     liquidation_threshold: user_thrs,
        // };

        // Calculating LTV
        // let ltv = calculate_ltv(&user_position);
        // ic_cdk::println!("LTV {:?}", ltv);
        // ic_cdk::println!(
        //     "user liq threshold {:?}",
        //     user_data.liquidation_threshold.unwrap()
        // );

        if avg_ltv >= user_data.liquidation_threshold.unwrap() {
            return Err(Error::LTVGreaterThanThreshold);
        }

        // Calculating health factor
        //let health_factor = calculate_health_factor(&user_position);

        if health_factor < Nat::from(1u128) {
            return Err(Error::HealthFactorLess);
        }
        Ok(())
    }

    //     // --------------------------------------
    //     // --------------- BORROW ---------------
    //     // --------------------------------------

    pub async fn validate_borrow(
        reserve: &ReserveData,
        amount: Nat,
        user_principal: Principal,
    ) -> Result<(), Error> {
        // Check if the caller is anonymous
        if user_principal == Principal::anonymous() {
            return Err(Error::UnauthorizedAccess);
        }

        if user_principal != ic_cdk::caller() {
            return Err(Error::InvalidUser);
        }
        if amount <= Nat::from(0u128) {
            return Err(Error::InvalidAmount);
        }

        if !reserve.configuration.borrowing_enabled {
            return Err(Error::BorrowingNotEnabled);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (
            reserve.configuration.active,
            reserve.configuration.frozen,
            reserve.configuration.paused,
        );

        if !is_active {
            return Err(Error::ReserveInactive);
        }
        if is_paused {
            return Err(Error::ReservePaused);
        }
        if is_frozen {
            return Err(Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // Ask: dont we need transfer fee.

        // Fetch user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                return Err(Error::UserNotFound);
            }
        };

        // let mut total_collateral: u128 = 0;
        // let mut total_debt: u128 = 0;
        let mut avg_ltv = Nat::from(0u128);
        // let mut avg_liquidation_threshold: u128 = 0;
        let mut health_factor =Nat::from(0u128);
        // let mut available_borrow: u128 = 0;
        //let mut has_zero_ltv_collateral: bool = false;

        let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
            GenericLogic::calculate_user_account_data(None).await;

        match user_data_result {
            Ok((
                _t_collateral,
                _t_debt,
                ltv,
                _liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => {
                // Assign the values to the previously declared variables
                // total_collateral = t_collateral;
                // total_debt = t_debt;
                avg_ltv = ltv;
                // avg_liquidation_threshold = liquidation_threshold;
                health_factor = h_factor;
                // available_borrow = a_borrow;
                // has_zero_ltv_collateral = zero_ltv_collateral;

                // Use the values
                // println!("Total Collateral: {}", total_collateral);
                // println!("Total Debt: {}", total_debt);
                println!("Average LTV: {}", avg_ltv);
                // println!(
                //     "Average Liquidation Threshold: {}",
                //     avg_liquidation_threshold
                // );
                println!("Health Factor: {}", health_factor);
                //println!("Available Borrow: {}", available_borrow);
                // println!("Has Zero LTV Collateral: {}", has_zero_ltv_collateral);
            }
            Err(_) => {
                // Handle the error case
                return Err(Error::CalculateUserAccountDataError);
            }
        }
        ic_cdk::println!(
            "borrow liquidation threshold = {:?}",
            user_data.liquidation_threshold
        );
        if avg_ltv > user_data.liquidation_threshold.unwrap() {
            return Err(Error::LTVGreaterThanThreshold);
        }

        if health_factor < Nat::from(1u128) {
            return Err(Error::HealthFactorLess);
        }

        // Validating supply cap limit.
        //Ask: am i need to do similar of the supply for borrow cap and need to make a get_total_borrow and we dont have any specfic icrc function for this.
        let borrow_cap = reserve.configuration.borrow_cap.clone();
        ic_cdk::println!("borrow_cap : {:?}", borrow_cap);

        let final_total_borrow = amount + (reserve.asset_borrow.clone().scaled_mul(reserve.debt_index.clone()));
        ic_cdk::println!("final_total_supply : {:?}", final_total_borrow);

        if final_total_borrow >= borrow_cap {
            return Err(Error::BorrowCapExceeded);
        };
        Ok(())
    }
    //     // --------------------------------------
    //     // ---------------- REPAY ---------------
    //     // --------------------------------------

    pub async fn validate_repay(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        // // Check if the caller is anonymous
        if user == Principal::anonymous() {
            return Err(Error::UnauthorizedAccess);
        }

        // Check if the caller matches the provided user
        if user != ic_cdk::caller() {
            return Err(Error::InvalidUser);
        }

        if amount <= Nat::from(0u128) {
            return Err(Error::InvalidAmount);
        }
        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetch user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(_) => {
                return Err(Error::UserNotFound);
            }
        };

        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == *reserve.asset_name.as_ref().unwrap()),
            None => None,
        };

        let mut user_current_debt = Nat::from(0u128);

        if let Some((_, reserve_data)) = user_reserve {
            user_current_debt = reserve_data.asset_borrow.clone();
        }

        if user_current_debt == Nat::from(0u128) {
            return Err(Error::NoDebtToRepay);
        }

        if final_amount > user_current_debt  {
            return Err(Error::RepayMoreThanDebt);
        }

        let (is_active, is_frozen, is_paused) = (
            reserve.configuration.active,
            reserve.configuration.frozen,
            reserve.configuration.paused,
        );

        if !is_active {
            return Err(Error::ReserveInactive);
        }
        if is_paused {
            return Err(Error::ReservePaused);
        }
        if is_frozen {
            return Err(Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);
        Ok(())
    }

    //     // --------------------------------------
    //     // ---------------LIQUIDATION---------------
    //     // --------------------------------------

    // pub async fn validate_liquidation(
    //     repay_asset: String,
    //     repay_amount: u128,
    //     reward_amount: u128,
    //     liquidator: Principal,
    //     user: Principal,
    // ) {
    //     let repay_ledger_canister_id = mutate_state(|state| {
    //         let reserve_list = &state.reserve_list;
    //         reserve_list
    //             .get(&repay_asset.to_string().clone())
    //             .map(|principal| principal.clone())
    //             .ok_or_else(|| panic!("No canister ID found for asset: {}", repay_asset))
    //     })
    //     .unwrap();

    //     if liquidator != ic_cdk::caller() {
    //         panic!("{:?}", Error::InvalidUser);
    //     }

    //     // Checking liquidator is present in user list
    //     // let _ = mutate_state(|state| {
    //     //     let user_profile_data = &mut state.user_profile;
    //     //     user_profile_data
    //     //         .get(&liquidator)
    //     //         .map(|user| user.0.clone())
    //     //         .ok_or_else(|| panic!("Liquidator not found: {}", user.to_string()))
    //     // });

    //     // let liquidator_balance = get_balance(repay_ledger_canister_id, liquidator).await;
    //     ic_cdk::println!("User balance: {:?}", liquidator_balance);

    //     let transfer_fees = get_fees(repay_ledger_canister_id).await;
    //     ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

    //     let final_amount = repay_amount + transfer_fees;
    //     ic_cdk::println!("final_amount : {:?}", final_amount);

    //     if repay_amount == 0 {
    //         panic!("{:?}", Error::InvalidAmount);
    //     }

    //     // if final_amount > liquidator_balance {
    //     //     panic!("{:?}", Error::MaxAmount);
    //     // }

    //     // Fetch user data
    //     let user_data_result = mutate_state(|state| {
    //         let user_profile_data = &mut state.user_profile;
    //         user_profile_data
    //             .get(&user)
    //             .map(|user| user.0.clone())
    //             .ok_or_else(|| panic!("User not found: {}", user.to_string()))
    //     });

    //     let user_data = match user_data_result {
    //         Ok(data) => {
    //             ic_cdk::println!("User found: {:?}", data);
    //             data
    //         }
    //         Err(e) => {
    //             panic!("{:?}", e);
    //         }
    //     };

    //     if user_data.total_collateral.unwrap_or(0) < reward_amount {
    //         panic!("{:?}", Error::LessRewardAmount);
    //     }

    //     let reserve_data_result = mutate_state(|state| {
    //         let asset_index = &mut state.asset_index;
    //         asset_index
    //             .get(&repay_asset.to_string().clone())
    //             .map(|reserve| reserve.0.clone())
    //             .ok_or_else(|| panic!("Reserve not found for asset: {}", repay_asset.to_string()))
    //     });

    //     let reserve_data = match reserve_data_result {
    //         Ok(data) => {
    //             ic_cdk::println!("Reserve data found for asset: {:?}", data);
    //             data
    //         }
    //         Err(e) => {
    //             panic!("{:?}", e);
    //         }
    //     };

    //     // validating reserve states
    //     let (is_active, is_frozen, is_paused) = (
    //         reserve_data.configuration.active,
    //         reserve_data.configuration.frozen,
    //         reserve_data.configuration.paused,
    //     );

    //     if !is_active {
    //         panic!("{:?}", Error::ReserveInactive);
    //     }
    //     if is_paused {
    //         panic!("{:?}", Error::ReservePaused);
    //     }
    //     if is_frozen {
    //         panic!("{:?}", Error::ReserveFrozen);
    //     }
    //     ic_cdk::println!("is_active : {:?}", is_active);
    //     ic_cdk::println!("is_paused : {:?}", is_paused);
    //     ic_cdk::println!("is_frozen : {:?}", is_frozen);
    // }
}
