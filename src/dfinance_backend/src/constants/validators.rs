use super::{constant_variables::constants::MAX_ASSET_LENGTH, data_types::zero_nat_value};
use crate::constants::errors::Error;

/*
 * @title Validate Asset Name
 * @dev Ensures that the asset name is not empty and does not exceed the maximum allowed length.
 * @param asset_name The name of the asset to validate.
 * @returns A Result indicating success or an appropriate Error variant.
 * @functionality Validates asset name by checking if it's non-empty and within the allowed length.
 */
pub fn validate_asset_name(asset_name: &str) -> Result<(), Error> {
  
  if asset_name.trim().is_empty() {
      return Err(Error::EmptyAsset);
  }

    if asset_name.len() > MAX_ASSET_LENGTH {
        return Err(Error::InvalidAssetLength);
    }

    Ok(())
}

/*
 * @title Validate Asset Image URL
 * @dev Ensures that the asset image URL is a valid HTTP or HTTPS URL.
 * @param asset_image_url The URL of the asset image to validate.
 * @returns A Result indicating success or an appropriate Error variant.
 * @functionality Validates asset image URL by checking if it starts with "http://" or "https://".
 */
pub fn validate_asset_image_url(asset_image_url: &str) -> Result<(), Error> {
    if !asset_image_url.starts_with("http://") && !asset_image_url.starts_with("https://") {
        return Err(Error::InvalidAssetImageUrl);
    }

    Ok(())
}


/*
 * @title Validate Asset Amount
 * @dev Ensures that the asset amount is greater than zero.
 * @param value The asset amount to validate.
 * @returns A Result indicating success or an appropriate Error variant.
 * @functionality Validates asset amount by checking if it's greater than zero.
 */
pub fn validate_zero_value(value: &candid::Nat) -> Result<(), Error> {
  if value <= &zero_nat_value() {
      return Err(Error::InvalidAmount);
  }

  Ok(())
}

/**
 * @title Validate Negative Value
 * @dev Validates that the given value is not negative.
 * @param value The value to be validated, represented as a `candid::Nat`.
 * @returns An `Ok(())` if the value is non-negative, or an error if the value is negative.
 *
 * @functionality Ensures that the provided value is not less than zero to avoid invalid negative amounts.
 */
pub fn validate_negatige_value(value: &candid::Nat) -> Result<(), Error> {
  if value < &zero_nat_value() {
      return Err(Error::NegativeAmount);
  }

    Ok(())
}
