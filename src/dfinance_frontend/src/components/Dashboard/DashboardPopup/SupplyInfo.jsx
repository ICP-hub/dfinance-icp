import React, { useEffect, useRef, useState } from "react";
import { Check, Info } from "lucide-react";
import { X } from "lucide-react";
import CircularProgress from "../../Common/CircularProgressbar";
import useFetchConversionRate from "../../customHooks/useFetchConversionRate";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * SupplyInfo Component
 *
 * This component provides information on a specific asset's supply status, including total supplied,
 * supply cap, borrowed amount, APY, and liquidation-related metrics like Max LTV, liquidation threshold,
 * and liquidation penalty. It also includes interactive tooltips with additional details on LTV and liquidation threshold.
 *
 * @param {Object} props - The component props containing asset data and necessary functions.
 * @returns {JSX.Element} - The rendered SupplyInfo component displaying key supply and risk metrics.
 */
const SupplyInfo = ({formatNumber, supplyCap, totalSupplied, totalBorrowed, supplyRateAPR, ltv, canBeCollateral, liquidationBonus, liquidationThreshold,}) => {

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const dashboardRefreshTrigger = useSelector((state) => state.dashboardUpdate.refreshDashboardTrigger);

  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const { ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate, } = useFetchConversionRate();

  const { id } = useParams();
  const tooltipRef = useRef(null);

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [supplied, setSupplied] = useState(totalSupplied);
  const [borrowed, setBorrowed] = useState(totalBorrowed);
  const [isLTVTooltipVisible, setLTVTooltipVisible] = useState(false);
  const [isLiquidationThresholdTooltipVisible,setLiquidationThresholdTooltipVisible] = useState(false);
  const [isLiquidationPenaltyTooltipVisible,setLiquidationPenaltyTooltipVisible] = useState(false);

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  const supplyCapNumber = supplyCap ? Number(supplyCap) : 0;
  const totalSupplyPercentage =supplyCapNumber && supplied ? (supplied / supplyCapNumber) * 100 : 0;

  const getAssetRate = (assetName) => {
    switch (assetName) {
      case "ckBTC":
        return ckBTCUsdRate / 1e8;
      case "ckETH":
        return ckETHUsdRate / 1e8;
      case "ckUSDC":
        return ckUSDCUsdRate / 1e8;
      case "ICP":
        return ckICPUsdRate / 1e8;
      case "ckUSDT":
        return ckUSDTUsdRate / 1e8;
      default:
        return 0;
    }
  };

  const assetRate = getAssetRate(id);
  const totalSuppliedAsset = assetRate && supplied ? Number(supplied) * assetRate : 0;
  const totalSuppliedCap = assetRate && supplyCap ? Number(supplyCap) / assetRate : 0;

  const formatValue = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return "0";
    }
    return numericValue >= 1
      ? numericValue.toFixed(2)
      : numericValue.toFixed(7);
  };

  const toggleLTVTooltip = () => setLTVTooltipVisible((prev) => !prev);
  const toggleLiquidationThresholdTooltip = () =>setLiquidationThresholdTooltipVisible((prev) => !prev);
  const toggleLiquidationPenaltyTooltip = () =>setLiquidationPenaltyTooltipVisible((prev) => !prev);

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setLTVTooltipVisible(false);
        setLiquidationThresholdTooltipVisible(false);
        setLiquidationPenaltyTooltipVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSupplied(totalSupplied);
    setBorrowed(totalBorrowed);
  }, [dashboardRefreshTrigger, totalSupplied, totalBorrowed]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col md:flex-row items-start sxs3:flex-row sxs3:mb-7 lg:gap-0 md:gap-3">
        <div className="w-full lg:w-[20%] md:w-[10%] flex justify-center align-items-center lg:mt-0 md:mt-2 md:mx-4 lg:mx-0">
          <CircularProgress progessValue={totalSupplyPercentage.toFixed(2)} />
        </div>
        <div className="w-full lg:w-9/12 md:w-[55%] flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs  lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 md:justify-center lg:justify-start sxs3:gap-4">
          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Total Supplied
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5 mb-[1px]`}
            />
            <p>
              {" "}
              <span>{formatValue(totalSupplied)}</span> of{" "}
              <span>
                {supplyCap ? formatNumber(Number(totalSuppliedCap)) : "N/A"}
              </span>
            </p>
            <p className="text-[12px] -mt-3">
              {" "}
              <span>${formatNumber(Number(totalSuppliedAsset))}</span> of{" "}
              <span>
                $
                {supplyCap ? formatNumber(Number(supplyCap.toString())) : "N/A"}
              </span>
            </p>
          </div>

          <hr
            className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
          />

          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              APY, variable
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>
              {supplyRateAPR < 0.1 ? "<0.01%" : `${supplyRateAPR.toFixed(2)}%`}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <p className="mt-4 text-[#5B62FE] flex items-center gap-2 dark:text-darkText">
          Collateral usage: {canBeCollateral ? <Check /> : <X />}{" "}
          {canBeCollateral ? "Can be collateral" : "Cannot be collateral"}
        </p>

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Max LTV
              <span
                className="relative inline-block ml-1"
                onMouseEnter={() => setLTVTooltipVisible(true)}
                onMouseLeave={() => setLTVTooltipVisible(false)}
              >
                <Info
                  size={15}
                  className="ml-1 align-middle cursor-pointer button1"
                  onClick={toggleLTVTooltip}
                />

                {isLTVTooltipVisible && (
                  <div
                    ref={tooltipRef}
                    className="absolute w-[300px] bottom-full transform -translate-x-[39%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                  >
                    <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                      The Maximum LTV ratio shows how much you can borrow
                      against collateral.
                      <hr className="my-2 opacity-50" />
                      For example, with an LTV of 75%, you can borrow up to 75%
                      of the value of your collateral, like 0.75 USD for every 1
                      USD worth of collateral.
                    </span>
                  </div>
                )}
              </span>
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{ltv}%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Liquidation threshold
              <span
                className="relative inline-block ml-1"
                onMouseEnter={() => setLiquidationThresholdTooltipVisible(true)}
                onMouseLeave={() =>
                  setLiquidationThresholdTooltipVisible(false)
                }
              >
                <Info
                  size={15}
                  className="ml-1 align-middle cursor-pointer button1"
                  onClick={toggleLiquidationThresholdTooltip}
                />

                {isLiquidationThresholdTooltipVisible && (
                  <div
                    ref={tooltipRef}
                    className="absolute w-[300px] bottom-full transform -translate-x-[75%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                  >
                    <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                      A liquidation threshold is the point at which a borrowed
                      position becomes too risky and will be liquidated.
                      <hr className="my-2 opacity-50" />
                      For example, if the threshold is 80%, the position will be
                      liquidated when the debt reaches 80% of the collateral's
                      value.
                    </span>
                  </div>
                )}
              </span>
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{liquidationThreshold}%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Liquidation Penalty
              <span
                className="relative inline-block ml-1"
                onMouseEnter={() => setLiquidationPenaltyTooltipVisible(true)}
                onMouseLeave={() => setLiquidationPenaltyTooltipVisible(false)}
              >
                <Info
                  size={15}
                  className="ml-1 align-middle cursor-pointer button1"
                  onClick={toggleLiquidationPenaltyTooltip}
                />

                {isLiquidationPenaltyTooltipVisible && (
                  <div
                    ref={tooltipRef}
                    className="absolute w-[300px] bottom-full transform -translate-x-[70%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                  >
                    <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                      Liquidation occurs when liquidators repay up to 50% of the
                      borrower's debt and, in return, purchase the collateral at
                      a discount, keeping difference (liquidation penalty) as a
                      bonus.
                    </span>
                  </div>
                )}
              </span>
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{liquidationBonus}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyInfo;
