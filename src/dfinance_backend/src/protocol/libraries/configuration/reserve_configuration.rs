#[derive(Default, Clone)]
pub struct ReserveConfigurationMap {
    pub data: u128,  // Assuming data is a 128-bit unsigned integer for simplicity
}

#[derive(Debug)]
pub enum Error {
    InvalidLTV,
    InvalidLiquidityThreshold,
    InvalidLiquidityBonus,
    InvalidDecimals,
    InvalidReserveFactor,
    InvalidBorrowCap,
    InvalidSupplyCap,
    InvalidDebtCeiling,
    InvalidLiquidationProtocolFee,
    InvalidEModeCategory,
    InvalidUnbackedMintCap,
}

pub struct ReserveConfiguration;

impl ReserveConfiguration {
    const LTV_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    const LIQUIDATION_THRESHOLD_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000;
    const LIQUIDATION_BONUS_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFFFFFF0000FFFF;
    const DECIMALS_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFF00FFFFFFFF;
    const ACTIVE_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFF;
    const FROZEN_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFF;
    const BORROWING_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFFBFFFFFFFFFFFF;
    const STABLE_BORROWING_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFF7FFFFFFFFFFFF;
    const PAUSED_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFF;
    const BORROWABLE_IN_ISOLATION_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFFF;
    const SILOED_BORROWING_MASK: u128 = 0xFFFFFFFFFFFFFFFFFFBFFFFFFFFFFFFF;
    const FLASHLOAN_ENABLED_MASK: u128 = 0xFFFFFFFFFFFFFFFFFF7FFFFFFFFFFFFF;
    const RESERVE_FACTOR_MASK: u128 = 0xFFFFFFFFFFFF0000FFFFFFFFFFFFFFFF;
    // const BORROW_CAP_MASK: u128 = 0xFFFFFFFFFFF000000000FFFFFFFFFFFFFFFF;
    // const SUPPLY_CAP_MASK: u128 = 0xFFFFFFFFFF0000000000FFFFFFFFFFFFFFFF;
    // const LIQUIDATION_PROTOCOL_FEE_MASK: u128 = 0xFFFFFFFFFF00000000FFFFFFFFFFFFFFFF;
    // const EMODE_CATEGORY_MASK: u128 = 0xFFFFFFFFFFFF00FFFFFFFFFFFFFFFFFFFF;
    // const UNBACKED_MINT_CAP_MASK: u128 = 0xFFFFFFFFF0000000000FFFFFFFFFFFFFFFFFFFF;
    // const DEBT_CEILING_MASK: u128 = 0xF0000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    const LIQUIDATION_THRESHOLD_START_BIT_POSITION: u8 = 16;
    const LIQUIDATION_BONUS_START_BIT_POSITION: u8 = 32;
    const RESERVE_DECIMALS_START_BIT_POSITION: u8 = 48;
    const IS_ACTIVE_START_BIT_POSITION: u8 = 56;
    const IS_FROZEN_START_BIT_POSITION: u8 = 57;
    const BORROWING_ENABLED_START_BIT_POSITION: u8 = 58;
    const STABLE_BORROWING_ENABLED_START_BIT_POSITION: u8 = 59;
    const IS_PAUSED_START_BIT_POSITION: u8 = 60;
    const BORROWABLE_IN_ISOLATION_START_BIT_POSITION: u8 = 61;
    const SILOED_BORROWING_START_BIT_POSITION: u8 = 62;
    const FLASHLOAN_ENABLED_START_BIT_POSITION: u8 = 63;
    const RESERVE_FACTOR_START_BIT_POSITION: u8 = 64;
    const BORROW_CAP_START_BIT_POSITION: u8 = 80;
    const SUPPLY_CAP_START_BIT_POSITION: u8 = 116;
    const LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION: u8 = 152;
    const EMODE_CATEGORY_START_BIT_POSITION: u8 = 168;
    const UNBACKED_MINT_CAP_START_BIT_POSITION: u8 = 176;
    const DEBT_CEILING_START_BIT_POSITION: u8 = 212;

    const MAX_VALID_LTV: u128 = 65535;
    const MAX_VALID_LIQUIDATION_THRESHOLD: u128 = 65535;
    const MAX_VALID_LIQUIDATION_BONUS: u128 = 65535;
    const MAX_VALID_DECIMALS: u128 = 255;
    const MAX_VALID_RESERVE_FACTOR: u128 = 65535;
    const MAX_VALID_BORROW_CAP: u128 = 68719476735;
    const MAX_VALID_SUPPLY_CAP: u128 = 68719476735;
    const MAX_VALID_LIQUIDATION_PROTOCOL_FEE: u128 = 65535;
    const MAX_VALID_EMODE_CATEGORY: u128 = 255;
    const MAX_VALID_UNBACKED_MINT_CAP: u128 = 68719476735;
    const MAX_VALID_DEBT_CEILING: u128 = 1099511627775;

    pub fn set_ltv(config: &mut ReserveConfigurationMap, ltv: u128) -> Result<(), Error> {
        if ltv > Self::MAX_VALID_LTV {
            return Err(Error::InvalidLTV);
        }
        config.data = (config.data & Self::LTV_MASK) | ltv;
        Ok(())
    }

    pub fn get_ltv(config: &ReserveConfigurationMap) -> u128 {
        config.data & !Self::LTV_MASK
    }

    pub fn set_liquidation_threshold(
        config: &mut ReserveConfigurationMap,
        threshold: u128,
    ) -> Result<(), Error> {
        if threshold > Self::MAX_VALID_LIQUIDATION_THRESHOLD {
            return Err(Error::InvalidLiquidityThreshold);
        }
        config.data = (config.data & Self::LIQUIDATION_THRESHOLD_MASK)
            | (threshold << Self::LIQUIDATION_THRESHOLD_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_liquidation_threshold(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::LIQUIDATION_THRESHOLD_MASK)
            >> Self::LIQUIDATION_THRESHOLD_START_BIT_POSITION
    }

    pub fn set_liquidation_bonus(
        config: &mut ReserveConfigurationMap,
        bonus: u128,
    ) -> Result<(), Error> {
        if bonus > Self::MAX_VALID_LIQUIDATION_BONUS {
            return Err(Error::InvalidLiquidityBonus);
        }
        config.data = (config.data & Self::LIQUIDATION_BONUS_MASK)
            | (bonus << Self::LIQUIDATION_BONUS_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_liquidation_bonus(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::LIQUIDATION_BONUS_MASK) >> Self::LIQUIDATION_BONUS_START_BIT_POSITION
    }

    pub fn set_decimals(
        config: &mut ReserveConfigurationMap,
        decimals: u128,
    ) -> Result<(), Error> {
        if decimals > Self::MAX_VALID_DECIMALS {
            return Err(Error::InvalidDecimals);
        }
        config.data =
            (config.data & Self::DECIMALS_MASK) | (decimals << Self::RESERVE_DECIMALS_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_decimals(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::DECIMALS_MASK) >> Self::RESERVE_DECIMALS_START_BIT_POSITION
    }

    pub fn set_active(config: &mut ReserveConfigurationMap, active: bool) {
        config.data = (config.data & Self::ACTIVE_MASK)
            | ((active as u128) << Self::IS_ACTIVE_START_BIT_POSITION);
    }

    pub fn get_active(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::ACTIVE_MASK) != 0
    }

    pub fn set_frozen(config: &mut ReserveConfigurationMap, frozen: bool) {
        config.data = (config.data & Self::FROZEN_MASK)
            | ((frozen as u128) << Self::IS_FROZEN_START_BIT_POSITION);
    }

    pub fn get_frozen(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::FROZEN_MASK) != 0
    }

    pub fn set_paused(config: &mut ReserveConfigurationMap, paused: bool) {
        config.data = (config.data & Self::PAUSED_MASK)
            | ((paused as u128) << Self::IS_PAUSED_START_BIT_POSITION);
    }

    pub fn get_paused(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::PAUSED_MASK) != 0
    }

    pub fn set_borrowable_in_isolation(
        config: &mut ReserveConfigurationMap,
        borrowable: bool,
    ) {
        config.data = (config.data & Self::BORROWABLE_IN_ISOLATION_MASK)
            | ((borrowable as u128) << Self::BORROWABLE_IN_ISOLATION_START_BIT_POSITION);
    }

    pub fn get_borrowable_in_isolation(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::BORROWABLE_IN_ISOLATION_MASK) != 0
    }

    pub fn set_siloed_borrowing(config: &mut ReserveConfigurationMap, siloed: bool) {
        config.data = (config.data & Self::SILOED_BORROWING_MASK)
            | ((siloed as u128) << Self::SILOED_BORROWING_START_BIT_POSITION);
    }

    pub fn get_siloed_borrowing(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::SILOED_BORROWING_MASK) != 0
    }

    pub fn set_borrowing_enabled(config: &mut ReserveConfigurationMap, enabled: bool) {
        config.data = (config.data & Self::BORROWING_MASK)
            | ((enabled as u128) << Self::BORROWING_ENABLED_START_BIT_POSITION);
    }

    pub fn get_borrowing_enabled(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::BORROWING_MASK) != 0
    }

    pub fn set_stable_rate_borrowing_enabled(
        config: &mut ReserveConfigurationMap,
        enabled: bool,
    ) {
        config.data = (config.data & Self::STABLE_BORROWING_MASK)
            | ((enabled as u128) << Self::STABLE_BORROWING_ENABLED_START_BIT_POSITION);
    }

    pub fn get_stable_rate_borrowing_enabled(
        config: &ReserveConfigurationMap,
    ) -> bool {
        (config.data & !Self::STABLE_BORROWING_MASK) != 0
    }

    pub fn set_reserve_factor(
        config: &mut ReserveConfigurationMap,
        reserve_factor: u128,
    ) -> Result<(), Error> {
        if reserve_factor > Self::MAX_VALID_RESERVE_FACTOR {
            return Err(Error::InvalidReserveFactor);
        }
        config.data = (config.data & Self::RESERVE_FACTOR_MASK)
            | (reserve_factor << Self::RESERVE_FACTOR_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_reserve_factor(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::RESERVE_FACTOR_MASK) >> Self::RESERVE_FACTOR_START_BIT_POSITION
    }

    pub fn set_borrow_cap(
        config: &mut ReserveConfigurationMap,
        borrow_cap: u128,
    ) -> Result<(), Error> {
        if borrow_cap > Self::MAX_VALID_BORROW_CAP {
            return Err(Error::InvalidBorrowCap);
        }
        config.data = (config.data & Self::BORROW_CAP_MASK)
            | (borrow_cap << Self::BORROW_CAP_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_borrow_cap(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::BORROW_CAP_MASK) >> Self::BORROW_CAP_START_BIT_POSITION
    }

    pub fn set_supply_cap(
        config: &mut ReserveConfigurationMap,
        supply_cap: u128,
    ) -> Result<(), Error> {
        if supply_cap > Self::MAX_VALID_SUPPLY_CAP {
            return Err(Error::InvalidSupplyCap);
        }
        config.data = (config.data & Self::SUPPLY_CAP_MASK)
            | (supply_cap << Self::SUPPLY_CAP_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_supply_cap(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::SUPPLY_CAP_MASK) >> Self::SUPPLY_CAP_START_BIT_POSITION
    }

    pub fn set_debt_ceiling(
        config: &mut ReserveConfigurationMap,
        ceiling: u128,
    ) -> Result<(), Error> {
        if ceiling > Self::MAX_VALID_DEBT_CEILING {
            return Err(Error::InvalidDebtCeiling);
        }
        config.data = (config.data & Self::DEBT_CEILING_MASK)
            | (ceiling << Self::DEBT_CEILING_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_debt_ceiling(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::DEBT_CEILING_MASK) >> Self::DEBT_CEILING_START_BIT_POSITION
    }

    pub fn set_liquidation_protocol_fee(
        config: &mut ReserveConfigurationMap,
        liquidation_protocol_fee: u128,
    ) -> Result<(), Error> {
        if liquidation_protocol_fee > Self::MAX_VALID_LIQUIDATION_PROTOCOL_FEE {
            return Err(Error::InvalidLiquidationProtocolFee);
        }
        config.data = (config.data & Self::LIQUIDATION_PROTOCOL_FEE_MASK)
            | (liquidation_protocol_fee << Self::LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_liquidation_protocol_fee(
        config: &ReserveConfigurationMap,
    ) -> u128 {
        (config.data & !Self::LIQUIDATION_PROTOCOL_FEE_MASK)
            >> Self::LIQUIDATION_PROTOCOL_FEE_START_BIT_POSITION
    }

    pub fn set_unbacked_mint_cap(
        config: &mut ReserveConfigurationMap,
        unbacked_mint_cap: u128,
    ) -> Result<(), Error> {
        if unbacked_mint_cap > Self::MAX_VALID_UNBACKED_MINT_CAP {
            return Err(Error::InvalidUnbackedMintCap);
        }
        config.data = (config.data & Self::UNBACKED_MINT_CAP_MASK)
            | (unbacked_mint_cap << Self::UNBACKED_MINT_CAP_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_unbacked_mint_cap(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::UNBACKED_MINT_CAP_MASK)
            >> Self::UNBACKED_MINT_CAP_START_BIT_POSITION
    }

    pub fn set_emode_category(
        config: &mut ReserveConfigurationMap,
        category: u128,
    ) -> Result<(), Error> {
        if category > Self::MAX_VALID_EMODE_CATEGORY {
            return Err(Error::InvalidEModeCategory);
        }
        config.data = (config.data & Self::EMODE_CATEGORY_MASK)
            | (category << Self::EMODE_CATEGORY_START_BIT_POSITION);
        Ok(())
    }

    pub fn get_emode_category(config: &ReserveConfigurationMap) -> u128 {
        (config.data & !Self::EMODE_CATEGORY_MASK) >> Self::EMODE_CATEGORY_START_BIT_POSITION
    }

    pub fn set_flashloan_enabled(
        config: &mut ReserveConfigurationMap,
        flash_loan_enabled: bool,
    ) {
        config.data = (config.data & Self::FLASHLOAN_ENABLED_MASK)
            | ((flash_loan_enabled as u128) << Self::FLASHLOAN_ENABLED_START_BIT_POSITION);
    }

    pub fn get_flashloan_enabled(config: &ReserveConfigurationMap) -> bool {
        (config.data & !Self::FLASHLOAN_ENABLED_MASK) != 0
    }

    pub fn get_flags(
        config: &ReserveConfigurationMap,
    ) -> (bool, bool, bool, bool, bool) {
        let data_local = config.data;

        (
            (data_local & !Self::ACTIVE_MASK) != 0,
            (data_local & !Self::FROZEN_MASK) != 0,
            (data_local & !Self::BORROWING_MASK) != 0,
            (data_local & !Self::STABLE_BORROWING_MASK) != 0,
            (data_local & !Self::PAUSED_MASK) != 0,
        )
    }

    pub fn get_params(
        config: &ReserveConfigurationMap,
    ) -> (u128, u128, u128, u128, u128, u128) {
        let data_local = config.data;

        (
            data_local & !Self::LTV_MASK,
            (data_local & !Self::LIQUIDATION_THRESHOLD_MASK)
                >> Self::LIQUIDATION_THRESHOLD_START_BIT_POSITION,
            (data_local & !Self::LIQUIDATION_BONUS_MASK) >> Self::LIQUIDATION_BONUS_START_BIT_POSITION,
            (data_local & !Self::DECIMALS_MASK) >> Self::RESERVE_DECIMALS_START_BIT_POSITION,
            (data_local & !Self::RESERVE_FACTOR_MASK) >> Self::RESERVE_FACTOR_START_BIT_POSITION,
            (data_local & !Self::EMODE_CATEGORY_MASK) >> Self::EMODE_CATEGORY_START_BIT_POSITION,
        )
    }

    pub fn get_caps(config: &ReserveConfigurationMap) -> (u128, u128) {
        let data_local = config.data;

        (
            (data_local & !Self::BORROW_CAP_MASK) >> Self::BORROW_CAP_START_BIT_POSITION,
            (data_local & !Self::SUPPLY_CAP_MASK) >> Self::SUPPLY_CAP_START_BIT_POSITION,
        )
    }
}

fn main() {
    let mut config = ReserveConfigurationMap::default();

    // Example usage
    ReserveConfiguration::set_ltv(&mut config, 5000).unwrap();
    let ltv = ReserveConfiguration::get_ltv(&config);
    println!("LTV: {}", ltv);

    ReserveConfiguration::set_liquidation_threshold(&mut config, 8000).unwrap();
    let threshold = ReserveConfiguration::get_liquidation_threshold(&config);
    println!("Liquidation Threshold: {}", threshold);

    ReserveConfiguration::set_active(&mut config, true);
    let active = ReserveConfiguration::get_active(&config);
    println!("Is Active: {}", active);
}
