
use super::{data_types::zero_nat_value, interest_variables::constants::MAX_ASSET_LENGTH};
use crate::constants::errors::Error;


// to validate input asset details
pub fn validate_asset_name(asset_name: &str) -> Result<(), Error> {
  if asset_name.trim().is_empty() {
      ic_cdk::println!("Asset cannot be an empty string");
      return Err(Error::EmptyAsset);
  }

  if asset_name.len() > MAX_ASSET_LENGTH {
      ic_cdk::println!("Asset must have a maximum length of {} characters", MAX_ASSET_LENGTH);
      return Err(Error::InvalidAssetLength);
  }

  Ok(())
}

// to validate zero value
pub fn validate_zero_value(value: &candid::Nat) -> Result<(), Error> {
  if value <= &zero_nat_value() {
      ic_cdk::println!("Asset cannot be an empty string");
      return Err(Error::InvalidAmount);
  }



  Ok(())
}