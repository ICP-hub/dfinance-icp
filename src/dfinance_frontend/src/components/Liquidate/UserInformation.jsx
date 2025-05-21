import React, { useEffect, useRef, useState, useCallback } from "react";
import { Info, X, TriangleAlert } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import check from "../../../public/assests-icon/check.png";
import cross from "../../../public/assests-icon/cross.png";
import { Principal } from "@dfinity/principal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../CustomHooks/useAssets";
import { useDispatch, useSelector } from "react-redux";
import useFetchConversionRate from "../CustomHooks/useFetchConversionRate";
import { trackEvent } from "../../utils/googleAnalytics";
import { toggleRefreshLiquidate } from "../../redux/reducers/liquidateUpdateReducer";
import useFunctionBlockStatus from "../CustomHooks/useFunctionBlockStatus";
import useTransferFee from "../CustomHooks/useTransferFee";
import { SCALING_FACTOR } from '../../utils/constants';
import { PERCENTAGE_FACTOR } from '../../utils/constants';
import useNotificationSystem from "../CustomHooks/useNotification";
const UserInformationPopup = ({
  onClose,
  mappedItem,
  userAccountData,
  assetSupply,
  assetBorrow,
  assetBalance,
}) => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { isBlocked } = useFunctionBlockStatus();
  const { backendActor } = useAuth();

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();

  const {
    assets,
    filteredItems,
    fetchAssetSupply,
    fetchAssetBorrow,
    AssetImages,
    asset_supply,
    asset_borrow
  } = useAssetData();

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [rewardAmount, setRewardAmount] = useState();
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedDebtAsset, setSelectedDebtAsset] = useState();
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [calculatedData, setCalculatedData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAssetBalance, setSelectedAssetBalance] = useState(0);
  const [factor, setFactor] = useState("");
  const [showPanicPopup, setShowPanicPopup] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [selectedAssetSupply, setSelectedAssetSupply] = useState(null);
  const [collateralRate, setCollateralRate] = useState(null);
  const [collateral, setCollateralRateAmount] = useState(null);
  const [info, setInfo] = useState(false);
  const [isCollateralAssetSelected, setIsCollateralAssetSelected] =
    useState(false);
  const [isDebtAssetSelected, setIsDebtAssetSelected] = useState(false);
  const [amountToRepayUSD, setAmountToRepayUSD] = useState(null);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [ledgerFee, setLedgerFee] = useState(null);
  const assetRates = {
    ckETH: ckETHUsdRate,
    ckBTC: ckBTCUsdRate,
    ckUSDC: ckUSDCUsdRate,
    ICP: ckICPUsdRate,
    ckUSDT: ckUSDTUsdRate,
  };

  const [value, setValue] = useState(0);
  const checkAndNotify = useNotificationSystem();
  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const dispatch = useDispatch();
  const liquidateTrigger = useSelector(
    (state) => state.liquidateUpdate.LiquidateTrigger
  );
  const ledgerActors = useSelector((state) => state.ledger);

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  const transferFeRetrive = useTransferFee(selectedDebtAsset);
  const transferFee = Number(transferFeRetrive?.transferFee) || 0;
  const ledgerFeeNumber =
    typeof ledgerFee === "bigint"
      ? Number(ledgerFee)
      : Number(ledgerFee) || 0;

  const transactionFee = transferFee + ledgerFeeNumber/1e8;
  const formatFee = (fee) => {
    const fixedFee = parseFloat(fee).toFixed(8);
    const parts = fixedFee.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    return `${integerPart}.${decimalPart.padEnd(8, "0").slice(0, 8)}`;
  };
  const formattedTransactionFee = formatFee(transactionFee);
  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  // Fetch asset supply and borrow data
  const getAssetSupplyValue = useCallback((asset) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset][0]);
      return supplyValue;
    } else {
      console.warn(`No supply value found for ${asset}`);
      return 0;
    }
  }, [asset_supply]);

  const getAssetBorrowValue = useCallback((asset) => {
    if (asset_borrow[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset][0]);
      return borrowValue;
    }
    console.warn(`No borrow value found for ${asset}`);
    return 0;
  }, [asset_borrow]);



  /**
 * Calculate the Health Factor based on total collateral, total debt, and liquidation thresholds.
 * 
 * 1. Retrieve `amountTaken` and `amountAdded` from `calculatedData`, scaled by 1e8.
 * 2. Define asset rates for `ckETH`, `ckBTC`, `ckUSDC`, `ICP`, and `ckUSDT`.
 * 3. Compute `totalCollateralValue`, adjusting for `amountTaken` and the selected asset's rate.
 * 4. Ensure `totalCollateralValue` and `totalDeptValue` are non-negative.
 * 5. If `totalDeptValue` is 0, return `Infinity`.
 * 6. Calculate adjusted liquidation value (`avliq = liquidationThreshold * totalCollateral`).
 * 7. Adjust liquidation value (`tempLiq`), factoring in `amountTaken` and `reserveliquidationThreshold`.
 * 8. Normalize `tempLiq` based on `totalCollateralValue`.
 * 9. Compute the health factor as `(totalCollateralValue * (tempLiq / 100)) / totalDeptValue`.
 * 10. Round and return the health factor, ensuring 8 decimal places.
 */
  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold,
    reserveliquidationThreshold
  ) => {
    const amountTaken = calculatedData?.maxCollateral / SCALING_FACTOR || 0;
    const amountAdded = calculatedData?.maxDebtToLiq / SCALING_FACTOR || 0;

    const assetRates = {
      ckETH: ckETHUsdRate,
      ckBTC: ckBTCUsdRate,
      ckUSDC: ckUSDCUsdRate,
      ICP: ckICPUsdRate,
      ckUSDT: ckUSDTUsdRate,
    };

    let totalCollateralValue =
      Math.trunc(
        (parseFloat(totalCollateral) -
          parseFloat(amountTaken * (assetRates[selectedAsset] / SCALING_FACTOR))) *
        SCALING_FACTOR
      ) / SCALING_FACTOR;

    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }

    let totalDeptValue =
      Math.trunc(
        (parseFloat(totalDebt) -
          parseFloat(amountAdded * (assetRates[selectedDebtAsset] / SCALING_FACTOR))) *
        SCALING_FACTOR
      ) / SCALING_FACTOR;

    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    if (totalDeptValue === 0) {
      return Infinity;
    }

    let avliq = Math.trunc(liquidationThreshold * totalCollateral * SCALING_FACTOR) / SCALING_FACTOR;

    let tempLiq =
      avliq -
      amountTaken *
      (assetRates[selectedAsset] / SCALING_FACTOR) *
      reserveliquidationThreshold;
    if (totalCollateralValue > 0) {
      tempLiq = tempLiq / totalCollateralValue;

      const multiplier = Math.pow(10, 8);
      tempLiq = Math.floor(tempLiq * multiplier) / multiplier;
    }

    let result = (totalCollateralValue * (tempLiq / 100)) / totalDeptValue;
    result = Math.round(result * SCALING_FACTOR) / SCALING_FACTOR;

    return result;
  };

  // Function to get balance for principal and asset
  const getBalanceForPrincipalAndAsset = (
    principal,
    assetName,
    balanceType
  ) => {
    const userBalances = assetBalance[principal] || {};
    const assetBalances = userBalances[assetName];
    return assetBalances ? assetBalances[balanceType] || 0 : 0;
  };

  //Asset supply calculated
  const calculateAssetSupply = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    let currentLiquidity = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        currentLiquidity = reserveGroup[1]?.liquidity_index || 0;
      }
    });
    const assetBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "dtokenBalance"
      ) || 0;
    if (!currentLiquidity) return 0;
    return Math.trunc(
      Math.trunc(Number(assetBalance) / Number(currentLiquidity)) *
      Number(getAssetSupplyValue(assetName))
    );
  };
  //asset borrow calculated
  const calculateAssetBorrow = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    let debtIndex = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        debtIndex = reserveGroup[1]?.variable_borrow_index || 0;
      }
    });

    const assetBorrowBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "debtTokenBalance"
      ) || 0;

    if (!debtIndex) return 0;

    return Math.trunc(
      (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetName))) /
      Number(debtIndex)
    );
  };

  //Function to close popup on clicking outisde
  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      onClose();
    }
  };

  //Function to handle next click
  const handleNextClick = () => {
    if (isDebtInfo) {
      return;
    } else {
      setIsDebtInfo(true);
    }
  };

  //Function to handle debt asset selection
  const handleDebtAssetSelection = (
    asset,
    assetBorrowAmount,
    assetBorrowAmountInUSD
  ) => {
    setIsDebtAssetSelected(true);
    setSelectedDebtAsset(asset);
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);
    setAmountToRepayUSD(assetBorrowAmountInUSD ? assetBorrowAmountInUSD : 0);
    setIsCollateralAssetSelected(false);
    setSelectedAsset(null);
    setCollateralRate(0);
    setSelectedAssetSupply(0);
    setCollateralRateAmount(0);
  };

  const handleAssetSelection = (
    asset,
    collateralRate,
    assetSupply,
    collateralAmount
  ) => {
    setIsCollateralAssetSelected(true);
    setSelectedAsset(asset);
    setCollateralRate(collateralRate ? collateralRate : 0);
    setSelectedAssetSupply(assetSupply);
    setCollateralRateAmount(collateralAmount ? collateralAmount : 0);
  };

  const handleCheckboxClick = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };
  const fetchStatusFromBackend = async () => {
    try {
      const cycleStatus = await backendActor.cycle_alert();
      const tokenStatus = await backendActor.token_balance_alert(selectedAsset);
      const status = {
        cycle: cycleStatus,
        token: tokenStatus.OK
      };

      return status;
    } catch (error) {
      console.error("Failed to fetch status:", error);
      throw error;
    }
  };
  const handleApprove = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    let ledgerActor;
    if (selectedDebtAsset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (selectedDebtAsset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (selectedDebtAsset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (selectedDebtAsset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    } else if (selectedDebtAsset === "ckUSDT") {
      ledgerActor = ledgerActors.ckUSDT;
    }

    const supplyAmount = BigInt(Math.round(amountToRepay * SCALING_FACTOR));

   
    // If some values are regular numbers
    const totalAmount = BigInt(supplyAmount) + BigInt(Math.round(transferFee * SCALING_FACTOR)) + BigInt(ledgerFee);
    try {
      setIsLoading(true);
      const result = await ledgerActor.icrc2_approve({
        fee: ledgerFee ? [ledgerFee] : [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: totalAmount,
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
          subaccount: [],
        },
      });
      setIsApproved(true);
      toast.success(`Approval successful!`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
  * Calculates max collateral to liquidity and max debt to liquidity.
  *
  * 1. **Validation**: Check if `supplyAmount`, `totalDebt`, and `collateralBalance` are valid numbers.
  * 2. **Asset Rates**: Fetch rates for `selectedAsset` and `selectedDebtAsset`.
  * 3. **Truncate Values**: Ensure precision by truncating collateral and debt values to 8 decimal places.
  * 4. **Final Collateral Amount**: Add `liquidation_bonus` to collateral and truncate the result:
  *    finalCollateralAmount = truncatedCollateral + (truncatedCollateral * (liquidation_bonus / 100))
  * 5. **Max Collateral**: 
  *    - If `finalCollateralAmount > collateralBalance`, set `maxCollateral` to `collateralBalance`.
  *    - Otherwise, use `finalCollateralAmount`.
  * 6. **Max Debt to Liquidity**:
  *    - If `maxCollateral` equals `collateralBalance`, calculate the `maxDebtToLiq`:
  *    maxDebtToLiq = ((collateralBalance * usdRate) / debtPrice) * (10000 / generalLiquidityBonus)
  *    - Otherwise, use the `supplyAmount` as `maxDebtToLiq`.
  * 7. **Return**: Return `maxCollateral` and `maxDebtToLiq`.
  */
  function cal_max_collateral_to_liq(
    supplyAmount,
    totalDebt,
    collateralBalance,
    selectedAsset
  ) {
    if (isNaN(supplyAmount) || isNaN(totalDebt) || isNaN(collateralBalance)) {
      throw new Error(
        "Invalid input parameters. All parameters must be numbers."
      );
    }

    const assetRates = {
      ckETH: ckETHUsdRate,
      ckBTC: ckBTCUsdRate,
      ckUSDC: ckUSDCUsdRate,
      ICP: ckICPUsdRate,
      ckUSDT: ckUSDTUsdRate,
    };

    const usdRate = assetRates[selectedAsset]
      ? assetRates[selectedAsset] / SCALING_FACTOR
      : null;
    const debtPrice = assetRates[selectedDebtAsset]
      ? assetRates[selectedDebtAsset] / SCALING_FACTOR
      : null;
    if (!debtPrice)
      console.error(
        "Debt price not found for selectedDebtAsset:",
        selectedDebtAsset
      );

    const truncateToEightDecimals = (value) => Math.floor(value * SCALING_FACTOR) / SCALING_FACTOR;
    const truncatedCollateral = truncateToEightDecimals(collateralAmount);
    const truncatedCollateralBalance =
      truncateToEightDecimals(collateralBalance);

    let finalCollateralAmount = truncateToEightDecimals(
      (truncatedCollateral + truncatedCollateral * (liquidation_bonus / 100)) *
      SCALING_FACTOR
    );

    finalCollateralAmount = Math.trunc(finalCollateralAmount);
    const generalLiquidityBonus = (100 + liquidation_bonus) * 100;

    let maxCollateral, maxDebtToLiq;

    if (finalCollateralAmount > truncatedCollateralBalance) {
      maxCollateral = truncatedCollateralBalance;

      const calculatedValue =
        ((truncatedCollateralBalance * usdRate) / debtPrice) *
        (10000 / generalLiquidityBonus);

      maxDebtToLiq = Math.trunc(calculatedValue);
      setInfo(false);
    } else {
      maxDebtToLiq = supplyAmount;
      maxCollateral = finalCollateralAmount;
      setInfo(false);
    }

    return {
      maxCollateral,
      maxDebtToLiq,
    };
  }

  //Function to calculate max collateral
  const handleMaxCollateral = async () => {
    try {
      const supplyAmount = Math.trunc(amountToRepay * SCALING_FACTOR);
      const totalDebt = Number(mappedItem.debt) * SCALING_FACTOR;
      const selectedAssetsupply = Math.trunc(selectedAssetSupply);

      const response = cal_max_collateral_to_liq(
        supplyAmount,
        totalDebt,
        selectedAssetsupply,
        selectedAsset
      );
      if (response) {
        return response;
      }
    } catch (error) {
      console.error("Error in handleMaxCollateral:", error.message);
    }
  };

  const errorMessages = {
    EmptyAsset: "The asset cannot be empty. Please select a valid asset.",
    InvalidAssetLength:
      "Asset name is too long. Maximum length is 7 characters.",
    InvalidAmount: "An unexpected error occurred. Please try again later.",
    AnonymousPrincipal: "Anonymous users cannot perform this action.",
    LockAcquisitionFailed:
      "Failed to acquire lock for the operation. Try again later.",
    NoReserveDataFound:
      "No reserve data found for the selected asset. Please try again.",
    NoUserReserveDataFound:
      "User reserve data not found. Ensure you have the required assets.",
    NoCanisterIdFound:
      "Collateral asset canister ID is missing. Contact support.",
    ConversionErrorFromTextToPrincipal:
      "Conversion error occurred. Please refresh and retry.",
    ExchangeRateError: "Failed to fetch price data. Try again later.",
    CryptoBaseAssetNotFound: "Failed to fetch price data. Try again later.",
    HealthFactorLess: "Health Factor is less than one.",
    UserCannotBeLiquidated:
      "Health Factor is too high to proceed with liquidation",
    InterestRateUpdateFailed:
      "Interest rates could not be updated. Please retry.",
    ErrorRollBack:
      "An error occurred during rollback. Contact support if the issue persists.",
    Default: "An unexpected error occurred. Please try again later.",
  };

  /**
 * This function handles the liquidation process by executing several calculations 
 * and interacting with the backend actor. 
 * 
 * Key Calculations:
 * 1. Truncates debt and collateral values to eight decimal places for precision.
 * 2. Converts the values into their smallest units (for example, converting tokens to wei-like units).
 * 3. Prepares the liquidation parameters by calculating the supply amount (debt) and reward amount (collateral).
 * 4. Sends the liquidation request to the backend actor, along with the necessary parameters.
 * 
 * The function also handles errors by checking for specific error codes and 
 * displaying appropriate error messages via toasts to inform the user about 
 * issues like being blocked, exchange rate errors, health factor issues, 
 * or maximum liquidation amounts.
 */
  const handleConfirmLiquidation = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    setIsLoading(true);
    try {
      const truncateToEightDecimals = (num) => {
        return Math.trunc(num * SCALING_FACTOR) / SCALING_FACTOR;
      };
      const maxDebtToLiqValue = calculatedData?.maxDebtToLiq
        ? calculatedData.maxDebtToLiq / SCALING_FACTOR
        : 0;

      const truncatedMaxDebtToLiq = truncateToEightDecimals(maxDebtToLiqValue);
      let supplyAmount = truncateToEightDecimals(truncatedMaxDebtToLiq);
      supplyAmount = Math.trunc(supplyAmount * SCALING_FACTOR);

      const maxCollateralValue = calculatedData?.maxCollateral
        ? calculatedData.maxCollateral / SCALING_FACTOR
        : 0;

      const truncatedMaxCollateral =
        truncateToEightDecimals(maxCollateralValue);
      let rewardAmount = truncatedMaxCollateral;
      rewardAmount = truncateToEightDecimals(rewardAmount);

      if (!backendActor) {
        throw new Error("Backend actor is not initialized");
      }
      const liquidationParams = {
        debt_asset: selectedDebtAsset,
        collateral_asset: selectedAsset,
        // If some values are regular numbers
        amount: BigInt(supplyAmount) + BigInt(Math.round(transferFee * SCALING_FACTOR)) + BigInt(ledgerFee),
        on_behalf_of: mappedItem?.principal?._arr,
        reward_amount: Math.trunc(rewardAmount * SCALING_FACTOR),
      };
      const result = await backendActor.execute_liquidation(liquidationParams);
      const statusData = await fetchStatusFromBackend();

      await checkAndNotify(statusData);
      if ("Ok" in result) {
        trackEvent(
          `Liq:${selectedDebtAsset},${selectedAsset},${Number(
            amountToRepay
          ).toLocaleString()},${mappedItem.principal.toString()}`,
          "Assets",
          `Liq:${selectedDebtAsset},${selectedAsset},${Number(
            amountToRepay
          ).toLocaleString()},${mappedItem.principal.toString()}`
        );

        toast.success(`Liquidation successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTransactionResult("success");
      } else if ("Err" in result) {
        const errorKey = result.Err;
        const errorMessage = String(errorKey).toLowerCase();
        if (errorKey && "BlockedForOneHour" in errorKey) {
          console.error("You are temporarily blocked from using this function");

          toast.error("You are temporarily blocked from using this function", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          return;
        }

        if (errorKey?.ExchangeRateError === null) {
          toast.error("Price fetch failed", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setError(
            "Price fetch failed: Your assets are safe, try again later."
          );
        } else if (errorKey?.HealthFactorLess === null) {
          toast.error("Health factor too high", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setError("Health Factor too high to proceed for liquidation.");
        } else if (errorKey?.MaxAmount === null) {
          toast.error("Liquidation amount exceeds maximum allowed.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setError(
            "The liquidation amount you entered exceeds the allowed maximum."
          );
        } else if (errorKey?.LessRewardAmount === null) {
          toast.error("Reward amount is too low for liquidation.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setError("The reward amount is too low for liquidation to proceed.");
        } else if (errorMessage.includes("panic")) {
          setShowPanicPopup(true);
          setShowWarningPopup(false);
        } else if (
          errorMessage.includes("out of cycles") ||
          errorMessage.includes("reject text: canister")
        ) {
          toast.error("Canister is out of cycles. Admin has been notified.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else if (errorMessage.includes("borrowcapexceeded")) {
          toast.error("Borrow cap is exceeded.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else if (errorMessage.includes("collateral too low")) {
          toast.error("Collateral is too low for liquidation.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          const userFriendlyMessage =
            errorMessages[errorKey] || errorMessages.Default;
          console.error("Error:", errorKey);

          toast.error(`Liquidation failed: ${userFriendlyMessage}`, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
        setTransactionResult("failure");
      }
    } catch (error) {
      console.error(`Error: ${error.message || "Liquidation action failed!"}`);

      const message = error.message
        ? error.message.toLowerCase()
        : "Liquidation action failed!";
      const isPanicError = message.includes("panic");
      const isOutOfCyclesError =
        message.includes("out of cycles") ||
        message.includes("reject text: canister");
      const isMaxAmountExceeded = message.includes("MaxAmount");
      const isLessRewardAmount = message.includes("LessRewardAmount");

      if (isPanicError) {
        setShowPanicPopup(true);
        setShowWarningPopup(false);
      } else if (isOutOfCyclesError) {
        toast.error("Canister is out of cycles. Admin has been notified.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if (isMaxAmountExceeded) {
        toast.error("Liquidation amount exceeds maximum allowed.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if (isLessRewardAmount) {
        toast.error("Reward amount is too low for liquidation.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
      setTransactionResult("failure");
    } finally {
      setIsLoading(false);
    }
  };

  //Function to handle wanring popup close
  const handleCloseWarningPopup = () => {
    setShowWarningPopup(false);
  };

  //Function to show warnning popup
  const handleCallLiquidation = () => {
    setShowWarningPopup(true);
  };

  //Function to handle popup close
  const handleClosePopup = () => {
    setTransactionResult(null);
    onClose();
    dispatch(toggleRefreshLiquidate());
  };

  /**
  * Renders asset details including:
  * - Reward amount in USD
  * - Adjusted reward amount and bonus (calculated as DebtAmount * liquidation_bonus / 100)
  * - User health factor and transaction fee
  * 
  * Calculates the bonus based on DebtAmount and liquidation bonus percentage:
  *    bonusValue = (DebtAmount / 1e8) * liquidation_bonus / 100
  */
  const renderDebtAssetDetails = (asset) => {
    const assetBalances = {
      ckETH: ckETHBalance,
      ckBTC: ckBTCBalance,
      ckUSDC: ckUSDCBalance,
      ICP: ckICPBalance,
      ckUSDT: ckUSDTBalance || "0.00",
    };

    const balance = assetBalances[asset];
    const assetIndex = assets.indexOf(asset);
    return (
      <div className="flex flex-col items-end">
        <p className="text-xs font-normal  text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
          Wallet Balance
        </p>
        <div className=" flex items-center space-x-2">
          <p className="text-xs font-normal text-[#2A1F9D] dark:text-darkText mt-1 ">
            {balance}
          </p>

          {/* Asset Image */}
          {assetIndex !== -1 && AssetImages[assetIndex] && (
            <img
              key={assetIndex}
              src={AssetImages[assetIndex]}
              alt={asset || "asset"}
              className="rounded-full w-4 h-4 mt-1"
            />
          )}
        </div>
      </div>
    );
  };

  const formatValue = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return "0.00";
    }
    if (numericValue === 0) {
      return "0.00";
    } else if (numericValue >= 1) {
      return numericValue.toFixed(2);
    } else {
      return numericValue.toFixed(7);
    }
  };

  const renderAssetDetails = (asset) => {
    if (!asset) return null;

    const assetRates = {
      ckETH: ckETHUsdRate,
      ckBTC: ckBTCUsdRate,
      ckUSDC: ckUSDCUsdRate,
      ICP: ckICPUsdRate,
      ckUSDT: ckUSDTUsdRate,
    };

    const usdRate = assetRates[asset] ? assetRates[asset] / SCALING_FACTOR : null;
    const adjustedRewardAmount =
      rewardAmount !== calculatedData?.maxCollateral / SCALING_FACTOR
        ? calculatedData?.maxCollateral / SCALING_FACTOR
        : rewardAmount;
    const rewardInUSD = usdRate ? adjustedRewardAmount * usdRate : null;
    const DebtusdRate = assetRates[selectedDebtAsset]
      ? assetRates[selectedDebtAsset] / SCALING_FACTOR
      : 0;
    const DebtAmount =
      selectedAsset == selectedDebtAsset
        ? calculatedData?.maxDebtToLiq
        : Math.trunc((calculatedData?.maxDebtToLiq * DebtusdRate) / usdRate);
    const bonusValue = ((DebtAmount / SCALING_FACTOR) * liquidation_bonus) / 100;
    const assetIndex = assets.indexOf(asset);
    const DebtassetIndex = assets.indexOf(selectedDebtAsset);
    return (
      <div className="mt-4">
        <p className="text-sm font-normal text-[#2A1F9D] opacity-80 dark:text-darkText dark:opacity-80">
          Reward Amount
        </p>
        <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-1 flex justify-between items-center">
          <div>
            {(() => {
              let displayedReward;
              if (!isFinite(rewardInUSD) || rewardInUSD === 0) {
                displayedReward = "0.00";
              } else if (rewardInUSD < 0.01) {
                displayedReward = `<${(0.01 / usdRate).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  }
                )}`;
              } else {
                displayedReward = adjustedRewardAmount.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  }
                );
              }

              return (
                <>
                  <p className="text-sm font-medium text-green-500">
                    {displayedReward}
                  </p>
                  {usdRate && (
                    <p className="text-xs font-normal text-gray-500 dark:text-darkTextSecondary mt-1">
                      {rewardInUSD === 0
                        ? "$0.00"
                        : rewardInUSD < 0.01
                          ? "<0.01$"
                          : `$${rewardInUSD.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          <div className="flex flex-col items-end">
            <p className="text-xs font-normal text-[#2A1F9D] dark:text-darkText opacity-50">
              Including Bonus:
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs font-normal text-green-500 mt-1">
                {formatValue(bonusValue)}
              </p>

              {assetIndex !== -1 && AssetImages[assetIndex] && (
                <img
                  key={assetIndex}
                  src={AssetImages[assetIndex]}
                  alt={asset || "asset"}
                  className="rounded-full w-4 h-4 mt-1"
                />
              )}
            </div>
          </div>
        </div>

        <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4"></div>

        <div className="w-full text-[14px] mt-1">
          <div className="flex justify-between items-center">
            <p className="opacity-80">User Health Factor:</p>
            <div className="flex items-center gap-1">
              <span
                className={`${value > 3
                  ? "text-green-500"
                  : value <= 1
                    ? "text-red-500"
                    : value <= 1.5
                      ? "text-orange-600"
                      : value <= 2
                        ? "text-orange-400"
                        : "text-orange-300"
                  }`}
              >
                {value > 100 ? "∞" : value.toFixed(2)}
              </span>
              <span className="text-gray-500">→</span>
              <span
                className={`${currentHealthFactor > 3
                  ? "text-green-500"
                  : currentHealthFactor <= 1
                    ? "text-red-500"
                    : currentHealthFactor <= 1.5
                      ? "text-orange-600"
                      : currentHealthFactor <= 2
                        ? "text-orange-400"
                        : "text-orange-300"
                  }`}
              >
                {currentHealthFactor}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <p className="opacity-80">Transaction Fee:</p>
            <div className="flex items-center gap-1 mt-1 ml-1">
              <p className="font-medium">{formattedTransactionFee}</p>
              {DebtassetIndex !== -1 && AssetImages[DebtassetIndex] && (
                <img
                  key={DebtassetIndex}
                  src={AssetImages[DebtassetIndex]}
                  alt={asset || "asset"}
                  className="rounded-full w-4 h-4 "
                />
              )}
            </div>
          </div>
        </div>

        {info === true && calculatedData?.maxDebtToLiq === 0 && (
          <div className="w-full flex flex-col my-3 space-y-2">
            <div className="w-full flex bg-[#6e3d17] p-2 rounded-md">
              <div className="w-1/12 flex items-center justify-center">
                <div className="warning-icon-container">
                  <Info className=" text-[#f6ba43]" />
                </div>
              </div>
              <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                This collateral asset is insufficient to cover the required debt
                amount. Select another one.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  let liquidation_bonus = "";

  const selectedItem = filteredItems?.find((item) => {
    const assetName = item[1].Ok[0].asset_name
      ? item[1].Ok[0].asset_name
      : "Unknown";
    return assetName === selectedAsset;
  });
  if (selectedItem && selectedItem[1]?.Ok[0]) {
    const item = selectedItem[1].Ok[0];
    liquidation_bonus =
      Number(item?.configuration?.liquidation_bonus || "0") / SCALING_FACTOR;
  }

  // Function to truncate value to 8 decimals
  const truncateToEightDecimals = (value) => {
    const multiplier = Math.pow(10, 8);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(8);
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    const fetchSupplyData = async () => {
      if (assets.length === 0) return;
      try {
        for (const asset of assets) {
          await fetchAssetSupply(asset);
        }
      } catch (error) {
        console.error("Error fetching supply data:", error);
      }
    };

    const fetchBorrowData = async () => {
      if (assets.length === 0) return;
      try {
        for (const asset of assets) {
          await fetchAssetBorrow(asset);
        }
      } catch (error) {
        console.error("Error fetching borrow data:", error);
      }
    };

    fetchSupplyData();
    fetchBorrowData();
  }, [assets, liquidateTrigger]);
 useEffect(() => {
    if (!selectedAsset || !ledgerActors) return;

    let ledgerActor;
    if (selectedAsset === "ckBTC") ledgerActor = ledgerActors.ckBTC;
    else if (selectedAsset === "ckETH") ledgerActor = ledgerActors.ckETH;
    else if (selectedAsset === "ckUSDC") ledgerActor = ledgerActors.ckUSDC;
    else if (selectedAsset === "ICP") ledgerActor = ledgerActors.ICP;
    else if (selectedAsset === "ckUSDT") ledgerActor = ledgerActors.ckUSDT;
    else {
      console.error(`Unknown selectedAsset type: ${selectedAsset}`);
      return;
    }

    // Define async function inside useEffect
    const fetchFee = async () => {
      try {
        const fee = await ledgerActor.icrc1_fee();
        const feeAsNumber = typeof fee === "bigint" ? Number(fee) : fee;
        const feeBigInt = BigInt(Math.round(feeAsNumber));
        setLedgerFee(feeBigInt);
      } catch (error) {
        console.error(`Error getting fee for ${selectedAsset}:`, error);
      }
    };

    // Call the async function
    fetchFee();
  }, [selectedAsset]);

  useEffect(() => {
    const totalCollateral = Number(mappedItem.collateral) / SCALING_FACTOR || 0;

    const totalDebt = Number(mappedItem.debt) / SCALING_FACTOR || 0;

    const liquidationThreshold =
      Number(mappedItem.liquidationThreshold) / SCALING_FACTOR || 0;

    const assetLiquidationThresholds = Array.isArray(
      mappedItem.userData?.reserves?.[0]
    )
      ? mappedItem.userData?.reserves?.[0].map((mappedItem) => {
        const assetName = mappedItem?.[0];

        const item1 = filteredItems?.find((item) => item[0] === assetName);

        const liquidationThreshold =
          Number(item1?.[1]?.Ok?.configuration?.liquidation_threshold) /
          SCALING_FACTOR || 0;

        return { assetName, liquidationThreshold };
      })
      : [];

    const reserveliquidationThreshold =
      assetLiquidationThresholds.find(
        (item) => item.assetName === selectedAsset
      )?.liquidationThreshold || 0;

    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold,
      reserveliquidationThreshold
    );

    const truncateToDecimals = (num, decimals) => {
      const factor = Math.pow(10, decimals);
      return (Math.floor(num * factor) / factor).toFixed(decimals);
    };

    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : truncateToDecimals(healthFactor, 2)
    );
  }, [
    mappedItem.collateral,
    mappedItem.debt,
    calculatedData?.maxCollateral,
    calculatedData?.maxDebtToLiq,
    liquidateTrigger,
    filteredItems,
    selectedAsset,
    assetRates,
  ]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await handleMaxCollateral();
        if (response) {
          setCalculatedData(response);
        }
      } catch (error) {
        console.error("Error in handleMaxCollateral:", error);
      }
    };

    fetchData();
  }, [
    amountToRepay,
    selectedDebtAsset,
    selectedAsset,
    liquidateTrigger,
    collateralAmount,
  ]);

  useEffect(() => {
    if (!selectedAsset || !selectedDebtAsset || !collateralRate) {
      return;
    }
    const truncateTo8Decimals = (num) => Math.trunc(num * SCALING_FACTOR) / SCALING_FACTOR;
    const newCollateralAmount =
      selectedAsset === selectedDebtAsset
        ? amountToRepay
        : truncateTo8Decimals(amountToRepayUSD / collateralRate);

    setCollateralAmount(newCollateralAmount);
  }, [
    selectedAsset,
    selectedDebtAsset,
    amountToRepay,
    amountToRepayUSD,
    collateralRate,
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchBalance("ckUSDT"),
          fetchConversionRate(),
        ]);
      } catch (error) {
        setError(error);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    liquidateTrigger,
  ]);

  useEffect(() => {
    const newValue = Number(mappedItem.healthFactor) / (SCALING_FACTOR * PERCENTAGE_FACTOR);
    setValue(newValue);
  }, [liquidateTrigger]);

  useEffect(() => {
    const calculatedRewardAmount =
      collateral + collateral * (liquidation_bonus / PERCENTAGE_FACTOR);
    setRewardAmount(calculatedRewardAmount);
  }, [collateral, liquidation_bonus]);

  useEffect(() => {
    switch (selectedDebtAsset) {
      case "ckETH":
        setSelectedAssetBalance(ckETHBalance);
        break;
      case "ckBTC":
        setSelectedAssetBalance(ckBTCBalance);
        break;
      case "ckUSDC":
        setSelectedAssetBalance(ckUSDCBalance);
        break;
      case "ICP":
        setSelectedAssetBalance(ckICPBalance);
        break;
      case "ckUSDT":
        setSelectedAssetBalance(ckUSDTBalance);
        break;
      default:
        setSelectedAssetBalance(0);
    }
  }, [
    selectedDebtAsset,
    ckETHBalance,
    ckBTCBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
  ]);

  useEffect(() => {
    const value = Number(mappedItem.healthFactor) / (SCALING_FACTOR * PERCENTAGE_FACTOR);

    if (value > 100) {
      setFactor("50");
    } else if (value < 0.95) {
      setFactor("100");
    } else {
      setFactor("50");
    }
  }, [userAccountData]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  /* ===================================================================================
   *                                  RENDER-COMPONENTS
   * =================================================================================== */

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {transactionResult ? (
        <div
          ref={popupRef}
          className="bg-white dark:bg-[#1D1B40] dark:text-darkText p-6 rounded-md w-full max-w-md mx-4 text-center"
        >
          <div className="flex flex-col items-center">
            {transactionResult === "success" ? (
              <>
                <img src={check} alt="Success" className="w-30 h-30" />
                <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-2">
                  Liquidation Successful
                </h2>
                <p className="text-gray-500 dark:text-darkText mb-4">
                  Check Your wallet balance
                </p>
                <button
                  className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            ) : (
              <>
                <img src={cross} alt="Failure" className="w-30 h-30" />
                {error ? (
                  <p className="text-xl font-bold text-[#2A1F9D] dark:text-darkText mb-4 -mt-6">
                    {error}
                  </p>
                ) : (
                  <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-4 -mt-6">
                    Liquidation Call Failed
                  </h2>
                )}

                <button
                  className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E]  text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            )}
          </div>
        </div>
      ) : showWarningPopup ? (
        <div className="bg-white dark:bg-[#1D1B40] dark:text-darkText p-6 rounded-md w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-center text-[#2A1F9D] dark:text-indigo-300">
            Warning Pop Up
          </h2>
          <p className="text-md text-[#989898] text-center dark:text-darkText mt-4 font-light">
            Are you sure you want to liquidate on behalf of "
            <strong className="font-bold">
              {mappedItem.principal?._arr.toString()}
            </strong>
            "?{" "}
            <strong className="font-bold text-red-500">
              {amountToRepay === calculatedData.maxDebtToLiq / SCALING_FACTOR
                ? truncateToEightDecimals(amountToRepay)
                : truncateToEightDecimals(
                  calculatedData.maxDebtToLiq / SCALING_FACTOR
                )}{" "}
            </strong>
            <span className="font-bold">{selectedDebtAsset}</span> will be{" "}
            <strong className="underline">deducted</strong> from your account &{" "}
            <strong className="font-bold text-green-500">
              {rewardAmount === calculatedData?.maxCollateral / SCALING_FACTOR
                ? truncateToEightDecimals(rewardAmount)
                : truncateToEightDecimals(
                  calculatedData?.maxCollateral / SCALING_FACTOR
                )}{" "}
            </strong>
            <span className="font-bold">{selectedAsset}</span> will be rewarded.
          </p>

          <div className="mt-4 flex justify-center">
            <label className="flex items-center text-[#989898]  ">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4  appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-400 checked:border-gray-400 checked:text-white focus:outline-none checked:after:content-['✔'] checked:after:text-white checked:after:text-xs checked:after:flex checked:after:justify-center checked:after:items-center"
                checked={isCheckboxChecked}
                onChange={handleCheckboxClick}
              />
              <p className="font-semibold">Yes, call Liquidation</p>
            </label>
          </div>

          <div className="flex justify-center mt-6 ">
            {isCheckboxChecked ? (
              <button
                className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E]  text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={handleConfirmLiquidation}
                disabled={isLoading}
              >
                {"Call Liquidation"}
              </button>
            ) : (
              <button
                className="bg-gray-400 dark:bg-gray-500 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2"
                onClick={handleCloseWarningPopup}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}

            {isLoading && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(1px)",
                }}
              >
                <div className="loader"></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          ref={popupRef}
          className="bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/10 p-6 text-[#2A1F9D] dark:bg-darkOverlayBackground dark:text-darkText font-poppins w-full max-w-md mx-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#2A1F9D] dark:text-darkText">
              {isDebtInfo ? "Reward Information" : "User Information"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-darkText hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          {showPanicPopup && (
            <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2  text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
              <div className="w-full flex flex-col items-center ">
                <div className="w-full flex items-center justify-between  ">
                  <h1 className="font-semibold text-lg text-orange-400 text-center flex-grow mt-3">
                    Important Message
                  </h1>
                  <button
                    onClick={handleClosePaymentPopup}
                    className="text-gray-400 focus:outline-none mt-3 mr-4"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div
                  className="dark:bg-gradient 
                         dark:from-darkGradientStart 
                         dark:to-darkGradientEnd 
                         dark:text-darkText p-2 "
                >
                  <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                    Thanks for helping us improve DFinance! <br></br> You’ve
                    uncovered a bug, and our dev team is on it.
                  </p>

                  <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                    Your account is temporarily locked while we investigate and
                    fix the issue. <br />
                  </p>
                  <p className="text-gray-700 mb-2 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                    We appreciate your contribution and have logged your
                    ID—testers like you are key to making DFinance better!{" "}
                    <br />
                    If you have any questions, feel free to reach out.
                  </p>
                </div>
              </div>
            </div>
          )}
          {isDebtInfo ? (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Debt Asset
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  {Array.isArray(mappedItem?.userData?.reserves?.[0]) &&
                    mappedItem.userData?.reserves?.[0].map((item, index) => {
                      const assetName = item[0];
                      const asset = item[0];
                      const assetBorrow = calculateAssetBorrow(
                        assetName,
                        mappedItem
                      );

                      const assetBorrowAmount =
                        Math.trunc(
                          Number((assetBorrow * (factor / 100)) / SCALING_FACTOR) * SCALING_FACTOR
                        ) / SCALING_FACTOR;

                      let assetBorrowAmountInUSD = 0;
                      if (assetName === "ckBTC" && ckBTCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckBTCUsdRate / SCALING_FACTOR);
                      } else if (assetName === "ckETH" && ckETHUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckETHUsdRate / SCALING_FACTOR);
                      } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckUSDCUsdRate / SCALING_FACTOR);
                      } else if (assetName === "ICP" && ckICPUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckICPUsdRate / SCALING_FACTOR);
                      } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckUSDTUsdRate / SCALING_FACTOR);
                      }
                      const assetIndex = assets.indexOf(asset);
                      if (assetBorrow > 0) {
                        return (
                          <label
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              name="debtAsset"
                              className="form-radio text-[#EB8863]"
                              checked={selectedDebtAsset === asset}
                              onChange={() => {
                                handleDebtAssetSelection(
                                  asset,
                                  assetBorrowAmount,
                                  assetBorrowAmountInUSD
                                );
                              }}
                            />
                            {assetIndex !== -1 && AssetImages[assetIndex] && (
                              <img
                                key={assetIndex}
                                src={AssetImages[assetIndex]}
                                alt={asset || "asset"}
                                className="rounded-full w-7 h-7 "
                              />
                            )}
                          </label>
                        );
                      }
                      return null;
                    })}
                </div>
                <div className="flex justify-start mt-0.5">
                  {!selectedDebtAsset && (
                    <div className="w-full flex flex-col my-1 space-y-2">
                      <div className="w-full flex bg-[#6e3d17] p-2 rounded-lg text-white">
                        <div className="  flex items-center justify-center">
                          <div className="warning-icon-container">
                            <Info className=" text-[#f6ba43] w-3 h-4 mb-0.2" />
                          </div>
                        </div>
                        <div className="w-11/12 text-[12px] flex items-center text-white ml-1 ">
                          Select a debt asset to see amount to repay
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDebtAsset && (
                  <>
                    <h3 className="text-sm font-normal text-[#2A1F9D] opacity-80 dark:text-darkText dark:opacity-80 ">
                      Amount To Repay
                    </h3>
                    <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm text-[#c25252] mt-2 flex flex-row justify-between items-start">
                      <div>
                        {(() => {
                          const assetRates = {
                            ckETH: ckETHUsdRate,
                            ckBTC: ckBTCUsdRate,
                            ckUSDC: ckUSDCUsdRate,
                            ICP: ckICPUsdRate,
                            ckUSDT: ckUSDTUsdRate,
                          };

                          const usdRate = assetRates[selectedDebtAsset]
                            ? assetRates[selectedDebtAsset] / SCALING_FACTOR
                            : null;

                          const adjustedAmountToRepay =
                            calculatedData?.maxDebtToLiq > 0
                              ? calculatedData.maxDebtToLiq / SCALING_FACTOR
                              : amountToRepay;

                          const repayInUSD = usdRate
                            ? adjustedAmountToRepay * usdRate
                            : 0;
                          let displayedRepayAmount;
                          if (!isFinite(repayInUSD) || repayInUSD === 0) {
                            displayedRepayAmount = "0.00";
                          } else if (repayInUSD < 0.01) {
                            displayedRepayAmount = `<${(
                              0.01 / usdRate
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 8,
                              maximumFractionDigits: 8,
                            })}`;
                          } else {
                            displayedRepayAmount =
                              adjustedAmountToRepay.toLocaleString(undefined, {
                                minimumFractionDigits: 8,
                                maximumFractionDigits: 8,
                              });
                          }

                          return (
                            <>
                              <p className="text-sm font-semibold">
                                {amountToRepay ? (
                                  displayedRepayAmount
                                ) : (
                                  <span className="text-gray-300 text-[11px] text-normal">
                                    --
                                  </span>
                                )}
                              </p>

                              <p className="text-xs font-light text-gray-500 dark:text-darkTextSecondary mt-1">
                                {amountToRepay && selectedDebtAsset
                                  ? repayInUSD === 0
                                    ? "$0.00"
                                    : repayInUSD < 0.01
                                      ? "<0.01$"
                                      : `$${repayInUSD.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                  : ""}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      <div className="ml-4">
                        {renderDebtAssetDetails(selectedDebtAsset)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                Collateral Asset
              </h3>
              { }

              <div className="flex items-center space-x-4 mb-4">
                {mappedItem.userData?.reserves?.[0].map((item, index) => {
                  const assetName = item[0];

                  const assetSupply = calculateAssetSupply(
                    assetName,
                    mappedItem
                  );
                  let collateralRate = 0;
                  if (assetName === "ckBTC" && ckBTCUsdRate) {
                    collateralRate = ckBTCUsdRate / SCALING_FACTOR;
                  } else if (assetName === "ckETH" && ckETHUsdRate) {
                    collateralRate = ckETHUsdRate / SCALING_FACTOR;
                  } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                    collateralRate = ckUSDCUsdRate / SCALING_FACTOR;
                  } else if (assetName === "ICP" && ckICPUsdRate) {
                    collateralRate = ckICPUsdRate / SCALING_FACTOR;
                  } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                    collateralRate = ckUSDTUsdRate / SCALING_FACTOR;
                  }
                  const collateralAmount =
                    selectedAsset === selectedDebtAsset
                      ? amountToRepay
                      : amountToRepayUSD / collateralRate;

                  const assetIndex = assets.indexOf(assetName);
                  if (assetSupply > 0) {
                    return (
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="collateralAsset"
                          className="form-radio text-[#EB8863]"
                          checked={selectedAsset === assetName}
                          disabled={!selectedDebtAsset}
                          onChange={() => {
                            handleAssetSelection(
                              assetName,
                              collateralRate,
                              assetSupply,
                              collateralAmount
                            );
                          }}
                        />
                        {assetIndex !== -1 && AssetImages[assetIndex] && (
                          <img
                            key={assetIndex}
                            src={AssetImages[assetIndex]}
                            alt={assetName || "asset"}
                            className="rounded-full w-7 h-7 "
                          />
                        )}
                      </label>
                    );
                  }
                  return null;
                })}
              </div>

              {renderAssetDetails(selectedAsset)}

              {(!isCollateralAssetSelected ||
                (amountToRepay !== calculatedData?.maxDebtToLiq &&
                  !(
                    calculatedData?.maxDebtToLiq / SCALING_FACTOR <=
                    selectedAssetBalance
                  ))) && (
                  <div className="w-full flex flex-col my-3 space-y-2">
                    <div
                      className={`w-full flex p-2 rounded-lg text-white ${!isCollateralAssetSelected
                        ? "bg-[#6e3d17]"
                        : "bg-[#BA5858]"
                        }`}
                    >
                      <div className=" flex items-center justify-center">
                        <div className="warning-icon-container">
                          {isCollateralAssetSelected ? (
                            <div className="warning-icon-container">
                              <TriangleAlert />
                            </div>
                          ) : (
                            <div className="info-icon-container">
                              <Info className="text-[#f6ba43]   w-3 h-4 mb-0.2" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-11/12 text-[12px] flex items-center text-white ml-1">
                        {!isCollateralAssetSelected
                          ? "Select a collateral asset to see reward"
                          : "Amount to repay exceeds available balance of the selected asset"}
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg  sxs3:text-[12px] md:text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2"
                  onClick={() => setIsDebtInfo(false)}
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] sxs3:text-[12px] md:text-sm px-6 py-2 sxs3:p-1 sxs3:px-4 relative ${isCollateralAssetSelected &&
                    !info &&
                    isDebtAssetSelected &&
                    (amountToRepay !== calculatedData?.maxDebtToLiq
                      ? calculatedData?.maxDebtToLiq / SCALING_FACTOR <=
                      selectedAssetBalance
                      : amountToRepay <= selectedAssetBalance)
                    ? "opacity-100 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={() => {
                    isApproved ? handleCallLiquidation() : handleApprove();
                  }}
                  disabled={
                    isLoading ||
                    !isCollateralAssetSelected ||
                    !isDebtAssetSelected ||
                    info ||
                    !(amountToRepay !== calculatedData?.maxDebtToLiq
                      ? calculatedData?.maxDebtToLiq / SCALING_FACTOR <=
                      selectedAssetBalance
                      : amountToRepay <= selectedAssetBalance)
                  }
                >
                  {isApproved
                    ? `Call Liquidation ${selectedDebtAsset}`
                    : `Approve ${selectedDebtAsset} to continue`}
                </button>

                {isLoading && (
                  <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{
                      background: "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(1px)",
                    }}
                  >
                    <div className="loader"></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D]  dark:text-darkText mb-2">
                  User Section
                </h3>
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                    <p className="text-sm font-normal font-Poppins text-[#2A1F9D] opacity-50 dark:text-darkText mb-1 ">
                      User Principal
                    </p>
                    <p className="text-xs font-semibold text-[#2A1F9D] dark:text-darkText dark:opacity-100 ">
                      {` ${mappedItem?.principal?._arr.toString()}`}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm text-[#dc5959]">
                    <p className="text-sm font-normal text-[#2A1F9D] dark:text-darkText opacity-50 mb-1 ">
                      User Health Factor
                    </p>
                    <p className="text-xs font-medium ">
                      {Number(value) > 100
                        ? "Infinity"
                        : parseFloat(Number(value)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleNextClick}
                  className="my-2 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E]  text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040]  sxs3:text-[12px] md:text-sm cursor-pointer px-6 py-2 relative"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInformationPopup;
