// SPDX-License-Identifier: MIT
//he Context contract is used as a utility to provide information about the execution context, specifically the sender of the transaction and the transaction data. 
//This is particularly useful in scenarios involving Gas Station Network (GSN) meta-transactions, where the account that sends and pays for the execution might not be the actual sender as far as the application is concerned. 
//By using _msgSender() and _msgData(), contracts can abstract away the details of the underlying transaction and focus on the higher-level logic.
use ic_cdk::export::Principal;
// use ic_cdk_macros::update;

pub struct Context;

impl Context {
    pub fn _msg_sender() -> Principal {
        ic_cdk::caller()
    }

    pub fn _msg_data() -> Vec<u8> {
        ic_cdk::api::call::msg_arg_data()
    }
}

// #[update]
// fn example_function() {
//     let sender = Context::_msg_sender();
//     let data = Context::_msg_data();

//     ic_cdk::println!("Sender: {:?}", sender);
//     ic_cdk::println!("Data: {:?}", data);
// }
