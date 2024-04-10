use crate::{api, types::User, with_state};
use ic_cdk::{caller, query, update};

#[query]
fn check_username(username: String) -> bool {
    with_state(|state| api::username_exists(state, username.clone()))
}
