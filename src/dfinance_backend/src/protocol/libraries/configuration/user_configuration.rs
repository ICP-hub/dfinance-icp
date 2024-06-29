#[derive(Default, Clone)]
pub struct UserConfigurationMap {
    pub data: u128,
}

#[derive(Debug)]
pub enum Error {
    InvalidReserveIndex,
}

pub struct ReserveConfiguration;

impl ReserveConfiguration {
    pub const MAX_RESERVES_COUNT: usize = 128;
}

pub struct UserConfiguration;

impl UserConfiguration {
    const BORROWING_MASK: u128 = 0x55555555555555555555555555555555;
    const COLLATERAL_MASK: u128 = 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;

    pub fn set_borrowing(
        config: &mut UserConfigurationMap,
        reserve_index: usize,
        borrowing: bool,
    ) -> Result<(), Error> {
        if reserve_index >= ReserveConfiguration::MAX_RESERVES_COUNT {
            return Err(Error::InvalidReserveIndex);
        }
        let bit = 1 << (reserve_index << 1);
        if borrowing {
            config.data |= bit;
        } else {
            config.data &= !bit;
        }
        Ok(())
    }

    pub fn set_using_as_collateral(
        config: &mut UserConfigurationMap,
        reserve_index: usize,
        using_as_collateral: bool,
    ) -> Result<(), Error> {
        if reserve_index >= ReserveConfiguration::MAX_RESERVES_COUNT {
            return Err(Error::InvalidReserveIndex);
        }
        let bit = 1 << ((reserve_index << 1) + 1);
        if using_as_collateral {
            config.data |= bit;
        } else {
            config.data &= !bit;
        }
        Ok(())
    }

    pub fn is_using_as_collateral_or_borrowing(
        config: &UserConfigurationMap,
        reserve_index: usize,
    ) -> Result<bool, Error> {
        if reserve_index >= ReserveConfiguration::MAX_RESERVES_COUNT {
            return Err(Error::InvalidReserveIndex);
        }
        Ok((config.data >> (reserve_index << 1)) & 3 != 0)
    }

    pub fn is_borrowing(
        config: &UserConfigurationMap,
        reserve_index: usize,
    ) -> Result<bool, Error> {
        if reserve_index >= ReserveConfiguration::MAX_RESERVES_COUNT {
            return Err(Error::InvalidReserveIndex);
        }
        Ok((config.data >> (reserve_index << 1)) & 1 != 0)
    }

    pub fn is_using_as_collateral(
        config: &UserConfigurationMap,
        reserve_index: usize,
    ) -> Result<bool, Error> {
        if reserve_index >= ReserveConfiguration::MAX_RESERVES_COUNT {
            return Err(Error::InvalidReserveIndex);
        }
        Ok((config.data >> ((reserve_index << 1) + 1)) & 1 != 0)
    }

    pub fn is_using_as_collateral_one(config: &UserConfigurationMap) -> bool {
        let collateral_data = config.data & Self::COLLATERAL_MASK;
        collateral_data != 0 && (collateral_data & (collateral_data - 1)) == 0
    }

    pub fn is_using_as_collateral_any(config: &UserConfigurationMap) -> bool {
        config.data & Self::COLLATERAL_MASK != 0
    }

    pub fn is_borrowing_one(config: &UserConfigurationMap) -> bool {
        let borrowing_data = config.data & Self::BORROWING_MASK;
        borrowing_data != 0 && (borrowing_data & (borrowing_data - 1)) == 0
    }

    pub fn is_borrowing_any(config: &UserConfigurationMap) -> bool {
        config.data & Self::BORROWING_MASK != 0
    }

    pub fn is_empty(config: &UserConfigurationMap) -> bool {
        config.data == 0
    }

    fn get_first_asset_id_by_mask(config: &UserConfigurationMap, mask: u128) -> usize {
        let bitmap_data = config.data & mask;
        let mut first_asset_position = bitmap_data & !(bitmap_data - 1);
        let mut id = 0;

        while first_asset_position >> 2 != 0 {
            first_asset_position >>= 2;
            id += 1;
        }
        id
    }

    pub fn get_isolation_mode_state(
        config: &UserConfigurationMap,
        reserves_data: &Vec<ReserveData>,
    ) -> (bool, Option<usize>, u128) {
        if Self::is_using_as_collateral_one(config) {
            let asset_id = Self::get_first_asset_id_by_mask(config, Self::COLLATERAL_MASK);
            let ceiling = reserves_data[asset_id].configuration.get_debt_ceiling();
            if ceiling != 0 {
                return (true, Some(asset_id), ceiling);
            }
        }
        (false, None, 0)
    }

    pub fn get_siloed_borrowing_state(
        config: &UserConfigurationMap,
        reserves_data: &Vec<ReserveData>,
    ) -> (bool, Option<usize>) {
        if Self::is_borrowing_one(config) {
            let asset_id = Self::get_first_asset_id_by_mask(config, Self::BORROWING_MASK);
            if reserves_data[asset_id].configuration.get_siloed_borrowing() {
                return (true, Some(asset_id));
            }
        }
        (false, None)
    }
}

#[derive(Default, Clone)]
pub struct ReserveConfigurationMap {
    pub data: u128,  // Assuming data is a 128-bit unsigned integer for simplicity
}

impl ReserveConfigurationMap {
    pub fn get_debt_ceiling(&self) -> u128 {
        // Implement this function based on your business logic
        0
    }

    pub fn get_siloed_borrowing(&self) -> bool {
        // Implement this function based on your business logic
        false
    }
}

#[derive(Default, Clone)]
pub struct ReserveData {
    pub configuration: ReserveConfigurationMap,
}

fn main() {
    let mut user_config = UserConfigurationMap::default();

    // Example usage
    UserConfiguration::set_borrowing(&mut user_config, 1, true).unwrap();
    let is_borrowing = UserConfiguration::is_borrowing(&user_config, 1).unwrap();
    println!("Is Borrowing: {}", is_borrowing);

    UserConfiguration::set_using_as_collateral(&mut user_config, 1, true).unwrap();
    let is_using_as_collateral = UserConfiguration::is_using_as_collateral(&user_config, 1).unwrap();
    println!("Is Using as Collateral: {}", is_using_as_collateral);
}
