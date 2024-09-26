import { useDispatch, useSelector } from "react-redux";
import React from "react";
import Button from "../Common/Button";
import { useAuth } from "../../utils/useAuthClient";
import { SlidersHorizontal, SlidersVertical } from "lucide-react";
import { ASSET_DETAILS } from "../../utils/constants";
import { setAssetDetailFilter } from "../../redux/reducers/utilityReducer";
import SupplyInfo from "./DashboardPopup/SupplyInfo";
import BorrowInfo from "./DashboardPopup/BorrowInfo";
import { useParams } from "react-router-dom";
import { Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  setIsWalletConnected,
  setWalletModalOpen, setConnectedWallet
} from "../../redux/reducers/utilityReducer";
import { WalletMinimal } from "lucide-react";
import { Info } from "lucide-react";

import icplogo from "../../../public/wallet/icp.png";
import plug from "../../../public/wallet/plug.png";
import bifinity from "../../../public/wallet/bifinity.png";
import nfid from "../../../public/wallet/nfid.png";
import useAssetData from "../Common/useAssets";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useCallback } from "react";
import MySupplyModal from "./MySupplyModal";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
import ckbtc from "../../../public/assests-icon/ckBTC.png";
import cketh from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../declarations/ckbtc_ledger";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";

const AssetDetails = () => {

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isWalletCreated, isWalletModalOpen, isSwitchingWallet, connectedWallet } = useSelector(state => state.utility)
  console.log("isWalletswitching", isSwitchingWallet, connectedWallet)

  const {
    isAuthenticated,
    login,
    logout,
    principal,
    createLedgerActor,
    backendActor
  } = useAuth()

  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false }))
  }

  const handleWallet = () => {
    dispatch(setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false }))
    dispatch(setIsWalletConnected(true))
    navigate('/dashboard/my-supply')
  }

  useEffect(() => {
    if (isWalletCreated) {
      navigate('/dashboard/wallet-details')
    }
  }, [isWalletCreated]);


  const loginHandlerIsSwitch = async (val) => {
    dispatch(setUserData(null));
    await logout();
    await login(val);
    dispatch(setConnectedWallet(val));
    dispatch(setWalletModalOpen({ isOpen: false, isSwitching: false }));

  };

  const loginHandler = async (val) => {
    await login(val);
    dispatch(setConnectedWallet(val));
  };

  const handleLogout = () => {
    dispatch(setUserData(null));
    logout();
  };

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };



  const walletDisplayName = (wallet) => {
    switch (wallet) {
      case 'ii':
        return "Internet Identity";
      case 'plug':
        return "Plug";
      case 'bifinity':
        return "Bitfinity";
      case 'nfid':
        return "NFID";
      default:
        return "Unknown Wallet";
    }
  };


  const { id } = useParams();

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
      console.log("get_user_data in mysupply:", result);
      return result;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  const [isFilter, setIsFilter] = React.useState(false);
  const { filteredItems } = useAssetData();

  const { assetDetailFilter } = useSelector((state) => state.utility);

  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
  const [ckETHUsdRate, setCkETHUsdRate] = useState(null);


  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);
  const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);

  const [balance, setBalance] = useState(null);
  const [usdBalance, setUsdBalance] = useState(null);
  const [supplyCapUsd, setSupplyCapUsd] = useState(null);
  const [supplyPercentage, setSupplyPercentage] = useState("");
  const [borrowCapUsd, setBorrowCapUsd] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollateral, setIsCollateral] = useState(true);


  const handleFilter = (value) => {
    setIsFilter(false);
    dispatch(setAssetDetailFilter(value));
  };

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );
  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            console.log(`get_asset_principle (${asset}):`, result);
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
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      console.log(`get_asset_principle in mysupply (${asset}):`, result);
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };
  const ledgerActorckBTC = useMemo(
    () =>
      assetPrincipal.ckBTC
        ? createLedgerActor(assetPrincipal.ckBTC, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckBTC]
  );

  const ledgerActorckETH = useMemo(
    () =>
      assetPrincipal.ckETH
        ? createLedgerActor(assetPrincipal.ckETH, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckETH]
  );
  const ledgerActorckUSDC = useMemo(
    () =>
      assetPrincipal.ckUSDC
        ? createLedgerActor(assetPrincipal.ckUSDC, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckUSDC]
  );
  console.log("ckBTC ledger", ledgerActorckBTC);
  console.log("ckUSDC ledger", ledgerActorckUSDC);
  console.log("ckETH ledger", ledgerActorckETH);


  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, ckBTCUsdRate]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }
  }, [ckETHBalance, ckETHUsdRate]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate]);


  useEffect(() => {
    console.log("Asset ID from URL parameters:", id); // Log the asset ID from URL
  }, [id]);




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
            //  balance = 2500
            setCkBTCBalance(balance.toString()); // Set ckBTC balance
          } else if (assetType === "ckETH") {
            if (!ledgerActorckETH) {
              console.warn("Ledger actor for ckETH not initialized yet");
              return;
            }
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            //  balance = 3500
            setCkETHBalance(balance.toString()); // Set ckETH balance
          } else if (assetType === "ckUSDC") {
            if (!ledgerActorckUSDC) {
              console.warn("Ledger actor for ckUSDC not initialized yet");
              return;
            }
            balance = await ledgerActorckUSDC.icrc1_balance_of(account);
            //  balance = 1300
            setCKUSDCBalance(balance.toString()); // Set ckUSDC balance
          } else {
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
    [isAuthenticated, ledgerActorckBTC, ledgerActorckETH, ledgerActorckUSDC, principalObj]
  );

  // Log balances using useEffect after state updates
  useEffect(() => {
    if (ckBTCBalance !== null) {
      console.log("Updated ckBTC Balance:", ckBTCBalance); // Log updated ckBTC balance
    }
  }, [ckBTCBalance]);

  useEffect(() => {
    if (ckETHBalance !== null) {
      console.log("Updated ckETH Balance:", ckETHBalance); // Log updated ckETH balance
    }
  }, [ckETHBalance]);

  useEffect(() => {
    if (ckUSDCBalance !== null) {
      console.log("Updated ckUSDC Balance:", ckUSDCBalance); // Log updated ckUSDC balance
    }
  }, [ckUSDCBalance]);

  useEffect(() => {
    if (error) {
      console.error("Error detected:", error); // Log any errors
    }
  }, [error]);

  // Ensure ledger actors are initialized correctly
  useEffect(() => {
    console.log("Ledger Actor for ckBTC:", ledgerActorckBTC); // Log the ledger actor for ckBTC
    console.log("Ledger Actor for ckETH:", ledgerActorckETH); // Log the ledger actor for ckETH
    console.log("Ledger Actor for ckUSDC:", ledgerActorckUSDC); // Log the ledger actor for ckUSDC
  }, [ledgerActorckBTC, ledgerActorckETH, ledgerActorckUSDC]);

  // Fetch balance when `id` is defined
  useEffect(() => {
    if (id) {
      fetchBalance(id);
    } else {
      console.error("No valid asset ID found in URL parameters."); // Log missing asset ID
    }
  }, [id, fetchBalance]);

  const pollInterval = 10000; // 10 seconds
  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin,internet-computer&vs_currencies=usd"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setCkBTCUsdRate(data.bitcoin.usd);
      setCkETHUsdRate(data.ethereum.usd);
      setCkUSDCUsdRate(data["usd-coin"].usd);
      setCkICPUsdRate(data["internet-computer"].usd);
      // console.log(
      //   "Fetched Conversion Rates - ckBTC:",
      //   data.bitcoin.usd,
      //   "ckETH:",
      //   data.ethereum.usd,
      //   "ckUSDC:",
      //   data["usd-coin"].usd,
      //   "ICP:",
      //   data["internet-computer"].usd
      // );
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
      setError(error);
    }
  }, [ckBTCBalance, ckETHBalance, ckUSDCBalance, pollInterval]);

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
          fetchConversionRate(), // Fetch ckBTC and ckETH rates
        ]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate, ckBTCBalance, ckETHBalance, ckUSDCBalance]);

  let supply_cap;
  let borrow_cap;
  let asset;

  filteredItems.map((item, index) => {
    asset = item[0];
    supply_cap = item[1].Ok.configuration.supply_cap;
    borrow_cap = item[1].Ok.configuration.borrow_cap;
  });

  console.log("asserhuhdhd", asset);

  useEffect(() => {
    if (balance && conversionRate) {
      const balanceInUsd = (parseFloat(balance) * conversionRate).toFixed(2);
      const supplyCapUsd = (parseFloat(supply_cap) * conversionRate).toFixed(2);
      const borrowCapUsd = (parseFloat(borrow_cap) * conversionRate).toFixed(2);
      setUsdBalance(balanceInUsd);
      setSupplyCapUsd(supplyCapUsd);
      setBorrowCapUsd(borrowCapUsd);

      const percentage =
        supplyCapUsd > 0
          ? Math.round(
            (parseFloat(balanceInUsd) / parseFloat(supplyCapUsd)) * 100
          )
          : 0;
      setSupplyPercentage(percentage);
      console.log(`Balance as a percentage of Supply Cap: ${percentage}%`);
    }
  }, [balance, conversionRate, supply_cap]);

  function formatNumber(num) {
    if (num === null || num === undefined) {
      return "0";
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }


  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);



  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
  });

  const handleModalOpen = (type,
    asset,
    image,
    supplyRateAPR,
    ckBalance,
    liquidationThreshold,
    assetSupply,
    assetBorrow,
    totalCollateral,
    totalDebt) => {
    console.log("Handle modal opened");
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
      supplyRateAPR: supplyRateAPR,
      ckBalance: ckBalance,
      liquidationThreshold: liquidationThreshold,
      assetSupply: assetSupply,
      assetBorrow: assetBorrow,
      totalCollateral: totalCollateral,
      totalDebt: totalDebt,
    });
  };

  const renderModalOpen = (type) => {
    console.log(type);
    switch (type) {
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            setIsModalOpen={setIsModalOpen}
            children={
              <SupplyPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                balance={isModalOpen.ckBalance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );

      default:
        return null;
    }
  };

  const renderFilterComponent = () => {
    switch (assetDetailFilter) {
      case "Supply Info":
        return (
          <SupplyInfo
            filteredItems={filteredItems}
            formatNumber={formatNumber}
            usdBalance={usdBalance}
            borrowCapUsd={borrowCapUsd}
            supplyPercentage={supplyPercentage}
          />
        );
      case "Borrow Info":
        return (
          <BorrowInfo
            filteredItems={filteredItems}
            formatNumber={formatNumber}
            usdBalance={usdBalance}
            borrowCapUsd={borrowCapUsd}
            supplyPercentage={supplyPercentage}
          />
        );
      default:
        return <SupplyInfo filteredItems={filteredItems} />;
    }
  };

  return (
    <div className="w-full flex flex-col lg1:flex-row mt-16 my-6 gap-6 mb-[5rem]">
      <div className="w-full lg1:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
        <h1 className="text-[#2A1F9D] font-bold my-2 dark:text-darkText">
          Reserve status & configuration
        </h1>
        <div className="w-full mt-8  lg:flex">
          <div className="w-full mb-6 dxl1: block xl:hidden">
            <div className="flex items-center justify-between gap-3 cursor-pointer text-[#2A1F9D] relative sxs3:w-[40%] dark:text-darkText">
              <span className="font-medium dark:text-darkText">
                {assetDetailFilter}
              </span>
              <span onClick={() => setIsFilter(!isFilter)}>
                {!isFilter ? (
                  <SlidersHorizontal size={16} className="text-[#695fd4]" />
                ) : (
                  <SlidersVertical size={16} className="text-[#695fd4]" />
                )}
              </span>
              {isFilter && (
                <div className="w-fit absolute top-full left-1/2 z-30 bg-[#0C5974] text-white rounded-xl overflow-hidden animate-fade-down">
                  {ASSET_DETAILS.map((item, index) => (
                    <button
                      type="button"
                      key={index}
                      className="w-full whitespace-nowrap text-left text-sm p-3 hover:bg-[#2b6980]"
                      onClick={() => handleFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-2/12 hidden xl:block">
            <div className="flex items-center justify-between gap-3 cursor-pointer text-[#2A1F9D] relative">
              <span className="font-medium text-[16px] dark:text-darkText">
                {assetDetailFilter}
              </span>
              <span onClick={() => setIsFilter(!isFilter)}>
                {!isFilter ? (
                  <SlidersHorizontal size={16} className="text-[#695fd4]" />
                ) : (
                  <SlidersVertical size={16} className="text-[#695fd4]" />
                )}
              </span>
              {isFilter && (
                <div className="w-fit absolute top-full left-1/2 z-30 bg-[#0C5974] text-white rounded-xl overflow-hidden animate-fade-down">
                  {ASSET_DETAILS.map((item, index) => (
                    <button
                      type="button"
                      key={index}
                      className="w-full whitespace-nowrap text-left text-sm p-3 hover:bg-[#2b6980]"
                      onClick={() => handleFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {renderFilterComponent()}
        </div>
      </div>
      {!isAuthenticated && (
        <div className="w-full lg:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
            <h1 className="font-semibold">Total Supplied</h1>
            <p className="text-gray-300 text-[12px] my-1">
              Please connect a wallet to view your personal information here.
            </p>
            <div className="w-full mt-4">
              <Button
                title={"Connect Wallet"}
                onClickHandler={handleWalletConnect}
                className={
                  "my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"
                }
              />
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="w-full lg1:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
            <h1 className="font-semibold mb-5">Your Info</h1>
            <div className="flex">
              <div className="bg-[#59588D] flex items-center px-3 rounded-xl mr-3">
                {" "}
                <WalletMinimal />
              </div>
              <div>
                {" "}
                <p className="text-gray-300 text-[12px] my-1">Wallet Balance</p>
                <p className="text  font-semibold text-[#eeeef0] dark:text-darkText">
                  {id === "ckBTC" && (
                    <>
                      <p>{ckBTCBalance} {id}</p>

                    </>
                  )}
                  {id === "ckETH" && (
                    <>
                      <p>{ckETHBalance} {id}</p>

                    </>
                  )}
                  {id === "ckUSDC" && (
                    <>
                      <p>{ckUSDCBalance} {id}</p>

                    </>
                  )}
                </p>
              </div>
            </div>

            <div>
              <div className="border mt-6 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className=" text-[12px] my-1 text-darkTextSecondary1">
                    Assets to Supply
                  </p>
                  <span>
                    <Info size={13} color="lightblue" />
                  </span>
                </div>
                <div className="flex">
                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 ">
                    <div className="text-sm text-[#eeeef0] dark:text-darkText flex flex-col justify-center">
                      {id === "ckBTC" && (
                        <>
                          <p>{ckBTCBalance} {id}</p>
                          <p className="text-[11px] font-light">${formatNumber(ckBTCUsdBalance)}</p>
                        </>
                      )}
                      {id === "ckETH" && (
                        <>
                          <p>{ckETHBalance} {id}</p>
                          <p className="text-[11px] font-light">${formatNumber(ckETHUsdBalance)}</p>
                        </>
                      )}
                      {id === "ckUSDC" && (
                        <>
                          <p>{ckUSDCBalance} {id}</p>
                          <p className="text-[11px] font-light">${formatNumber(ckUSDCUsdBalance)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button
                      title={"Supply"}
                      onClickHandler={() => {
                        const reserveData = userData?.Ok?.reserves[0]?.find(
                          (reserveGroup) => reserveGroup[0] === id
                        );
                        console.log("userData", userData);
                        const assetSupply = reserveData?.[1]?.asset_supply || 0;
                        const assetBorrow = reserveData?.[1]?.asset_borrow || 0;
                        const totalCollateral =
                          userData?.Ok?.total_collateral || 0;
                        const totalDebt = userData?.Ok?.total_debt || 0;

                        const filteredData = filteredItems?.find((item) => {
                          console.log("itemsitems", item[1]?.Ok?.asset_name); // You can console.log here
                          return item[1]?.Ok // Still need to return the condition
                        });

                        const supplyRateApr = filteredData[1]?.Ok.supply_rate_apr || 0;
                        const liquidationThreshold = filteredData[1]?.Ok.configuration.liquidation_threshold || 0;
                        const ckBalance =
                          id === "ckBTC"
                            ? ckBTCBalance
                            : asset === "ckETH"
                              ? ckETHBalance
                              : asset === "ckUSDC"
                                ? ckUSDCBalance
                                : null;

                        console.log("ckBalance", ckBalance, "assetSupply", assetSupply, "assetBorrow", assetBorrow, "totalCollateral", totalCollateral, "totalDebt", totalDebt, "supplyRateApr", supplyRateApr, "liquidationThreshold", liquidationThreshold);

                        handleModalOpen(
                          "supply",
                          id,
                          (id === "ckBTC" && ckbtc) ||
                          (id === "ckETH" && cketh) ||
                          (id === "ckUSDC" && ckUSDC),
                          supplyRateApr,
                          ckBalance,
                          liquidationThreshold,
                          assetSupply,
                          assetBorrow,
                          totalCollateral,
                          totalDebt
                        );
                      }}
                      className={
                        "my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-2 px-8 shadow-lg font-semibold text-sm'"
                      }
                    />
                  </div>
                </div>

              </div>

              {balance === "0" && (
                <div className="bg-[#59588D] mt-5 rounded-lg px-2 py-1">
                  <p className=" text-[10px] my-1">
                    Your wallet is empty. Please add assets to your wallet
                    before supplying.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(isSwitchingWallet || !isAuthenticated) && (
        <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
          <div className='w-[300px] absolute bg-gray-100 shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
            {connectedWallet ? <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Switch wallet</h1> : <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>}
            <h1 className="text-xs text-gray-500 dark:text-darkTextSecondary mt-3 italic">
              {connectedWallet && (
                <>
                  <span className="text-[#2A1F9D] dark:text-blue-400 font-semibold" >{walletDisplayName(connectedWallet)}</span>
                  <span> is connected</span>
                </>
              )}
            </h1>
            <div className='flex flex-col gap-2 mt-3 text-sm'>

              {connectedWallet !== "ii" && (
                <div
                  className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
                  onClick={() => { isSwitchingWallet ? loginHandlerIsSwitch("ii") : loginHandler("ii") }}
                >
                  Internet Identity
                  <div className='w-8 h-8'>
                    <img src={icplogo} alt="connect_wallet_icon" className='object-fill w-9 h-8 bg-white p-1 rounded-[20%]' />
                  </div>
                </div>
              )}

              {connectedWallet !== "nfid" && (
                <div
                  className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
                  onClick={() => { isSwitchingWallet ? loginHandlerIsSwitch("nfid") : loginHandler("nfid") }}
                >
                  NFID
                  <div className='w-8 h-8'>
                    <img src={nfid} alt="connect_wallet_icon" className='object-fill w-9 h-8 bg-white p-1 rounded-[20%]' />
                  </div>
                </div>
              )}


            </div>
            <p className='w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>Track wallet balance in read-only mode</p>

            <div className="w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full p-2 border border-[#233D63] focus:outline-none focus:border-blue-500 placeholder:text-[#233D63] dark:border-darkTextSecondary1 dark:placeholder:text-darkTextSecondary1 text-gray-600 dark:text-darkTextSecondary1 text-xs rounded-md dark:bg-transparent"
                placeholder="Enter wallet address or username"
              />
            </div>

            {inputValue && (
              <div className="w-full flex mt-3">
                <Button
                  title="Connect"
                  onClickHandler={handleWallet}
                  className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 px-20 shadow-lg font-semibold text-sm"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
      {renderModalOpen(isModalOpen.type)}
    </div>
  );
};

export default AssetDetails;
