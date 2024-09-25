use candid::Principal;
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};

#[ic_cdk_macros::update]  
pub async fn get_exchange_rates(base_asset_symbol: String) -> Result<(f64, u64), String> {
    let args = GetExchangeRateRequest {
        timestamp: None,
        quote_asset: Asset {
            class: AssetClass::Cryptocurrency,
            symbol: "USDT".to_string(),
        },
        base_asset: Asset {
            class: AssetClass::Cryptocurrency,
            symbol: base_asset_symbol.clone(),  
        },
    };

    let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> 
    = ic_cdk::api::call::call_with_payment128(Principal::from_text("asrmz-lmaaa-aaaaa-qaaeq-cai").unwrap(), "get_exchange_rate", (args,), 1_000_000_000).await;

    match res {
        Ok(res_value) => {
            match res_value.0 {
                GetExchangeRateResult::Ok(v) => {
                    let quote = v.rate;
                    let pow = 10usize.pow(v.metadata.decimals);
                    let res = quote as f64 / pow as f64;
                    let time = ic_cdk::api::time();
                    return Ok((res, time));
                },
                GetExchangeRateResult::Err(e) => {
                    return Err(format!("ERROR :: {:?}", e));
                }
            }
        },
        Err(error) => {
            return Err(format!("Could not get USD/{} Rate - {:?} - {}", base_asset_symbol.clone(), error.0, error.1));
        },
    }
}


