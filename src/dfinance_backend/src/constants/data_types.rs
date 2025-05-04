use candid::Nat;

// TODO: i think this function placing is not correct. i dont think i should be inside the data types.
pub fn zero_nat_value() -> Nat {
  Nat::from(0u128)
}