import { Info, Check, Wallet, X, TriangleAlert } from "lucide-react";
import React, { useState, useRef } from "react";
import Vector from "../../../../public/Helpers/Vector.png";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { idlFactory as ledgerIdlFactory } from "../../../../../declarations/token_ledger";
import { useEffect } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";


const Borrow = ({
  asset,
  image,
  supplyRateAPR,
  balance,
  liquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  Ltv,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [amount, setAmount] = useState(null);

  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const { createLedgerActor, backendActor, principal } = useAuth();
  const [error, setError] = useState('');
  const [conversionRate, setConversionRate] = useState(0); // Holds the conversion rate for the selected asset
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null); // Reference to the modal container

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        const response = await fetch('http://localhost:5000/conversion-rates'); 

        if (!response.ok) {
          throw new Error('Failed to fetch conversion rates from server');
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
            rate = data['usd-coin']?.usd;
            break;
          case "ICP":
            rate = data['internet-computer']?.usd;
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
        console.error("Error fetching conversion rate from server:", error.message);
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset]);


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

  console.log("fecthAssteprincCKUSDC", assetPrincipal.ckUSDC)
  console.log("fecthAssteprincCKBTC", assetPrincipal.ckBTC)
  console.log("fecthAssteprincCKETH", assetPrincipal.ckETH)

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

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);


  const handleAcknowledgeChange = (e) => {
    setIsAcknowledged(e.target.checked);
  };
  const value = currentHealthFactor;

  const handleBorrowETH = async () => {
    console.log("Borrow function called for", asset, amount);
    setIsLoading(true);
    let ledgerActor;

    
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActorckUSDC; 
    }
    else if (asset === "ICP") {
      ledgerActor = ledgerActorICP; 
    }

    try {
     
      const borrowResult = await backendActor.borrow(asset, Number(amount));
      console.log("Borrow result", borrowResult);
      setIsPaymentDone(true);
      setIsVisible(false);
      toast.success("Borrow successful!");
     
    } catch (error) {
      console.error("Error borrowing:", error);
      toast.error(`Error: ${error.message || "Borrow action failed!"}`);
      setIsPaymentDone(false);
      setIsVisible(true);
      setIsLoading(false)
      
    }
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); 
  console.log("Fees:", fees); 
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const numericBalance = parseFloat(balance); 
  const transferFee = Number(fees[normalizedAsset] || fees.default);
  const supplyBalance = numericBalance - transferFee; 

  console.log("Supply Balance:", supplyBalance); 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isLoading) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);



  useEffect(() => {
    const healthFactor = calculateHealthFactor(totalCollateral, totalDebt, liquidationThreshold);
    console.log('Health Factor:', healthFactor);
    const amountTaken = usdValue || 0;
    const nextTotalDebt = parseFloat(amountTaken) + parseFloat(totalDebt);
    console.log("NextTotalDebt", nextTotalDebt, "TOtal Collateral", totalCollateral, "threshold", liquidationThreshold)
    const ltv = calculateLTV(nextTotalDebt, totalCollateral);
    console.log('LTV:', ltv * 100);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(healthFactor.toFixed(2));

    if (healthFactor <= 1 || ltv * 100 >= liquidationThreshold) {
      setIsButtonDisabled(true); 
    } else {
      setIsButtonDisabled(false); 
    }

    if (isAcknowledged) {
      setIsButtonDisabled(false);
    }

  }, [asset, liquidationThreshold, assetSupply, assetBorrow, amount, usdValue, isAcknowledged, setIsAcknowledged]);

  const amountTaken = usdValue || 0; 
  const amountAdded = 0;
  const calculateHealthFactor = (totalCollateral, totalDebt, liquidationThreshold,) => {
    const totalCollateralValue = parseFloat(totalCollateral) + parseFloat(amountAdded);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountTaken);
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue;
  };


  const totalDeptValueLTV = parseFloat(totalDebt) + parseFloat(amountTaken);



  const calculateLTV = (nextTotalDebt, totalCollateral) => {
    if (totalCollateral === 0) {
      return 0;
    }
    return (nextTotalDebt / totalCollateral);
  };

  const [healthFactorBackend, setHealthFactorBackend] = useState(null);
  const [userData, setUserData] = useState();

  useEffect(() => {
    const fetchUserData = async () => {
      if (backendActor) {
        try {
          const result = await getUserData(principal.toString());
          console.log('get_user_data:', result);
          setUserData(result);
          updateWalletDetailTab(result);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        console.error('Backend actor initialization failed.');
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
      console.log('get_user_data in supplypopup:', result);

      
      if (result && result.Ok && result.Ok.health_factor) {
        setHealthFactorBackend(result.Ok.health_factor);  
      } else {
        setError("Health factor not found");
      }
      return result;
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    }
  };


  const [availableBorrows, setAvailableBorrows] = useState(0);

 
  const ltv2 = 0.7;



  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;

    
    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0) {

     
      const convertedValue = numericAmount * conversionRate;
      setUsdValue(parseFloat(convertedValue.toFixed(2))); 
      setAmount(inputAmount);
      setError("");

    } else if (inputAmount === "") {
     
      setAmount("");
       setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
       setUsdValue(0);
    }
    useEffect(() => {
      if (amount && conversionRate) {
        const convertedValue = parseFloat(amount) * conversionRate;
        setUsdValue(convertedValue);
      } else {
        setUsdValue(0); 
      }
    }, [amount, conversionRate]);
  };
  return (
    <>
      {isVisible && (
        <div className="borrow-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Borrow {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={totalCollateral === 0}
                    className="lg:text-lg focus:outline-none bg-gray-100  rounded-md p-2  w-full dark:bg-darkBackground/5 dark:text-darkText"
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
                  <p className="text-xs mt-4">
                    ${parseFloat(totalCollateral)?.toFixed(2) || "0.00"} Max
                  </p>

                </div>
              </div>
            </div>
            <div className="w-full ">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100  cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center my-1 mb-2">
                    <p>APY, borrow rate</p>
                    <p>{(supplyRateAPR * 100) < 0.1 ? '<0.1%' : `${(supplyRateAPR * 100)}%`}</p>
                  </div>

                  <div className="w-full flex justify-between items-center">
                    <p>Health Factor</p>
                    <p>
                      <span className={`${healthFactorBackend > 3
                        ? "text-green-500"
                        : healthFactorBackend <= 1
                          ? "text-red-500"
                          : healthFactorBackend <= 1.5
                            ? "text-orange-600"
                            : healthFactorBackend <= 2
                              ? "text-orange-400"
                              : "text-orange-300"
                        }`}>{parseFloat(healthFactorBackend).toFixed(2)}</span>
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

                  <div className="w-full flex justify-end items-center mt-1 ">
                    <p className="text-gray-500">liquidation at &lt;1</p>
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
                    className="object-cover w-5 h-5 rounded-full" 
                  />
                  <div className="relative group">
                    <Info size={16} className="ml-2 cursor-pointer" />

                    {/* Tooltip */}
                    <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                      Fees deducted on every transaction
                    </div>
                  </div>
                </div>
                <div>
                  {value < 2 && value > 1 && (
                    <div>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="acknowledgeRisk"
                          className="mr-2"
                          onChange={handleAcknowledgeChange}
                        />
                        <label
                          htmlFor="acknowledgeRisk"
                          className="text-sm text-gray-700 dark:text-white"
                        >
                          I acknowledge the risk involved
                        </label>
                      </div>

                      <div className="w-full flex flex-col my-3 space-y-2">
                        <div className="w-full flex bg-[#BA5858] p-3 rounded-lg">
                          <div className="w-1/12 flex items-center justify-center">
                            <div className="warning-icon-container">
                              <TriangleAlert />
                            </div>
                          </div>
                          <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                            Borrowing this amount will reduce your health factor and increase risk of liquidation
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <button
                onClick={handleBorrowETH}
                className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 ${isLoading || amount <= 0 || isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={isLoading || (amount <= 0 || null) || isButtonDisabled}
              >
                Borrow {asset}
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
              You have borrowed {amount} d{asset}
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

export default Borrow;
