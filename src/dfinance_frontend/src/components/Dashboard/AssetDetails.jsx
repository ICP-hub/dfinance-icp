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
import { Modal } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  setIsWalletConnected,
  setWalletModalOpen
} from '../../redux/reducers/utilityReducer'
import { WalletMinimal } from 'lucide-react';
import { Info } from 'lucide-react';


const AssetDetails = () => {
  const [isFilter, setIsFilter] = React.useState(false)
  const { id } = useParams();
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


  const navigate = useNavigate()

  const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility)



  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    // dispatch(setIsWalletCreated(true))
  }

  const handleWallet = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    dispatch(setIsWalletConnected(true))
    navigate('/dashboard/my-supply')
  }

  useEffect(() => {
    if (isWalletCreated) {
      navigate('/dashboard/wallet-details')
    }
  }, [isWalletCreated]);



  const loginHandler = async (val) => {
    await login(val);
    // navigate("/");

    // await existingUserHandler();
  };

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="w-full flex flex-col lg1:flex-row mt-16 my-6 gap-6 mb-[5rem]">
      <div className="w-full lg1:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
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
      {!isAuthenticated && <div className="w-full lg:w-3/12">
        <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
          <h1 className="font-semibold">Total Supplied</h1>
          <p className="text-gray-300 text-[12px] my-1">
            Please connect a wallet to view your personal information here.
          </p>
          <div className="w-full mt-4">
            <Button title={"Connect Wallet"} onClickHandler={handleWalletConnect} className={"my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"} />
          </div>
        </div>
      </div>}


      {isAuthenticated && <div className="w-full lg1:w-3/12">
        <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
          <h1 className="font-semibold mb-5">Your Info</h1>
          <div className="flex">
            <div className="bg-[#59588D] flex items-center px-3 rounded-xl mr-3"> <WalletMinimal /></div>
            <div>  <p className="text-gray-300 text-[12px] my-1">
              Wallet Balance
            </p>
              <h1 className="font-semibold">0 ckETH</h1></div>
          </div>

          <div>

            <div className="border mt-6 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <p className=" text-[12px] my-1 text-darkTextSecondary1">
                  Assets to Supply
                </p>
                <span><Info size={13} color="lightblue" /></span>
              </div>
              <div className="flex">
                <div>
                  <h1 className="font-semibold">0 ckETH</h1>
                  <p className="text-light text-[10px] text-gray-400">0$</p>
                </div>
                <div className="ml-auto">
                  <Button title={"Supply"} className={"my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-2 px-8 shadow-lg font-semibold text-sm'"} />
                </div>
              </div>


              <div className="flex items-center gap-2">
                <p className=" text-[12px] my-1 text-darkTextSecondary1">
                  Assets to Supply
                </p>
                <span><Info size={13} color="lightblue" /></span>
              </div>
              <div className="flex">
                <div>
                  <h1 className="font-semibold">0 ckETH</h1>
                  <p className="text-light text-[10px] text-gray-400">0$</p>
                </div>
                <div className="ml-auto">
                  <Button title={"Supply"} className={"my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-2 px-8 shadow-lg font-semibold text-sm'"} />
                </div>
              </div>


            </div>

            <div className="bg-[#59588D] mt-5 rounded-lg px-2 py-1">
              <p className=" text-[10px] my-1">
                Your Ethereum wallet is empty. Purchase or transfer assets.
              </p>
            </div>



          </div>

        </div>
      </div>}


      {!isAuthenticated &&
        <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
          <div className='w-[300px] absolute bg-gray-100  shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
            <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
            <div className='flex flex-col gap-2 mt-3 text-sm'>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("ii")}>
                Internet Identity
                <div className='w-8 h-8'>
                  <img src={"https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                Plug
                <div className='w-8 h-8'>
                  <img src={"/plug.png.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                Bifinity
                <div className='w-8 h-8'>
                  <img src={"/bifinity.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText" onClick={() => loginHandler("nfid")}>
                NFID
                <div className='w-8 h-8'>
                  <img src={"/nfid.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
            </div>
            <p className='w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>Track wallet balance in read-only mode</p>

            <div className="w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full p-2 border border-[#233D63] focus:outline-none focus:border-blue-500 placeholder:text-[#233D63] dark:border-darkTextSecondary1 dark:placeholder:text-darkTextSecondary1 text-gray-600 dark:text-darkTextSecondary1 text-xs rounded-md dark:bg-transparent"
                placeholder="Enter ethereum address or username"
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
        </Modal>}

    </div>
  )
}

export default AssetDetails
