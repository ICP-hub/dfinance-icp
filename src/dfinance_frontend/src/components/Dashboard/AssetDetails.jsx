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
import { useNavigate, useLocation } from "react-router-dom";
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
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";

const AssetDetails = () => {
  const location = useLocation();
  const { assetData } = location.state || {};

  const [borrowRateAPR, setBorrowRateAPR] = useState(null);
  const [supplyRateAPR, setSupplyRateAPR] = useState(null);
  const [totalBorrowed, setTotalBorrowed] = useState(null);
  const [totalSupplied, setTotalSupplied] = useState(null);
  const [borrowCap, setBorrowCap] = useState(null);
  const [supplyCap, setSupplyCap] = useState(null);
  const [ltv, setLtv] = useState(null);
  const [liquidationBonus, setLiquidationBonus] = useState(null);
  const [liquidationThreshold, setLiquidationThreshold] = useState(null);
  const [canBeCollateral, setCanBeCollateral] = useState(null);

  useEffect(() => {
    if (assetData?.Ok) {
      console.log("assetData:",assetData?.Ok);
      setBorrowRateAPR(assetData.Ok.borrow_rate);
      setSupplyRateAPR(assetData.Ok.current_liquidity_rate);
      setTotalBorrowed(assetData.Ok.total_borrowed);
      setTotalSupplied(assetData.Ok.total_supply);
      setBorrowCap(assetData.Ok.configuration?.borrow_cap);
      setSupplyCap(assetData.Ok.configuration?.supply_cap);
      setLtv(assetData.Ok.configuration?.ltv);
      setLiquidationBonus(assetData.Ok.configuration?.liquidation_bonus);
      setLiquidationThreshold(assetData.Ok.configuration?.liquidation_threshold);
      setCanBeCollateral(assetData.Ok.can_be_collateral?.[0]);
    }
  }, [assetData]);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
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
  const ledgerActorICP = useMemo(
    () =>
      assetPrincipal.ICP
        ? createLedgerActor(assetPrincipal.ICP, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ICP]
  );



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
    console.log("Asset ID from URL parameters:", id); 
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
            setCkBTCBalance(balance.toString()); 
          } else if (assetType === "ckETH") {
            if (!ledgerActorckETH) {
              console.warn("Ledger actor for ckETH not initialized yet");
              return;
            }
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            setCkETHBalance(balance.toString());
          } else if (assetType === "ckUSDC") {
            if (!ledgerActorckUSDC) {
              console.warn("Ledger actor for ckUSDC not initialized yet");
              return;
            }
            balance = await ledgerActorckUSDC.icrc1_balance_of(account);
            setCKUSDCBalance(balance.toString()); 
          }
          else if (assetType === "ICP") {
            if (!ledgerActorICP) {
              console.warn("Ledger actor for ICP not initialized yet");
              return;
            }
            balance = await ledgerActorICP.icrc1_balance_of(account);
            setCkICPBalance(balance.toString()); 
          }
          else {
            throw new Error(
              "Unsupported asset type or ledger actor not initialized"
            );
          }
         
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

  
  useEffect(() => {
    if (ckBTCBalance !== null) {
      console.log("Updated ckBTC Balance:", ckBTCBalance); 
    }
  }, [ckBTCBalance]);

  useEffect(() => {
    if (ckETHBalance !== null) {
      console.log("Updated ckETH Balance:", ckETHBalance); 
    }
  }, [ckETHBalance]);

  useEffect(() => {
    if (ckUSDCBalance !== null) {
      console.log("Updated ckUSDC Balance:", ckUSDCBalance); 
    }
  }, [ckUSDCBalance]);

  useEffect(() => {
    if (error) {
      console.error("Error detected:", error); 
    }
  }, [error]);

  useEffect(() => {
    if (id) {
      fetchBalance(id);
    } else {
      console.error("No valid asset ID found in URL parameters."); 
    }
  }, [id, fetchBalance]);

  const pollInterval = 2000; 
  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch("http://139.59.16.70/conversion-rates");
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
    const intervalId = setInterval(() => {
      fetchConversionRate();
    }, pollInterval);

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
  ]);


  function formatNumber(num) {
    // Ensure num is a valid number
    const parsedNum = parseFloat(num);
  
    if (isNaN(parsedNum) || parsedNum === null || parsedNum === undefined) {
      return "0";
    }
    if (parsedNum >= 1000000000) {
      return (parsedNum / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (parsedNum >= 1000000) {
      return (parsedNum / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (parsedNum >= 1000) {
      return (parsedNum / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return parsedNum.toFixed(2).toString();
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
            formatNumber={formatNumber}
            supplyCap={supplyCap}
            totalSupplied={totalSupplied}
            supplyRateAPR={supplyRateAPR}
            ltv={ltv}
            canBeCollateral={canBeCollateral}
            liquidationBonus={liquidationBonus}
            liquidationThreshold={liquidationThreshold}
          />
        );
      case "Borrow Info":
        return (
          <BorrowInfo
            formatNumber={formatNumber}
            borrowCap={borrowCap}
            totalBorrowed={totalBorrowed}
            borrowRateAPR={borrowRateAPR}
          />
        );
      default:
        return <SupplyInfo filteredItems={filteredItems} />;
    }
  };

  const ckBalance =
    id === "ckBTC"
      ? ckBTCBalance
      : id === "ckETH"
        ? ckETHBalance
        : id === "ckUSDC"
          ? ckUSDCBalance
          : id === "ICP"
            ? ckICPBalance
            : null;

  return (
    <div className="w-full flex flex-col lg1:flex-row mt-16 my-6 gap-6 mb-[5rem]">
      <div className="w-full lg1:w-9/12  p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
        <h1 className="text-[#2A1F9D] font-bold my-2 dark:text-darkText">
          Reserve status & configuration
        </h1>
        <div className="w-full mt-8  lg:flex">
          <div className="mb-6 text-auto md:block xl:hidden">
            <div className="flex items-center justify-start gap-3 sxs3:justify-start sxs3:px-3 cursor-pointer text-[#2A1F9D] relative sxs3:w-[40%] dark:text-darkText">
              <span className="font-medium text-nowrap dark:text-darkText">
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
            <div className="flex items-center justify-around gap-3 cursor-pointer text-[#2A1F9D] relative">
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
                  {id === "ICP" && (
                    <>
                      <p>{ckICPBalance} {id}</p>

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
                      {id === "ICP" && (
                        <>
                          <p>{ckICPBalance} {id}</p>
                          <p className="text-[11px] font-light">${formatNumber(ckICPUsdBalance)}</p>
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
                          console.log("itemsitems", item[1]?.Ok?.asset_name); 
                          return item[1]?.Ok 
                        });

                        const supplyRateApr = filteredData[1]?.Ok.current_liquidity_rate || 0;
                        const liquidationThreshold = filteredData[1]?.Ok.configuration.liquidation_threshold || 0;
                        const ckBalance =
                          id === "ckBTC"
                            ? ckBTCBalance
                            : id === "ckETH"
                              ? ckETHBalance
                              : id === "ckUSDC"
                                ? ckUSDCBalance
                                : id === "ICP"
                                  ? ckICPBalance
                                  : null;

                        console.log("ckBalance", ckBalance, "assetSupply", assetSupply, "assetBorrow", assetBorrow, "totalCollateral", totalCollateral, "totalDebt", totalDebt, "supplyRateApr", supplyRateApr, "liquidationThreshold", liquidationThreshold);

                        handleModalOpen(
                          "supply",
                          id,
                          (id === "ckBTC" && ckbtc) ||
                          (id === "ckETH" && cketh) ||
                          (id === "ckUSDC" && ckUSDC) ||
                          (id === "ICP" && icp),
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

              {ckBalance === "0" && (
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
