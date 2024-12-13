use crate::api::functions::get_balance;
use crate::api::functions::update_balance;
use crate::protocol::libraries::logic::user::nat_to_u128;
use crate::protocol::libraries::math::math_utils;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use ic_cdk::api::time;

use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;

use crate::protocol::libraries::logic::interest_rate::{
    calculate_interest_rates, initialize_interest_rate_params,
};
use crate::protocol::libraries::math::math_utils::ScalingMath;

use crate::protocol::libraries::types::datatypes::UserState;

use crate::api::functions::asset_transfer;
use candid::{Nat, Principal};

fn current_timestamp() -> u64 {
    time() / 1_000_000_000 // time() returns nanoseconds.
}

pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
        d_token_canister: reserve_data.d_token_canister.clone(),
        debt_token_canister: reserve_data.debt_token_canister.clone(),
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,

        curr_liquidity_index: reserve_data.liquidity_index.clone(),
        next_liquidity_index: reserve_data.liquidity_index.clone(),
        curr_liquidity_rate: reserve_data.current_liquidity_rate.clone(),

        curr_debt_index: reserve_data.debt_index.clone(),
        curr_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_rate: reserve_data.borrow_rate.clone(),
        next_debt_index: reserve_data.debt_index.clone(),
        debt_last_update_timestamp: 0,

        reserve_factor: reserve_data.configuration.reserve_factor.clone(),

        curr_debt: reserve_data.asset_borrow.clone(), //TODO take from total_supply of debt token or update this while minting and burning the tokens
        //next_debt
        curr_supply: reserve_data.asset_supply.clone(), //TODO take from total_supply of d token or update this while minting and burning the tokens
    }
}

pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);
    accrue_to_treasury(reserve_data, reserve_cache); //TODO review this code

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != Nat::from(0u128) {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
        );
        reserve_cache.next_liquidity_index =
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index.clone());

        reserve_data.liquidity_index = reserve_cache.next_liquidity_index.clone();
    }
    //TODO compare the total_debt
    if reserve_cache.curr_debt_index != Nat::from(0u128) {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate.clone(),
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        reserve_cache.next_debt_index =
            cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index.clone());
        reserve_data.debt_index = reserve_cache.next_debt_index.clone();
    }
}

pub async fn update_interest_rates(
    reserve_data: &mut ReserveData,
    reserve_cache: &mut ReserveCache,
    total_borrowed: Nat,
    total_supplies: Nat,
) {
    let total_debt = total_borrowed.clone().scaled_mul(reserve_cache.curr_debt_index.clone());
    let total_supply = total_supplies.scaled_mul(reserve_cache.curr_liquidity_index.clone());
    let asset = reserve_data
        .asset_name
        .clone()
        .unwrap_or("no token".to_string());
    let interest_rate_params = initialize_interest_rate_params(&asset);
    ic_cdk::println!("interest rate params {:?}", interest_rate_params);
    ic_cdk::println!("total debt: {:?}", total_debt);
    let (next_liquidity_rate, next_debt_rate) = calculate_interest_rates(
        total_supply.clone(),
        total_borrowed.clone(),
        total_debt,
        reserve_cache.curr_debt_rate.clone(),
        &interest_rate_params,
        reserve_cache.reserve_factor.clone(),
    );
    reserve_data.asset_borrow = total_borrowed; //TODO remove this
    reserve_data.asset_supply = total_supply; //TODO remove this
    reserve_data.current_liquidity_rate = next_liquidity_rate;
    reserve_data.borrow_rate = next_debt_rate;
    ic_cdk::println!(
        "reserve_data.total_borrowed: {:?}",
        reserve_data.total_borrowed
    );
}

// pub async fn burn_scaled(
//     user_state: &mut UserState,
//     amount: u128,
//     current_liquidity_index: u128,
//     user_principal: Principal,
//     token_canister_principal: Principal,
//     platform_principal: Principal,
// ) -> Result<(), String> {
//     ic_cdk::println!("burn user state value = {:?}", user_state);
//     ic_cdk::println!("burn amount value = {}", amount);
//     ic_cdk::println!(
//         "burn current_liquidity_index value = {}",
//         current_liquidity_index
//     );
//     ic_cdk::println!("burn user_principal value = {}", user_principal);
//     ic_cdk::println!(
//         "burn token_canister_principal value = {}",
//         token_canister_principal
//     );
//     ic_cdk::println!("burn platform_principal value = {}", platform_principal);

//     let adjusted_amount = amount.scaled_div(current_liquidity_index);

//     if adjusted_amount == 0 {
//         return Err("Invalid burn amount".to_string());
//     }

//     // Calculate interest accrued since the last liquidity index update
//     let balance_increase = (user_state
//         .adjusted_balance
//         .scaled_mul(current_liquidity_index))
//         - (user_state
//             .adjusted_balance
//             .scaled_mul(user_state.last_liquidity_index));

//     if adjusted_amount > user_state.adjusted_balance + balance_increase {
//         return Err("Insufficient balance to burn".to_string());
//     }

//     user_state.adjusted_balance -= adjusted_amount;

//     user_state.last_liquidity_index = current_liquidity_index;

//     ic_cdk::println!("burn updated user state = {:?}", user_state);

//     let burn_amount = adjusted_amount as u128;

//     // Perform token transfer from the user to the platform to burn the tokens
//     match asset_transfer(
//         platform_principal,
//         token_canister_principal,
//         user_principal,
//         Nat::from(burn_amount),
//     )
//     .await
//     {
//         Ok(_) => {
//             ic_cdk::println!("Dtoken transfer from user to backend executed successfully");
//             Ok(())
//         }
//         Err(err) => Err(format!("Burning failed. Error: {:?}", err)),
//     }
// }

//TODO change the param of burn function according to mint.
pub async fn burn_scaled(
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    burn_dtoken: bool,
) -> Result<(), String> {
    //TODO if user is not caller, then
    //TODO if to is not backend, transfer it to other
    ic_cdk::println!("burn user state value = {:?}", user_state);
    ic_cdk::println!("burn amount value = {}", amount);
    ic_cdk::println!("burn current_liquidity_index value = {}", index);
    ic_cdk::println!("burn user_principal value = {}", user_principal);
    ic_cdk::println!(
        "burn token_canister_principal value = {}",
        token_canister_principal
    );
    ic_cdk::println!("burn platform_principal value = {}", platform_principal);

    let adjusted_amount = amount.clone().scaled_div(index.clone());
    ic_cdk::println!("adjusted_amount calculated = {}", adjusted_amount);

    if adjusted_amount == Nat::from(0u128) {
        return Err("Invalid burn amount".to_string());
    }

    let balance = get_balance(token_canister_principal, user_principal).await;
    ic_cdk::println!("balance_nat retrieved = {:?}", balance);

    // let balance = match nat_to_u128(balance_nat) {
    //     Ok(bal) => {
    //         ic_cdk::println!("balance converted to u128: {}", bal);
    //         bal
    //     }
    //     Err(err) => {
    //         ic_cdk::println!("Error converting balance to u128: {:?}", err);
    //         return Err("Error converting balance to u128".to_string());
    //     }
    // };

    let mut balance_increase = Nat::from(0u128);
    if burn_dtoken {
        balance_increase =
            (balance.clone().scaled_mul(index.clone())) - (balance.clone().scaled_mul(user_state.liquidity_index.clone()));
        ic_cdk::println!("balance_increase calculated = {}", balance_increase);

        user_state.d_token_balance -= adjusted_amount;
        user_state.liquidity_index = index;
    } else {
        balance_increase =
            (balance.clone().scaled_mul(index.clone())) - (balance.clone().scaled_mul(user_state.variable_borrow_index.clone())); //fetch from user
        ic_cdk::println!("balance_increase calculated = {}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.debt_token_blance -= adjusted_amount;
        user_state.variable_borrow_index = index;
    }

    if balance_increase > amount {
        let amount_to_mint = balance_increase - amount;
        ic_cdk::println!(
            "balance_increase is greater than amount, amount_to_mint = {}",
            amount_to_mint
        );

        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            amount_to_mint,
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("token transfer from backend to user executed successfully");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
                Err(format!("Minting failed. Error: {:?}", err))
            }
        }
    } else {
        let amount_to_burn = amount - balance_increase;
        ic_cdk::println!(
            "balance_increase is not greater than amount, amount_to_burn = {}",
            amount_to_burn
        );

        match asset_transfer(
            platform_principal,
            token_canister_principal,
            user_principal,
            Nat::from(amount_to_burn),
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("token transfer from user to backend executed successfully");
                Ok(())
            }
            Err(err) => {
                ic_cdk::println!("Error: Burning failed. Error: {:?}", err);
                Err(format!("Burning failed. Error: {:?}", err))
            }
        }
    }
}

pub async fn mint_scaled(
    reserve_data: &mut ReserveData,
    user_state: &mut UserReserveData,
    amount: Nat,
    index: Nat,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
    minting_dtoken: bool,
) -> Result<(), String> {
    ic_cdk::println!("--- mint_scaled_modified called ---");
    ic_cdk::println!("Initial user state: {:?}", user_state);
    ic_cdk::println!("Amount value: {}", amount);
    ic_cdk::println!("Current liquidity index value: {}", index);
    ic_cdk::println!("User principal value: {}", user_principal);
    ic_cdk::println!("current_liquidity_index value = {}", index);
    ic_cdk::println!("user_principal value = {}", user_principal);
    ic_cdk::println!(
        "token_canister_principal value = {}",
        token_canister_principal
    );
    ic_cdk::println!("Platform principal value: {}", platform_principal);

    let adjusted_amount = amount.clone().scaled_div(index.clone());
    ic_cdk::println!("Adjusted amount: {}", adjusted_amount);
    if adjusted_amount == Nat::from(0u128) {
        ic_cdk::println!("Error: Invalid mint amount");
        return Err("Invalid mint amount".to_string());
    }

    // Calculate interest accrued since the last liquidity index update
    // let balance_increase = (user_state
    //     .adjusted_balance
    //     .scaled_mul(current_liquidity_index))
    //     - (user_state
    //         .adjusted_balance
    //         .scaled_mul(user_state.index));

    // user_state.adjusted_balance += adjusted_amount + balance_increase;

    // user_state.index = current_liquidity_index;

    // ic_cdk::println!("updated user state value = {:?}", user_state);

    // let newmint: u128 = adjusted_amount as u128;

    // // Perform token transfer to the user with the newly minted aTokens
    // match asset_transfer(
    //     user_principal,
    //     token_canister_principal,
    //     platform_principal,
    //     Nat::from(newmint),
    // )
    // .await
    // {
    //     Ok(_) => {
    //         ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
    //         Ok(())
    //     }
    //     Err(err) => Err(format!("Minting failed. Error: {:?}", err)),
    // }
    let balance = get_balance(token_canister_principal, user_principal).await;
    ic_cdk::println!("Fetched balance in Nat: {:?}", balance);

    //let balance = nat_to_u128(balance_nat).unwrap();
    ic_cdk::println!("mint balance = {}", balance);
    println!("Balance as u128: {}", balance);
    let mut balance_increase = Nat::from(0u128);
    if minting_dtoken {
        println!("minting dtoken**************");
        balance_increase =
            (balance.clone().scaled_mul(index.clone())) - (balance.clone().scaled_mul(user_state.liquidity_index.clone())); //fetch from user
        println!("balance incr dtoken{}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.d_token_balance += adjusted_amount.clone();
        reserve_data.asset_supply += adjusted_amount.clone();
        println!("user new dtoken balance {}", user_state.d_token_balance);
        user_state.liquidity_index = index;
        println!("user new liq index {}", user_state.liquidity_index);
    } else {
        println!("minting debttoken*************");
        balance_increase =
            (balance.clone().scaled_mul(index.clone())) - (balance.clone().scaled_mul(user_state.variable_borrow_index.clone())); //fetch from user
        println!("balance incr debttoken{}", balance_increase);
        // user_state.adjusted_balance += adjusted_amount + balance_increase; //not sure with this line
        user_state.debt_token_blance += adjusted_amount.clone();
        reserve_data.asset_borrow += adjusted_amount.clone();
        println!("new debt balance {}", user_state.debt_token_blance);
        user_state.variable_borrow_index = index;
        println!("new debt index {}", user_state.variable_borrow_index);
    }

    //same
    //TODO add into total supply also
    //update balance with oldbalance +adjusted_amount
    // let _ = update_balance(token_canister_principal, user_principal, balance+adjusted_amount);
    // ic_cdk::println!("updated user state value = {:?}", user_state);

    let newmint  = amount + balance_increase;
    println!("minted token {}", newmint);
    // Perform token transfer to the user with the newly minted aTokens
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        newmint,
    )
    .await
    {
        Ok(_) => {
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
            Ok(())
        }
        Err(err) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
            Err(format!("Minting failed. Error: {:?}", err))
        }
    }
}

// pub async fn mint_scaled(
//     user_state: &mut UserState,
//     amount: u128,
//     current_liquidity_index: u128,
//     user_principal: Principal,
//     token_canister_principal: Principal,
//     platform_principal: Principal,
// ) -> Result<(), String> {
//     ic_cdk::println!("user state value = {:?}", user_state);
//     ic_cdk::println!("amount value = {}", amount);
//     ic_cdk::println!(
//         "current_liquidity_index value = {}",
//         current_liquidity_index
//     );
//     ic_cdk::println!("user_principal value = {}", user_principal);
//     ic_cdk::println!(
//         "token_canister_principal value = {}",
//         token_canister_principal
//     );
//     ic_cdk::println!("platform_principal value = {}", platform_principal);

//     let adjusted_amount: u128 = amount.scaled_div(current_liquidity_index);
//     if adjusted_amount == 0 {
//         return Err("Invalid mint amount".to_string());
//     }

//     // Calculate interest accrued since the last liquidity index update
//     let balance_increase = (user_state
//         .adjusted_balance
//         .scaled_mul(current_liquidity_index))
//         - (user_state
//             .adjusted_balance
//             .scaled_mul(user_state.last_liquidity_index));

//     user_state.adjusted_balance += adjusted_amount + balance_increase;

//     user_state.last_liquidity_index = current_liquidity_index;

//     ic_cdk::println!("updated user state value = {:?}", user_state);

//     let newmint: u128 = adjusted_amount as u128;

//     // Perform token transfer to the user with the newly minted aTokens
//     match asset_transfer(
//         user_principal,
//         token_canister_principal,
//         platform_principal,
//         Nat::from(newmint),
//     )
//     .await
//     {
//         Ok(_) => {
//             ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
//             Ok(())
//         }
//         Err(err) => Err(format!("Minting failed. Error: {:?}", err)),
//     }
//}

pub fn accrue_to_treasury(reserve_data: &mut ReserveData, reserve_cache: &ReserveCache) {
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == Nat::from(0u128) {
        return;
    }

    vars.prev_total_variable_debt =
        ScalingMath::scaled_mul(reserve_cache.curr_debt.clone(), reserve_cache.curr_debt_index.clone());

    vars.curr_total_variable_debt =
        ScalingMath::scaled_mul(reserve_cache.curr_debt.clone(), reserve_cache.next_debt_index.clone());

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;

    vars.amount_to_mint =
        ScalingMath::scaled_mul(vars.total_debt_accrued.clone(), reserve_cache.reserve_factor.clone()); //percent

    if vars.amount_to_mint != Nat::from(0u128) {
        reserve_data.accure_to_platform +=
            (ScalingMath::scaled_mul(vars.amount_to_mint, reserve_cache.next_liquidity_index.clone()))
                / 100 as u128;
    }
}

struct AccrueToTreasuryLocalVars {
    prev_total_variable_debt: Nat,
    curr_total_variable_debt: Nat,
    total_debt_accrued: Nat,
    amount_to_mint: Nat,
}

impl Default for AccrueToTreasuryLocalVars {
    fn default() -> Self {
        AccrueToTreasuryLocalVars {
            prev_total_variable_debt: Nat::from(0u128),
            curr_total_variable_debt: Nat::from(0u128),
            total_debt_accrued: Nat::from(0u128),
            amount_to_mint: Nat::from(0u128),
        }
    }
}

// #[derive(Default, Debug, CandidType, Deserialize, Serialize)]
// struct UpdateInterestRatesLocalVars {
//     next_liquidity_rate: u128,
//     next_stable_rate: u128,
//     next_variable_rate: u128,
//     total_variable_debt: u128,
// }

// function executeMintToTreasury(
//     mapping(address => DataTypes.ReserveData) storage reservesData,
//     address[] calldata assets
//   ) external {
//     for (uint256 i = 0; i < assets.length; i++) {
//       address assetAddress = assets[i];

//       DataTypes.ReserveData storage reserve = reservesData[assetAddress];

//       // this cover both inactive reserves and invalid reserves since the flag will be 0 for both
//       if (!reserve.configuration.getActive()) {
//         continue;
//       }

//       uint256 accruedToTreasury = reserve.accruedToTreasury;

//       if (accruedToTreasury != 0) {
//         reserve.accruedToTreasury = 0;
//         uint256 normalizedIncome = reserve.getNormalizedIncome();
//         uint256 amountToMint = accruedToTreasury.rayMul(normalizedIncome);
//         IAToken(reserve.aTokenAddress).mintToTreasury(amountToMint, normalizedIncome);

//         emit MintedToTreasury(assetAddress, amountToMint);
//       }
//     }
//   }

// function mintToTreasury(address[] calldata assets) external virtual override {
//     PoolLogic.executeMintToTreasury(_reserves, assets);
//   }

///// @inheritdoc IAToken
// function mintToTreasury(uint256 amount, uint256 index) external virtual override onlyPool {
//     if (amount == 0) {
//       return;
//     }
//     _mintScaled(address(POOL), _treasury, amount, index);
//   }

//  /**
//    * @notice Mints the assets accrued through the reserve factor to the treasury in the form of aTokens
//    * @param assets The list of reserves for which the minting needs to be executed
//    */
//   function mintToTreasury(address[] calldata assets) external;
//   /**
//    * @notice Implements the basic logic to mint a scaled balance token.
//    * @param caller The address performing the mint
//    * @param onBehalfOf The address of the user that will receive the scaled tokens
//    * @param amount The amount of tokens getting minted
//    * @param index The next liquidity index of the reserve
//    * @return `true` if the the previous balance of the user was 0
//    */
//   function _mintScaled(
//     address caller,
//     address onBehalfOf,
//     uint256 amount,
//     uint256 index
//   ) internal returns (bool) {
//     uint256 amountScaled = amount.rayDiv(index);
//     require(amountScaled != 0, Errors.INVALID_MINT_AMOUNT);

//     uint256 scaledBalance = super.balanceOf(onBehalfOf);
//     uint256 balanceIncrease = scaledBalance.rayMul(index) -
//       scaledBalance.rayMul(_userState[onBehalfOf].additionalData);

//     _userState[onBehalfOf].additionalData = index.toUint128();

//     _mint(onBehalfOf, amountScaled.toUint128());

//     uint256 amountToMint = amount + balanceIncrease;
//     emit Transfer(address(0), onBehalfOf, amountToMint);
//     emit Mint(caller, onBehalfOf, amountToMint, balanceIncrease, index);

//     return (scaledBalance == 0);
//   }

// function mint(
//     address user,
//     address onBehalfOf,
//     uint256 amount,
//     uint256 index
//   ) external virtual override onlyPool returns (bool, uint256) {
//     if (user != onBehalfOf) {
//       _decreaseBorrowAllowance(onBehalfOf, user, amount);
//     }
//     return (_mintScaled(user, onBehalfOf, amount, index), scaledTotalSupply());
//   }
