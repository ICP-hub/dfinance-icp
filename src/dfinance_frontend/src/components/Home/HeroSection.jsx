import React from "react";
import { useEffect, useState } from "react";
import useAssetData from "../customHooks/useAssets";

const HeroSection = () => {
  const { totalMarketSize, totalSupplySize, totalBorrowSize } = useAssetData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (totalSupplySize !== null && totalSupplySize !== undefined) {
      setLoading(false);
    }
  }, [totalSupplySize]);

  return (
    <div
      id="hero"
      className="flex justify-center text-2xl md:text-[32px] xl:text-[45px] font-medium lg:font-extralight text-[#2A1F9D] mt-8 dark:text-darkText"
    >
      <div className="w-fit xl:w-[700px] gap-2 flex flex-col items-center justify-center px-8">
        <h1 className="text-xl md:text-3xl xl:text-4xl">
          {}
          <span className="font-semibold bg-gradient-to-tr from-[#4659CF]/100 to-[#C562BD]/70 bg-clip-text text-transparent dark:text-darkText">
            Lend,&nbsp;
          </span>
          {}
          <span className="font-semibold bg-gradient-to-tr from-purple-500 to-pink-400 bg-clip-text text-transparent ">
            Borrow
          </span>
          <span className="font-semibold bg-gradient-to-tr from-[#4659CF]/100 to-[#C562BD]/70 bg-clip-text text-transparent dark:text-darkTextSecondary">
            , Earn
          </span>
        </h1>

        <p className="text-base mt-4 font-normal text-[#737373] text-center dark:text-darkTextSecondary leading-relaxed mx-auto max-w-xs sm:max-w-lg lg:max-w-4xl lg:leading-relaxed lg:text-lg lg:max-h-none overflow-visible">
          Revolutionizing DeFi on the Internet Computer Protocol
        </p>

        <div className="w-full mt-10 h-32 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl text-center dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd flex flex-col justify-center items-center px-4 lg:gap-3 gap-4">
          <h1 className="text-[#2A1F9D] font-bold  dark:text-darkText">
            {`$ ${totalSupplySize}`}
          </h1>
          <p className="text-sm font-normal text-[#585454] dark:text-darkText lg:-mb-1 md:-mb-0">
            Total supply side positions on the platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
