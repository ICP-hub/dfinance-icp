import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import check from "../../../public/assests-icon/check.png";
import cross from "../../../public/assests-icon/Cross.png";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import { useCallback } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../Common/useAssets";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import icp from "../../../public/assests-icon/ICPMARKET.png";

const UserInformationPopup = ({ onClose, mappedItem, principal }) => {
  const {
    isAuthenticated,
    createLedgerActor,
    backendActor,
    principal: currentUserPrincipal,
  } = useAuth();

  console.log("mappeditems", mappedItem);
  const [rewardAmount, setRewardAmount] = useState(10);
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false); // State to manage content view
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false); // New state for Collateral Overlay
  const [selectedAsset, setSelectedAsset] = useState(); // Default selected asset
  const [selectedDebtAsset, setSelectedDebtAsset] = useState(); // Default selected asset
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null); // State to handle transaction
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);

  const [userdata, setUserData] = useState();
  const [userHealthFactor, setUserHealthFactor] = useState();

  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
  const [ckETHUsdRate, setCkETHUsdRate] = useState(null);
  const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = selectedAsset
    ? selectedAsset.toLowerCase()
    : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);

  useEffect(() => {
    const fetchUserData = async () => {
      if (backendActor) {
        try {
          const result = await getUserData(principal.toString());
          console.log("get_user_data:", result);
          setUserData(result);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };
    fetchUserData();
  }, [principal, backendActor]);

  const getUserData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(user);
      console.log("get_user_data in mysupply:", result);
      setUserHealthFactor(result.Ok.health_factor);
      return result;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  function roundToDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  console.log("health factor", roundToDecimal(userHealthFactor, 2));

  const defaultAsset = "cketh";

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
      setIsCollateralOverlay(true); // Show Collateral Overlay on next click in Debt Info
    } else {
      setIsDebtInfo(true); // Switch to Debt Information view
    }
  };
  const [amountBorrowUSD, setAmountBorrowUSD] = useState(null);
  const [selectedAssetSupply, setSelectedAssetSupply] = useState(null);
  const [collateralRate, setCollateralRate] = useState(null)
const [collateral, setCollateralRateAmount] = useState(null)

  const [isCollateralAssetSelected, setIsCollateralAssetSelected] =
    useState(false);
  const handleAssetSelection = (asset, collateralRate, assetSupply, collateralAmount) => {
    setIsCollateralAssetSelected(true);
    setSelectedAsset(asset);
    setCollateralRate(collateralRate ? collateralRate: 0);
    // Set the selected asset (only one at a time)
    setSelectedAssetSupply(assetSupply);
    setCollateralRateAmount(collateralAmount ? collateralAmount: 0)
   
    const assetRewardAmounts = {
      cketh: 0.003256,
      ckbtc: 0.001025,
      icp: 5.03256,
    };

    setRewardAmount(assetRewardAmounts[asset] || 10);
  };
  console.log("selectedAsstSUplly", selectedAssetSupply);
  console.log("Collateral in usd",collateral)
  const [isDebtAssetSelected, setIsDebtAssetSelected] = useState(false);
  const [amountToRepayUSD, setAmountToRepayUSD] = useState(null)

  const handleDebtAssetSelection = (asset, assetBorrowAmount, assetBorrowAmountInUSD) => {
    setIsDebtAssetSelected(true);
    setSelectedDebtAsset(asset); // Set the selected asset (only one at a time)
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);
    setAmountToRepayUSD(assetBorrowAmountInUSD? assetBorrowAmountInUSD : 0)

    console.log("Asset Borrow Amount to Repay:", assetBorrowAmount);
    console.log("Amount to Repay (after check):", amountToRepay);
  };

  const handleCheckboxClick = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            // console.log(`get_asset_principle (${asset}):`, result);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {
          console.error("Error fetching asset principal:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };

    fetchAssetPrinciple();
  }, [backendActor]);

  console.log("fecthAssteprincCKUSDC", assetPrincipal.ckUSDC);
  console.log("fecthAssteprincCKBTC", assetPrincipal.ckBTC);
  console.log("fecthAssteprincCKETH", assetPrincipal.ckETH);

  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      let result;
      switch (asset) {
        case "ckBTC":
          result = await backendActor.get_asset_principal("ckBTC");
          break;
        case "ckETH":
          result = await backendActor.get_asset_principal("ckETH");
          break;
        case "ckUSDC":
          result = await backendActor.get_asset_principal("ckUSDC");
          break;
        case "ICP":
          result = await backendActor.get_asset_principal("ICP");
          break;
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      // console.log(`get_asset_principle in mysupply (${asset}):`, result);
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };

  const ledgerActorckBTC = useMemo(
    () =>
      assetPrincipal.ckBTC
        ? createLedgerActor(
          assetPrincipal.ckBTC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckBTC] // Re-run when principal changes
  );

  // Memoized actor for ckETH using dynamic principal
  const ledgerActorckETH = useMemo(
    () =>
      assetPrincipal.ckETH
        ? createLedgerActor(
          assetPrincipal.ckETH, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckETH] // Re-run when principal changes
  );

  const ledgerActorckUSDC = useMemo(
    () =>
      assetPrincipal.ckUSDC
        ? createLedgerActor(
          assetPrincipal.ckUSDC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckUSDC] // Re-run when principal changes
  );

  const ledgerActorICP = useMemo(
    () =>
      assetPrincipal.ICP
        ? createLedgerActor(assetPrincipal.ICP, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ICP]
  );

  const principalObj = useMemo(
    () => Principal.fromText(currentUserPrincipal),
    [currentUserPrincipal]
  );

  const fetchBalance = useCallback(
    async (assetType) => {
      if (isAuthenticated && principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          let balance;

          if (assetType === "ckBTC") {
            if (!ledgerActorckBTC) {
              console.warn("Ledger actor for ckBTC not initialized yet");
              return;
            }
            balance = await ledgerActorckBTC.icrc1_balance_of(account);
            setCkBTCBalance(balance.toString()); // Set ckBTC balance
          } else if (assetType === "ckETH") {
            if (!ledgerActorckETH) {
              console.warn("Ledger actor for ckETH not initialized yet");
              return;
            }
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            setCkETHBalance(balance.toString()); // Set ckETH balance
          } else if (assetType === "ckUSDC") {
            if (!ledgerActorckUSDC) {
              console.warn("Ledger actor for ckUSDC not initialized yet");
              return;
            }
            balance = await ledgerActorckUSDC.icrc1_balance_of(account);
            setCKUSDCBalance(balance.toString()); // Set ckUSDC balance
          }
          else if (assetType === "ICP") {
            if (!ledgerActorICP) {
              console.warn("Ledger actor for ICP not initialized yet");
              return;
            }
            balance = await ledgerActorICP.icrc1_balance_of(account);
            setCkICPBalance(balance.toString()); // Set ICP balance
          }
          else {
            throw new Error(
              "Unsupported asset type or ledger actor not initialized"
            );
          }
          // console.log(`Fetched Balance for ${assetType}:`, balance.toString());
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      }
    },
    [
      isAuthenticated,
      ledgerActorckBTC,
      ledgerActorckETH,
      ledgerActorckUSDC,
      principalObj,
      ledgerActorICP
    ]
  );

  const [loading, setLoading] = useState();


  const handleApprove = async () => {
    let ledgerActor;
    if (selectedDebtAsset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (selectedDebtAsset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else if (selectedDebtAsset === "ckUSDC") {
      ledgerActor = ledgerActorckUSDC;
    } else if (selectedDebtAsset === "ICP") {
      ledgerActor = ledgerActorICP;
    }

    const transferfee = BigInt(100);
    // Convert amount and transferFee to numbers and add them
    const supplyAmount = BigInt(Math.floor(amountToRepay));
    const totalAmount = supplyAmount + transferfee;

    try {
      setIsLoading(true);

      // Call the approval function
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

      console.log("Approve", approval);
      setIsApproved(true);
      console.log("isApproved state after approval:", isApproved);

      // Show success notification
      toast.success("Approval successful!");
    } catch (error) {
      // Log the error
      console.error("Approval failed:", error);

      // Show error notification using Toastify
      toast.error(`Error: ${error.message || "Approval failed!"}`);
    } finally {
      setIsLoading(false); // Stop loading once the function is done
    }
  };

  const handleConfirmLiquidation = async () => {
    setIsLoading(true);
    try {
      const supplyAmount = BigInt(Math.floor(amountToRepay));
      console.log("backend actor", backendActor);

      if (!backendActor) {
        throw new Error("Backend actor is not initialized");
      }

      const result = await backendActor.liquidation_call(
        selectedDebtAsset,
        selectedAsset,
        supplyAmount,
        mappedItem.principal
      );
      toast.success("Liquidation successful!");
      console.log("Liquidation call result:", result);
      setTransactionResult("success");
      setShowWarningPopup(false);
    } catch (error) {
      console.error("Error during liquidation:", error);
      setTransactionResult("failure");
    } finally {
      setIsLoading(false); // Stop loading once the function is done
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
    onClose(); // Close the transaction result popup
  };

  const conversionRates = {
    ckBTC: 26000, // example conversion rate, 1 ckBTC = 26000 USD
    ckETH: 1600, // example conversion rate, 1 ckETH = 1600 USD
    ckUSDC: 1, // example conversion rate, 1 ckUSDC = 1 USD
  };

  const convertToUSD = (assetName, assetBorrowAmount) => {
    const rate = conversionRates[assetName];
    if (!rate) return 0; // default to 0 if no rate is available for the asset
    return assetBorrowAmount * rate; // calculate USD equivalent
  };

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
      console.log(`ckBTC Balance in USD: ${balanceInUsd}`);
    }
  }, [ckBTCBalance, ckBTCUsdRate]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
      console.log(`ckETH Balance in USD: ${balanceInUsd}`);
    }
  }, [ckETHBalance, ckETHUsdRate]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
      console.log(`ckUSDC Balance in USD: ${balanceInUsd}`);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate]);

  const pollInterval = 2000;
  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        throw new Error("Response was not valid JSON");
      }

      setCkBTCUsdRate(data.bitcoin.usd);
      setCkETHUsdRate(data.ethereum.usd);
      setCkUSDCUsdRate(data["usd-coin"].usd);
      setCkICPUsdRate(data["internet-computer"].usd);
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
      setError(error);
    }
  }, [ckBTCBalance, ckETHBalance, ckUSDCBalance, ckICPBalance, pollInterval]);

  useEffect(() => {
    // Start polling at regular intervals
    const intervalId = setInterval(() => {
      fetchConversionRate();
    }, pollInterval);

    // Clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchConversionRate]);


  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchConversionRate(), // Fetch ckBTC and ckETH rates
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
  ]);


  const renderDebtAssetDetails = (asset) => {
    switch (asset) {
      case "ckETH":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckETHBalance}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ckBTC":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckBTCBalance}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ckUSDC":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckUSDCBalance}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ICP":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckICPBalance}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };
  const renderAssetDetails = (asset) => {
    switch (asset) {
      case "ckETH":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Price
              </p>
              <p className="text-sm font-medium">{collateralRate}</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Liquidation Bonus %
              </p>
              <p className="text-sm font-medium"> {liquidation_bonus}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
               
                {Math.floor(collateral + (collateral * (liquidation_bonus / 100)))}
              </p>
            </div>
          </div>
        );

        return null;
      case "ckBTC":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
              {collateralRate}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC liquidation Bonus %
              </p>
              <p className="text-sm font-medium">{liquidation_bonus}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
             {Math.floor(collateral + (collateral * (liquidation_bonus / 100)))}
              </p>
            </div>
          </div>
        );

        return null;
      case "ckUSDC":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDC Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
              {collateralRate}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDC Liquidation Bonus %
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {liquidation_bonus}%
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
             {Math.floor(collateral + (collateral * (liquidation_bonus / 100)))}
              </p>
            </div>
          </div>
        );

        return null;
      case "ICP":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
              {collateralRate}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Liquidation Bonus %
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {liquidation_bonus}%
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
             {Math.floor(collateral + (collateral * (liquidation_bonus / 100)))}
              </p>
            </div>
          </div>
        );

        return null;
      default:
        return null;
    }
  };

  const { filteredItems } = useAssetData();

  function formatNumber(num) {
    // Ensure num is a valid number
    const parsedNum = parseFloat(num);

    if (isNaN(parsedNum) || parsedNum === null || parsedNum === undefined) {
      return "0";
    }
    if (parsedNum >= 1000000000) {
      return (parsedNum / 1000000000).toFixed(1).replace(/.0$/, "") + "B";
    }
    if (parsedNum >= 1000000) {
      return (parsedNum / 1000000).toFixed(1).replace(/.0$/, "") + "M";
    }
    if (parsedNum >= 1000) {
      return (parsedNum / 1000).toFixed(1).replace(/.0$/, "") + "K";
    }
    return parsedNum.toFixed(2).toString();
  }

  let asset_name = "";
  let accrued_to_treasury = "0";
  let borrow_rate = "0";
  let supply_cap = "0";
  let borrow_cap = "0";
  let ltv = "0";
  let supply_rate_apr = "0";
  let total_supply = "0";
  let total_borrowed = "0";
  let total_supplied = "0";
  let current_liquidity_rate = "0";
  let liquidity_index = "0";
  let d_token_canister = "";
  let debt_token_canister = "";
  let liquidation_bonus = "";
  let liquidation_threshold = "";

  if (filteredItems && filteredItems.length > 0) {
    const item = filteredItems[0][1].Ok;
    asset_name = item.asset_name ? item.asset_name[0] : "Unknown";
    accrued_to_treasury = item.accrued_to_treasury?.toString() || "0";
    borrow_rate = item.borrow_rate ? item.borrow_rate[0] : "0";
    supply_cap = item.configuration.supply_cap || "0";
    borrow_cap = formatNumber(item.configuration.borrow_cap?.toString()) || "0";
    ltv = item.configuration.ltv?.toString() || "0";
    liquidation_threshold = item.configuration.liquidation_threshold || "0";
    liquidation_bonus = item.configuration.liquidation_bonus || "0";
    supply_rate_apr = item.supply_rate_apr ? item.supply_rate_apr[0] : "0";
    total_supply = item.total_supply ? formatNumber(item.total_supply) : "0";
    current_liquidity_rate = item.current_liquidity_rate || "0";
    liquidity_index = item.liquidity_index?.toString() || "0";
    d_token_canister = item.d_token_canister ? item.d_token_canister[0] : "N/A";
    debt_token_canister = item.debt_token_canister
      ? item.debt_token_canister[0]
      : "N/A";
    total_borrowed = item.total_borrowed
      ? formatNumber(item.total_borrowed)
      : "0";
    total_supplied = item.total_supplied
      ? formatNumber(item.total_supplied)
      : "0";
  }

  const [selectedAssetBalance, setSelectedAssetBalance] = useState(0);

  // When an asset is selected, update the balance accordingly
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
      default:
        setSelectedAssetBalance(0);
    }
  }, [selectedDebtAsset, ckETHBalance, ckBTCBalance, ckUSDCBalance, ckICPBalance]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {transactionResult ? (
        // Transaction result popup
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
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            ) : (
              <>
                <img src={cross} alt="Failure" className="w-30 h-30" />
                <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-4 -mt-6">
                  Liquidation Call Failed
                </h2>

                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
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
          <p className="text-sm text-[#989898] text-center dark:text-darkText mt-4">
            Are you sure you want to liquidate on behalf of "
            <strong>{principal}</strong>"? <strong>{amountToRepay} ICP</strong>{" "}
            will be <strong>deducted</strong> from your account &{" "}
            <strong>{rewardAmount}</strong> will be rewarded.
          </p>
          <div className="mt-4 flex justify-center">
            <label className="flex items-center text-[#989898]">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4 appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-400 checked:border-gray-400 checked:text-white focus:outline-none checked:after:content-['✔'] checked:after:text-white checked:after:text-xs checked:after:flex checked:after:justify-center checked:after:items-center"
                checked={isCheckboxChecked}
                onChange={handleCheckboxClick}
              />
              Yes, call Liquidation
            </label>
          </div>

          <div className="flex justify-center mt-6 ">
            {isCheckboxChecked ? (
              // Button for "Call Liquidation"
              <button
                className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={handleConfirmLiquidation}
                disabled={isLoading} // Disable the button while loading
              >
                {"Call Liquidation"}
              </button>
            ) : (
              // Button for "Cancel"
              <button
                className="bg-gray-400 dark:bg-gray-500 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2"
                onClick={handleCloseWarningPopup}
                disabled={isLoading} // Disable the button while loading
              >
                Cancel
              </button>
            )}

            {isLoading && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                  background: "rgba(0, 0, 0, 0.4)", // Dim background
                  backdropFilter: "blur(1px)", // Blur effect
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
              {isCollateralOverlay
                ? "Collateral Information"
                : isDebtInfo
                  ? "Debt Information"
                  : "User Information"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-darkText hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {isCollateralOverlay ? (
            // Collateral Overlay Content with checkboxes for asset selection
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Collateral Asset
                </h3>
                {/* Collateral Asset selection with checkboxes */}

                <div className="flex items-center space-x-4 mb-4">
                  {mappedItem.reserves[0].map((item, index) => {
                    console.log("mappedItesm", mappedItem.reserves[0])
                    const assetName = item[1]?.reserve;
                    const assetSupply = item[1]?.asset_supply;
                    const assetBorrow = item[1]?.asset_borrow;
                    const assetBorrowAmount = Math.floor(assetBorrow / 2);

                    let collateralRate = 0;
                    if (assetName === "ckBTC" && ckBTCUsdRate) {
                      collateralRate = (
                        ckBTCUsdRate
                      );
                    } else if (assetName === "ckETH" && ckETHUsdRate) {
                      collateralRate = (
                        ckETHUsdRate
                      );
                    } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                      collateralRate = (
                        ckUSDCUsdRate
                      );
                    }
                    else if (assetName === "ICP" && ckICPUsdRate) {
                      collateralRate = (
                        ckICPUsdRate
                      );
                    }

                    console.log(
                      "collateralRate",
                      collateralRate
                    );

                    const collateralAmount = amountToRepayUSD / collateralRate;

                    const assetBalance =
                      assetName === "ckBTC"
                        ? ckBTCBalance
                        : assetName === "ckETH"
                          ? ckETHBalance
                          : assetName === "ckUSDC"
                            ? ckUSDCBalance
                            : assetName === "ICP"
                              ? ckICPBalance
                              : 0;

                    if (assetSupply > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedAsset === assetName}
                            onChange={() =>
                              handleAssetSelection(
                                assetName,
                                collateralRate,
                                assetSupply,
                                collateralAmount
                              )
                            }
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

                {/* Render asset details based on selected checkboxes */}
                {renderAssetDetails(selectedAsset)}
                <div className="flex items-center mt-2">
                  <Fuel className="w-4 h-4 mr-1" />
                  <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
                  {selectedAsset === "ckBTC" && (
                    <img
                      src={ckBTC}
                      alt="ckBTC icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}

                  {selectedAsset === "ckETH" && (
                    <img
                      src={ckETH}
                      alt="ckETH icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}

                  {selectedAsset === "ckUSDC" && (
                    <img
                      src={ckUSDC}
                      alt="ckUSDC icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}
                  {selectedAsset === "ICP" && (
                    <img
                      src={icp}
                      alt="ICP icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-darkText button2"
                  onClick={() => setIsCollateralOverlay(false)}
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm  px-6 py-2 relative ${isCollateralAssetSelected &&
                    amountToRepay + amountToRepay * (liquidation_bonus / 100) <
                    selectedAssetSupply
                    ? "opacity-100 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={() => {
                    console.log("Button clicked");
                    isApproved ? handleCallLiquidation() : handleApprove();
                  }}
                  disabled={
                    isLoading ||
                    !isCollateralAssetSelected ||
                    !(
                      (collateral + (collateral * (liquidation_bonus / 100))) <
                      selectedAssetSupply
                    )
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
                      background: "rgba(0, 0, 0, 0.4)", // Dim background
                      backdropFilter: "blur(1px)", // Blur effect
                    }}
                  >
                    <div className="loader"></div>
                  </div>
                )}
              </div>
            </div>
          ) : isDebtInfo ? (
            // Debt Information Content
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Debt Asset
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  {mappedItem.reserves[0].map((item, index) => {
                    const assetName = item[1]?.reserve;
                    const assetBorrow = item[1]?.asset_borrow;
                    const assetBorrowAmount = Math.floor(assetBorrow / 2);

                    let assetBorrowAmountInUSD = 0;
                    if (assetName === "ckBTC" && ckBTCUsdRate) {
                      assetBorrowAmountInUSD = (
                        assetBorrowAmount * ckBTCUsdRate
                      ).toFixed(2);
                    } else if (assetName === "ckETH" && ckETHUsdRate) {
                      assetBorrowAmountInUSD = (
                        assetBorrowAmount * ckETHUsdRate
                      ).toFixed(2);
                    } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                      assetBorrowAmountInUSD = (
                        assetBorrowAmount * ckUSDCUsdRate
                      ).toFixed(2);
                    }
                    else if (assetName === "ICP" && ckICPUsdRate) {
                      assetBorrowAmountInUSD = (
                        assetBorrowAmount * ckICPUsdRate
                      ).toFixed(2);
                    }
                    if (assetBorrow > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedDebtAsset === assetName}
                            onChange={() =>
                              handleDebtAssetSelection(
                                assetName,
                                assetBorrowAmount,
                                assetBorrowAmountInUSD
                              )
                            }
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

                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
                  <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText dark:opacity-50">
                    Close Factor
                  </p>
                  <p className="text-lg font-bold text-[#2A1F9D] dark:text-darkText ">
                    50%
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-darkBackground/30   rounded-md p-2 text-sm text-[#F30606] mt-4 flex justify-between items-center">
                  <p className="text-base font-bold text-[#2A1F9D] dark:text-darkText ">
                    Amount to Repay
                  </p>
                  <p className="text-base font-bold">{amountToRepay}</p>
                </div>

                {renderDebtAssetDetails(selectedDebtAsset)}
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2"
                  onClick={() => setIsDebtInfo(false)} // Go back to User Info view
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm px-6 py-2 relative ${isDebtAssetSelected && amountToRepay <= selectedAssetBalance
                    ? "opacity-100"
                    : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={handleNextClick}
                  disabled={
                    !isDebtAssetSelected ||
                    !(amountToRepay <= selectedAssetBalance)
                  }
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : (
            // User Information Content
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
                      {` ${principal}`}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm text-[#F30606]">
                    <p className="text-sm font-normal text-[#2A1F9D] dark:text-darkText opacity-50 mb-1 ">
                      User Health Factor
                    </p>
                    <p className="text-xs font-medium text-[#F30606] ">
                      {parseFloat(userHealthFactor > 100 ? "Infinity" : parseFloat(userHealthFactor).toFixed(2))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleNextClick}
                  className="my-2 bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
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
