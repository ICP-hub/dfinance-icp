use std::collections::HashMap;

pub trait IPoolAddressesProvider {
    fn get_market_id(&self) -> String;
    fn set_market_id(&mut self, new_market_id: String);
    fn get_address(&self, id: &[u8]) -> Option<String>;
    fn set_address_as_proxy(&mut self, id: &[u8], new_implementation_address: String);
    fn set_address(&mut self, id: &[u8], new_address: String);
    fn get_pool(&self) -> Option<String>;
    fn set_pool_impl(&mut self, new_pool_impl: String);
    fn get_pool_configurator(&self) -> Option<String>;
    fn set_pool_configurator_impl(&mut self, new_pool_configurator_impl: String);
    fn get_price_oracle(&self) -> Option<String>;
    fn set_price_oracle(&mut self, new_price_oracle: String);
    fn get_acl_manager(&self) -> Option<String>;
    fn set_acl_manager(&mut self, new_acl_manager: String);
    fn get_acl_admin(&self) -> Option<String>;
    fn set_acl_admin(&mut self, new_acl_admin: String);
    fn get_price_oracle_sentinel(&self) -> Option<String>;
    fn set_price_oracle_sentinel(&mut self, new_price_oracle_sentinel: String);
    fn get_pool_data_provider(&self) -> Option<String>;
    fn set_pool_data_provider(&mut self, new_data_provider: String);
}

pub struct MockPoolAddressesProvider {
    market_id: String,
    addresses: HashMap<Vec<u8>, String>,
    pool: Option<String>,
    pool_configurator: Option<String>,
    price_oracle: Option<String>,
    acl_manager: Option<String>,
    acl_admin: Option<String>,
    price_oracle_sentinel: Option<String>,
    pool_data_provider: Option<String>,
}

impl MockPoolAddressesProvider {
    pub fn new() -> Self {
        Self {
            market_id: String::new(),
            addresses: HashMap::new(),
            pool: None,
            pool_configurator: None,
            price_oracle: None,
            acl_manager: None,
            acl_admin: None,
            price_oracle_sentinel: None,
            pool_data_provider: None,
        }
    }
}

impl IPoolAddressesProvider for MockPoolAddressesProvider {
    fn get_market_id(&self) -> String {
        self.market_id.clone()
    }

    fn set_market_id(&mut self, new_market_id: String) {
        let old_market_id = self.market_id.clone();
        self.market_id = new_market_id.clone();
        println!("MarketIdSet: oldMarketId={}, newMarketId={}", old_market_id, new_market_id);
    }

    fn get_address(&self, id: &[u8]) -> Option<String> {
        self.addresses.get(id).cloned()
    }

    fn set_address_as_proxy(&mut self, id: &[u8], new_implementation_address: String) {
        let proxy_address = self.addresses.get(id).cloned();
        let old_implementation_address = proxy_address.clone();
        self.addresses.insert(id.to_vec(), new_implementation_address.clone());
        println!(
            "AddressSetAsProxy: id={:?}, proxyAddress={:?}, oldImplementationAddress={:?}, newImplementationAddress={}",
            id, proxy_address, old_implementation_address, new_implementation_address
        );
    }

    fn set_address(&mut self, id: &[u8], new_address: String) {
        let old_address = self.addresses.insert(id.to_vec(), new_address.clone());
        println!("AddressSet: id={:?}, oldAddress={:?}, newAddress={}", id, old_address, new_address);
    }

    fn get_pool(&self) -> Option<String> {
        self.pool.clone()
    }

    fn set_pool_impl(&mut self, new_pool_impl: String) {
        let old_address = self.pool.replace(new_pool_impl.clone());
        println!("PoolUpdated: oldAddress={:?}, newAddress={}", old_address, new_pool_impl);
    }

    fn get_pool_configurator(&self) -> Option<String> {
        self.pool_configurator.clone()
    }

    fn set_pool_configurator_impl(&mut self, new_pool_configurator_impl: String) {
        let old_address = self.pool_configurator.replace(new_pool_configurator_impl.clone());
        println!(
            "PoolConfiguratorUpdated: oldAddress={:?}, newAddress={}",
            old_address, new_pool_configurator_impl
        );
    }

    fn get_price_oracle(&self) -> Option<String> {
        self.price_oracle.clone()
    }

    fn set_price_oracle(&mut self, new_price_oracle: String) {
        let old_address = self.price_oracle.replace(new_price_oracle.clone());
        println!("PriceOracleUpdated: oldAddress={:?}, newAddress={}", old_address, new_price_oracle);
    }

    fn get_acl_manager(&self) -> Option<String> {
        self.acl_manager.clone()
    }

    fn set_acl_manager(&mut self, new_acl_manager: String) {
        let old_address = self.acl_manager.replace(new_acl_manager.clone());
        println!("ACLManagerUpdated: oldAddress={:?}, newAddress={}", old_address, new_acl_manager);
    }

    fn get_acl_admin(&self) -> Option<String> {
        self.acl_admin.clone()
    }

    fn set_acl_admin(&mut self, new_acl_admin: String) {
        let old_address = self.acl_admin.replace(new_acl_admin.clone());
        println!("ACLAdminUpdated: oldAddress={:?}, newAddress={}", old_address, new_acl_admin);
    }

    fn get_price_oracle_sentinel(&self) -> Option<String> {
        self.price_oracle_sentinel.clone()
    }

    fn set_price_oracle_sentinel(&mut self, new_price_oracle_sentinel: String) {
        let old_address = self.price_oracle_sentinel.replace(new_price_oracle_sentinel.clone());
        println!(
            "PriceOracleSentinelUpdated: oldAddress={:?}, newAddress={}",
            old_address, new_price_oracle_sentinel
        );
    }

    fn get_pool_data_provider(&self) -> Option<String> {
        self.pool_data_provider.clone()
    }

    fn set_pool_data_provider(&mut self, new_data_provider: String) {
        let old_address = self.pool_data_provider.replace(new_data_provider.clone());
        println!(
            "PoolDataProviderUpdated: oldAddress={:?}, newAddress={}",
            old_address, new_data_provider
        );
    }
}

fn main() {
    let mut pool_addresses_provider = MockPoolAddressesProvider::new();

    pool_addresses_provider.set_market_id("newMarketId".to_string());
    println!("Market ID: {}", pool_addresses_provider.get_market_id());

    pool_addresses_provider.set_pool_impl("newPoolImpl".to_string());
    println!("Pool Address: {:?}", pool_addresses_provider.get_pool());

    pool_addresses_provider.set_price_oracle("newPriceOracle".to_string());
    println!("Price Oracle: {:?}", pool_addresses_provider.get_price_oracle());

    pool_addresses_provider.set_acl_manager("newAclManager".to_string());
    println!("ACL Manager: {:?}", pool_addresses_provider.get_acl_manager());

    pool_addresses_provider.set_acl_admin("newAclAdmin".to_string());
    println!("ACL Admin: {:?}", pool_addresses_provider.get_acl_admin());

    pool_addresses_provider.set_price_oracle_sentinel("newPriceOracleSentinel".to_string());
    println!("Price Oracle Sentinel: {:?}", pool_addresses_provider.get_price_oracle_sentinel());

    pool_addresses_provider.set_pool_data_provider("newDataProvider".to_string());
    println!("Pool Data Provider: {:?}", pool_addresses_provider.get_pool_data_provider());

    let id = b"id1";
    pool_addresses_provider.set_address(id, "newAddress1".to_string());
    println!("Address for id1: {:?}", pool_addresses_provider.get_address(id));
    
    let new_implementation_address = "newImplementationAddress".to_string();
    pool_addresses_provider.set_address_as_proxy(id, new_implementation_address);
    println!("Address as Proxy for id1: {:?}", pool_addresses_provider.get_address(id));
}
