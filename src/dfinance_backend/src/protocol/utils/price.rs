use crate::constants::validators::validate_asset_name;
use crate::{debug, error, info, trace};
use crate::protocol::utils::math_utils::{current_timestamp, ScalingMath};
use crate::stable_storage::state_handler::{insert_certified_value, mutate_state, read_state};
use crate::constants::errors::Error;
use crate::constants::constant_variables::constants::{SCALING_FACTOR, TOKEN_TRANSFER_FEE, XRC_CANISTER_NAME};
use crate::stable_storage::storable::Candid;
#[cfg(feature = "testnet")]
use crate::guards::access_control::check_is_tester;
use crate::guards::access_control::guard_controller_only;

use crate::declarations::datatypes::{CachedPrice, PriceCache};
use candid::Nat;
use ic_cdk::update;
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};
use std::collections::HashMap;
use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::{
    ONE_VALUE, TEST_CKBTC_PRICE, TEST_CKETH_PRICE, TEST_CKUSDC_PRICE, TEST_CKUSDT_PRICE, TEST_ICP_PRICE, XRC_CYCLES_FEE
};
use crate::protocol::utils::log::{log_internal,LogLevel};

/*
 * @title Price Cache Management
 * @functionality Provides a caching mechanism for asset prices to optimize exchange rate lookups and reduce redundant external API calls
 * @dev Handles storing and retrieving cached prices of assets to avoid redundant calls.
 *      Allows fetching and updating asset exchange rates efficiently.
 */
impl PriceCache {
    /*
     * @title Get Cached Price
     * @functionality Retrieves stored asset prices from the cache to avoid unnecessary external calls
     * @dev Retrieves the cached exchange rate for a given asset, if available.
     * @param asset The name of the asset (e.g., "ckBTC", "ckETH").
     * @returns Option<Nat> - Returns the cached price if it exists, otherwise `None`.
     */
    pub fn get_cached_price_simple(&self, asset: &str) -> Option<Nat> {
        self.cache
            .get(asset)
            .map(|cached_price| cached_price.price.clone())
    }

    /*
     * @title Set Cached Price
     * @functionality Updates the in-memory price cache with new asset exchange rate values
     * @dev Updates the cached price for a specific asset.
     * @param asset The name of the asset.
     * @param price The latest exchange rate for the asset.
     */
    pub fn set_price(&mut self, asset: String, price: Nat) {
        self.cache.insert(asset, CachedPrice { price });
    }
}

/*
 * @title Update Reserve Prices
 * @functionality Refreshes all cached asset prices by fetching latest rates from the exchange rate oracle
 * @dev Fetches the latest exchange rates for all reserves and updates the cache.
 *      This function iterates through all the registered reserves and fetches new prices.
 */
#[update]
pub async fn update_reserves_price() -> Result<(), Error> {
    trace!("update_reserves_price called");

    guard_controller_only()?;

    // Fetch all the keys (asset names) from the reserve list
    let keys: Vec<String> = read_state(|state| 
        state.reserve_list
            .iter()
            .map(|(key, _value)| key)
            .collect()
    );

    for asset_name in keys {
         get_exchange_rates(asset_name.clone(), None, Nat::from(0u128)).await?;
    }
    Ok(())
}

/*
 * @title Update Token Price
 * @functionality Updates the cached price for a single specific token
 * @dev Fetches the latest exchange rate for a single asset and updates the cache.
 * @param asset The name of the asset whose price needs to be updated.
 */
pub async fn update_token_price(asset: String) -> Result<(), Error> {
   
    if let Err(e) = get_exchange_rates(asset, None, Nat::from(ONE_VALUE)).await {
        error!("Error updating token price: {:?}", e);
        return Err(e);
    };
    info!(
        "Price cache updated successfully"
    );

    Ok(())
}

/*
 * @title Fetch Exchange Rates
 * @functionality Retrieves real-time exchange rates from external price oracle services for converting between assets
 * @dev Fetches the latest exchange rate of a given base asset against a quote asset.
 *      Supports both cryptocurrency and fiat asset classes.
 * @param base_asset_symbol The base asset for which exchange rate is needed.
 * @param quote_asset_symbol The asset against which the base asset is quoted. Defaults to USDT.
 * @param amount The amount of the base asset to convert.
 * @returns Result<(Nat, u64), ()> - Returns the exchange rate value and the timestamp.
 */
pub async fn get_exchange_rates(
    base_asset_symbol: String,
    quote_asset_symbol: Option<String>,
    amount: Nat,
) -> Result<(Nat, u64), Error> {
    trace!("get_exchange_rates called");
  
    validate_asset_name(&base_asset_symbol)?;
    if let Some(ref symbol) = quote_asset_symbol {
        validate_asset_name(symbol)?;
    }
 
    let base_asset = normalize_symbol(&base_asset_symbol);

    let quote_asset = normalize_symbol(&quote_asset_symbol.unwrap_or_else(|| "USDT".to_string()));


    let args = GetExchangeRateRequest {
        timestamp: None,
        quote_asset: Asset {
            class: if quote_asset == "USD" {
                AssetClass::FiatCurrency
            } else {
                AssetClass::Cryptocurrency
            },
            symbol: quote_asset.clone(),
        },
        base_asset: Asset {
            class: if base_asset == "USD" {
                AssetClass::FiatCurrency
            } else {
                AssetClass::Cryptocurrency
            },
            symbol: base_asset.clone(),
        },
    };

    let xrc_canister_id = get_canister_id_by_name(XRC_CANISTER_NAME.to_string()).map_err(|_e| {
        Error::NoCanisterIdFound
    })?;
    let res = ic_cdk::api::call::call_with_payment128(
        xrc_canister_id,
        "get_exchange_rate",
        (args,),
        XRC_CYCLES_FEE,
    )
    .await;

    let response = match res {
        Ok((GetExchangeRateResult::Ok(v),)) => v,
        Ok((GetExchangeRateResult::Err(e),)) => {
            error!("Exchange rate error: {:?}", e);
            return Err(Error::ExchangeRateError);
        }
        Err(e) => {
            error!("Call failed: {:?}", e);
            return Err(Error::ExchangeRateError);
        }
    };
    let quote = response.rate;
    let pow = 10u64.pow(response.metadata.decimals);
    let exchange_rate = (Nat::from(quote) * Nat::from(SCALING_FACTOR)) / Nat::from(pow);
    let total_value = (Nat::from(quote) * amount) / Nat::from(pow);
    let time = current_timestamp();
    if quote_asset == "USDT" {
        let mut price_cache_data = mutate_state(|state| {
            let price_cache_data = &mut state.price_cache_list;
            if !price_cache_data.contains_key(&base_asset) {
                price_cache_data.insert(base_asset.clone(), Candid(PriceCache { cache: HashMap::new() }));
                
            }
           
            match price_cache_data.get(&base_asset) {
                Some(Candid(data)) => Ok::<_, String>(data.clone()),
                None => Err("Failed to retrieve or insert price cache".to_string()),
            }
           
        }).map_err(|_| Error::NoPriceCache)?;

        price_cache_data.set_price(base_asset_symbol.clone(), exchange_rate);
        
        mutate_state(|state| {
            state
                .price_cache_list
                .insert(base_asset.clone(), Candid(price_cache_data.clone()));
            insert_certified_value("price_cache".to_string(), price_cache_data);
        });
        
    }

    Ok((total_value, time))
}

/*
 * @title Update Price Cache for Assets with Predefined Manual Prices (For Testing Purpose - Pocket IC)
 * @functionality Provides a testing mechanism to populate the price cache with predefined values for simulated environments
 * @dev This function checks if the caller is a valid tester for Pocket IC and iterates over the assets in the state,
 *      updating their price caches with manually defined prices. If no price is found for an asset,
 *      it logs the absence of the price. If a price cache does not exist, a new one is created.
 * @param None
 * @returns
 *      - `Ok(())`: if the price update process completes successfully.
 *      - `Err(Error::InvalidUser)`: if the caller is not a valid tester.
 *      - `Err(Error::ExchangeRateError)`: if updating the price cache fails.
 */
#[cfg(feature = "testnet")]
#[update]
pub async fn mock_price_data() -> Result<(), Error> {
    trace!("mock_price_data called");
    if !check_is_tester() {
        error!("Invalid User");
        return Err(Error::InvalidUser);
    };

    let manual_prices: HashMap<String, Nat> = vec![
        ("ckBTC".to_string(), Nat::from(TEST_CKBTC_PRICE)),
        ("ckETH".to_string(), Nat::from(TEST_CKETH_PRICE)),
        ("ICP".to_string(), Nat::from(TEST_ICP_PRICE)),
        ("ckUSDC".to_string(), Nat::from(TEST_CKUSDC_PRICE)),
        ("ckUSDT".to_string(), Nat::from(TEST_CKUSDT_PRICE)),
    ]
    .into_iter()
    .collect();

    let keys: Vec<String> = read_state(|state| {
        state
            .reserve_list
            .iter()
            .map(|(key, _)| key.clone())
            .collect()
    });

    for base_asset_symbol in keys {
        debug!("Updating test price for asset: {}", base_asset_symbol);
        let base_asset = normalize_symbol(&base_asset_symbol);

        if let Some(price) = manual_prices.get(&base_asset_symbol) {
            debug!("Found manual price for {}: {:?}", base_asset_symbol, price);

            let price_cache_result: Result<PriceCache, String> = mutate_state(|state| {
                let price_cache_data = &mut state.price_cache_list;
                if let Some(price_cache) = price_cache_data.get(&base_asset) {
                    
                    Ok(price_cache.0.clone())
                } else {
                    let new_price_cache: PriceCache = PriceCache {
                        cache: HashMap::new(),
                    };
                    price_cache_data.insert(base_asset.clone(), Candid(new_price_cache.clone()));
                    Ok(new_price_cache)
                }
            });

            if let Ok(mut price_cache_data) = price_cache_result {
                price_cache_data.set_price(base_asset_symbol.clone(), price.clone());
                debug!("price cache after setting =  {:?}", price_cache_data.cache);

                mutate_state(|state| {
                    state
                        .price_cache_list
                        .insert(base_asset.clone(), Candid(price_cache_data.clone()));
                    insert_certified_value("price_cache".to_string(), price_cache_data);
                });
            } else {
                error!("Failed to update price cache for {}", base_asset_symbol);
                return Err(Error::ExchangeRateError);
            }
        } else {
            debug!("No manual price found for asset: {}", base_asset_symbol);
        }
    }
    info!("Price update process completed successfully.");
    Ok(())
}


fn normalize_symbol(symbol: &str) -> String {
    match symbol {
        "ckBTC" => "btc".to_string(),
        "ckETH" => "eth".to_string(),
        "ckUSDC" => "usdc".to_string(),
        "ckUSDT" => "usdt".to_string(),
        _ => symbol.to_string(), 
    }
}



pub fn get_cached_exchange_rate(base_asset_symbol: String) -> Result<Nat, Error> {
    trace!("calling get_cached_exchange_rate");
    // asset validator
    validate_asset_name(&base_asset_symbol)?;
    
    let base_asset = match base_asset_symbol.as_str() {
        "ckBTC" => "btc",
        "ckETH" => "eth",
        "ckUSDC" => "usdc",
        "ckUSDT" => "usdt",
        _ => base_asset_symbol.as_str(),
    };

    debug!("base asset and base_asset_symbol {}, {}", base_asset , base_asset_symbol);
    
   read_state(|state| {
        state
            .price_cache_list
            .get(&base_asset.to_string())
            .map(|price_cache: Candid<PriceCache>| {
                price_cache
                    .0
                    .cache
                    .get(&base_asset_symbol)
                    .map(|p| p.price.clone())
            })
            .flatten()
            .ok_or(Error::NoPriceCache)
    })

}


/**
 * @title Calculate Transfer Fee
 * @dev Computes the fee for transferring an asset based on its exchange rate.
 * 
 * @params
 * @param asset_name - Name of the asset (e.g., "ICP", "BTC").
 * @param amount - Transfer amount.
 * 
 * @returns
 * @return Ok(Nat) - Calculated fee.
 * @return Err(Error) - If fee exceeds amount or rate fetch fails.
 * 
 * @errors
 * - FeeExceedsAmount
 * - Errors from `get_cached_exchange_rate`
 */
pub fn calculate_transfer_fee(
    asset_name: &str,
    amount: Nat,
) -> Result<Nat, Error> {

    let asset_price = get_cached_exchange_rate(asset_name.to_string())?;

    // Calculate Fee in Asset Terms
    let transfer_token_fee = Nat::from(TOKEN_TRANSFER_FEE).scaled_div(asset_price); 

    if amount < transfer_token_fee {
        return Err(Error::FeeExceedsAmount);
    }

    Ok(transfer_token_fee)
}
