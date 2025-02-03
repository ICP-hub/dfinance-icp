import React, { useEffect, useRef, useState } from "react";
import { Info, Check, X, TriangleAlert } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import check from "../../../public/assests-icon/check.png";
import cross from "../../../public/assests-icon/Cross.png";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import { useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../Common/useAssets";
import { Fuel } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import { trackEvent } from "../../utils/googleAnalytics";
import { toggleRefreshLiquidate } from "../../redux/reducers/liquidateUpdateReducer";

const UserInformationPopup = ({
  onClose,
  mappedItem,
  principal,
  userAccountData,
  assetSupply,
  assetBorrow,
  assetBalance,
}) => {
  const liquidateTrigger = useSelector(
    (state) => state.liquidateUpdate.LiquidateTrigger
  );

  const { backendActor, principal: currentUserPrincipal } = useAuth();
  const [rewardAmount, setRewardAmount] = useState();
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false);
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedDebtAsset, setSelectedDebtAsset] = useState();
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [calculatedData, setCalculatedData] = useState(null);
  const [userdata, setUserData] = useState();
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  const dispatch = useDispatch();
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
  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = selectedAsset
    ? selectedAsset.toLowerCase()
    : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const [maxCollateral, setMaxCollateral] = useState(null);
  const [maxDebtToLiq, setMaxDebtToLiq] = useState(null);
  const [supplyDataLoading, setSupplyDataLoading] = useState(true);
  const [borrowDataLoading, setBorrowDataLoading] = useState(true);
  const {
    assets,
    reserveData,
    filteredItems,
    fetchAssetSupply,
    fetchAssetBorrow,
  } = useAssetData();
  useEffect(() => {
    const fetchSupplyData = async () => {
      if (assets.length === 0) return;
      setSupplyDataLoading(true);
      try {
        for (const asset of assets) {
          await fetchAssetSupply(asset);
        }
      } catch (error) {
        setSupplyDataLoading(false);
        console.error("Error fetching supply data:", error);
      } finally {
        setSupplyDataLoading(false);
      }
    };

    const fetchBorrowData = async () => {
      if (assets.length === 0) return;
      setBorrowDataLoading(true);
      try {
        for (const asset of assets) {
          await fetchAssetBorrow(asset);
        }
      } catch (error) {
        setBorrowDataLoading(false);
        console.error("Error fetching borrow data:", error);
      } finally {
        setBorrowDataLoading(false);
      }
    };

    fetchSupplyData();
    fetchBorrowData();
  }, [assets, liquidateTrigger]);
  const getAssetSupplyValue = (asset, principal) => {
    if (assetSupply[asset] !== undefined) {
      const supplyValue = Number(assetSupply[asset]);
      return supplyValue;
    }
    return;
  };
  const getAssetBorrowValue = (asset, principal) => {
    if (assetBorrow[asset] !== undefined) {
      const borrowValue = Number(assetBorrow[asset]);
      return borrowValue;
    }
    return;
  };
  const [showPanicPopup, setShowPanicPopup] = useState(false);
  const { userData, healthFactorBackend, refetchUserData } = useUserData();
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const assetRates = {
    ckETH: ckETHUsdRate,
    ckBTC: ckBTCUsdRate,
    ckUSDC: ckUSDCUsdRate,
    ICP: ckICPUsdRate,
    ckUSDT: ckUSDTUsdRate,
  };

  useEffect(() => {
    // Convert values safely
    const totalCollateral = Number(mappedItem.collateral) / 1e8 || 0;
    const totalDebt = Number(mappedItem.debt) / 1e8 || 0;
    const liquidationThreshold =
      Number(mappedItem.liquidationThreshold) / 1e8 || 0;

    // Extract liquidation thresholds for each asset
    const assetLiquidationThresholds = Array.isArray(
      mappedItem.userData?.reserves?.[0]
    )
      ? mappedItem.userData?.reserves?.[0].map((mappedItem) => {
        const assetName = mappedItem?.[0];

        // Find corresponding asset in filteredItems
        const item1 = filteredItems.find((item) => item[0] === assetName);

        // Extract and convert the liquidation threshold
        const liquidationThreshold =
          Number(item1?.[1]?.Ok?.configuration?.liquidation_threshold) /
          1e8 || 0;

        console.log(
          `Asset: ${assetName}, Liquidation Threshold: ${liquidationThreshold}`
        );
        return { assetName, liquidationThreshold };
      })
      : [];

    console.log("Asset Liquidation Thresholds:", assetLiquidationThresholds);

    // Get liquidation threshold for selected asset
    const reserveliquidationThreshold =
      assetLiquidationThresholds.find(
        (item) => item.assetName === selectedAsset
      )?.liquidationThreshold || 0;

    console.log(
      `Liquidation Threshold for ${selectedAsset}:`,
      reserveliquidationThreshold
    );

    // Calculate the health factor using correct values
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold,
      reserveliquidationThreshold
    );

    // Calculate adjusted collateral and debt values
    const amountTaken = calculatedData?.maxCollateral / 1e8 || 0;
    const amountAdded = calculatedData?.maxDebtToLiq / 1e8 || 0;

    let totalCollateralValue =
      Math.trunc(
        (parseFloat(totalCollateral) -
          parseFloat(amountTaken * (assetRates[selectedAsset] / 1e8))) *
        1e8
      ) / 1e8;
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }

    let totalDebtValue =
      totalDebt - amountAdded * (assetRates[selectedDebtAsset] / 1e8);

    if (totalDebtValue < 0) {
      totalDebtValue = 0;
    }

    // Calculate liquidation values
    let avliq = Math.trunc(liquidationThreshold * totalCollateral * 1e8) / 1e8;
    console.log("avliq", avliq);

    let tempLiq = avliq - amountTaken * reserveliquidationThreshold;
    const multiplier = Math.pow(10, 8);
    tempLiq = Math.floor(tempLiq * multiplier) / multiplier;
    if (totalCollateralValue > 0) {
      tempLiq = tempLiq / totalCollateralValue;

      // Truncate to 8 decimal places
      const multiplier = Math.pow(10, 8);
      tempLiq = Math.floor(tempLiq * multiplier) / multiplier;
    }
    console.log("tempLiq", tempLiq);

    let result = (totalCollateralValue * (tempLiq / 100)) / totalDebtValue;
    result = Math.round(result * 1e8) / 1e8;

    console.log("result", result);

    // Update state with new values
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    // No return statement here; state updates should happen instead
  }, [
    mappedItem.collateral,
    mappedItem.debt,
    calculatedData?.maxCollateral,
    calculatedData?.maxDebtToLiq,
    liquidateTrigger,
    filteredItems, // Ensure filteredItems is tracked
    selectedAsset, // Track selectedAsset changes
    assetRates, // Ensure assetRates is updated
  ]);

  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold,
    reserveliquidationThreshold
  ) => {
    const amountTaken = calculatedData?.maxCollateral / 1e8 || 0;
    const amountAdded = calculatedData?.maxDebtToLiq / 1e8 || 0;
    console.log("amountTaken", amountTaken);
    console.log("amountAdded", amountAdded);
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
          parseFloat(amountTaken * (assetRates[selectedAsset] / 1e8))) *
        1e8
      ) / 1e8;
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    console.log("assetRates[selectedAsset]", assetRates[selectedAsset]);
    console.log("totalCollateralValue", totalCollateralValue);
    console.log("totalCollateral", totalCollateral);
    let totalDeptValue =
      Math.trunc(
        (parseFloat(totalDebt) -
          parseFloat(amountAdded * (assetRates[selectedDebtAsset] / 1e8))) *
        1e8
      ) / 1e8;

    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    if (totalDeptValue === 0) {
      return Infinity;
    }
    console.log("assetRates[selectedDebtAsset]", assetRates[selectedDebtAsset]);
    console.log("totalDeptValue", totalDeptValue);
    console.log("totalDebt", totalDebt);
    // const healthFactorValue =
    //   (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue;

    // return healthFactorValue;
    console.log("liquidationThreshold", liquidationThreshold);
    let avliq = Math.trunc(liquidationThreshold * totalCollateral * 1e8) / 1e8;
    console.log("avliq", avliq);
    let tempLiq = avliq - amountTaken * reserveliquidationThreshold;

    if (totalCollateralValue > 0) {
      tempLiq = tempLiq / totalCollateralValue;

      // Truncate to 8 decimal places
      const multiplier = Math.pow(10, 8);
      tempLiq = Math.floor(tempLiq * multiplier) / multiplier;
    }
    //withdraw me minus hoga repay aur borrow same toggle add horaha to plus varna minus
    console.log("tempLiq", tempLiq);
    let result = (totalCollateralValue * (tempLiq / 100)) / totalDeptValue;
    result = Math.round(result * 1e8) / 1e8;
    console.log("result", result);
    return result;
  };

  function roundToDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }
  const getBalanceForPrincipalAndAsset = (
    principal,
    assetName,
    balanceType
  ) => {
    const userBalances = assetBalance[principal] || {};

    const assetBalances = userBalances[assetName];

    return assetBalances ? assetBalances[balanceType] || 0 : 0;
  };

  const defaultAsset = "cketh";
  // const calculateAssetSupply = (assetName, mappedItem, reserveData) => {
  //   const reserve = reserveData?.[assetName];

  //   const currentLiquidity = reserve?.Ok?.liquidity_index;
  //   const assetBalance =
  //     getBalanceForPrincipalAndAsset(
  //       mappedItem.principal?._arr,
  //       assetName,
  //       "dtokenBalance"
  //     ) || 0;

  //   // Calculate asset supply
  //   return (
  //     (Number(assetBalance) * Number(getAssetSupplyValue(assetName))) /
  //     Number(currentLiquidity)
  //   );
  // };

  // const calculateAssetBorrow = (assetName, mappedItem, reserveData) => {
  //   const reserve = reserveData?.[assetName];
  //   const DebtIndex = reserve?.Ok?.debt_index;
  //   const assetBorrowBalance =
  //     getBalanceForPrincipalAndAsset(
  //       mappedItem.principal?._arr,
  //       assetName,
  //       "debtTokenBalance"
  //     ) || 0;

  //   // Calculate asset borrow
  //   return (
  //     (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetName))) /
  //     Number(DebtIndex)
  //   );
  // };
  const calculateAssetSupply = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    console.log("reserve in asset supply", reserves)
    let currentLiquidity = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        currentLiquidity = reserveGroup[1]?.liquidity_index || 0;
        console.log("Liquidity Index for", assetName, ":", currentLiquidity);
      }
    });

    const assetBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "dtokenBalance"
      ) || 0;

    if (!currentLiquidity) return 0; // Prevent division by zero
    console.log("assetBalance", assetBalance);// d token balance
    console.log("getAssetSupplyValue(assetName)", Number(getAssetSupplyValue(assetName)));
    console.log("multiply =", (Number(assetBalance) * Number(getAssetSupplyValue(assetName))));
    console.log("currentLiquidity", currentLiquidity);
    console.log("total = ", Math.trunc((Number(assetBalance) * Number(getAssetSupplyValue(assetName))) /
      Number(currentLiquidity)))

    return Math.trunc(
      (Number(assetBalance) * Number(getAssetSupplyValue(assetName))) /
      Number(currentLiquidity)
    );
  };

  const calculateAssetBorrow = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    console.log("reserves in borrow", reserves)
    let debtIndex = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        debtIndex = reserveGroup[1]?.variable_borrow_index
          || 0;
        console.log("Debt Index for", assetName, ":", debtIndex);
      }
    });

    const assetBorrowBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "debtTokenBalance"
      ) || 0;

    if (!debtIndex) return 0; // Prevent division by zero

    // Calculate asset borrow
    return Math.trunc(
      (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetName))) /
      Number(debtIndex)
    );
  };
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNextClick = () => {
    if (isDebtInfo) {
      setIsCollateralOverlay(true);
    } else {
      setIsDebtInfo(true);
    }
  };
  const [amountBorrowUSD, setAmountBorrowUSD] = useState(null);
  const [selectedAssetSupply, setSelectedAssetSupply] = useState(null);
  const [collateralRate, setCollateralRate] = useState(null);
  const [collateral, setCollateralRateAmount] = useState(null);
  const [info, setInfo] = useState(false);
  const [isCollateralAssetSelected, setIsCollateralAssetSelected] =
    useState(false);
  const [isDebtAssetSelected, setIsDebtAssetSelected] = useState(false);
  const [amountToRepayUSD, setAmountToRepayUSD] = useState(null);

  const handleDebtAssetSelection = (
    asset,
    assetBorrowAmount,
    assetBorrowAmountInUSD
  ) => {
    setIsDebtAssetSelected(true);
    setSelectedDebtAsset(asset);
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);
    setAmountToRepayUSD(assetBorrowAmountInUSD ? assetBorrowAmountInUSD : 0);

    // Reset collateral asset selection
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
  const [collateralAmount, setCollateralAmount] = useState(0);
  const ledgerActors = useSelector((state) => state.ledger);

  const principalObj = useMemo(
    () => Principal.fromText(currentUserPrincipal),
    [currentUserPrincipal]
  );

  const [loading, setLoading] = useState();

  const handleApprove = async () => {
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

    const transferFee = BigInt(100);

    const supplyAmount = BigInt(Math.round(amountToRepay * 100000000));
    const totalAmount = supplyAmount + transferFee;

    // Convert to Number
    const totalAmountAsNumber = Number(totalAmount);

    try {
      setIsLoading(true);

      const approval = await ledgerActor.icrc2_approve({
        fee: [],
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await handleMaxCollateral(); // Await the promise
        if (response) {
          setCalculatedData(response); // Set the resolved value
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

  //  Update `collateralAmount` when dependencies change
  useEffect(() => {
    if (!selectedAsset || !selectedDebtAsset || !collateralRate) {
      setCollateralAmount(collateral); // Fallback to old collateral
      return;
    }
    const truncateTo8Decimals = (num) => Math.trunc(num * 1e8) / 1e8;
    const newCollateralAmount =
      selectedAsset === selectedDebtAsset
        ? amountToRepay
        : truncateTo8Decimals(amountToRepayUSD / collateralRate);

    console.log("amount to repay usd = ", amountToRepayUSD);
    console.log("rate of collateral  = ", collateralRate);
    console.log("amount to repay eeee = ", amountToRepay);
    console.log(" Setting collateralAmount:", newCollateralAmount);
    setCollateralAmount(newCollateralAmount);
  }, [
    selectedAsset,
    selectedDebtAsset,
    amountToRepay,
    amountToRepayUSD,
    collateralRate,
  ]);

  // ✅ Log after state update completes
  useEffect(() => {
    console.log(" Updated collateralAmount:", collateralAmount);
  }, [collateralAmount]);

  //  Ensure `collateralAmount` is correctly used in calculations
  function cal_max_collateral_to_liq(
    supplyAmount,
    totalDebt,
    collateralBalance,
    selectedAsset
  ) {
    console.log("Function cal_max_collateral_to_liq called");
    console.log("to check agaaaa = ", Math.trunc(rewardAmount * 100000000))

    console.log("supplyAmount:", supplyAmount);
    console.log("totalDebt:", totalDebt);
    console.log("collateralBalance:", collateralBalance);
    console.log("selectedAsset:", selectedAsset);
    console.log("Using Updated collateralAmount:", collateralAmount); //  Ensuring we use the latest collateralAmount

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
      ? assetRates[selectedAsset] / 1e8
      : null;
    if (!usdRate)
      console.error("USD rate not found for selectedAsset:", selectedAsset);

    const debtPrice = assetRates[selectedDebtAsset]
      ? assetRates[selectedDebtAsset] / 1e8
      : null;
    if (!debtPrice)
      console.error(
        "Debt price not found for selectedDebtAsset:",
        selectedDebtAsset
      );

    //  Truncate function to ensure precision without rounding
    const truncateToEightDecimals = (value) => Math.floor(value * 1e8) / 1e8;

    //  Use collateralAmount instead of collateral
    const truncatedCollateral = truncateToEightDecimals(collateralAmount);
    const truncatedCollateralBalance =
      truncateToEightDecimals(collateralBalance);

    console.log("Truncated collateralAmount:", truncatedCollateral);
    console.log("Truncated collateralBalance:", truncatedCollateralBalance);

    let finalCollateralAmount = truncateToEightDecimals(
      (truncatedCollateral + truncatedCollateral * (liquidation_bonus / 100)) *
      1e8
    );

    finalCollateralAmount = Math.trunc(finalCollateralAmount);

    console.log(
      "Updated finalCollateralAmount before returning:",
      finalCollateralAmount
    );

    const generalLiquidityBonus = (100 + liquidation_bonus) * 100;
    console.log("General Liquidity Bonus:", generalLiquidityBonus);

    let maxCollateral, maxDebtToLiq;

    if (finalCollateralAmount > truncatedCollateralBalance) {
      console.log("Collateral amount exceeds collateral balance, adjusting...");
      maxCollateral = truncatedCollateralBalance;

      const calculatedValue =
        ((truncatedCollateral * usdRate) / debtPrice) *
        (1000 / generalLiquidityBonus);
      console.log("Calculated Debt-to-Liquidate Value:", calculatedValue);

      maxDebtToLiq = truncateToEightDecimals(calculatedValue);
      console.log("Max Debt To Liquidate (Truncated):", maxDebtToLiq);

      setInfo(true);
    } else {
      console.log("Collateral amount is within balance.");
      maxDebtToLiq = supplyAmount;
      maxCollateral = finalCollateralAmount;
      setInfo(false);
    }

    console.log("Final maxCollateral:", maxCollateral);
    console.log("Final maxDebtToLiq:", maxDebtToLiq);

    return {
      maxCollateral,
      maxDebtToLiq,
    };
  }

  const handleMaxCollateral = async () => {
    try {
      const supplyAmount = Math.trunc(amountToRepay * 100000000);
      const totalDebt = Number(mappedItem.debt) * 1e8;
      const selectedAssetsupply = Math.trunc(selectedAssetSupply);
      console.log("supplyAmount", supplyAmount);
      console.log("amount to repay again", amountToRepay);
      const response = cal_max_collateral_to_liq(
        supplyAmount,
        totalDebt,
        selectedAssetsupply,
        selectedAsset
      );
      console.log("response", response);
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
    HealthFactorLess: "Health Factor is too high to proceed with liquidation.",
    InterestRateUpdateFailed:
      "Interest rates could not be updated. Please retry.",
    ErrorRollBack:
      "An error occurred during rollback. Contact support if the issue persists.",
    Default: "An unexpected error occurred. Please try again later.",
  };

  const handleConfirmLiquidation = async () => {
    setIsLoading(true);
    try {
      const supplyAmount = Math.trunc(amountToRepay * 100000000);
      // Convert maxCollateral to correct decimal format
      const maxCollateralValue = calculatedData?.maxCollateral
        ? calculatedData.maxCollateral / 1e8
        : 0;

      // ✅ Strictly truncate to 8 decimal places (NO ROUNDING)
      const truncateToEightDecimals = (num) => {
        return Math.trunc(num * 1e8) / 1e8;
      };

      // Apply truncation function
      const truncatedMaxCollateral = truncateToEightDecimals(maxCollateralValue);

      // ✅ Determine the reward amount conditionally
      let rewardAmount = truncatedMaxCollateral;

      // Debugging logs
      console.log("reward amount", rewardAmount);
      console.log("max collateral value", maxCollateralValue);
      console.log("truncatedMaxCollateral", truncatedMaxCollateral);

      // ✅ Ensure the rewardAmount is strictly 8 decimal places
      rewardAmount = truncateToEightDecimals(rewardAmount);

      console.log("Final rewardAmount", rewardAmount);

      // ✅ Backend execution
      if (!backendActor) {
        throw new Error("Backend actor is not initialized");
      }

      const liquidationParams = {
        debt_asset: selectedDebtAsset,
        collateral_asset: selectedAsset,
        amount: supplyAmount,
        on_behalf_of: mappedItem?.principal?._arr,
        reward_amount: Math.trunc(rewardAmount * 1e8), // Convert back to integer format
      };

      console.log("result of = ", Math.trunc(rewardAmount * 1e8));


      const result = await backendActor.execute_liquidation(liquidationParams);

      if ("Ok" in result) {
        trackEvent(
          "Liq:" +
          selectedDebtAsset +
          "," +
          selectedAsset +
          "," +
          Number(amountToRepay).toLocaleString() +
          "," +
          mappedItem.principal.toString(),
          "Assets",
          "Liq:" +
          selectedDebtAsset +
          "," +
          selectedAsset +
          "," +
          Number(amountToRepay).toLocaleString() +
          "," +
          mappedItem.principal.toString()
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
        const errorMessage = String(errorKey);
        const errorMsg = errorKey?.toString() || "An unexpected error occurred";

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
          setError("Price fetch failed: Your assets are safe, try again after some time.");
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
        } else if (errorMessage.toLowerCase().includes("panic")) {
          setShowPanicPopup(true);
          setShowWarningPopup(false);
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

      if (error.message && error.message.toLowerCase().includes("panic")) {
        setShowPanicPopup(true);
        setShowWarningPopup(false);
      } else {
        toast.error(`Error: ${error.message || "Liquidation action failed!"}`, {
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

  const handleCloseWarningPopup = () => {
    setShowWarningPopup(false);
  };

  const handleCallLiquidation = () => {
    setShowWarningPopup(true);
  };

  const handleClosePopup = () => {
    setTransactionResult(null);
    onClose();
    // dispatch(toggleRefreshLiquidate());
  };

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, ckBTCUsdRate, liquidateTrigger]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }
  }, [ckETHBalance, ckETHUsdRate, liquidateTrigger]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate, liquidateTrigger]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate, liquidateTrigger]);

  useEffect(() => {
    if (ckUSDTBalance && ckUSDTUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDTBalance) * ckUSDTUsdRate).toFixed(
        2
      );
      setCkUSDTUsdBalance(balanceInUsd);
    }
  }, [ckUSDTBalance, ckUSDTUsdRate, liquidateTrigger]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
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

  const renderDebtAssetDetails = (asset) => {
    const assetBalances = {
      ckETH: ckETHBalance,
      ckBTC: ckBTCBalance,
      ckUSDC: ckUSDCBalance,
      ICP: ckICPBalance,
      ckUSDT: ckUSDTBalance || "0.00",
    };

    const balance = assetBalances[asset];

    return (
      <div className="flex flex-col items-end">
        <p className="text-xs font-normal  text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
          Wallet Balance
        </p>
        <div className=" flex items-center space-x-2">
          {/* Balance */}
          <p className="text-xs font-normal text-[#2A1F9D] dark:text-darkText mt-1 ">
            {balance}
          </p>

          {/* Asset Image */}
          <img
            src={
              asset === "ckBTC"
                ? ckBTC
                : asset === "ckETH"
                  ? ckETH
                  : asset === "ckUSDC"
                    ? ckUSDC
                    : asset === "ICP"
                      ? icp
                      : asset === "ckUSDT"
                        ? ckUSDT
                        : undefined
            }
            alt={asset}
            className="rounded-full w-4 h-4 mt-1"
          />
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
    if (!asset) return null; // Render nothing if no asset is selected

    const assetRates = {
      ckETH: ckETHUsdRate,
      ckBTC: ckBTCUsdRate,
      ckUSDC: ckUSDCUsdRate,
      ICP: ckICPUsdRate,
      ckUSDT: ckUSDTUsdRate,
    };

    const usdRate = assetRates[asset] ? assetRates[asset] / 1e8 : null; // Scale USD rate if available
    const adjustedRewardAmount =
      rewardAmount !== calculatedData?.maxCollateral / 1e8
        ? calculatedData?.maxCollateral / 1e8
        : rewardAmount;
    const rewardInUSD = usdRate ? adjustedRewardAmount * usdRate : null;
    const bonusValue =
      ((calculatedData?.maxCollateral / 1e8) * liquidation_bonus) / 100;

    return (
      <div className="mt-4">
        <p className="text-sm font-normal text-[#2A1F9D] opacity-80 dark:text-darkText dark:opacity-80">
          Reward Amount
        </p>
        <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-1 flex justify-between items-center">
          {/* Reward Amount */}
          <div>
            {(() => {
              const assetRates = {
                ckETH: ckETHUsdRate,
                ckBTC: ckBTCUsdRate,
                ckUSDC: ckUSDCUsdRate,
                ICP: ckICPUsdRate,
                ckUSDT: ckUSDTUsdRate,
              };

              const usdRate = assetRates[asset]
                ? assetRates[asset] / 1e8
                : null;
              const adjustedRewardAmount =
                rewardAmount !== calculatedData?.maxCollateral / 1e8
                  ? calculatedData?.maxCollateral / 1e8
                  : rewardAmount;
              const rewardInUSD = usdRate ? adjustedRewardAmount * usdRate : 0;

              // Determine how to display the reward amount
              let displayedReward;
              if (!isFinite(rewardInUSD) || rewardInUSD === 0) {
                displayedReward = "0.00"; // Show "0.00" if USD value is exactly 0
              } else if (rewardInUSD < 0.01) {
                displayedReward = `<${(0.01 / usdRate).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  }
                )}`; // Show "<" sign for small reward values
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

          {/* Including Bonus with Value and Image */}
          <div className="flex flex-col items-end">
            <p className="text-xs font-normal text-[#2A1F9D]  dark:text-darkText opacity-50">
              Including Bonus:
            </p>
            <div className="flex items-center space-x-2 ">
              <p className="text-xs font-normal text-green-500 mt-1">
                {formatValue(bonusValue)}
              </p>
              <img
                src={
                  asset === "ckBTC"
                    ? ckBTC
                    : asset === "ckETH"
                      ? ckETH
                      : asset === "ckUSDC"
                        ? ckUSDC
                        : asset === "ICP"
                          ? icp
                          : asset === "ckUSDT"
                            ? ckUSDT
                            : undefined
                }
                alt={asset}
                className="rounded-full w-4 h-4 mt-1"
              />
            </div>
          </div>
        </div>
        <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>

        <div className="w-full flex justify-between items-center mt-1.5">
          <p className="ml-2 text-sm font-normal text-[#2A1F9D] opacity-80 dark:text-darkText dark:opacity-80">
            User Health Factor
          </p>
          <p className="mr-4 text-sm font-normal">
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
              {value > 100 ? "Infinity" : parseFloat(value).toFixed(2)}
            </span>
            <span className="text-gray-500 mx-1">→</span>
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
          </p>
        </div>
        {info == true && calculatedData?.maxDebtToLiq == 0 && (
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

  const [value, setValue] = useState(0);

  useEffect(() => {
    const newValue = Number(mappedItem.healthFactor) / 10000000000;
    setValue(newValue);
  }, [liquidateTrigger]);
  // const currentHealthFactor = 1;
  const formatNumber = useFormatNumber();
  let liquidation_bonus = "";

  const selectedItem = filteredItems.find((item) => {
    const assetName = item[1].Ok.asset_name
      ? item[1].Ok.asset_name[0]
      : "Unknown";
    return assetName === selectedAsset;
  });

  if (selectedItem && selectedItem[1]?.Ok) {
    const item = selectedItem[1].Ok;
    liquidation_bonus =
      Number(item?.configuration?.liquidation_bonus || "0") / 100000000;
  }

  useEffect(() => {
    const calculatedRewardAmount =
      collateral + collateral * (liquidation_bonus / 100);
    setRewardAmount(calculatedRewardAmount);
  }, [collateral, liquidation_bonus]);
  const [selectedAssetBalance, setSelectedAssetBalance] = useState(0);

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

  const truncateToSevenDecimals = (value) => {
    const multiplier = Math.pow(10, 8); // To shift the decimal 7 places
    const truncated = Math.floor(value * multiplier) / multiplier; // Truncate the value
    return truncated.toFixed(8); // Convert to string with exactly 7 decimals
  };

  const [factor, setFactor] = useState("");

  // Calculate the factor based on the userAccountData and set it in state
  useEffect(() => {
    const value = Number(mappedItem.healthFactor) / 10000000000;

    if (value > 100) {
      setFactor("50");
    } else if (value < 0.95) {
      setFactor("100");
    } else {
      setFactor("50");
    }
  }, [userAccountData]);

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
              {amountToRepay === calculatedData.maxDebtToLiq / 1e8
                ? truncateToSevenDecimals(amountToRepay)
                : truncateToSevenDecimals(
                  calculatedData.maxDebtToLiq / 1e8
                )}{" "}
            </strong>
            <span className="font-bold">{selectedDebtAsset}</span> will be{" "}
            <strong className="underline">deducted</strong> from your account &{" "}
            <strong className="font-bold text-green-500">
              {rewardAmount === calculatedData?.maxCollateral / 1e8
                ? truncateToSevenDecimals(rewardAmount)
                : truncateToSevenDecimals(
                  calculatedData?.maxCollateral / 1e8
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
              <div className="w-full flex flex-col items-center p-2 ">
                <button
                  onClick={handleClosePaymentPopup}
                  className="text-gray-400 focus:outline-none self-end button1"
                >
                  <X size={24} />
                </button>

                <div
                  className="dark:bg-gradient 
                dark:from-darkGradientStart 
                dark:to-darkGradientEnd 
                dark:text-darkText  "
                >
                  <h1 className="font-semibold text-xl mb-4 ">
                    Important Message
                  </h1>
                  <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                    Thanks for helping us improve DFinance! <br></br> You’ve
                    uncovered a bug, and our dev team is on it.
                  </p>

                  <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                    Your account is temporarily locked while we investigate and
                    fix the issue. <br />
                  </p>
                  <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
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
                      const assetSupply = calculateAssetSupply(
                        assetName,
                        mappedItem

                      );
                      const assetBorrow = calculateAssetBorrow(
                        assetName,
                        mappedItem

                      );

                      const assetBorrowAmount = Math.trunc(
                        Number((assetBorrow * (factor / 100)) / 1e8) * 1e8
                      ) / 1e8;

                      // TODO: resolve nine values are coming now.

                      console.log("assest borrow amount", assetBorrowAmount);

                      let assetBorrowAmountInUSD = 0;
                      if (assetName === "ckBTC" && ckBTCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckBTCUsdRate / 1e8);
                      } else if (assetName === "ckETH" && ckETHUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckETHUsdRate / 1e8);
                      } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckUSDCUsdRate / 1e8);
                      } else if (assetName === "ICP" && ckICPUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckICPUsdRate / 1e8);
                      } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * (ckUSDTUsdRate / 1e8);
                      }

                      console.log("assetBorrowAmountInUSD", assetBorrowAmountInUSD);
                      console.log("ckBTCUsdRate", ckBTCUsdRate, "ckETHUsdRate", ckETHUsdRate, "ckUSDCUsdRate", ckUSDCUsdRate, "ckICPUsdRate", ckICPUsdRate, "ckUSDTUsdRate", ckUSDTUsdRate);
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
                              checked={selectedDebtAsset === asset} // Ensure it matches exactly
                              onChange={() => {
                                handleDebtAssetSelection(
                                  asset,
                                  assetBorrowAmount,
                                  assetBorrowAmountInUSD
                                );
                              }}
                            />

                            <img
                              src={
                                asset === "ckBTC"
                                  ? ckBTC
                                  : asset === "ckETH"
                                    ? ckETH
                                    : asset === "ckUSDC"
                                      ? ckUSDC
                                      : asset === "ICP"
                                        ? icp
                                        : asset === "ckUSDT"
                                          ? ckUSDT
                                          : undefined
                              }
                              alt={asset}
                              className="rounded-[50%] w-7"
                            />
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
                            ? assetRates[selectedDebtAsset] / 1e8
                            : null;

                          const adjustedAmountToRepay =
                            amountToRepay !== calculatedData?.maxDebtToLiq / 1e8
                              ? calculatedData?.maxDebtToLiq / 1e8
                              : amountToRepay;

                          const repayInUSD = usdRate
                            ? adjustedAmountToRepay * usdRate
                            : 0;
                          console.log("repayin usd", repayInUSD)
                          // Determine how to display the amount to repay
                          let displayedRepayAmount;
                          if (!isFinite(repayInUSD) || repayInUSD === 0) {
                            displayedRepayAmount = "0.00"; // Show "0.00" if USD value is exactly 0
                          } else if (repayInUSD < 0.01) {
                            displayedRepayAmount = `<${(
                              0.01 / usdRate
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 8,
                              maximumFractionDigits: 8,
                            })}`; // Show "<" sign for small values
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

                  const assetBorrow = calculateAssetBorrow(
                    assetName,
                    mappedItem

                  );
                  const assetBorrowAmount = Math.floor(assetBorrow / 2);
                  let collateralRate = 0;
                  if (assetName === "ckBTC" && ckBTCUsdRate) {
                    collateralRate = ckBTCUsdRate / 1e8;
                  } else if (assetName === "ckETH" && ckETHUsdRate) {
                    collateralRate = ckETHUsdRate / 1e8;
                  } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                    collateralRate = ckUSDCUsdRate / 1e8;
                  } else if (assetName === "ICP" && ckICPUsdRate) {
                    collateralRate = ckICPUsdRate / 1e8;
                  } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                    collateralRate = ckUSDTUsdRate / 1e8;
                  }
                  const collateralAmount =
                    selectedAsset === selectedDebtAsset
                      ? amountToRepay
                      : amountToRepayUSD / collateralRate;
                  const assetBalance =
                    assetName === "ckBTC"
                      ? ckBTCBalance
                      : assetName === "ckETH"
                        ? ckETHBalance
                        : assetName === "ckUSDC"
                          ? ckUSDCBalance
                          : assetName === "ICP"
                            ? ckICPBalance
                            : assetName === "ckUSDT"
                              ? ckUSDTBalance
                              : 0;

                  if (assetSupply > 0) {
                    return (
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="collateralAsset"
                          className="form-radio text-[#EB8863]"
                          checked={selectedAsset === assetName} // Ensure it matches exactly
                          disabled={!selectedDebtAsset} // Disabled if no debt asset is selected
                          onChange={() => {
                            handleAssetSelection(
                              assetName,
                              collateralRate,
                              assetSupply,
                              collateralAmount
                            );
                          }}
                        />
                        <img
                          key={index}
                          src={
                            assetName === "ckBTC"
                              ? ckBTC
                              : assetName === "ckETH"
                                ? ckETH
                                : assetName === "ckUSDC"
                                  ? ckUSDC
                                  : assetName === "ICP"
                                    ? icp
                                    : assetName === "ckUSDT"
                                      ? ckUSDT
                                      : undefined
                          }
                          alt={assetName}
                          className="rounded-[50%] w-7"
                        />{" "}
                      </label>
                    );
                  }
                  return null;
                })}
              </div>

              { }
              {renderAssetDetails(selectedAsset)}

              {(!isCollateralAssetSelected ||
                !(amountToRepay <= selectedAssetBalance)) && (
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
              {/* <div className="flex justify-start mt-1">
                {!isCollateralAssetSelected && (
                  <div className="w-full flex flex-col my-3 space-y-2">
                    <div className="w-full flex bg-[#6e3d17] p-2 rounded-lg text-white">
                      <div className="  flex items-center justify-center">
                        <div className="warning-icon-container">
                          <Info className=" text-[#f6ba43] w-3 h-4 mb-0.2" />
                        </div>
                      </div>
                      <div className="w-11/12 text-[12px] flex items-center text-white ml-1 ">
                        Select a collateral asset to see reward
                      </div>
                    </div>
                  </div>
                )}
              </div> */}
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
                      ? calculatedData?.maxDebtToLiq / 1e8 <=
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
                      ? calculatedData?.maxDebtToLiq / 1e8 <=
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