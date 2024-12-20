use crate::api::functions::{get_balance, get_fees, get_total_supply};
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::logic::update::user_data;
use crate::protocol::libraries::logic::user::GenericLogic;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};

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
        ic_cdk::println!("validation amount = {}", amount);
        ic_cdk::println!("validation reserve = {:?}", reserve);

        // validating amount
        let balance_result = get_balance(ledger_canister, user).await;

        let user_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };
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

        let total_supply_result = get_total_supply(d_token_canister_id_result).await;
        let total_supply = match total_supply_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };

        ic_cdk::println!("validation reserve accure = {}", reserve.accure_to_platform);

        // Ask: is it okk to comment these line (i think because supply cap is total number of tokens not amount in usd).
        // let final_total_supply = final_amount + reserve.total_supply as u128; //usd
        // ic_cdk::println!("final_total_supply : {:?}", final_total_supply);

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

        // validating amount
        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetching user data
        let user_data_result = user_data(user);

        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let mut user_dtokens: Nat = Nat::from(0u128);

        let d_token_canister = Principal::from_text(reserve.d_token_canister.clone().unwrap());
        let d_token_canister_id = match d_token_canister {
            Ok(id) => id,
            Err(_) => return Err(Error::ConversionErrorFromTextToPrincipal),
        };
        user_dtokens = get_balance(d_token_canister_id, user).await?;

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

        let mut avg_ltv = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);

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
                avg_ltv = ltv;
                health_factor = h_factor;

                println!("Average LTV: {}", avg_ltv);
                println!("Health Factor: {}", health_factor);
            }
            Err(e) => {
                return Err(e);
            }
        }

        if avg_ltv >= user_data.liquidation_threshold.unwrap() {
            return Err(Error::LTVGreaterThanThreshold);
        }
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

        // Fetch user data
        let user_data_result = user_data(user_principal);

        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let mut avg_ltv = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);

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
                avg_ltv = ltv;
                health_factor = h_factor;
                println!("Average LTV: {}", avg_ltv);
                println!("Health Factor: {}", health_factor);
            }
            Err(e) => {
                // Handle the error case
                return Err(e);
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

        let final_total_borrow = amount
            + (reserve
                .asset_borrow
                .clone()
                .scaled_mul(reserve.debt_index.clone()));
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
      
        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetch user data
        let user_data_result = user_data(user);
   
        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e);
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

        if final_amount > user_current_debt {
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

    pub async fn validate_liquidation(
        repay_asset: String,
        repay_amount: u128,
        reward_amount: u128,
        liquidator: Principal,
        user: Principal,
    )-> Result<(),Error> {
        let repay_ledger_canister_id = read_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&repay_asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| Error::NoCanisterIdFound)
        })?;

        // Checking liquidator is present in user list
        // let _ = mutate_state(|state| {
        //     let user_profile_data = &mut state.user_profile;
        //     user_profile_data
        //         .get(&liquidator)
        //         .map(|user| user.0.clone())
        //         .ok_or_else(|| panic!("Liquidator not found: {}", user.to_string()))
        // });

        let transfer_fees = get_fees(repay_ledger_canister_id).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = repay_amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        if repay_amount == 0 {
            panic!("{:?}", Error::InvalidAmount);
        }

        // if final_amount > liquidator_balance {
        //     panic!("{:?}", Error::MaxAmount);
        // }

        // Fetch user data
        let user_data_result = user_data(user);
        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e)
            }
        };

        if user_data.total_collateral.unwrap_or(Nat::from(0u128)) < reward_amount {
            panic!("{:?}", Error::LessRewardAmount);
        }

        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&repay_asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                return Err(e)
            }
        };

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (
            reserve_data.configuration.active,
            reserve_data.configuration.frozen,
            reserve_data.configuration.paused,
        );

        if !is_active {
            return Err(Error::ReserveInactive);
        }
        if is_paused {
           return Err(Error::ReservePaused);
        }
        if is_frozen {
            return  Err(Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);
        Ok(())
    }
}
