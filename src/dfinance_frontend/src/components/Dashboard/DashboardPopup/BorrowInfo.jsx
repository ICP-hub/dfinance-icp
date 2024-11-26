import React from "react";
import CircularProgress from "../../Common/CircularProgressbar";
import useFetchConversionRate from "../../customHooks/useFetchConversionRate";
import { useParams } from "react-router-dom";

const BorrowInfo = ({
  formatNumber,
  borrowCap,
  totalBorrowed,
  borrowRateAPR,
}) => {
  const borrowCapNumber = borrowCap ? Number(borrowCap) : 0;
  const totalBorrowPercentage =
    borrowCapNumber && totalBorrowed ? totalBorrowed / borrowCapNumber : 0;
  const { id } = useParams();

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
  } = useFetchConversionRate();

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
  const totalBorrowedAsset =
    assetRate && totalBorrowed ? Number(totalBorrowed) / assetRate : 0;
  const totalBorrowedCap =
    assetRate && borrowCap ? Number(borrowCap) / assetRate : 0;
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
              <span>{formatValue(totalBorrowedAsset)}</span> of{" "}
              <span>
                {borrowCap ? formatNumber(Number(totalBorrowedCap)) : "N/A"}
              </span>
            </p>
            <p className="text-[12px] -mt-3">
              {" "}
              <span>${formatNumber(Number(totalBorrowed))}</span> of{" "}
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
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowInfo;
