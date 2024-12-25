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
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import { WalletMinimal } from "lucide-react";
import { Info } from "lucide-react";

import icplogo from "../../../public/wallet/icp.png";
import bifinity from "../../../public/wallet/bifinity.png";
import nfid from "../../../public/wallet/nfid.png";
import useAssetData from "../Common/useAssets";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import MySupplyModal from "./MySupplyModal";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
import ckbtc from "../../../public/assests-icon/ckBTC.png";
import cketh from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import WalletModal from "./WalletModal";

const AssetDetails = () => {
  const { isAuthenticated, principal, backendActor } = useAuth();

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
  const { userData, userAccountData } = useUserData();
  useEffect(() => {
    if (userData && userAccountData) {
      setLoading(false);
    }
  }, [userData, userAccountData]);

  useEffect(() => {
    if (assetData?.Ok) {
      setBorrowRateAPR(Number(assetData.Ok.borrow_rate) / 100000000);
      setSupplyRateAPR(Number(assetData.Ok.current_liquidity_rate) / 100000000);
      setTotalBorrowed(Number(assetData.Ok.asset_borrow) / 100000000);
      setTotalSupplied(Number(assetData.Ok.asset_supply) / 100000000);
      setBorrowCap(Number(assetData.Ok.configuration?.borrow_cap) / 100000000);
      setSupplyCap(Number(assetData.Ok.configuration?.supply_cap) / 100000000);
      setLtv(Number(assetData.Ok.configuration?.ltv) / 100000000);
      setLiquidationBonus(
        Number(assetData.Ok.configuration?.liquidation_bonus) / 100000000
      );
      setLiquidationThreshold(
        Number(assetData.Ok.configuration?.liquidation_threshold) / 100000000
      );
      setCanBeCollateral(Number(assetData.Ok.can_be_collateral?.[0])) /
        100000000;
    }
  }, [assetData]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);

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

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const { id } = useParams();
  const {
    assets,
    filteredItems,
    asset_supply,
    asset_borrow,
    fetchAssetBorrow,
    fetchAssetSupply,
  } = useAssetData();

  useEffect(() => {
    const fetchData = async () => {
      for (const asset of assets) {
        fetchAssetSupply(asset);
        fetchAssetBorrow(asset);
      }
    };

    fetchData();
  }, [assets]);

  
  const getAssetSupplyValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]) / 1e8;
      return supplyValue;
    }
    return `noSupply`;
  };
  const getAssetBorrowValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]) / 1e8;
      return borrowValue; // Format as a number with 2 decimals
    }
    return `noBorrow`;
  };
  const [isFilter, setIsFilter] = React.useState(false);

  const { assetDetailFilter } = useSelector((state) => state.utility);

  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);

  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilter = (value) => {
    setIsFilter(false);
    dispatch(setAssetDetailFilter(value));
  };

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {}
      } else {
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
        case "ckUSDT":
          result = await backendActor.get_asset_principal("ckUSDT");
          break;

        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      return result.Ok.toText();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckBTCBalance) * ckBTCUsdRate) /
        1e8
      ).toFixed(7);
      setCkBTCUsdBalance(balanceInUsd);
    }

    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (
        parseFloat(ckETHBalance) *
        (ckETHUsdRate / 1e8)
      ).toFixed(7);
      setCkETHUsdBalance(balanceInUsd);
    }

    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckUSDCBalance) * ckUSDCUsdRate) /
        1e8
      ).toFixed(7);
      setCkUSDCUsdBalance(balanceInUsd);
    }

    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckICPBalance) * ckICPUsdRate) /
        1e8
      ).toFixed(7);
      setCkICPUsdBalance(balanceInUsd);
    }

    if (ckUSDTBalance && ckUSDTUsdRate) {
      const balanceInUsd = (
        parseFloat(ckUSDTBalance) *
        (ckUSDTUsdRate / 1e8)
      ).toFixed(7);
      setCkUSDTUsdBalance(balanceInUsd);
    }
  }, [
    ckBTCBalance,
    ckBTCUsdRate,
    ckETHBalance,
    ckETHUsdRate,
    ckUSDCBalance,
    ckUSDCUsdRate,
    ckICPBalance,
    ckICPUsdRate,
    ckUSDTBalance,
    ckUSDTUsdRate,
  ]);

  useEffect(() => {}, [id]);

  useEffect(() => {
    if (ckBTCBalance !== null) {
    }
  }, [ckBTCBalance]);

  useEffect(() => {
    if (ckETHBalance !== null) {
    }
  }, [ckETHBalance]);

  useEffect(() => {
    if (ckUSDCBalance !== null) {
    }
  }, [ckUSDCBalance]);

  useEffect(() => {
    if (error) {
    }
  }, [error]);

  useEffect(() => {
    if (id) {
      fetchBalance(id);
    } else {
    }
  }, [id, fetchBalance]);

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
    ckUSDTBalance,
  ]);

  const formatNumber = useFormatNumber();

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

  const handleModalOpen = (
    type,
    asset,
    image,
    supplyRateAPR,
    ckBalance,
    reserveliquidationThreshold,
    liquidationThreshold,
    assetSupply,
    assetBorrow,
    totalCollateral,
    totalDebt,
    currentCollateralStatus
  ) => {
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
      supplyRateAPR: supplyRateAPR,
      ckBalance: ckBalance,
      reserveliquidationThreshold: reserveliquidationThreshold,
      liquidationThreshold: liquidationThreshold,
      assetSupply: assetSupply,
      assetBorrow: assetBorrow,
      totalCollateral: totalCollateral,
      totalDebt: totalDebt,
      currentCollateralStatus: currentCollateralStatus,
    });
  };

  const renderModalOpen = (type) => {
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
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                currentCollateralStatus={isModalOpen.currentCollateralStatus}
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
      : id === "ckUSDT"
      ? ckUSDTBalance
      : null;
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
  return (
    <div className="w-full flex flex-col lg1:flex-row mt-7 md:-mt-7 lg:mt-10 my-6 gap-6 mb-[5rem]">
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
                      <p>
                        {formatValue(ckBTCBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckETH" && (
                    <>
                      <p>
                        {formatValue(ckETHBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckUSDC" && (
                    <>
                      <p>
                        {formatValue(ckUSDCBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ICP" && (
                    <>
                      <p>
                        {formatValue(ckICPBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckUSDT" && (
                    <>
                      <p>
                        {formatValue(ckUSDTBalance)} {id}
                      </p>
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
                          <p>
                            {ckBTCBalance === 0
                              ? "0"
                              : ckBTCBalance >= 1
                              ? Number(ckBTCBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : Number(ckBTCBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 7,
                                  maximumFractionDigits: 7,
                                })}
                          </p>
                          <p className="font-light">
                            ${formatNumber(ckBTCUsdBalance)}
                          </p>
                        </>
                      )}
                      {id === "ckETH" && (
                        <>
                          <p>
                            {ckETHBalance === 0
                              ? "0"
                              : ckETHBalance >= 1
                              ? Number(ckETHBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : Number(ckETHBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 7,
                                  maximumFractionDigits: 7,
                                })}
                          </p>
                          <p className="font-light">
                            ${formatNumber(ckETHUsdBalance)}
                          </p>
                        </>
                      )}
                      {id === "ckUSDC" && (
                        <>
                          <p>
                            {ckUSDCBalance === 0
                              ? "0"
                              : ckUSDCBalance >= 1
                              ? Number(ckUSDCBalance).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : Number(ckUSDCBalance).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 7,
                                    maximumFractionDigits: 7,
                                  }
                                )}
                          </p>
                          <p className="font-light">
                            ${formatNumber(ckUSDCUsdBalance)}
                          </p>
                        </>
                      )}
                      {id === "ICP" && (
                        <>
                          <p>
                            {ckICPBalance === 0
                              ? "0"
                              : ckICPBalance >= 1
                              ? Number(ckICPBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : Number(ckICPBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 7,
                                  maximumFractionDigits: 7,
                                })}
                          </p>
                          <p className="font-light">
                            ${formatNumber(ckICPUsdBalance)}
                          </p>
                        </>
                      )}
                      {id === "ckUSDT" && (
                        <>
                          <p>
                            {ckUSDTBalance === 0
                              ? "0"
                              : ckUSDTBalance >= 1
                              ? Number(ckUSDTBalance).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : Number(ckUSDTBalance).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 7,
                                    maximumFractionDigits: 7,
                                  }
                                )}
                          </p>
                          <p className="font-light">
                            ${formatNumber(ckUSDTUsdBalance)}
                          </p>
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

                        const assetSupply = getAssetSupplyValue(id);
                        const assetBorrow = getAssetBorrowValue(id);
                        const currentCollateralStatus =
                          reserveData?.[1]?.is_collateral;

                        console.log(
                          "currentCollateralStatus",
                          currentCollateralStatus
                        );
                        const totalCollateral =
                          parseFloat(
                            Number(userAccountData?.Ok?.[0]) / 100000000
                          ) || 0;
                        const totalDebt =
                          parseFloat(
                            Number(userAccountData?.Ok?.[1]) / 100000000
                          ) || 0;

                        const filteredData = filteredItems?.find((item) => {
                          return item[1]?.Ok;
                        });

                        const supplyRateAPR =
                          Number(filteredData[1]?.Ok.current_liquidity_rate) /
                            100000000 || 0;

                        const liquidationThreshold =
                          Number(userAccountData?.Ok?.[3]) / 100000000 || 0;
                        const reserveliquidationThreshold =
                          Number(
                            filteredData[1]?.Ok.configuration
                              .liquidation_threshold
                          ) / 100000000 || 0;

                        const ckBalance =
                          id === "ckBTC"
                            ? ckBTCBalance
                            : id === "ckETH"
                            ? ckETHBalance
                            : id === "ckUSDC"
                            ? ckUSDCBalance
                            : id === "ICP"
                            ? ckICPBalance
                            : id === "ckUSDT"
                            ? ckUSDTBalance
                            : null;

                        handleModalOpen(
                          "supply",
                          id,
                          (id === "ckBTC" && ckbtc) ||
                            (id === "ckETH" && cketh) ||
                            (id === "ckUSDC" && ckUSDC) ||
                            (id === "ICP" && icp) ||
                            (id === "ckUSDT" && ckUSDT),
                          supplyRateAPR,
                          ckBalance,
                          liquidationThreshold,
                          reserveliquidationThreshold,
                          assetSupply,
                          assetBorrow,
                          totalCollateral,
                          totalDebt,
                          currentCollateralStatus
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

      {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
      {renderModalOpen(isModalOpen.type)}
    </div>
  );
};

export default AssetDetails;
