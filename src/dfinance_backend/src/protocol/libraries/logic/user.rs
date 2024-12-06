use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::query;
use num_traits::cast::ToPrimitive;

use crate::{
    api::{
        functions::get_balance,
        state_handler::{mutate_state, read_state},
    },
    declarations::assets::ReserveData,
    get_cached_exchange_rate, get_reserve_data,
    protocol::libraries::{
        math::{
            calculate::{cal_average_threshold, get_exchange_rates, UserPosition},
            math_utils::ScalingMath,
        },
        types::datatypes::UserReserveData,
    },
    user_normalized_debt, user_normalized_supply,
};

use super::update::user_data;

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserConfig {
    pub collateral: bool,
    pub borrowing: bool,
}

// impl UserConfig {
//     pub fn is_empty(&self) -> bool {
//         !self.collateral && !self.borrowing
//     }
//     pub fn is_using_as_collateral(&self) -> bool {
//         self.collateral
//     }
//     pub fn is_borrowing(&self) -> bool {
//         self.borrowing
//     }
// }

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserAccountDataParams {
    pub user: String,
    // pub user_config: UserConfig,
    // pub reserves_count: usize,
}

pub struct GenericLogic;

impl GenericLogic {
    pub async fn calculate_user_account_data(
        on_behalf: Option<String>,
    ) -> Result<(u128, u128, u128, u128, u128, u128, bool), String> {
        let user_principal = match on_behalf {
            // If `on_behalf` is Some, we parse the Principal from the string
            Some(ref principal_str) => {
                // Parse the principal string into a Principal and return an error if it fails
                Principal::from_text(principal_str)
                    .map_err(|e| format!("Failed to parse Principal: {}", e))?
            }
            // If `on_behalf` is None, we use the caller's principal
            None => ic_cdk::caller(),
        };
        // let user_principal =
        //     Principal::from_text("65j2k-jdu5y-vcmph-e4elp-mz7hc-cfo45-4aype-qzzf2-j25xy-qldem-mae")
        //         .unwrap();
        ic_cdk::println!("Principal of the user: {:?}", user_principal.to_string());

        let user_data_result = user_data(user_principal);
        ic_cdk::println!("Fetching user data...");

        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User data found");
                data
            }
            Err(e) => {
                ic_cdk::println!("Error fetching user data: {}", e);
                return Err(e);
            }
        };

        if user_data.reserves.is_none() {
            ic_cdk::println!("No reserves found for the user.");
            return Ok((0, 0, 0, 0, 0, u128::MAX, false));
        }

        // Ensure reserves exist for the user
        let user_data_reserves = user_data
            .reserves
            .as_ref()
            .ok_or_else(|| format!("Reserves not found for user"))?;
        ic_cdk::println!("User reserves found");

        let mut total_collateral = 0u128;
        let mut total_debt = 0u128;
        let mut avg_ltv = 0u128;
        let mut avg_liquidation_threshold = 0u128;
        let mut has_zero_ltv_collateral = false;
        let mut available_borrow = 0u128;

        for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
            ic_cdk::println!("Processing reserve: {:?}", reserve_name);
            if !user_reserve_data.is_using_as_collateral_or_borrow {
                ic_cdk::println!("no supply no borrow, skipping..... {:?}", reserve_name);
                continue;
            }
            let reserve_data_result = mutate_state(|state| {
                let asset_index = &mut state.asset_index;
                asset_index
                    .get(&reserve_name.to_string().clone())
                    .map(|reserve| reserve.0.clone())
                    .ok_or_else(|| {
                        format!("Reserve not found for asset: {}", reserve_name.to_string())
                    })
            });

            let reserve_data = match reserve_data_result {
                Ok(data) => {
                    ic_cdk::println!("Reserve data found for asset");
                    data
                }
                Err(e) => {
                    ic_cdk::println!("Error: {}", e);
                    return Err(e);
                }
            };

            // let asset_price_result =
            // get_cached_exchange_rate(user_reserve_data.reserve.clone());

            // let asset_price = match asset_price_result {
            //     Ok((amount, _)) => amount,
            //     Err(err) => {
            //         ic_cdk::println!(
            //             "Error fetching asset price for {}: {}",
            //             user_reserve_data.reserve,
            //             err
            //         );
            //         return Err(err);
            //     }
            // };
            // ic_cdk::println!(
            //     "Asset price for reserve '{}': {}",
            //     user_reserve_data.reserve,
            //     asset_price
            // );
            let mut rate: Option<u128> = None;

            match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
                Ok(price_cache) => {
                    // Fetch the specific CachedPrice for the asset from the PriceCache
                    if let Some(cached_price) =
                        price_cache.cache.get(&user_reserve_data.reserve.clone())
                    {
                        let amount = cached_price.price; // Access the `price` field
                        rate = Some(amount);
                        ic_cdk::println!(
                            "Fetched exchange rate for {}: {:?}",
                            user_reserve_data.reserve.clone(),
                            rate
                        );
                    } else {
                        ic_cdk::println!(
                            "No cached price found for {}",
                            user_reserve_data.reserve.clone()
                        );
                        rate = None; // Explicitly set rate to None if the asset is not in the cache
                    }
                }
                Err(err) => {
                    ic_cdk::println!(
                        "Error fetching exchange rate for {}: {}",
                        user_reserve_data.reserve.clone(),
                        err
                    );
                    rate = None; // Explicitly set rate to None in case of an error
                }
            }
            let asset_price = rate.unwrap();
            if user_reserve_data.is_collateral {
                ic_cdk::println!("Reserve '{}' is collateral.", user_reserve_data.reserve);

                let user_balance = Self::get_user_balance_in_base_currency(
                    user_principal,
                    &user_reserve_data,
                    asset_price,
                )
                .await;

                ic_cdk::println!(
                    "User balance in usd for collateral reserve '{}': {}",
                    user_reserve_data.reserve,
                    user_balance
                );

                //Ask jyotirmay : the total collateral this time should be bigger than the userdata.total_collateral.
                total_collateral += user_balance;
                ic_cdk::println!("Total collateral so far: {}", total_collateral);

                if reserve_data.configuration.ltv != 0 {
                    avg_ltv += user_balance.scaled_mul(reserve_data.configuration.ltv);
                    ic_cdk::println!("Average LTV updated to: {}", avg_ltv);
                } else {
                    has_zero_ltv_collateral = true;
                    ic_cdk::println!(
                        "Reserve '{}' has zero LTV collateral.",
                        user_reserve_data.reserve
                    );
                }

                avg_liquidation_threshold +=
                    user_balance.scaled_mul(reserve_data.configuration.liquidation_threshold);
                ic_cdk::println!(
                    "Average liquidation threshold updated to: {}",
                    avg_liquidation_threshold
                );

                available_borrow += user_balance.scaled_mul(reserve_data.configuration.ltv) / 100;
                ic_cdk::println!(
                    "available borrow after adding collateral of {} = {}",
                    reserve_name,
                    available_borrow
                );
            }

            if user_reserve_data.is_borrowed {
                ic_cdk::println!("Reserve '{}' is borrowed.", user_reserve_data.reserve);

                let user_debt = Self::get_user_debt_in_base_currency(
                    user_principal,
                    &user_reserve_data,
                    asset_price,
                )
                .await;
                total_debt += user_debt;
                ic_cdk::println!(
                    "Total debt for borrowed reserve '{}': {}",
                    user_reserve_data.reserve,
                    total_debt
                );
                available_borrow -= user_debt;
                if available_borrow == u128::MAX {
                    available_borrow = 0;
                }
                ic_cdk::println!(
                    "avaible borrow after subtracting debt = {}",
                    available_borrow
                );
            }
        }

        // ic_cdk::println!(
        //     "Total collateral: {}, Total debt: {}, Avg LTV: {}, Avg Liquidation Threshold: {}",
        //     total_collateral,
        //     total_debt,
        //     avg_ltv,
        //     avg_liquidation_threshold
        // );

        avg_ltv = if total_collateral != 0 {
            // weighted average.
            avg_ltv.scaled_div(total_collateral)
        } else {
            0
        };
        ic_cdk::println!("Final Avg LTV: {}", avg_ltv);

        avg_liquidation_threshold = if total_collateral != 0 {
            avg_liquidation_threshold.scaled_div(total_collateral)
        } else {
            0
        };
        ic_cdk::println!(
            "Final Avg Liquidation Threshold: {}",
            avg_liquidation_threshold
        );

        let health_factor = if total_debt == 0 {
            ic_cdk::println!("Health factor: No debt, setting to MAX.");
            u128::MAX
        } else {
            (total_collateral * avg_liquidation_threshold) / total_debt
        };
        ic_cdk::println!("Calculated Final Health Factor: {}", health_factor);

        ic_cdk::println!("Final avaiable borrow = {}", available_borrow);

        ic_cdk::println!(
            "Final calculated values: total_collateral = {}, total_debt = {}, avg_ltv = {}, avg_liquidation_threshold = {}, health_factor = {}, has_zero_ltv_collateral = {}, available_borrow = {}",
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral,
            available_borrow
        );

        Ok((
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            available_borrow,
            has_zero_ltv_collateral,
        ))
    }

    pub async fn get_user_balance_in_base_currency(
        user_principal: Principal,
        reserve: &UserReserveData,
        asset_price: u128,
    ) -> u128 {
        ic_cdk::println!("Calculating user balance in base currency...");
        ic_cdk::println!("User principal: {:?}", user_principal);
        ic_cdk::println!("Reserve: {:?}", reserve.reserve);
        ic_cdk::println!("Asset price: {}", asset_price);

        let asset_reserve = get_reserve_data(reserve.reserve.clone()).unwrap();
        // Simulate fetching user bto_i128(scaled balance multiplied by normalized income)
        let d_token_canister_principal: Principal =
            Principal::from_text(asset_reserve.d_token_canister.unwrap()).unwrap();

        let get_balance_value: Nat = get_balance(d_token_canister_principal, user_principal).await; // fetch from d token balance of user
        ic_cdk::println!(
            "Fetched balance from DToken canister: {:?}",
            get_balance_value
        );

        let nat_convert_value: Result<u128, String> = nat_to_u128(get_balance_value);

        let user_scaled_balance = match nat_convert_value {
            Ok(amount) => {
                ic_cdk::println!("User scaled balance: {}", amount);
                amount
            }
            Err(_) => {
                return 0;
            }
        };
        let normalized_supply = user_normalized_supply(reserve.clone());
        ic_cdk::println!("user balance normailized supply = {:?}", normalized_supply);
        let user_scaled_balanced_normalized =
            user_scaled_balance.scaled_mul(normalized_supply.unwrap());
        ic_cdk::println!(
            "user_scaled_balanced_normalized = {}",
            user_scaled_balanced_normalized
        );
        // Ask : get normailse incone function does not exist.
        ic_cdk::println!(
            "last of the base currency  = {}",
            user_scaled_balanced_normalized.scaled_mul(asset_price)
        );
        user_scaled_balanced_normalized.scaled_mul(asset_price)
    }

    pub async fn get_user_debt_in_base_currency(
        user_principal: Principal,
        reserve: &UserReserveData,
        asset_price: u128,
    ) -> u128 {
        ic_cdk::println!("Calculating user balance in debt currency...");
        ic_cdk::println!("User principal: {:?}", user_principal);
        ic_cdk::println!("Reserve data: {:?}", reserve.reserve);
        ic_cdk::println!("Asset price: {}", asset_price);

        let asset_reserve = get_reserve_data(reserve.reserve.clone()).unwrap();

        ic_cdk::println!("Fetching debt token canister principal from reserve...");
        let debt_token_canister_principal =
            Principal::from_text(asset_reserve.debt_token_canister.unwrap()).unwrap();

        // let get_balance_value = get_balance(debt_token_canister_principal, user_principal).await; // fetch from d token balance of user
        ic_cdk::println!("Fetching balance of user...");
        let get_balance_value = get_balance(debt_token_canister_principal, user_principal).await; // fetch from d token balance of user
        ic_cdk::println!("Balance value fetched: {:?}", get_balance_value);

        ic_cdk::println!("Converting balance value from Nat to u128...");
        let nat_convert_value: Result<u128, String> = nat_to_u128(get_balance_value);
        ic_cdk::println!("Conversion result: {:?}", nat_convert_value);

        let mut user_variable_debt = match nat_convert_value {
            Ok(amount) => {
                println!("Conversion successful, amount: {}", amount);
                amount
            }
            Err(_) => {
                return 0;
            }
        };

        ic_cdk::println!(
            "User variable debt before normalization: {}",
            user_variable_debt
        );
        //let mut user_variable_debt: u128 = 1_000_000;
        if user_variable_debt != 0 {
            user_variable_debt =
                user_variable_debt.scaled_mul(user_normalized_debt(reserve.clone()).unwrap());
            ic_cdk::println!(
                "User variable debt after normalization: {}",
                user_variable_debt
            );
        }

        let result = user_variable_debt.scaled_mul(asset_price);
        ic_cdk::println!("Final user debt in base currency: {}", result);
        result
    }
}

pub fn nat_to_u128(n: Nat) -> Result<u128, String> {
    n.0.to_u128()
        .ok_or_else(|| "Conversion failed: Nat is too large for u128.".to_string())
}
