use crate ::api;
use crate::types::TransferFromResult;
use ic_cdk::update;

#[update]
async fn add_liquidity_to_pool(token_name : String, amount : u128) -> Result<TransferFromResult, String> {
    api::adding_liquidity_to_canister(token_name, amount).await
}   


    

