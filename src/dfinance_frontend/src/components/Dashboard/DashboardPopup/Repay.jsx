import { Info, Check, Wallet, X } from "lucide-react";
import React, { useState, useRef } from "react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { idlFactory as ledgerIdlFactory } from "../../../../../declarations/token_ledger";
import { useEffect } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";
const Repay = ({
  asset,
  image,
  supplyRateAPR,
  balance,
  reserveliquidationThreshold,
  liquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  const [amount, setAmount] = useState(null);
  const modalRef = useRef(null); // Reference to the modal container
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState("");
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [conversionRate, setConversionRate] = useState(0); // Holds the conversion rate for the selected asset
  const [usdValue, setUsdValue] = useState(0);

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
  }, [principal, backendActor]);

  // console.log("fecthAssteprincCKUSDC", assetPrincipal.ckUSDC);
  // console.log("fecthAssteprincCKBTC", assetPrincipal.ckBTC);
  // console.log("fecthAssteprincCKETH", assetPrincipal.ckETH);

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

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);

  const value = 5.23;
  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;

    // Convert input to a number
    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= assetBorrow) {
        // Calculate and format the USD value
        const convertedValue = numericAmount * conversionRate;
        setUsdValue(parseFloat(convertedValue.toFixed(2))); // Ensure proper formatting
        setAmount(inputAmount);
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
        setUsdValue(0);
      }
    } else if (inputAmount === "") {
      // Allow empty input and reset error
      setAmount("");
      setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
      // setUsdValue(0);
    }
  };

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        const response = await fetch(
          "https://dfinance.kaifoundry.com/conversion-rates"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversion rates from server");
        }

        const data = await response.json();

        let rate;
        switch (asset) {
          case "ckBTC":
            rate = data.bitcoin?.usd;
            break;
          case "ckETH":
            rate = data.ethereum?.usd;
            break;
          case "ckUSDC":
            rate = data["usd-coin"]?.usd;
            break;
          case "ICP":
            rate = data["internet-computer"]?.usd;
            break;
          default:
            console.error(`Unsupported asset: ${asset}`);
            return;
        }
        if (rate) {
          console.log(`Rate for ${asset}:`, rate);
          setConversionRate(rate);
        } else {
          console.error("Conversion rate not found for asset:", asset);
        }
      } catch (error) {
        console.error(
          "Error fetching conversion rate from server:",
          error.message
        );
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset]);

  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const amountAsNat64 = Number(amount);
  const scaledAmount = amountAsNat64 * Number(10 ** 8);
  const handleApprove = async () => {
    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActorckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActorICP;
    }

    // Convert amount and transferFee to numbers and add them
    const amountAsNat64 = Number(amount);
    const scaledAmount = amountAsNat64 * Number(10 ** 8);
    const totalAmount = scaledAmount + transferfee;

    try {
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
    }
  };

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleRepayETH = async () => {
    console.log("Repay function called for", asset);

    let ledgerActor;

    // Select the correct backend actor based on the asset
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActorckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActorICP;
    }

    console.log("Backend actor", ledgerActor);

    try {
      const amountAsNat64 = parseFloat(amount);
      const scaledAmount = BigInt(Math.floor(amountAsNat64 * 10 ** 8));

      const repayResult = await backendActor.repay(asset, scaledAmount, []);
      toast.success("Repay successful!");
      console.log("Repay result", repayResult);
      setIsPaymentDone(true);
      setIsVisible(false);
    } catch (error) {
      console.error("Error repaying:", error);
      toast.error(`Error: ${error.message || "Repay action failed!"}`);
      // Handle error state, e.g., show error message
    }
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleRepayETH();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !isLoading
      ) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);

  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold
    );
    console.log("Health Factor:", healthFactor);
    const ltv = calculateLTV(totalCollateral, totalDebt);
    console.log("LTV:", ltv);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    if (healthFactor <= 1 || ltv >= reserveliquidationThreshold) {
      setIsButtonDisabled(true); // Disable the button
    } else {
      setIsButtonDisabled(false); // Enable the button
    }
  }, [
    asset,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
  ]);

  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
    const amountTaken = 0;
    const amountAdded = usdValue || 0;
    console.log("THreshold", liquidationThreshold);
    console.log(
      "totalDebt before minus",
      totalDebt,
      "collateral",
      totalCollateral,
      "amount added",
      amountAdded
    );
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountTaken);
    const totalDeptValue = parseFloat(totalDebt) - parseFloat(amountAdded);

    console.log("totalDeptValue", totalDeptValue);
    console.log("amountAdded", amountAdded);
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (
      (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue
    );
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return totalDeptValue / totalCollateralValue;
  };

  const [healthFactorBackend, setHealthFactorBackend] = useState(null);
  const [userData, setUserData] = useState();

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
      console.log("get_user_data in supplypopup:", result);

      // Check if the result is in the expected format (Ok.health_factor)
      if (result && result.Ok && result.Ok.health_factor) {
        setHealthFactorBackend(result.Ok.health_factor); // Store health_factor in state
      } else {
        setError("Health factor not found");
      }
      return result;
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message);
    }
  };

  return (
    <>
      {isVisible && (
        <div className="repay-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Repay {asset} </h1>

          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={assetBorrow === 0}
                    className="lg:text-lg focus:outline-none bg-gray-100  rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                  />
                  <p className="text-xs text-gray-500 px-2">
                    {usdValue ? `$${usdValue.toFixed(2)} USD` : "$0 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="Item Image"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p className="text-xs mt-4">{assetBorrow.toFixed(2)} Max </p>
                </div>
              </div>
            </div>
            <div className="w-full ">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center ">
                    <p className="text-nowrap">Remaining debt</p>
                    <div className="w-4/12 flex flex-col items-end">
                      <p className="text-xs mt-2">{assetBorrow - amount} Max</p>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center mt-1">
                    <p>Health Factor</p>
                    <p>
                      <span
                        className={`${
                          healthFactorBackend > 3
                            ? "text-green-500"
                            : healthFactorBackend <= 1
                            ? "text-red-500"
                            : healthFactorBackend <= 1.5
                            ? "text-orange-600"
                            : healthFactorBackend <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                        }`}
                      >
                        {parseFloat(
                          healthFactorBackend > 100
                            ? "Infinity"
                            : parseFloat(healthFactorBackend).toFixed(2)
                        )}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span
                        className={`${
                          currentHealthFactor > 3
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

                  <div className="w-full flex justify-end items-center mt-1">
                    <p className="text-[#909094]">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-3">
              <div className="w-full">
                <div className="flex items-center">
                  <Fuel className="w-4 h-4 mr-1" />
                  <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
                  <img
                    src={image}
                    alt="asset icon"
                    className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                  />
                  <div className="relative group">
                    <Info size={16} className="ml-2 cursor-pointer" />

                    {/* Tooltip */}
                    <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                      Fees deducted on every transaction
                    </div>
                  </div>
                </div>
                {balance <= 0 && (
                  <div className="w-full flex flex-col my-3 space-y-2">
                    <div className="w-full flex bg-[#6e3d17] p-2 rounded-md">
                      <div className="w-1/12 flex items-center justify-center">
                        <div className="warning-icon-container">
                          <Info className=" text-[#f6ba43]" />
                        </div>
                      </div>
                      <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                        You do not have enough {asset} in your account to pay
                        for transaction fees on Ethereum Sepolia network. Please
                        deposit {asset} from another account.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleClick}
                className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 ${
                  isLoading || amount <= 0 || isButtonDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading || amount <= 0 || null || isButtonDisabled}
              >
                {isApproved ? `Repay ${asset}` : `Approve ${asset} to continue`}
              </button>

              {/* Fullscreen Loading Overlay with Dim Background */}
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
        </div>
      )}
      {isPaymentDone && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 hover:text-gray-600 focus:outline-none self-end"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <p>
              You have repayed {scaledAmount/100000000} d{asset}
            </p>
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Repay;
