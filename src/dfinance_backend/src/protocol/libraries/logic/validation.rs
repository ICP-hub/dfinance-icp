use crate::api::functions::{get_balance, get_fees, get_total_supply};
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::assets::ReserveData;
use crate::{get_asset_debt,get_asset_supply, get_cached_exchange_rate};
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

        let transfer_fees_result = get_fees(ledger_canister).await;
        let transfer_fees = match transfer_fees_result {
            Ok(fees) => fees,
            Err(e) => {
                return Err(e);
            }
        };
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

        ic_cdk::println!("withdraw amount for validation = {}", amount);

        let final_amount = amount.clone();
        ic_cdk::println!("final_amount : {:?}", final_amount);

        let user_dtokens = get_asset_supply(reserve.asset_name.clone().unwrap(), Some(user)).await;

        let user_current_supply = match user_dtokens {
            Ok(supply) => supply,
            Err(e) => {
                return Err(e);
            }
        };

        if final_amount > user_current_supply {
            ic_cdk::println!("Withdraw amount exceeds current supply.");
            return Err(Error::WithdrawMoreThanSupply);
        }

        // TODO: platform balance check.
        let platform_principal = ic_cdk::api::id();
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let balance_result = get_balance(ledger_canister, platform_principal).await;

        let platform_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };
        ic_cdk::println!("User balance: {:?}", platform_balance);

        if amount > platform_balance {
            return Err(Error::MaxAmountPlatform);    
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

        let mut total_collateral = Nat::from(0u128);
        let mut total_debt = Nat::from(0u128);
        let mut avg_ltv = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);
        let mut liquidation_threshold_var = Nat::from(0u128);

        let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
            GenericLogic::calculate_user_account_data(None).await;

        match user_data_result {
            Ok((
                t_collateral,
                t_debt,
                ltv,
                liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => {
                total_collateral = t_collateral;
                total_debt = t_debt;
                avg_ltv = ltv;
                health_factor = h_factor;
                liquidation_threshold_var = liquidation_threshold;

                ic_cdk::println!("total collateral = {}", total_collateral);
                ic_cdk::println!("total debt = {}", total_debt);
                ic_cdk::println!("Average LTV: {}", avg_ltv);
                ic_cdk::println!("liqudation user = {}", liquidation_threshold_var);
                ic_cdk::println!("Health Factor: {}", health_factor);
            }
            Err(e) => {
                return Err(e);
            }
        }

        //TODO: whether is sho++ld be none or zero.
        if total_debt != Nat::from(0u128) {
       
        let mut rate: Option<Nat> = None;

        match get_cached_exchange_rate(reserve.asset_name.clone().unwrap()) {
            Ok(price_cache) => {
                // Fetch the specific CachedPrice for the asset from the PriceCache
                if let Some(cached_price) =
                    price_cache.cache.get(&reserve.asset_name.clone().unwrap())
                {
                    let amount = cached_price.price.clone();
                    rate = Some(amount);
                } else {
                    rate = None;
                }
            }
            Err(err) => {
                // ic_cdk::println!(
                //     "Error fetching exchange rate for {}: {:?}",
                //     user_reserve_data.reserve.clone(),
                //     err
                // );
                rate = None;
            }
        }

        ic_cdk::println!("rate = {:?}", rate);

        let usd_withdrawl = amount.clone().scaled_mul(rate.unwrap());
        ic_cdk::println!("usd withdraw amount = {}", usd_withdrawl);

        // Calculate Adjusted Collateral
        let mut adjusted_collateral = Nat::from(0u128);
        if adjusted_collateral < usd_withdrawl.clone() {
            adjusted_collateral = Nat::from(0u128);
        }else{
            adjusted_collateral = total_collateral.clone() -usd_withdrawl.clone();
        }
        // let adjusted_collateral = total_collateral - usd_withdrawl;
        ic_cdk::println!("adjusted amount = {}", adjusted_collateral);

        let mut ltv = Nat::from(0u128);
        // Calculate new ratio (Adjusted Collateral / Total Debt)
        if adjusted_collateral != Nat::from(0u128) {
            ltv = total_debt.scaled_div(adjusted_collateral);
            ltv = ltv * Nat::from(100u128);
            println!("New ltv: {}", ltv);
        }

        if ltv >= liquidation_threshold_var {
            return Err(Error::LTVGreaterThanThreshold);
        }
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
        ledger_canister: Principal,
    ) -> Result<(), Error> {

        if !reserve.configuration.borrowing_enabled {
            return Err(Error::BorrowingNotEnabled);
        }
        
        let platform_principal = ic_cdk::api::id();
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let balance_result = get_balance(ledger_canister, platform_principal).await;

        let platform_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };
        ic_cdk::println!("User balance: {:?}", platform_balance);

        if amount > platform_balance {
            return Err(Error::MaxAmountPlatform);
            
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

        let mut total_collateral = Nat::from(0u128);
        let mut total_debt = Nat::from(0u128);
        let mut avg_ltv = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);
        let mut liquidation_threshold_var = Nat::from(0u128);

        let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
            GenericLogic::calculate_user_account_data(None).await;

        match user_data_result {
            Ok((
                t_collateral,
                t_debt,
                ltv,
                liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => {
                total_collateral = t_collateral;
                total_debt = t_debt;
                avg_ltv = ltv;
                health_factor = h_factor;
                liquidation_threshold_var = liquidation_threshold;
                ic_cdk::println!("total collateral = {}", total_collateral);
                ic_cdk::println!("total debt = {}", total_debt);
                ic_cdk::println!("Average LTV: {}", avg_ltv);
                ic_cdk::println!("Health Factor: {}", health_factor);
                ic_cdk::println!("threshold: {}", liquidation_threshold_var);
            }
            Err(e) => {
                // Handle the error case
                return Err(e);
            }
        }
        let mut rate: Option<Nat> = None;

        match get_cached_exchange_rate(reserve.asset_name.clone().unwrap()) {
            Ok(price_cache) => {
                // Fetch the specific CachedPrice for the asset from the PriceCache
                if let Some(cached_price) =
                    price_cache.cache.get(&reserve.asset_name.clone().unwrap())
                {
                    let amount = cached_price.price.clone();
                    rate = Some(amount);
                } else {
                    rate = None;
                }
            }
            Err(err) => {
                // ic_cdk::println!(
                //     "Error fetching exchange rate for {}: {:?}",
                //     user_reserve_data.reserve.clone(),
                //     err
                // );
                rate = None;
            }
        }

        ic_cdk::println!("rate = {:?}", rate);

        let usd_borrow = amount.clone().scaled_mul(rate.unwrap());
        ic_cdk::println!("usd withdraw amount = {}", usd_borrow);

        let adjusted_debt = total_debt + usd_borrow;
        ic_cdk::println!("adjusted amount = {}", adjusted_debt);

        let mut ltv = Nat::from(0u128);
        ltv = adjusted_debt.scaled_div(total_collateral);
        ltv = ltv * Nat::from(100u128);
        ic_cdk::println!("New ltv: {}", ltv);

        if ltv >= liquidation_threshold_var {
            return Err(Error::LTVGreaterThanThreshold);
        }

        if health_factor < Nat::from(SCALING_FACTOR) {
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
         // --------------------------------------
    //     // ---------------- REPAY ---------------
    //     // --------------------------------------

    pub async fn validate_repay(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        liquidator: Option<Principal>,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        // // Check if the caller is anonymous
       //TODO remove transfer fee
       let mut balance_result = get_balance(ledger_canister, user.clone()).await;
       if !liquidator.is_none() {
           balance_result = get_balance(ledger_canister, liquidator.unwrap().clone()).await;
        }

        let user_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };
        ic_cdk::println!("User balance: {:?}", user_balance);
        if amount > user_balance {
            return Err(Error::LowWalletBalance);
        }
        let transfer_fees_result = get_fees(ledger_canister).await;
        let transfer_fees = match transfer_fees_result {
            Ok(fees) => fees,
            Err(e) => {
                return Err(e);
            }
        };
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetch user data
        let user_data_result = user_data(user);

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found");
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

        let mut user_current_debt = get_asset_debt(reserve.asset_name.clone().unwrap(), Some(user)).await?;
        
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

    // pub async fn validate_liquidation(
    //     repay_asset: String,
    //     repay_amount: u128,
    //     reward_amount: u128,
    //     liquidator: Principal,
    //     user: Principal,
    // ) -> Result<(), Error> {
    //     let repay_ledger_canister_id = read_state(|state| {
    //         let reserve_list = &state.reserve_list;
    //         reserve_list
    //             .get(&repay_asset.to_string().clone())
    //             .map(|principal| principal.clone())
    //             .ok_or_else(|| Error::NoCanisterIdFound)
    //     })?;

    //     // Checking liquidator is present in user list
    //     // let _ = mutate_state(|state| {
    //     //     let user_profile_data = &mut state.user_profile;
    //     //     user_profile_data
    //     //         .get(&liquidator)
    //     //         .map(|user| user.0.clone())
    //     //         .ok_or_else(|| panic!("Liquidator not found: {}", user.to_string()))
    //     // });

    //     let transfer_fees_result = get_fees(repay_ledger_canister_id).await;
    //     let transfer_fees = match transfer_fees_result {
    //         Ok(fees) => fees,
    //         Err(e) => {
    //             return Err(e);
    //         }
    //     };
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
    //     let user_data_result = user_data(user);
    //     let user_data = match user_data_result {
    //         Ok(data) => {
    //             ic_cdk::println!("User found: {:?}", data);
    //             data
    //         }
    //         Err(e) => return Err(e),
    //     };

    //     if user_data.total_collateral.unwrap_or(Nat::from(0u128)) < reward_amount {
    //         panic!("{:?}", Error::LessRewardAmount);
    //     }

    //     let reserve_data_result = mutate_state(|state| {
    //         let asset_index = &mut state.asset_index;
    //         asset_index
    //             .get(&repay_asset.to_string().clone())
    //             .map(|reserve| reserve.0.clone())
    //             .ok_or_else(|| Error::NoReserveDataFound)
    //     });

    //     let reserve_data = match reserve_data_result {
    //         Ok(data) => {
    //             ic_cdk::println!("Reserve data found for asset: {:?}", data);
    //             data
    //         }
    //         Err(e) => return Err(e),
    //     };

    //     // validating reserve states
    //     let (is_active, is_frozen, is_paused) = (
    //         reserve_data.configuration.active,
    //         reserve_data.configuration.frozen,
    //         reserve_data.configuration.paused,
    //     );

    //     if !is_active {
    //         return Err(Error::ReserveInactive);
    //     }
    //     if is_paused {
    //         return Err(Error::ReservePaused);
    //     }
    //     if is_frozen {
    //         return Err(Error::ReserveFrozen);
    //     }
    //     ic_cdk::println!("is_active : {:?}", is_active);
    //     ic_cdk::println!("is_paused : {:?}", is_paused);
    //     ic_cdk::println!("is_frozen : {:?}", is_frozen);
    //     Ok(())
    // }
    pub async fn validate_liquidation(
        repay_asset: String,
        repay_amount: Nat,
        reward_amount: Nat,
        liquidator: Principal,
        user: Principal,
        repay_reserve_data: ReserveData,
    ) -> Result<(), Error> {

        let repay_asset_principal = match Principal::from_text(repay_reserve_data.debt_token_canister.clone().unwrap()) {
            Ok(principal) => principal,
            Err(_) => return Err(Error::NoCanisterIdFound),
        };
        let balance_result = get_balance(repay_asset_principal, user.clone()).await;

        let debt_amount = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };

        if repay_amount > debt_amount{
            return Err(Error::InvalidAmount);
        }

        // TODO:i think we need to check this again -- 
        let repay_ledger_canister_id = read_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&repay_asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| Error::NoCanisterIdFound)
        })?;


        let balance_result = get_balance(repay_ledger_canister_id, liquidator.clone()).await;
        let liquidator_wallet_balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };

    

        if liquidator_wallet_balance < repay_amount {
            return Err(Error::MaxAmount);
        }

        let mut total_collateral = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);

        let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
            GenericLogic::calculate_user_account_data(Some(user)).await;

        match user_data_result {
            Ok((
                t_collateral,
                _t_debt,
                _ltv,
                _liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => {
                total_collateral = t_collateral;
                health_factor = h_factor;

                ic_cdk::println!("total collateral = {}", total_collateral);
                ic_cdk::println!("Health Factor: {}", health_factor);
            }
            Err(e) => {
                return Err(e);
            }
        }

        if total_collateral < reward_amount {
           return Err(Error::LessRewardAmount);
        }

        if health_factor/Nat::from(100u128) > Nat::from(SCALING_FACTOR) {
            return Err(Error::HealthFactorLess);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (
            repay_reserve_data.configuration.active,
            repay_reserve_data.configuration.frozen,
            repay_reserve_data.configuration.paused,
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
}
