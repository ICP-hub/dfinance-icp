import React, { useEffect, useRef, useState } from "react";
import CircularProgress from "../../Common/CircularProgressbar";
import useFetchConversionRate from "../../customHooks/useFetchConversionRate";
import { useParams } from "react-router-dom";
import { Info } from "lucide-react";

/**
 * BorrowInfo component displays borrowing-related data such as total borrowed amount,
 * borrowing cap, APY rates, and reserve factor with a tooltip.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.formatNumber - Function to format numerical values.
 * @param {number} props.borrowCap - Maximum amount that can be borrowed.
 * @param {number} props.totalBorrowed - Total amount borrowed so far.
 * @param {number} props.borrowRateAPR - Borrowing interest rate in APR.
 * @param {number} props.reserveFactor - Reserve factor percentage.
 */

const BorrowInfo =({ formatNumber, borrowCap, totalBorrowed, borrowRateAPR,reserveFactor}) => {

  /* 
  ============================
  STATE MANAGEMENT
  ============================
  */
  const [isReserveFactorTooltipVis, setIsReserveFactorTooltipVis] = useState(false);
   

  // Calculate borrowing percentages
  const borrowCapNumber = borrowCap ? Number(borrowCap) : 0;
  const totalBorrowPercentage =
    borrowCapNumber && totalBorrowed ? totalBorrowed / borrowCapNumber : 0;

  // URL Parameter Extraction
  const { id } = useParams();
  const tooltipRef = useRef(null);

  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
  } = useFetchConversionRate();

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  // Helper function to get asset conversion rate
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

  // Calculate total borrowed asset and cap
  const assetRate = getAssetRate(id);

  const totalBorrowedAsset = assetRate && totalBorrowed ? Number(totalBorrowed) * assetRate : 0;
    

  const totalBorrowedCap = assetRate && borrowCap ? Number(borrowCap) / assetRate : 0;
   

  // Format numerical values
  const formatValue = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return "0";
    }
    if (numericValue === 0) {
      return "0";
    } else if (numericValue >= 1) {
      return numericValue.toFixed(2);
    } else {
      return numericValue.toFixed(7);
    }
  };

  const toggleReserveFactorTooltip = () =>
    setIsReserveFactorTooltipVis((prev) => !prev);

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

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col lg:flex-row items-start sxs3:flex-row sxs3:mb-7 lg:gap-0 md:gap-3">
        <div className="w-full lg:w-[20%] md:w-[10%] flex justify-center align-items-center lg:mt-0 md:mt-2 md:mx-4 lg:mx-0">
          <CircularProgress progessValue={totalBorrowPercentage.toFixed(2)} />
        </div>
        <div className="w-full lg:w-9/12 md:w-[55%] flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs  lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 md:justify-center lg:justify-start sxs3:gap-4">
          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Total Borrowed
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>
              {" "}
              <span>{formatValue(totalBorrowed)}</span> of{" "}
              <span>
                {borrowCap ? formatNumber(Number(totalBorrowedCap)) : "N/A"}
              </span>
            </p>
            <p className="text-[12px] -mt-3">
              {" "}
              <span>${formatNumber(Number(totalBorrowedAsset))}</span> of{" "}
              <span>
                $
                {borrowCap ? formatNumber(Number(borrowCap.toString())) : "N/A"}
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
              {borrowRateAPR < 0.1 ? "<0.01%" : `${borrowRateAPR.toFixed(2)}%`}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex flex-wrap gap-8 mt-4 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Reserve factor
              <span
                className="relative inline-block ml-1"
                onMouseEnter={() => setIsReserveFactorTooltipVis(true)}
                onMouseLeave={() => setIsReserveFactorTooltipVis(false)}
              >
                <Info
                  size={15}
                  className="ml-1 align-middle cursor-pointer button1"
                  onClick={toggleReserveFactorTooltip}
                />

                {isReserveFactorTooltipVis && (
                  <div
                    ref={tooltipRef}
                    className="absolute w-[300px] bottom-full transform -translate-x-[39%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                  >
                    <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                      The reserve factor is a specified percentage of the
                      interest generated, which is redirected to the Dfinance
                      protocol's treasury to support the growth of the
                      ecosystem.
                    </span>
                  </div>
                )}
              </span>
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{reserveFactor}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowInfo;
