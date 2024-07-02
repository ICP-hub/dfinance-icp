use candid::Principal;
use ic_cdk::api::caller;
use ic_cdk::{init, query, update};
use std::collections::HashMap;

#[derive(Clone, Default)]
struct RoleData {
    members: HashMap<Principal, bool>,
    admin_role: String,
}

#[derive(Default)]
struct AccessControl {
    roles: HashMap<String, RoleData>,
}

static mut ACCESS_CONTROL: Option<AccessControl> = None;

impl AccessControl {
    fn new() -> Self {
        let mut roles = HashMap::new();
        roles.insert("DEFAULT_ADMIN_ROLE".to_string(), RoleData::default());
        AccessControl { roles }
    }

    fn has_role(&self, role: &str, account: &Principal) -> bool {
        if let Some(role_data) = self.roles.get(role) {
            return *role_data.members.get(account).unwrap_or(&false);
        }
        false
    }

    fn _check_role(&self, role: &str, account: &Principal) {
        if !self.has_role(role, account) {
            panic!("AccessControl: account {} is missing role {}", account, role);
        }
    }

    fn get_role_admin(&self, role: &str) -> String {
        if let Some(role_data) = self.roles.get(role) {
            return role_data.admin_role.clone();
        }
        "DEFAULT_ADMIN_ROLE".to_string()
    }

    fn grant_role(&mut self, role: &str, account: Principal) {
        let admin_role = self.get_role_admin(role);
        self._check_role(&admin_role, &caller());

        let role_data = self.roles.entry(role.to_string()).or_default();
        role_data.members.insert(account, true);

        ic_cdk::println!("RoleGranted: {} granted to {}", role, account);
    }

    fn revoke_role(&mut self, role: &str, account: Principal) {
        let admin_role = self.get_role_admin(role);
        self._check_role(&admin_role, &caller());

        if let Some(role_data) = self.roles.get_mut(role) {
            role_data.members.insert(account, false);
            ic_cdk::println!("RoleRevoked: {} revoked from {}", role, account);
        }
    }

    fn renounce_role(&mut self, role: &str, account: Principal) {
        if account != caller() {
            panic!("AccessControl: can only renounce roles for self");
        }

        if let Some(role_data) = self.roles.get_mut(role) {
            role_data.members.insert(account, false);
            ic_cdk::println!("RoleRevoked: {} renounced by {}", role, account);
        }
    }

    fn _setup_role(&mut self, role: &str, account: Principal) {
        let role_data = self.roles.entry(role.to_string()).or_default();
        role_data.members.insert(account, true);

        ic_cdk::println!("RoleGranted: {} setup for {}", role, account);
    }

    fn _set_role_admin(&mut self, role: &str, admin_role: &str) {
        if let Some(role_data) = self.roles.get_mut(role) {
            let previous_admin_role = role_data.admin_role.clone();
            role_data.admin_role = admin_role.to_string();
            ic_cdk::println!("RoleAdminChanged: {} admin role changed from {} to {}", role, previous_admin_role, admin_role);
        }
    }
}

#[init]
fn init() {
    unsafe {
        ACCESS_CONTROL = Some(AccessControl::new());
    }
}

#[query]
fn has_role(role: String, account: Principal) -> bool {
    unsafe {
        if let Some(ac) = &ACCESS_CONTROL {
            return ac.has_role(&role, &account);
        }
    }
    false
}

#[update]
fn grant_role(role: String, account: Principal) {
    unsafe {
        if let Some(ac) = &mut ACCESS_CONTROL {
            ac.grant_role(&role, account);
        }
    }
}

#[update]
fn revoke_role(role: String, account: Principal) {
    unsafe {
        if let Some(ac) = &mut ACCESS_CONTROL {
            ac.revoke_role(&role, account);
        }
    }
}

#[update]
fn renounce_role(role: String) {
    unsafe {
        if let Some(ac) = &mut ACCESS_CONTROL {
            ac.renounce_role(&role, caller());
        }
    }
}

#[query]
fn get_role_admin(role: String) -> String {
    unsafe {
        if let Some(ac) = &ACCESS_CONTROL {
            return ac.get_role_admin(&role);
        }
    }
    "DEFAULT_ADMIN_ROLE".to_string()
}
