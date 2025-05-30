use crate::api::inter_canister::{
    get_balance, get_icrc2_allowance, get_total_supply, get_transfer_fee,
};
use crate::constants::{
    constant_variables::constants::{PERCENTAGE_FACTOR, SCALING_FACTOR, ZERO_VALUE},
    errors::Error,
};

use crate::declarations::datatypes::{ReserveData, UserReserveData};
use crate::protocol::libraries::{
    reserve::get_asset_principal,
    update::{user_data, user_reserve},
    user::{calculate_user_account_data, user_normalized_debt, user_normalized_supply},
};
use crate::protocol::utils::{
    log::{log_internal, LogLevel},
    math_utils::ScalingMath,
    price::{calculate_transfer_fee, get_cached_exchange_rate, update_token_price},
};
use crate::{debug, error, trace};
use candid::{Nat, Principal};
pub struct ValidationLogic;

impl ValidationLogic {
    /*
     * @title Validate Supply
     * @notice Ensures the supply amount is valid before processing the transaction.
     *
     * @dev Performs checks on:
     * - User's balance in the ledger canister.
     * - Supply cap constraints.
     *
     * @functionality This function first checks the user's balance to ensure they have enough funds in the ledger canister.
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
        trace!("validating supply");
        debug!(
            "validation amount = {}, validation reserve = {:?}",
            amount, reserve
        );

        // validating amount
        let user_balance = get_balance(ledger_canister, user).await?;

        //checking if the user has enough wallet balance

        if amount > user_balance {
            error!("Supply amount exceeds user balance.");
            return Err(Error::MaxAmount);
        }

        let platform_principal = ic_cdk::api::id();
        let allowance = get_icrc2_allowance(ledger_canister, user, platform_principal)
            .await
            .map_err(|e| {
                error!("Allowance query failed: {:?}", e);
                Error::AllowanceQueryFailed
            })?;

        debug!(
            "Allowance from user {} to platform {} is {}",
            user, platform_principal, allowance.allowance
        );

        if amount > allowance.allowance {
            error!(
                "Insufficient allowance: required {}, allowed {}",
                amount, allowance.allowance
            );
            return Err(Error::AllowanceTooLow);
        }
        let supply_cap = reserve.configuration.supply_cap.clone();

        let d_token_canister_id = reserve.d_token_canister.clone().ok_or_else(|| {
            error!("No d_token canister ID found.");
            Error::NoCanisterIdFound
        })?;

        let total_supply = get_total_supply(d_token_canister_id).await?;

        let total_supply_amount_accure =
            total_supply.clone() + reserve.accure_to_platform.clone() + amount;
        debug!(
            "User balance: {:?}, supply_cap: {:?}, reserve accure to platform = {}, total supply = {}, total supply with amount and accrue = {}",
            user_balance,
            supply_cap,
            reserve.accure_to_platform,
            total_supply,
            total_supply_amount_accure
        );

        // Validating supply cap limit
        if total_supply_amount_accure >= supply_cap {
            error!("Supply cap exceeded: Final total supply exceeds the supply cap."); //error
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
     * @functionality This function first validates that the user has enough supplied balance to make the withdrawal.
     * - It then checks if the requested withdrawal amount exceeds the user's available supply.
     * - Next, it verifies the platform's available balance to ensure the withdrawal amount does not exceed what the platform can handle.
     * - The function updates the token price.
     * - Finally, the LTV ratio and health factor are calculated to ensure the withdrawal does not trigger a liquidation condition,
     * - based on the user's total collateral and debt. If any of these checks fail, it returns an appropriate error.
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
        mut amount: Nat,
        user: Principal,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        trace!("validating withdraw function called");
        let d_token_principal = reserve.d_token_canister.clone().unwrap();

        //fetching user current supply balance
        let user_current_supply = get_balance(d_token_principal, user).await?;

        //fetching interest rate
        let supplied_interest_rate = user_normalized_supply(reserve.clone())?;
        debug!(
            "withdraw amount for validation = {}, user current supply = {}, interest rate = {}, to check the supply = {}",
            amount,
            user_current_supply,
            supplied_interest_rate,
            user_current_supply.clone().scaled_mul(supplied_interest_rate.clone())
        );

        //checking if the user has enough supply
        if amount
            > user_current_supply
                .clone()
                .scaled_mul(supplied_interest_rate)
        {
            error!("Withdraw amount exceeds current supply.");
            return Err(Error::WithdrawMoreThanSupply);
        }

        let platform_principal = ic_cdk::api::id();

        //fetching platfrom balance
        let platform_balance = get_balance(ledger_canister, platform_principal).await?;

        debug!("platform balance: {:?}", platform_balance);

        //checking if plaform has enough balance
        if amount > platform_balance {
            error!("Withdraw amount exceeds platform balance.");
            return Err(Error::LowPlatformBalance);
        }

        let mut user_data = user_data(user)?;
        let user_reserve = user_reserve(&mut user_data, &reserve.asset_name.clone())
            .and_then(|(_, reserve_data)| Some(reserve_data.clone()))
            .ok_or(Error::NoUserReserveDataFound)?;

        debug!(
            "user collateral status for this token = {:?}",
            user_reserve.is_collateral
        );
        if !user_reserve.is_collateral {
            return Ok(());
        }
        // updating the token price and store in latest prince in price cache
        let _ = update_token_price(reserve.asset_name.clone()).await;

        let (total_collateral, total_debt, _avg_ltv, liquidation_threshold_var, _health_factor) =
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
                    debug!(
                        "total collateral = {}, total debt = {}, liquidation_threshold_var = {}",
                        t_collateral, t_debt, liquidation_threshold
                    ); //debug
                    (t_collateral, t_debt, ltv, liquidation_threshold, h_factor)
                }
                Err(e) => return Err(e),
            };

        if total_debt != Nat::from(0u128) || user_reserve.is_collateral {
            //fetching the exchange rate from cache
            let rate = get_cached_exchange_rate(reserve.asset_name.clone())?;

            //calculating the amount in USD
            let usd_withdrawl = amount.clone().scaled_mul(rate.clone());
            // Calculate Adjusted Collateral
            let adjusted_collateral: Nat;
            //checking for substration error
            if total_collateral < usd_withdrawl {
                error!("total collateral is less than withdrawl amount");
                return Err(Error::TotalCollateraLessThan);
            } else {
                adjusted_collateral = total_collateral.clone() - usd_withdrawl.clone();
            }
            debug!(
                "withdraw asset price = {:?}, usd withdraw amount = {}, adjusted amount = {}",
                rate, usd_withdrawl, adjusted_collateral
            );

            //calculating the newe LTV with adjusted collateral
            if adjusted_collateral != Nat::from(0u128) {
                //calculating the liquidation threshold
                let avliq = liquidation_threshold_var
                    .clone()
                    .scaled_mul(total_collateral.clone());

                let mut templiq = avliq
                    - usd_withdrawl.scaled_mul(reserve.configuration.liquidation_threshold.clone());
                templiq = templiq.scaled_div(adjusted_collateral.clone());

                let mut new_ltv = Nat::from(ZERO_VALUE);
                new_ltv = total_debt.clone().scaled_div(adjusted_collateral.clone());
                new_ltv = new_ltv * Nat::from(PERCENTAGE_FACTOR);
                debug!("New ltv {} and templiq : {}", new_ltv, templiq);
                //checking if the LTV is greater than the liquidation threshold
                if new_ltv >= templiq {
                    error!("LTV is greater than liquidation threshold");
                    return Err(Error::LTVGreaterThanThreshold);
                }
                if total_debt != Nat::from(0u128) {
                    let mut new_health_factor =
                        adjusted_collateral.scaled_mul(templiq / Nat::from(PERCENTAGE_FACTOR));

                    new_health_factor = new_health_factor.scaled_div(total_debt);
                    debug!("new health factor = {}", new_health_factor);

                    //checking if the health factor
                    if new_health_factor < Nat::from(SCALING_FACTOR) {
                        error!("Health factor is less than 1");
                        return Err(Error::HealthFactorLess);
                    }
                }
            }
        }

        Ok(())
    }

    /*
     * @title Validate Borrow
     * @notice Ensures a user can borrow a specified amount from the reserve.
     *
     * @dev Performs checks on:
     * - Loan-to-value (LTV) limits to prevent excessive borrowing.
     * - User’s health factor ensure safe borrowing.
     *
     * @param reserve The reserve from which the user is borrowing.
     * @param amount The borrowing amount requested.
     * @param ledger_canister The principal of the ledger canister for balance verification.
     *
     * @return Returns `Ok(())` if validation is successful.
     * @functionality Verifies that borrowing conditions are met for the user, such as ensuring borrowing is enabled,
     * checking the platform's balance, calculating LTV, ensuring the health factor
     * is above a certain threshold, and confirming that the borrow amount does not exceed the borrow cap.
     */
    pub async fn validate_borrow(
        reserve: &ReserveData,
        amount: Nat,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        trace!("validating borrow");
        //checking if the borrowing is enabled or not
        if !reserve.configuration.borrowing_enabled {
            error!("Borrowing is not enabled for this reserve.");
            return Err(Error::BorrowingNotEnabled);
        }

        let platform_principal = ic_cdk::api::id();

        //fetching the platform balance
        let platform_balance = get_balance(ledger_canister, platform_principal).await?;
        debug!(
            "amount in borrow = {}, platform balance: {:?}",
            amount, platform_balance
        );

        //checking if the platform has enough balance
        if amount > platform_balance {
            error!("Borrow amount exceeds platform balance.");
            return Err(Error::LowPlatformBalance);
        }

        let (total_collateral, total_debt, _avg_ltv, liquidation_threshold_var, _health_factor) =
            match calculate_user_account_data(None).await {
                Ok((
                    t_collateral,
                    t_debt,
                    ltv,
                    liquidation_threshold,
                    h_factor,
                    _a_borrow,
                    _zero_ltv_collateral,
                )) => (t_collateral, t_debt, ltv, liquidation_threshold, h_factor),
                Err(e) => return Err(e),
            };
        //checking if the user has some collateral
        if total_collateral <= Nat::from(0u128) {
            error!("No collateral found for the user.");
            return Err(Error::NoCollateralFound);
        }
        //fetching the exchange rate from cache
        let rate = get_cached_exchange_rate(reserve.asset_name.clone())?;

        //calculating the amount in USD
        let usd_borrow = amount.clone().scaled_mul(rate.clone());

        //adjusted is the final amount after borrow amount is added
        let adjusted_debt = total_debt.clone() + usd_borrow.clone();

        //calculating the liquidation threshold
        let avliq = liquidation_threshold_var
            .clone()
            .scaled_mul(total_collateral.clone());

        let mut templiq = avliq
            + usd_borrow
                .clone()
                .scaled_mul(reserve.configuration.liquidation_threshold.clone());
        templiq = templiq.scaled_div(adjusted_debt.clone());

        //calculating the new LTV with adjusted debt
        let mut new_ltv: Nat;
        new_ltv = adjusted_debt.clone().scaled_div(total_collateral.clone());
        new_ltv = new_ltv * Nat::from(PERCENTAGE_FACTOR);
        debug!(
            "asset price = {}, usd borrow amount = {}, adjusted debt = {}, New ltv: {}",
            rate, usd_borrow, adjusted_debt, new_ltv
        );

        //checking if the LTV is greater than the liquidation threshold
        if new_ltv >= templiq {
            error!("LTV is greater than liquidation threshold");
            return Err(Error::LTVGreaterThanThreshold);
        }

        //checking the health factor
        let mut new_health_factor =
            total_collateral.scaled_mul(templiq / Nat::from(PERCENTAGE_FACTOR));
        new_health_factor = new_health_factor
            .scaled_div(adjusted_debt)
            .scaled_div(Nat::from(PERCENTAGE_FACTOR));

        //checking if the health factor
        if new_health_factor < Nat::from(SCALING_FACTOR) {
            error!("Health factor is less than 1");
            return Err(Error::HealthFactorLess);
        }

        let borrow_cap = reserve.configuration.borrow_cap.clone();

        let final_total_borrow = amount
            + (reserve
                .asset_borrow
                .clone()
                .scaled_mul(reserve.debt_index.clone()));
        debug!(
            "new health factor = {}, borrow_cap: {:?}, final_total_borrow: {:?}",
            new_health_factor, borrow_cap, final_total_borrow
        );

        // Validating borrow cap limit
        if final_total_borrow >= borrow_cap {
            error!("Borrow cap exceeded: Final total borrow exceeds the borrow cap. final_total_borrow : {:?}", final_total_borrow);
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
     * - verifies the repayment amount is correct,
     * - and ensures the user's outstanding debt allows for repayment.
     */
    pub async fn validate_repay(
        _reserve: &ReserveData,
        amount: Nat,
        user: Principal,
        liquidator: Option<Principal>,
        ledger_canister: Principal,
    ) -> Result<(), Error> {
        //fetching the wallet balance of the user if liquidator is not present else fetch the liquidator wallet balance
        let user_balance;
        if liquidator.is_none() {
            user_balance = get_balance(ledger_canister, user.clone()).await?;
        } else {
            user_balance = get_balance(ledger_canister, liquidator.unwrap().clone()).await?;
        }

        debug!("User balance: {:?}", user_balance);
        let platform_principal = ic_cdk::api::id();
        let user_id = if liquidator.is_none() {
            user.clone()
        } else {
            liquidator.unwrap().clone()
        };
        let allowance = get_icrc2_allowance(ledger_canister, user_id, platform_principal)
            .await
            .map_err(|e| {
                error!("Allowance query failed: {:?}", e);
                Error::AllowanceQueryFailed
            })?;

        debug!(
            "Allowance from user {} to platform {} is {}",
            user, platform_principal, allowance.allowance
        );

        if amount > allowance.allowance {
            error!(
                "Insufficient allowance: required {}, allowed {}",
                amount, allowance.allowance
            );
            return Err(Error::AllowanceTooLow);
        }
        //checking if the user has enough wallet balance
        if amount > user_balance {
            error!("Repay amount exceeds user balance.");
            return Err(Error::LowWalletBalance);
        };

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
     * @param reward_reserve_data The reserve data associated with the collateral asset (reward asset).
     * @param user_reserve_data The user’s reserve data related to the collateral asset.
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
        reward_reserve_data: ReserveData,
        user_reserve_data: UserReserveData,
    ) -> Result<(), Error> {
        // Get the repay asset's debt token canister
        let repay_asset_principal =
            repay_reserve_data
                .debt_token_canister
                .clone()
                .ok_or_else(|| {
                    error!("No debt token canister ID found.");
                    Error::NoCanisterIdFound
                })?;
        let reward_asset_principal =
            reward_reserve_data
                .d_token_canister
                .clone()
                .ok_or_else(|| {
                    error!("No d_token canister ID found.");
                    Error::NoCanisterIdFound
                })?;
        if !user_reserve_data.is_collateral {
            error!("User reserve asset is not collateral.");
            return Err(Error::NoCollateralFound);
        }

        let user_dtoken_balance = get_balance(reward_asset_principal, user.clone()).await?;
        if user_dtoken_balance < reward_amount {
            error!("User collateral amount is less than the reward amount.");
            return Err(Error::UserCollateralLessThanReward);
        }

        // Fetch the user's total debt balance for the repay asset
        let debt_amount = get_balance(repay_asset_principal, user.clone()).await?;

        // Get the user's normalized debt factor
        let norm_debt = user_normalized_debt(repay_reserve_data.clone())?;
        let normalized_debt_amount = debt_amount.clone().scaled_mul(norm_debt);
        debug!(
            "Normalized debt: {:?}, User debt: {:?}, Repay amount: {:?}",
            normalized_debt_amount, debt_amount, repay_amount
        );

        let repay_ledger_canister_id = get_asset_principal(repay_asset.clone())?;
        // Check if repay amount exceeds normalized user debt
        let transfer_token_fee = calculate_transfer_fee(&repay_asset, repay_amount.clone())?;
        if (repay_amount.clone()
            - (get_transfer_fee(repay_ledger_canister_id).await? + transfer_token_fee.clone()))
            > normalized_debt_amount
        {
            error!(
                "Repay amount exceeds user debt. {}",
                repay_amount.clone()
                    - (get_transfer_fee(repay_ledger_canister_id).await? + transfer_token_fee)
            );
            return Err(Error::RepayMoreThanDebt);
        }

        // Fetch liquidator's wallet balance
        let liquidator_wallet_balance =
            get_balance(repay_ledger_canister_id, liquidator.clone()).await?;

        // Check if the liquidator has enough balance
        if liquidator_wallet_balance < repay_amount {
            error!("Liquidator repay amount exceeds wallet balance.");
            return Err(Error::LowWalletBalance);
        }

        // Fetch user's total collateral and health factor
        let (_total_collateral, health_factor) = match calculate_user_account_data(Some(user)).await
        {
            Ok((
                t_collateral,
                _t_debt,
                _ltv,
                _liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => (t_collateral, h_factor),
            Err(e) => return Err(e),
        };

        // Check if user can be liquidated (health factor must be ≤ 1)
        debug!(
            "Health factor percentage: {:?}",
            health_factor.clone() / Nat::from(PERCENTAGE_FACTOR)
        );
        if health_factor / Nat::from(PERCENTAGE_FACTOR) > Nat::from(SCALING_FACTOR) {
            error!("User health factor is greater than 1.");
            return Err(Error::UserCannotBeLiquidated);
        }

        Ok(())
    }
}
