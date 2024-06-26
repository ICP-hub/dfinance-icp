use ic_cdk::export_candid;
mod api;
mod memory;
mod types;

/* 
    Collection of all the libraries
*/

mod library;

export_candid!();
