import { useDispatch, useSelector } from "react-redux"
import React from "react"
import Button from "../Button"
import { useAuth } from "../../utils/useAuthClient"
import { SlidersHorizontal, SlidersVertical } from "lucide-react"
import { ASSET_DETAILS } from "../../utils/constants"
import { setAssetDetailFilter } from "../../redux/reducers/utilityReducer"
import SupplyInfo from "../../components/Dashboard/SupplyInfo"
import BorrowInfo from "./BorrowInfo"
import EModeInfo from "./EModeInfo"
import InterestRateModel from "./InterestRateModel"
import LineGraph from "./LineGraph"
import CircleProgess from "../CircleProgess"
import { useParams } from "react-router-dom"

const AssetDetails = () => {
  const [isFilter, setIsFilter] = React.useState(false)
  const {id} = useParams();
  console.log(id);

  // redux
  const dispatch = useDispatch()
  const { assetDetailFilter } = useSelector((state) => state.utility)

  const handleFilter = (value) => {
    setIsFilter(false)
    dispatch(setAssetDetailFilter(value))
  }

  const {
    isAuthenticated,
    login,
    logout,
    principal,
    reloadLogin,
    accountIdString,
  } = useAuth();

  const renderFilterComponent = () => {
    switch (assetDetailFilter) {
      case "Supply Info":
        return <SupplyInfo />
      case "Borrow Info":
        return <BorrowInfo />
      case "E-Mode info":
        return <EModeInfo />
      case "Interest rate model":
        return <InterestRateModel />
      default:
        return <SupplyInfo />
    }
  }
  return (
    <div className="w-full flex flex-col lg:flex-row mt-16 my-6 gap-6 mb-[5rem]">
      <div className="w-full lg:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
        <h1 className="text-[#2A1F9D] font-bold my-2 dark:text-darkText">
          Reserve status & configuration
        </h1>
        <div className="w-full mt-8 lg:flex">
          
            <div className="w-full mb-6 xl:hidden">
              <div className="flex items-center justify-between gap-3 cursor-pointer text-[#2A1F9D] relative sxs3:w-[40%] dark:text-darkText">
                <span className="font-medium dark:text-darkText">{assetDetailFilter}</span>
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
              <span className="font-medium text-[16px] dark:text-darkText">{assetDetailFilter}</span>
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
      <div className="w-full lg:w-3/12">
        <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
          {isAuthenticated ? <h1 className="font-semibold">Your Info</h1>:<h1 className="font-semibold">Total Supplied</h1>}
          {isAuthenticated ? <p className="text-gray-300 text-[12px] my-1">The Wallet has been connected!</p>:<p className="text-gray-300 text-[12px] my-1">
            Please connect a wallet to view your personal information here.
          </p>}
          {!isAuthenticated && <div className="w-full mt-4">
            <Button title={"Connect Wallet"} className={"my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"}/>
          </div>}
        </div>
      </div>
    </div>
  )
}

export default AssetDetails
