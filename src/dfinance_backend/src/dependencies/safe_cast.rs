/// Safe casting utilities for converting between integer types with overflow checks.
pub mod safe_cast {
    /// Converts a `u256` to a `u224`, reverting on overflow.
    pub fn to_u224(value: u128) -> Result<u128, &'static str> {
        if value <= (u128::MAX >> 32) {
            Ok(value)
        } else {
            Err("SafeCast: value doesn't fit in 224 bits")
        }
    }

    /// Converts a `u256` to a `u128`, reverting on overflow.
    pub fn to_u128(value: u128) -> Result<u128, &'static str> {
        Ok(value)
    }

    /// Converts a `u256` to a `u96`, reverting on overflow.
    pub fn to_u96(value: u128) -> Result<u128, &'static str> {
        if value <= (u128::MAX >> 32 + 32 + 32) {
            Ok(value)
        } else {
            Err("SafeCast: value doesn't fit in 96 bits")
        }
    }

    /// Converts a `u256` to a `u64`, reverting on overflow.
    pub fn to_u64(value: u128) -> Result<u64, &'static str> {
        if value <= (u64::MAX as u128) {
            Ok(value as u64)
        } else {
            Err("SafeCast: value doesn't fit in 64 bits")
        }
    }

    /// Converts a `u256` to a `u32`, reverting on overflow.
    pub fn to_u32(value: u128) -> Result<u32, &'static str> {
        if value <= (u32::MAX as u128) {
            Ok(value as u32)
        } else {
            Err("SafeCast: value doesn't fit in 32 bits")
        }
    }

    /// Converts a `u256` to a `u16`, reverting on overflow.
    pub fn to_u16(value: u128) -> Result<u16, &'static str> {
        if value <= (u16::MAX as u128) {
            Ok(value as u16)
        } else {
            Err("SafeCast: value doesn't fit in 16 bits")
        }
    }

    /// Converts a `u256` to a `u8`, reverting on overflow.
    pub fn to_u8(value: u128) -> Result<u8, &'static str> {
        if value <= (u8::MAX as u128) {
            Ok(value as u8)
        } else {
            Err("SafeCast: value doesn't fit in 8 bits")
        }
    }

    /// Converts an `i256` to a `u256`, reverting if the input is negative.
    pub fn to_u128_from_i128(value: i128) -> Result<u128, &'static str> {
        if value >= 0 {
            Ok(value as u128)
        } else {
            Err("SafeCast: value must be positive")
        }
    }

    /// Converts an `i256` to an `i128`, reverting on overflow.
    pub fn to_i128(value: i128) -> Result<i128, &'static str> {
        Ok(value)
    }

    /// Converts an `i256` to an `i64`, reverting on overflow.
    pub fn to_i64(value: i128) -> Result<i64, &'static str> {
        if value >= (i64::MIN as i128) && value <= (i64::MAX as i128) {
            Ok(value as i64)
        } else {
            Err("SafeCast: value doesn't fit in 64 bits")
        }
    }

    /// Converts an `i256` to an `i32`, reverting on overflow.
    pub fn to_i32(value: i128) -> Result<i32, &'static str> {
        if value >= (i32::MIN as i128) && value <= (i32::MAX as i128) {
            Ok(value as i32)
        } else {
            Err("SafeCast: value doesn't fit in 32 bits")
        }
    }

    /// Converts an `i256` to an `i16`, reverting on overflow.
    pub fn to_i16(value: i128) -> Result<i16, &'static str> {
        if value >= (i16::MIN as i128) && value <= (i16::MAX as i128) {
            Ok(value as i16)
        } else {
            Err("SafeCast: value doesn't fit in 16 bits")
        }
    }

    /// Converts an `i256` to an `i8`, reverting on overflow.
    pub fn to_i8(value: i128) -> Result<i8, &'static str> {
        if value >= (i8::MIN as i128) && value <= (i8::MAX as i128) {
            Ok(value as i8)
        } else {
            Err("SafeCast: value doesn't fit in 8 bits")
        }
    }

    /// Converts a `u256` to an `i256`, reverting if the input is greater than maxInt256.
    pub fn to_i128_from_u128(value: u128) -> Result<i128, &'static str> {
        if value <= (i128::MAX as u128) {
            Ok(value as i128)
        } else {
            Err("SafeCast: value doesn't fit in an int128")
        }
    }
}

