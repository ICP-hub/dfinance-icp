use crate::api::functions::{get_balance, get_total_supply};
use crate::api::state_handler::read_state;
use crate::constants::constant_variables::constants::MAX_ASSET_LENGTH;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::assets::ReserveData;
use crate::guards::guard_validate_reserve_status;
use crate::protocol::libraries::logic::update::user_data;
use crate::protocol::libraries::logic::user::calculate_user_account_data;
use crate::protocol::libraries::math::calculate::update_token_price;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::{get_cached_exchange_rate, user_normalized_debt, user_normalized_supply};
use candid::{Nat, Principal};
use crate::constants::constant_variables::constants::{
    ZERO_VALUE, ONE_VALUE, PERCENTAGE_FACTOR
};

pub struct ValidationLogic;

impl ValidationLogic {

    /*
    * @title Validate Supply
    * @notice Ensures the supply amount is valid before processing the transaction.
    *
    * @dev Performs checks on:
    * - User's balance in the ledger canister.
    * - Reserve status (active, paused, or frozen).
    * - Supply cap constraints.
    *
    * @functionality This function first checks the user's balance to ensure they have enough funds in the ledger canister. 
    *                It then checks the state of the reserve (whether it is active, paused, or frozen). 
    *                Finally, it verifies if the total supply of the asset, including the user's intended supply, exceeds the supply cap. 
    *                If any of these checks fail, it returns an error.
    *
    * @param reserve The reserve data for the asset being supplied.
    * @param amount The amount the user wants to supply.
    * @param user The principal of the user supplying the asset.
    * @param ledger_canister The principal of the ledger canister for balance verification.
    *
    * @return Returns `Ok(())` if validation is successful, or an `Err(Error)` if any of the validations fail.
 */
    pub async fn validate_supply(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        ic_cdk::println!("validation amount = {}", amount);
        ic_cdk::println!("validation reserve = {:?}", reserve);

        // let balance_result = get_balance(ledger_canister, user).await;

        // let user_balance = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        // validating amount
        let user_balance = get_balance(ledger_canister, user).await?;

        ic_cdk::println!("User balance: {:?}", user_balance);

        let final_amount = amount.clone();
        ic_cdk::println!("final_amount : {:?}", final_amount);

        if final_amount > user_balance {
            return Err(Error::MaxAmount);
        }

        // validating reserve states
        guard_validate_reserve_status(&reserve)?;
        // let (is_active, is_frozen, is_paused) = (
        //     reserve.configuration.active,
        //     reserve.configuration.frozen,
        //     reserve.configuration.paused,
        // );

        // if !is_active {
        //     ic_cdk::println!("Reserve is inactive.");
        //     return Err(Error::ReserveInactive);
        // }
        // if is_paused {
        //     ic_cdk::println!("Reserve is paused.");
        //     return Err(Error::ReservePaused);
        // }
        // if is_frozen {
        //     ic_cdk::println!("Reserve is frozen.");
        //     return Err(Error::ReserveFrozen);
        // }

        // Validating supply cap limit
        let supply_cap = reserve.configuration.supply_cap.clone();
        ic_cdk::println!("supply_cap : {:?}", supply_cap);

        // let d_token_canister_id: Result<Principal, candid::types::principal::PrincipalError> =
        //     Principal::from_text(reserve.d_token_canister.clone().unwrap());
        // let d_token_canister_id_result = match d_token_canister_id {
        //     Ok(id) => id,
        //     Err(_) => return Err(Error::NoCanisterIdFound),
        // };


        let d_token_canister_id: Result<Principal, candid::types::principal::PrincipalError> =
        Principal::from_text(reserve.d_token_canister.clone().unwrap());
    let d_token_canister_id_result = match d_token_canister_id {
        Ok(id) => id,
        Err(_) => return Err(Error::NoCanisterIdFound),
    };


        // let total_supply_result = get_total_supply(d_token_canister_id_result).await;
        // let total_supply = match total_supply_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };


        let total_supply = get_total_supply(d_token_canister_id_result).await?;


        ic_cdk::println!("validation reserve accure = {}", reserve.accure_to_platform);

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

    /*
    * @title Validate Withdraw
    * @notice Ensures a user can withdraw a specified amount from the reserve.
    *
    * @dev Performs checks on:
    * - User's supplied balance.
    * - Platform's available balance.
    * - Loan-to-value (LTV) constraints to prevent liquidation risk.
    *
    * @functionality This function first validates that the user has enough supplied balance to make the withdrawal. It then checks if the requested withdrawal amount exceeds the user's available supply. Next, it verifies the platform's available balance to ensure the withdrawal amount does not exceed what the platform can handle. The function also validates the reserve's state (active, paused, frozen) and updates the token price. Finally, the LTV ratio and health factor are calculated to ensure the withdrawal does not trigger a liquidation condition, based on the user's total collateral and debt. If any of these checks fail, it returns an appropriate error.
    *
    * @param reserve The reserve data for the asset being withdrawn.
    * @param amount The withdrawal amount requested by the user.
    * @param user The principal of the user withdrawing.
    * @param ledger_canister The principal of the ledger canister for balance verification.
    *
    * @return Returns `Ok(())` if validation is successful, or an `Err(Error)` if any of the validations fail.
    */
    pub async fn validate_withdraw(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        ic_cdk::println!("withdraw amount for validation = {}", amount);

        let final_amount = amount.clone();
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // let d_token_principal =
        //     Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap();
        // let user_dtokens = get_balance(d_token_principal, user).await;

        // let user_current_supply = match user_dtokens {
        //     Ok(supply) => supply,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };


        let d_token_principal =
            Principal::from_text(reserve.d_token_canister.clone().unwrap()).unwrap();

        let user_current_supply = get_balance(d_token_principal, user).await?;


        // let supplied_interest_rate = match user_normalized_supply(reserve.clone()) {
        //     Ok(interest) => interest,
        //     Err(e) => return Err(e),
        // };

        let supplied_interest_rate = user_normalized_supply(reserve.clone())?;

        ic_cdk::println!("user current supply = {}", user_current_supply);
        ic_cdk::println!("interest rate = {}", supplied_interest_rate);

        ic_cdk::println!(
            "to check the borrow = {}",
            user_current_supply
                .clone()
                .scaled_mul(supplied_interest_rate.clone())
        );

        if final_amount
            > user_current_supply
                .clone()
                .scaled_mul(supplied_interest_rate)
        {
            ic_cdk::println!("Withdraw amount exceeds current supply.");
            ic_cdk::println!(
                "final amount and current {} {}",
                final_amount,
                user_current_supply
            );
            return Err(Error::WithdrawMoreThanSupply);
        }

        let platform_principal = ic_cdk::api::id();
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        // let balance_result = get_balance(ledger_canister, platform_principal).await;

        // let platform_balance = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        let platform_balance = get_balance(ledger_canister, platform_principal).await?;

        ic_cdk::println!("User balance: {:?}", platform_balance);

        if amount > platform_balance {
            return Err(Error::MaxAmountPlatform);
        }

        // validating reserve states
        guard_validate_reserve_status(&reserve)?;
        // let (is_active, is_frozen, is_paused) = (
        //     reserve.configuration.active,
        //     reserve.configuration.frozen,
        //     reserve.configuration.paused,
        // );

        // if !is_active {
        //     return Err(Error::ReserveInactive);
        // }
        // if is_paused {
        //     return Err(Error::ReservePaused);
        // }
        // if is_frozen {
        //     return Err(Error::ReserveFrozen);
        // }
        // ic_cdk::println!("is_active : {:?}", is_active);
        // ic_cdk::println!("is_paused : {:?}", is_paused);
        // ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // if let Err(e) = update_token_price(reserve.asset_name.clone().unwrap()).await {
        //     ic_cdk::println!("Failed to update reserves price: {:?}", e);
        // }


        let _ = update_token_price(reserve.asset_name.clone().unwrap()).await;


        let mut total_collateral = Nat::from(0u128);
        let mut total_debt = Nat::from(0u128);
        let mut avg_ltv = Nat::from(0u128);
        let mut health_factor = Nat::from(0u128);
        let mut liquidation_threshold_var = Nat::from(0u128);

        // let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
        //     calculate_user_account_data(None).await;

        // match user_data_result {
        //     Ok((
        //         t_collateral,
        //         t_debt,
        //         ltv,
        //         liquidation_threshold,
        //         h_factor,
        //         _a_borrow,
        //         _zero_ltv_collateral,
        //     )) => {
        //         total_collateral = t_collateral;
        //         total_debt = t_debt;
        //         avg_ltv = ltv;
        //         health_factor = h_factor;
        //         liquidation_threshold_var = liquidation_threshold;

        //         ic_cdk::println!("total collateral = {}", total_collateral);
        //         ic_cdk::println!("total debt = {}", total_debt);
        //         ic_cdk::println!("Average LTV: {}", avg_ltv);
        //         ic_cdk::println!("liqudation user = {}", liquidation_threshold_var);
        //         ic_cdk::println!("Health Factor: {}", health_factor);
        //     }
        //     Err(e) => {
        //         return Err(e);
        //     }
        // }


        // bhanu can we directly assign below things ?
    match calculate_user_account_data(None).await {
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


        if total_debt != Nat::from(0u128) {
            // let rate = match get_cached_exchange_rate(reserve.asset_name.clone().unwrap()) {
            //     Ok(price) => price,
            //     Err(e) => {
            //         ic_cdk::println!("Failed to fetch exchange rate");
            //         return Err(e);
            //     }
            // };
            // ic_cdk::println!("asset price = {}",rate);

            let rate =  get_cached_exchange_rate(reserve.asset_name.clone().unwrap())?;
            

            ic_cdk::println!("rate = {:?}", rate);

            let usd_withdrawl = amount.clone().scaled_mul(rate);
            ic_cdk::println!("usd withdraw amount = {}", usd_withdrawl);

            // Calculate Adjusted Collateral
            let mut adjusted_collateral = Nat::from(0u128);
            
            if adjusted_collateral < usd_withdrawl.clone() {
                adjusted_collateral = Nat::from(0u128);
            }
            else if total_collateral < usd_withdrawl {
                return Err(Error::AmountSubtractionError);
            } 
            else {
                adjusted_collateral = total_collateral.clone() - usd_withdrawl.clone();
            }
            ic_cdk::println!("adjusted amount = {}", adjusted_collateral);

            let mut ltv = Nat::from(ZERO_VALUE);
            // Calculate new ratio (Adjusted Collateral / Total Debt)

            if adjusted_collateral != Nat::from(0u128) {
                ltv = total_debt.scaled_div(adjusted_collateral);
                ltv = ltv * Nat::from(PERCENTAGE_FACTOR);
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

   /*
     * @title Validate Borrow
     * @notice Ensures a user can borrow a specified amount from the reserve.
     *
     * @dev Performs checks on:
     * - Reserve status (active and borrowing enabled).
     * - Loan-to-value (LTV) limits to prevent excessive borrowing.
     * - User’s health factor to ensure safe borrowing.
     *
     * @param reserve The reserve from which the user is borrowing.
     * @param amount The borrowing amount requested.
     * @param user_principal The principal of the user borrowing funds.
     * @param ledger_canister The principal of the ledger canister for balance verification.
     *
     * @return Returns `Ok(())` if validation is successful.
     * @functionality Verifies that borrowing conditions are met for the user, such as ensuring borrowing is enabled,
     * checking the platform's balance, validating the reserve's status, calculating LTV, ensuring the health factor
     * is above a certain threshold, and confirming that the borrow amount does not exceed the borrow cap.
     */
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

        ic_cdk::println!("amount in borrow ={}", amount);

        // let balance_result = get_balance(ledger_canister, platform_principal).await;

        // let platform_balance = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        let platform_balance = get_balance(ledger_canister, platform_principal).await?;
        ic_cdk::println!("User balance: {:?}", platform_balance);

        if amount > platform_balance {
            return Err(Error::MaxAmountPlatform);
        }
        // validating reserve states
        guard_validate_reserve_status(&reserve)?;
        // let (is_active, is_frozen, is_paused) = (
        //     reserve.configuration.active,
        //     reserve.configuration.frozen,
        //     reserve.configuration.paused,
        // );

        // if !is_active {
        //     return Err(Error::ReserveInactive);
        // }
        // if is_paused {
        //     return Err(Error::ReservePaused);
        // }
        // if is_frozen {
        //     return Err(Error::ReserveFrozen);
        // }

        // ic_cdk::println!("is_active : {:?}", is_active);
        // ic_cdk::println!("is_paused : {:?}", is_paused);
        // ic_cdk::println!("is_frozen : {:?}", is_frozen);

        if let Err(e) = update_token_price(reserve.asset_name.clone().unwrap()).await {
            ic_cdk::println!("Failed to update reserves price: {:?}", e);
        }

        let mut total_collateral = Nat::from(ZERO_VALUE);
        let mut total_debt = Nat::from(ZERO_VALUE);
        let mut avg_ltv = Nat::from(ZERO_VALUE);
        let mut health_factor = Nat::from(ZERO_VALUE);
        let mut liquidation_threshold_var = Nat::from(ZERO_VALUE);

        // let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
        //     calculate_user_account_data(None).await;

        match calculate_user_account_data(None).await {
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
                // available_borrow = a_borrow;
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
        // let rate = match get_cached_exchange_rate(reserve.asset_name.clone().unwrap()) {
        //     Ok(price) => price,
        //     Err(e) => {
        //         ic_cdk::println!("Failed to fetch exchange rate");
        //         return Err(e);
        //     }
        // };

        let rate =  get_cached_exchange_rate(reserve.asset_name.clone().unwrap())?;
        
        ic_cdk::println!("asset price = {}",rate);

        ic_cdk::println!("rate = {:?}", rate);

        let usd_borrow = amount.clone().scaled_mul(rate);
        ic_cdk::println!("usd withdraw amount = {}", usd_borrow);

        let adjusted_debt = total_debt + usd_borrow;
        ic_cdk::println!("adjusted amount = {}", adjusted_debt);

        let mut ltv = Nat::from(ZERO_VALUE);
        ltv = adjusted_debt.scaled_div(total_collateral);
        ltv = ltv * Nat::from(PERCENTAGE_FACTOR);
        ic_cdk::println!("New ltv: {}", ltv);

        if ltv >= liquidation_threshold_var {
            return Err(Error::LTVGreaterThanThreshold);
        }

        if health_factor < Nat::from(SCALING_FACTOR) {
            return Err(Error::HealthFactorLess);
        }

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
/*
     * @title Validate Repay
     * @notice Ensures a user can repay a specified amount of borrowed assets.
     *
     * @dev Performs checks on:
     * - User’s or liquidator’s balance to ensure sufficient funds for repayment.
     * - User’s outstanding debt to verify if repayment is needed.
     * - Reserve status to confirm it is active and not paused or frozen.
     * - Repayment amount to prevent overpayment.
     *
     * @param reserve The reserve data containing asset information.
     * @param amount The amount to be repaid.
     * @param user The principal of the borrower.
     * @param liquidator Optional principal of the liquidator, if applicable.
     * @param ledger_canister The principal of the ledger canister for balance verification.
     *
     * @return Returns `Ok(())` if validation is successful.
     * @functionality Validates repayment conditions by ensuring that the user or liquidator has sufficient balance,
     * checks if the reserve is active and not paused or frozen, verifies the repayment amount is correct, 
     * and ensures the user's outstanding debt allows for repayment.
     */
    pub async fn validate_repay(
        reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        liquidator: Option<Principal>,
        ledger_canister: Principal,
    ) -> Result<(), Error> {

        let mut balance_result = get_balance(ledger_canister, user.clone()).await;


        if !liquidator.is_none() {
            balance_result = get_balance(ledger_canister, liquidator.unwrap().clone()).await;
        }

        // let user_balance = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        let user_balance =  balance_result?;
        ic_cdk::println!("User balance: {:?}", user_balance);

        if amount > user_balance {
            return Err(Error::LowWalletBalance);
        }

        let final_amount = amount;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        // Fetch user data
        // let user_data_result = user_data(user);

        // let mut user_data = match user_data_result {
        //     Ok(data) => {
        //         ic_cdk::println!("User found");
        //         data
        //     }
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        let mut user_data = user_data(user)?;

        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == *reserve.asset_name.as_ref().unwrap()),
            None => None,
        };

        guard_validate_reserve_status(&reserve)?;


        // let (is_active, is_frozen, is_paused) = (
        //     reserve.configuration.active,
        //     reserve.configuration.frozen,
        //     reserve.configuration.paused,
        // );

        // if !is_active {
        //     return Err(Error::ReserveInactive);
        // }
        // if is_paused {
        //     return Err(Error::ReservePaused);
        // }
        // if is_frozen {
        //     return Err(Error::ReserveFrozen);
        // }
        // ic_cdk::println!("is_active : {:?}", is_active);
        // ic_cdk::println!("is_paused : {:?}", is_paused);
        // ic_cdk::println!("is_frozen : {:?}", is_frozen);
        Ok(())
    }

   /*
     * @title Validate Liquidation
     * @notice Ensures a liquidator can liquidate a borrower's collateral.
     *
     * @dev Performs checks on:
     * - Borrower’s outstanding debt to ensure the repay amount is valid.
     * - Liquidator’s balance to verify sufficient funds for liquidation.
     * - Borrower’s collateral to confirm adequate assets for liquidation.
     * - Health factor to ensure the borrower is eligible for liquidation.
     *
     * @param repay_asset The asset being repaid during liquidation.
     * @param repay_amount The amount the liquidator is repaying.
     * @param reward_amount The collateral being claimed as a reward.
     * @param liquidator The principal of the liquidator executing the liquidation.
     * @param user The principal of the borrower being liquidated.
     * @param repay_reserve_data The reserve data associated with the asset.
     *
     * @return Returns `Ok(())` if liquidation validation passes.
     * @functionality Validates that a liquidation can occur by checking various conditions such as ensuring 
     * the liquidator has enough balance to repay, the borrower’s collateral is sufficient, 
     * and that the borrower is eligible for liquidation based on the health factor and debt amount.
     */
    pub async fn validate_liquidation(
        repay_asset: String,
        repay_amount: Nat,
        reward_amount: Nat,
        liquidator: Principal,
        user: Principal,
        repay_reserve_data: ReserveData,
    ) -> Result<(), Error> {
        let repay_asset_principal =
            match Principal::from_text(repay_reserve_data.debt_token_canister.clone().unwrap()) {
                Ok(principal) => principal,
                Err(_) => return Err(Error::NoCanisterIdFound),
            };
        // let balance_result = get_balance(repay_asset_principal, user.clone()).await;

        // let debt_amount = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };


        let debt_amount = get_balance(repay_asset_principal, user.clone()).await?;

        let normalized_debt_amount  = debt_amount.clone()
            .scaled_mul(user_normalized_debt(repay_reserve_data.clone()).unwrap());

        ic_cdk::println!("normalizesd {:?}", normalized_debt_amount);

        ic_cdk::println!("User debt: {:?}", debt_amount);
        ic_cdk::println!("Repay amount: {:?}", repay_amount);

        if repay_amount > normalized_debt_amount {
            return Err(Error::RepayMoreThanDebt);
        }

        // let repay_ledger_canister_id = read_state(|state| {
        //     let reserve_list = &state.reserve_list;
        //     reserve_list
        //         .get(&repay_asset.to_string().clone())
        //         .map(|principal| principal.clone())
        //         .ok_or_else(|| Error::NoCanisterIdFound)
        // })?;

        let repay_ledger_canister_id = read_state(|state| 
            state.reserve_list
                .get(&repay_asset.to_string())
                .map(|principal| principal)
                .ok_or_else(|| Error::NoCanisterIdFound)
        )?;

        

        // let balance_result = get_balance(repay_ledger_canister_id, liquidator.clone()).await;
        // let liquidator_wallet_balance = match balance_result {
        //     Ok(bal) => bal,
        //     Err(e) => {
        //         return Err(e);
        //     }
        // };

        let liquidator_wallet_balance = get_balance(repay_ledger_canister_id, liquidator.clone()).await?;


        if liquidator_wallet_balance < repay_amount {
            return Err(Error::LowWalletBalance);
        }

        let mut total_collateral = Nat::from(ZERO_VALUE);
        let mut health_factor = Nat::from(ZERO_VALUE);

        // let user_data_result: Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> =
        //     calculate_user_account_data(Some(user)).await;

        match calculate_user_account_data(Some(user)).await {
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
            return Err(Error::RewardIsHigher);
        }

        if health_factor / Nat::from(PERCENTAGE_FACTOR) > Nat::from(SCALING_FACTOR) {
            return Err(Error::USERCANNOTBELIQUIDATED);
        }

        // validating reserve states
        guard_validate_reserve_status(&repay_reserve_data)?;
        // let (is_active, is_frozen, is_paused) = (
        //     repay_reserve_data.configuration.active,
        //     repay_reserve_data.configuration.frozen,
        //     repay_reserve_data.configuration.paused,
        // );

        // if !is_active {
        //     return Err(Error::ReserveInactive);
        // }
        // if is_paused {
        //     return Err(Error::ReservePaused);
        // }
        // if is_frozen {
        //     return Err(Error::ReserveFrozen);
        // }
        // ic_cdk::println!("is_active : {:?}", is_active);
        // ic_cdk::println!("is_paused : {:?}", is_paused);
        // ic_cdk::println!("is_frozen : {:?}", is_frozen);
        Ok(())
    }
}


