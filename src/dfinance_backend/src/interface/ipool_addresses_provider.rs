use ic_cdk::export::candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct AddressSet {
    pub id: String,
    pub old_address: Option<String>,
    pub new_address: String,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ProxyCreated {
    pub id: String,
    pub proxy_address: String,
    pub implementation_address: String,
}

pub trait IPoolAddressesProvider {
    fn get_market_id(&self) -> String;
    fn set_market_id(&self, new_market_id: String);
    fn get_address(&self, id: String) -> Option<String>;
    fn set_address(&self, id: String, new_address: String);
    fn set_address_as_proxy(&self, id: String, new_implementation_address: String);
    fn get_pool(&self) -> Option<String>;
    fn set_pool_impl(&self, new_pool_impl: String);
    fn get_pool_configurator(&self) -> Option<String>;
    fn set_pool_configurator_impl(&self, new_pool_configurator_impl: String);
    fn get_price_oracle(&self) -> Option<String>;
    fn set_price_oracle(&self, new_price_oracle: String);
    fn get_acl_manager(&self) -> Option<String>;
    fn set_acl_manager(&self, new_acl_manager: String);
    fn get_acl_admin(&self) -> Option<String>;
    fn set_acl_admin(&self, new_acl_admin: String);
    fn get_price_oracle_sentinel(&self) -> Option<String>;
    fn set_price_oracle_sentinel(&self, new_price_oracle_sentinel: String);
    fn get_pool_data_provider(&self) -> Option<String>;
    fn set_pool_data_provider(&self, new_data_provider: String);
}
