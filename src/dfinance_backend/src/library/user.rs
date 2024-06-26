use declaration::user::UserData;
use ic_cdk::{caller, println, query, update};

use crate::{api::*, memory::{mutate_state, read_state}};

/* 
    Library to query username and set username
*/

#[update]
pub fn set_username(username: String) {
    let caller_id = caller();
    mutate_state(|state| {
        let user_data = &mut state.user_data;

        if let Some(mut user) = user_data.get(&caller_id) {
            user.set_username(username);
            println!("i am in if {:?}", user);
            state.user_data.insert(caller_id, user);
        }else{
            let mut user = UserData::default();
            user.set_username(username);
            println!("i am in else {:?}", user);
            state.user_data.insert(caller_id, user);
        }
    });

}

#[query]
pub fn get_username() -> String {
    read_state(|state| {state.user_data.get(&caller()).unwrap().get_username()})
}

// export_candid!();
