use candid::{CandidType, Principal};
use ic_cdk::{
    api::
        call::{call_with_cleanup, CdkError}
    ,
    export::{
        candid::{CandidType, Deserialize},
        Principal,
    },
    storage,
};
use std::collections::HashMap;
use ic_cdk_macros::*;

#[derive(CandidType, Deserialize)]
struct PermitParams {
    owner: Principal,
    spender: Principal,
    value: u64,
    nonce: u64,
    deadline: u64,
}

#[derive(CandidType, Deserialize)]
enum ATokenError {
    ZeroAddressNotValid,
    InvalidExpiration,
    InvalidSignature,
    PoolAddressesDoNotMatch,
    UnderlyingCannotBeRescued,
}

impl From<ATokenError> for CdkError {
    fn from(error: ATokenError) -> Self {
        match error {
            ATokenError::ZeroAddressNotValid => CdkError::CanisterError("ZeroAddressNotValid".to_string()),
            ATokenError::InvalidExpiration => CdkError::CanisterError("InvalidExpiration".to_string()),
            ATokenError::InvalidSignature => CdkError::CanisterError("InvalidSignature".to_string()),
            ATokenError::PoolAddressesDoNotMatch => CdkError::CanisterError("PoolAddressesDoNotMatch".to_string()),
            ATokenError::UnderlyingCannotBeRescued => CdkError::CanisterError("UnderlyingCannotBeRescued".to_string()),
        }
    }
}

#[derive(CandidType)]
struct State {
    treasury: Principal,
    underlying_asset: Principal,
    balances: HashMap<Principal, u64>,
    total_supply: u64,
    nonces: HashMap<Principal, u64>,
    permit_typehash: String,
}

impl Default for State {
    fn default() -> Self {
        Self {
            treasury: Principal::anonymous(),
            underlying_asset: Principal::anonymous(),
            balances: HashMap::new(),
            total_supply: 0,
            nonces: HashMap::new(),
            permit_typehash: "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)".to_string(),
        }
    }
}

#[init]
fn init(treasury: Principal, underlying_asset: Principal) {
    storage::write(State {
        treasury,
        underlying_asset,
        ..Default::default()
    });
}

#[update]
fn initialize(
    initializing_pool: Principal,
    treasury: Principal,
    underlying_asset: Principal,
    incentives_controller: Principal,
    a_token_decimals: u8,
    a_token_name: String,
    a_token_symbol: String,
    params: Vec<u8>,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if initializing_pool != Principal::anonymous() {
        return Err(ATokenError::PoolAddressesDoNotMatch.into());
    }
    _set_name(a_token_name.clone());
    _set_symbol(a_token_symbol.clone());
    _set_decimals(a_token_decimals);
    state.treasury = treasury;
    state.underlying_asset = underlying_asset;
    state.permit_typehash = "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)".to_string();
    storage::write(state);
    Ok(())
}

#[update]
fn mint(
    caller: Principal,
    on_behalf_of: Principal,
    amount: u64,
    index: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let caller_balance = state.balances.get(&caller).cloned().unwrap_or(0);
    let on_behalf_of_balance = state.balances.get(&on_behalf_of).cloned().unwrap_or(0);
    state.balances.insert(caller, caller_balance + amount);
    state.balances.insert(on_behalf_of, on_behalf_of_balance + amount);
    storage::write(state);
    Ok(())
}

#[update]
fn burn(
    from: Principal,
    receiver_of_underlying: Principal,
    amount: u64,
    index: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let from_balance = state.balances.get(&from).cloned().unwrap_or(0);
    if from_balance < amount {
        return Err("Insufficient balance".to_string());
    }
    let receiver_balance = state.balances.get(&receiver_of_underlying).cloned().unwrap_or(0);
    state.balances.insert(from, from_balance - amount);
    state.balances.insert(receiver_of_underlying, receiver_balance + amount);
    storage::write(state);
    Ok(())
}

#[update]
fn mint_to_treasury(
    amount: u64,
    index: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let treasury_balance = state.balances.get(&state.treasury).cloned().unwrap_or(0);
    state.balances.insert(state.treasury, treasury_balance + amount);
    storage::write(state);
    Ok(())
}

#[update]
fn transfer_on_liquidation(
    from: Principal,
    to: Principal,
    value: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let from_balance = state.balances.get(&from).cloned().unwrap_or(0);
    if from_balance < value {
        return Err("Insufficient balance".to_string());
    }
    let to_balance = state.balances.get(&to).cloned().unwrap_or(0);
    state.balances.insert(from, from_balance - value);
    state.balances.insert(to, to_balance + value);
    storage::write(state);
    Ok(())
}

#[query]
fn balance_of(owner: Principal) -> Result<u64, String> {
    let state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let balance = state.balances.get(&owner).cloned().unwrap_or(0);
    Ok(balance)
}

#[query]
fn total_supply() -> Result<u64, String> {
    let state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    Ok(state.total_supply)
}

#[update]
fn permit(
    owner: Principal,
    spender: Principal,
    value: u64,
    nonce: u64,
    deadline: u64,
    v: u8,
    r: Vec<u8>,
    s: Vec<u8>,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let current_nonce = state.nonces.get(&owner).cloned().unwrap_or(0);
    if nonce != current_nonce {
        return Err(ATokenError::InvalidSignature.into());
    }
    let mut domain_separator = "EIP712Domain(address verifyingContract,bytes32 salt)".to_string();
    let mut context = vec![];
    context.extend(domain_separator.as_bytes());
    context.extend(owner.to_bytes());
    context.extend(spender.to_bytes());
    context.extend(value.to_le_bytes());
    context.extend(nonce.to_le_bytes());
    context.extend(deadline.to_le_bytes());
    context.extend(v.to_le_bytes());
    context.extend(r);
    context.extend(s);
    state.nonces.insert(owner, current_nonce + 1);
    storage::write(state);
    Ok(())
}

#[update]
fn transfer(
    from: Principal,
    to: Principal,
    value: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let from_balance = state.balances.get(&from).cloned().unwrap_or(0);
    if from_balance < value {
        return Err("Insufficient balance".to_string());
    }
    let to_balance = state.balances.get(&to).cloned().unwrap_or(0);
    state.balances.insert(from, from_balance - value);
    state.balances.insert(to, to_balance + value);
    storage::write(state);
    Ok(())
}

#[update]
fn transfer_underlying_to(
    target: Principal,
    amount: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let target_balance = state.balances.get(&target).cloned().unwrap_or(0);
    state.balances.insert(target, target_balance + amount);
    storage::write(state);
    Ok(())
}

#[update]
fn handle_repayment(
    user: Principal,
    on_behalf_of: Principal,
    amount: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let user_balance = state.balances.get(&user).cloned().unwrap_or(0);
    let on_behalf_of_balance = state.balances.get(&on_behalf_of).cloned().unwrap_or(0);
    state.balances.insert(user, user_balance - amount);
    state.balances.insert(on_behalf_of, on_behalf_of_balance + amount);
    storage::write(state);
    Ok(())
}

#[update]
fn rescue_tokens(
    token: Principal,
    to: Principal,
    amount: u64,
) -> Result<(), String> {
    let mut state = storage::read::<State>();
    if state.treasury == Principal::anonymous() {
        return Err(ATokenError::ZeroAddressNotValid.into());
    }
    let token_balance = state.balances.get(&token).cloned().unwrap_or(0);
    state.balances.insert(token, token_balance + amount);
    storage::write(state);
    Ok(())
}
