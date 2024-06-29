#[derive(Debug)]
pub enum Error {
    CallerNotPoolAdmin,                       // '1': 'The caller of the function is not a pool admin'
    CallerNotEmergencyAdmin,                  // '2': 'The caller of the function is not an emergency admin'
    CallerNotPoolOrEmergencyAdmin,            // '3': 'The caller of the function is not a pool or emergency admin'
    CallerNotRiskOrPoolAdmin,                 // '4': 'The caller of the function is not a risk or pool admin'
    CallerNotAssetListingOrPoolAdmin,         // '5': 'The caller of the function is not an asset listing or pool admin'
    CallerNotBridge,                          // '6': 'The caller of the function is not a bridge'
    AddressesProviderNotRegistered,           // '7': 'Pool addresses provider is not registered'
    InvalidAddressesProviderId,               // '8': 'Invalid id for the pool addresses provider'
    NotContract,                              // '9': 'Address is not a contract'
    CallerNotPoolConfigurator,                // '10': 'The caller of the function is not the pool configurator'
    CallerNotAToken,                          // '11': 'The caller of the function is not an AToken'
    InvalidAddressesProvider,                 // '12': 'The address of the pool addresses provider is invalid'
    InvalidFlashloanExecutorReturn,           // '13': 'Invalid return value of the flashloan executor function'
    ReserveAlreadyAdded,                      // '14': 'Reserve has already been added to reserve list'
    NoMoreReservesAllowed,                    // '15': 'Maximum amount of reserves in the pool reached'
    EmodeCategoryReserved,                    // '16': 'Zero eMode category is reserved for volatile heterogeneous assets'
    InvalidEmodeCategoryAssignment,           // '17': 'Invalid eMode category assignment to asset'
    ReserveLiquidityNotZero,                  // '18': 'The liquidity of the reserve needs to be 0'
    FlashloanPremiumInvalid,                  // '19': 'Invalid flashloan premium'
    InvalidReserveParams,                     // '20': 'Invalid risk parameters for the reserve'
    InvalidEmodeCategoryParams,               // '21': 'Invalid risk parameters for the eMode category'
    BridgeProtocolFeeInvalid,                 // '22': 'Invalid bridge protocol fee'
    CallerMustBePool,                         // '23': 'The caller of this function must be a pool'
    InvalidMintAmount,                        // '24': 'Invalid amount to mint'
    InvalidBurnAmount,                        // '25': 'Invalid amount to burn'
    InvalidAmount,                            // '26': 'Amount must be greater than 0'
    ReserveInactive,                          // '27': 'Action requires an active reserve'
    ReserveFrozen,                            // '28': 'Action cannot be performed because the reserve is frozen'
    ReservePaused,                            // '29': 'Action cannot be performed because the reserve is paused'
    BorrowingNotEnabled,                      // '30': 'Borrowing is not enabled'
    StableBorrowingNotEnabled,                // '31': 'Stable borrowing is not enabled'
    NotEnoughAvailableUserBalance,            // '32': 'User cannot withdraw more than the available balance'
    InvalidInterestRateModeSelected,          // '33': 'Invalid interest rate mode selected'
    CollateralBalanceIsZero,                  // '34': 'The collateral balance is 0'
    HealthFactorLowerThanLiquidationThreshold,// '35': 'Health factor is lesser than the liquidation threshold'
    CollateralCannotCoverNewBorrow,           // '36': 'There is not enough collateral to cover a new borrow'
    CollateralSameAsBorrowingCurrency,        // '37': 'Collateral is (mostly) the same currency that is being borrowed'
    AmountBiggerThanMaxLoanSizeStable,        // '38': 'The requested amount is greater than the max loan size in stable rate mode'
    NoDebtOfSelectedType,                     // '39': 'For repayment of a specific type of debt, the user needs to have debt that type'
    NoExplicitAmountToRepayOnBehalf,          // '40': 'To repay on behalf of a user an explicit amount to repay is needed'
    NoOutstandingStableDebt,                  // '41': 'User does not have outstanding stable rate debt on this reserve'
    NoOutstandingVariableDebt,                // '42': 'User does not have outstanding variable rate debt on this reserve'
    UnderlyingBalanceZero,                    // '43': 'The underlying balance needs to be greater than 0'
    InterestRateRebalanceConditionsNotMet,    // '44': 'Interest rate rebalance conditions were not met'
    HealthFactorNotBelowThreshold,            // '45': 'Health factor is not below the threshold'
    CollateralCannotBeLiquidated,             // '46': 'The collateral chosen cannot be liquidated'
    SpecifiedCurrencyNotBorrowedByUser,       // '47': 'User did not borrow the specified currency'
    InconsistentFlashloanParams,              // '49': 'Inconsistent flashloan parameters'
    BorrowCapExceeded,                        // '50': 'Borrow cap is exceeded'
    SupplyCapExceeded,                        // '51': 'Supply cap is exceeded'
    UnbackedMintCapExceeded,                  // '52': 'Unbacked mint cap is exceeded'
    DebtCeilingExceeded,                      // '53': 'Debt ceiling is exceeded'
    UnderlyingClaimableRightsNotZero,         // '54': 'Claimable rights over underlying not zero (aToken supply or accruedToTreasury)'
    StableDebtNotZero,                        // '55': 'Stable debt supply is not zero'
    VariableDebtSupplyNotZero,                // '56': 'Variable debt supply is not zero'
    LtvValidationFailed,                      // '57': 'Ltv validation failed'
    InconsistentEmodeCategory,                // '58': 'Inconsistent eMode category'
    PriceOracleSentinelCheckFailed,           // '59': 'Price oracle sentinel validation failed'
    AssetNotBorrowableInIsolation,            // '60': 'Asset is not borrowable in isolation mode'
    ReserveAlreadyInitialized,                // '61': 'Reserve has already been initialized'
    UserInIsolationModeOrLtvZero,             // '62': 'User is in isolation mode or ltv is zero'
    InvalidLtv,                               // '63': 'Invalid ltv parameter for the reserve'
    InvalidLiqThreshold,                      // '64': 'Invalid liquidity threshold parameter for the reserve'
    InvalidLiqBonus,                          // '65': 'Invalid liquidity bonus parameter for the reserve'
    InvalidDecimals,                          // '66': 'Invalid decimals parameter of the underlying asset of the reserve'
    InvalidReserveFactor,                     // '67': 'Invalid reserve factor parameter for the reserve'
    InvalidBorrowCap,                         // '68': 'Invalid borrow cap for the reserve'
    InvalidSupplyCap,                         // '69': 'Invalid supply cap for the reserve'
    InvalidLiquidationProtocolFee,            // '70': 'Invalid liquidation protocol fee for the reserve'
    InvalidEmodeCategory,                     // '71': 'Invalid eMode category for the reserve'
    InvalidUnbackedMintCap,                   // '72': 'Invalid unbacked mint cap for the reserve'
    InvalidDebtCeiling,                       // '73': 'Invalid debt ceiling for the reserve'
    InvalidReserveIndex,                      // '74': 'Invalid reserve index'
    AclAdminCannotBeZero,                     // '75': 'ACL admin cannot be set to the zero address'
    InconsistentParamsLength,                 // '76': 'Array parameters that should be equal length are not'
    ZeroAddressNotValid,                      // '77': 'Zero address not valid'
    InvalidExpiration,                        // '78': 'Invalid expiration'
    InvalidSignature,                         // '79': 'Invalid signature'
    OperationNotSupported,                    // '80': 'Operation not supported'
    DebtCeilingNotZero,                       // '81': 'Debt ceiling is not zero'
    AssetNotListed,                           // '82': 'Asset is not listed'
    InvalidOptimalUsageRatio,                 // '83': 'Invalid optimal usage ratio'
    InvalidOptimalStableToTotalDebtRatio,     // '84': 'Invalid optimal stable to total debt ratio'
    UnderlyingCannotBeRescued,                // '85': 'The underlying asset cannot be rescued'
    AddressesProviderAlreadyAdded,            // '86': 'Reserve has already been added to reserve list'
    PoolAddressesDoNotMatch,                  // '87': 'The token implementation pool address and the pool address provided by the initializing pool do not match'
    StableBorrowingEnabled,                   // '88': 'Stable borrowing is enabled'
    SiloedBorrowingViolation,                 // '89': 'User is trying to borrow multiple assets including a siloed one'
    ReserveDebtNotZero,                       // '90': 'The total debt of the reserve needs to be 0'
    FlashloanDisabled,                        // '91': 'FlashLoaning for this asset is disabled'
}

impl Error {
    pub fn message(&self) -> &str {
        match self {
            Error::CallerNotPoolAdmin => "The caller of the function is not a pool admin",
            Error::CallerNotEmergencyAdmin => "The caller of the function is not an emergency admin",
            Error::CallerNotPoolOrEmergencyAdmin => "The caller of the function is not a pool or emergency admin",
            Error::CallerNotRiskOrPoolAdmin => "The caller of the function is not a risk or pool admin",
            Error::CallerNotAssetListingOrPoolAdmin => "The caller of the function is not an asset listing or pool admin",
            Error::CallerNotBridge => "The caller of the function is not a bridge",
            Error::AddressesProviderNotRegistered => "Pool addresses provider is not registered",
            Error::InvalidAddressesProviderId => "Invalid id for the pool addresses provider",
            Error::NotContract => "Address is not a contract",
            Error::CallerNotPoolConfigurator => "The caller of the function is not the pool configurator",
            Error::CallerNotAToken => "The caller of the function is not an AToken",
            Error::InvalidAddressesProvider => "The address of the pool addresses provider is invalid",
            Error::InvalidFlashloanExecutorReturn => "Invalid return value of the flashloan executor function",
            Error::ReserveAlreadyAdded => "Reserve has already been added to reserve list",
            Error::NoMoreReservesAllowed => "Maximum amount of reserves in the pool reached",
            Error::EmodeCategoryReserved => "Zero eMode category is reserved for volatile heterogeneous assets",
            Error::InvalidEmodeCategoryAssignment => "Invalid eMode category assignment to asset",
            Error::ReserveLiquidityNotZero => "The liquidity of the reserve needs to be 0",
            Error::FlashloanPremiumInvalid => "Invalid flashloan premium",
            Error::InvalidReserveParams => "Invalid risk parameters for the reserve",
            Error::InvalidEmodeCategoryParams => "Invalid risk parameters for the eMode category",
            Error::BridgeProtocolFeeInvalid => "Invalid bridge protocol fee",
            Error::CallerMustBePool => "The caller of this function must be a pool",
            Error::InvalidMintAmount => "Invalid amount to mint",
            Error::InvalidBurnAmount => "Invalid amount to burn",
            Error::InvalidAmount => "Amount must be greater than 0",
            Error::ReserveInactive => "Action requires an active reserve",
            Error::ReserveFrozen => "Action cannot be performed because the reserve is frozen",
            Error::ReservePaused => "Action cannot be performed because the reserve is paused",
            Error::BorrowingNotEnabled => "Borrowing is not enabled",
            Error::StableBorrowingNotEnabled => "Stable borrowing is not enabled",
            Error::NotEnoughAvailableUserBalance => "User cannot withdraw more than the available balance",
            Error::InvalidInterestRateModeSelected => "Invalid interest rate mode selected",
            Error::CollateralBalanceIsZero => "The collateral balance is 0",
            Error::HealthFactorLowerThanLiquidationThreshold => "Health factor is lesser than the liquidation threshold",
            Error::CollateralCannotCoverNewBorrow => "There is not enough collateral to cover a new borrow",
            Error::CollateralSameAsBorrowingCurrency => "Collateral is (mostly) the same currency that is being borrowed",
            Error::AmountBiggerThanMaxLoanSizeStable => "The requested amount is greater than the max loan size in stable rate mode",
            Error::NoDebtOfSelectedType => "For repayment of a specific type of debt, the user needs to have debt that type",
            Error::NoExplicitAmountToRepayOnBehalf => "To repay on behalf of a user an explicit amount to repay is needed",
            Error::NoOutstandingStableDebt => "User does not have outstanding stable rate debt on this reserve",
            Error::NoOutstandingVariableDebt => "User does not have outstanding variable rate debt on this reserve",
            Error::UnderlyingBalanceZero => "The underlying balance needs to be greater than 0",
            Error::InterestRateRebalanceConditionsNotMet => "Interest rate rebalance conditions were not met",
            Error::HealthFactorNotBelowThreshold => "Health factor is not below the threshold",
            Error::CollateralCannotBeLiquidated => "The collateral chosen cannot be liquidated",
            Error::SpecifiedCurrencyNotBorrowedByUser => "User did not borrow the specified currency",
            Error::InconsistentFlashloanParams => "Inconsistent flashloan parameters",
            Error::BorrowCapExceeded => "Borrow cap is exceeded",
            Error::SupplyCapExceeded => "Supply cap is exceeded",
            Error::UnbackedMintCapExceeded => "Unbacked mint cap is exceeded",
            Error::DebtCeilingExceeded => "Debt ceiling is exceeded",
            Error::UnderlyingClaimableRightsNotZero => "Claimable rights over underlying not zero (aToken supply or accruedToTreasury)",
            Error::StableDebtNotZero => "Stable debt supply is not zero",
            Error::VariableDebtSupplyNotZero => "Variable debt supply is not zero",
            Error::LtvValidationFailed => "Ltv validation failed",
            Error::InconsistentEmodeCategory => "Inconsistent eMode category",
            Error::PriceOracleSentinelCheckFailed => "Price oracle sentinel validation failed",
            Error::AssetNotBorrowableInIsolation => "Asset is not borrowable in isolation mode",
            Error::ReserveAlreadyInitialized => "Reserve has already been initialized",
            Error::UserInIsolationModeOrLtvZero => "User is in isolation mode or ltv is zero",
            Error::InvalidLtv => "Invalid ltv parameter for the reserve",
            Error::InvalidLiqThreshold => "Invalid liquidity threshold parameter for the reserve",
            Error::InvalidLiqBonus => "Invalid liquidity bonus parameter for the reserve",
            Error::InvalidDecimals => "Invalid decimals parameter of the underlying asset of the reserve",
            Error::InvalidReserveFactor => "Invalid reserve factor parameter for the reserve",
            Error::InvalidBorrowCap => "Invalid borrow cap for the reserve",
            Error::InvalidSupplyCap => "Invalid supply cap for the reserve",
            Error::InvalidLiquidationProtocolFee => "Invalid liquidation protocol fee for the reserve",
            Error::InvalidEmodeCategory => "Invalid eMode category for the reserve",
            Error::InvalidUnbackedMintCap => "Invalid unbacked mint cap for the reserve",
            Error::InvalidDebtCeiling => "Invalid debt ceiling for the reserve",
            Error::InvalidReserveIndex => "Invalid reserve index",
            Error::AclAdminCannotBeZero => "ACL admin cannot be set to the zero address",
            Error::InconsistentParamsLength => "Array parameters that should be equal length are not",
            Error::ZeroAddressNotValid => "Zero address not valid",
            Error::InvalidExpiration => "Invalid expiration",
            Error::InvalidSignature => "Invalid signature",
            Error::OperationNotSupported => "Operation not supported",
            Error::DebtCeilingNotZero => "Debt ceiling is not zero",
            Error::AssetNotListed => "Asset is not listed",
            Error::InvalidOptimalUsageRatio => "Invalid optimal usage ratio",
            Error::InvalidOptimalStableToTotalDebtRatio => "Invalid optimal stable to total debt ratio",
            Error::UnderlyingCannotBeRescued => "The underlying asset cannot be rescued",
            Error::AddressesProviderAlreadyAdded => "Reserve has already been added to reserve list",
            Error::PoolAddressesDoNotMatch => "The token implementation pool address and the pool address provided by the initializing pool do not match",
            Error::StableBorrowingEnabled => "Stable borrowing is enabled",
            Error::SiloedBorrowingViolation => "User is trying to borrow multiple assets including a siloed one",
            Error::ReserveDebtNotZero => "The total debt of the reserve needs to be 0",
            Error::FlashloanDisabled => "FlashLoaning for this asset is disabled",
        }
    }
}

fn main() {
    // Example usage
    let error = Error::CallerNotPoolAdmin;
    println!("Error code: {:?}", error);
    println!("Error message: {}", error.message());
}
