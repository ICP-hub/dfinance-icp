import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import React, { useState } from "react"
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../utils/constants"
import { NavLink } from "react-router-dom"
import { ArrowDownUp, Check, ChevronDown, ChevronUp, Menu } from "lucide-react"
import MobileTopNav from "./Home/MobileTopNav"
import { useAuth } from "../utils/useAuthClient"
import { useEffect } from "react"
import { setUserData } from "../redux/reducers/userReducer"
import { useSelector } from "react-redux"
import Button from "./Button"
import { ClickAwayListener } from "@mui/base/ClickAwayListener"
import { setIsWalletConnected, setWalletModalOpen } from "../redux/reducers/utilityReducer"
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import SwitchWallet from "./SwitchWallet"
export default function Navbar({ isHomeNav }) {
  const [isMobileNav, setIsMobileNav] = React.useState(false)
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.user)
  const { isWalletModalOpen, isWalletConnected } = useSelector((state) => state.utility)
  const [drop, setDrop] = useState(false)
  const [switchTokenDrop, setSwitchTokenDrop] = useState(false)
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false)
  const navigate = useNavigate()

  const {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
  } = useAuth()

  const handleCreateInternetIdentity = () => {
    console.log("Hello")
    login()
  }

  const handleLogout = () => {
    dispatch(setUserData(null))
    logout()
  }

  const handleSwitchToken = () => {
    if (isWalletConnected) {
      setSwitchTokenDrop(!switchTokenDrop)
      setSwitchWalletDrop(false)
      console.log("Hello")
    } else {
      dispatch(setWalletModalOpen(!isWalletModalOpen))
    }
  }
  const handleSwitchWallet = () => {
    setSwitchWalletDrop(!switchWalletDrop)
    setSwitchTokenDrop(false)
    console.log("Hello")
  }

  const handleClickAway = () => {
    setDrop(false)
    setSwitchTokenDrop(false)
    setSwitchWalletDrop(false)
  }
  const handleCopyAddress = () => {
    // Logic to handle copy address functionality
    console.log("Copy Address clicked");
  };
  const handleViewOnExplorerClick = () => {
    // Logic to navigate to explorer
    console.log("View on Explorer clicked");
  };
  const handleLaunchApp = () => {
    navigate("/dashboard/main");
  };
  useEffect(() => {
    if (isAuthenticated === true) {
      dispatch(
        setUserData({
          name: generateRandomUsername(),
          isAuth: isAuthenticated,
          principal,
          imageUrl:
            "https://res.cloudinary.com/dzfc0ty7q/image/upload/v1714272826/avatars/Web3_Avatar-36_xouxfd.svg",
        })
      )
    } else {
      dispatch(setUserData(null))
      navigate("/")
    }
  }, [isAuthenticated])

  useEffect(() => {
    console.log(switchTokenDrop)
  }, [switchTokenDrop])

  const hash = window.location.hash


  useEffect(() => {
    if (hash) {

      const ele = document.querySelector(hash)
      console.log(ele)
      if (ele) {
        ele.scrollIntoView({ behavior: "smooth" })
      }
    }
    console.log(hash);
  }, [hash])
  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div className="w-full">
          <nav className="w-full py-4 lg:py-10 flex items-center justify-between">
            <img
              src="/DFinance-Light.svg"
              alt="DFinance"
              className="w-[100px] md:w-[150px] lg:w-auto"
            />

            <div className="gap-4 hidden lg:flex">
              {!isHomeNav
                ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
                  <NavLink
                    key={index}
                    to={link.route}
                    className={`text-[#2a1f9d] px-3 py-2 text-lg`}
                  >
                    {link.title}
                  </NavLink>
                ))
                : HOME_TOP_NAV_LINK.map((link, index) => (
                  <NavLink
                    key={index}
                    to={link.route}
                    className={`text-[#233D63] px-3`}
                  >
                    {link.title}
                  </NavLink>
                ))}
            </div>

            {isHomeNav && (
        <Button
          title={"Launch App"}
          onClickHandler={handleLaunchApp}
        />
      )}

            {isAuthenticated && !isHomeNav && (
              <div className="hidden lg:flex gap-6">
                <div className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-3 p-2 px-3"
                    onClick={handleSwitchToken}
                  >
                    <span>Switch Token</span>
                    <ArrowDownUp />
                  </div>

                  {switchTokenDrop && (
                  <SwitchWallet/>
                  )}
                </div>
                <div className="flex items-center gap-3 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-3 p-2 px-3"
                    onClick={handleSwitchWallet}
                  >
                    <img
                      src={"/connect_wallet_icon.png"}
                      alt="connect_wallet_icon"
                      className="object-contain w-5 h-5"
                    />
                    <span>0x65.125s</span>
                  </div>

                  {switchWalletDrop && (
                    <div className="absolute p-4 top-full right-0 mt-4 rounded-lg bg-gray-100  shadow-xl border mb-4  z-10" >
                      <div className="w-full flex items-center gap-3 mt-2">
                        <img
                          src="/connect_wallet_icon.png"
                          alt="connect_wallet_icon"
                          className="w-10 h-10"
                        />
                        <h1 className="font-semibold text-2xl text-blue-800">0x65.125ssdf</h1>
                      </div>

                      <div className="w-full flex justify-center mt-3 gap-3">
                        <Button
                          title="Switch Wallet"
                          className="my-2 whitespace-nowrap bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                        onClickHandler={handleSwitchToken}
                        />
                        <Button
                          title="Disconnect"
                          className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                        />
                      </div>

                      <div className="flex mt-3 gap-3 ">
                        {/* First Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative" style={{ height: '70px', width: '160px' }}>
                            <span className="absolute top-1/4 transform -translate-y-1/2 text-blue-800" style={{ right: '55%' }}>Network</span>
                            <div className="absolute bottom-2 left-2 mt-4 flex items-center">
                              <img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="w-6 h-6" />
                              <span className="ml-2 text-base text-blue-800">ICP</span>
                            </div>
                          </div>

                        </div>



                        {/* Second Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative" style={{ height: '70px', width: '160px' }}>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center -ml-2">
                              <GrCopy className="h-5 w-4" />
                              <span className="ml-1">Copy Address</span>
                            </button>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center mt-2">
                              <CiShare1 className="h-5 w-4" />
                              <span className="ml-1 text-nowrap">View On Explorer</span>
                            </button>
                          </div>
                        </div>
                      </div>


                    </div>
                  )}


                </div>
              </div>
            )}

            {/* Mobile/Tablet Menu */}
            <button
              type="button"
              className="text-[#2A1F9D] cursor-pointer block lg:hidden"
              onClick={() => {
                setIsMobileNav(true)
                console.log("Hello")
              }}
            >
              <Menu />
            </button>
          </nav>
          <div className="w-full p-3 bg-slate-200 rounded-md flex lg:hidden">

            <div className="w-full flex gap-6">
              <div className="w-full my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-xs cursor-pointer relative">
                <div
                  className="flex items-center gap-3 p-2 px-3"
                  onClick={handleSwitchToken}
                >
                  <span>Switch Token</span>
                  <ArrowDownUp size={14} />
                </div>

                {switchTokenDrop && (
                  <div className="w-[250px] absolute left-0 mt-3 rounded-md bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl border p-4 z-50">
                    <h1 className="font-semibold">Switch Tokens</h1>

                    <div className="w-full my-2">
                      <input
                        type="text"
                        className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                      />
                    </div>
                    <div className="w-full my-2">
                      <input
                        type="text"
                        className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                      />
                    </div>
                    <div className="w-full flex justify-center mt-3">
                      <Button
                        title="Switch"
                        className={
                          "my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full flex items-center gap-3 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-xs cursor-pointer relative">
                <div
                  className="flex items-center gap-3 p-2 px-3"
                  onClick={handleSwitchWallet}
                >
                  <img
                    src={"/connect_wallet_icon.png"}
                    alt="connect_wallet_icon"
                    className="object-contain w-4 h-4"
                  />
                  <span>0x65.125s</span>
                </div>

                {switchWalletDrop && (
                  <div className="absolute w-[250px] z-50 p-4 top-full right-0 mt-3 rounded-md bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl border">
                    <div className="w-full flex items-center gap-3">
                      <img
                        src="/connect_wallet_icon.png"
                        alt="connect_wallet_icon"
                        className="w-8 h-8"
                      />
                      <h1 className="font-semibold text-xl">0x65.125ssdf</h1>
                    </div>

                    <div className="w-full flex justify-center mt-3 gap-3">
                      <Button
                        title="Switch Wallet"
                        className={
                          "my-2 whitespace-nowrap bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 shadow-lg font-semibold text-xs"
                        }
                      />
                      <Button
                        title="Disconnect"
                        className={
                          "my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 shadow-lg font-semibold text-xs"
                        }
                      />
                    </div>
                    <div className="w-full flex justify-center mt-3 gap-3">
                      <div className="flex-1 bg-gray-400 p-4 rounded-md text-xs">

                      </div>
                      <div className="flex-1 bg-gray-400 p-4 rounded-md text-xs">

                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </ClickAwayListener>

      <MobileTopNav
        isMobileNav={isMobileNav}
        setIsMobileNav={setIsMobileNav}
        isHomeNav={isHomeNav}
        handleCreateInternetIdentity={handleCreateInternetIdentity}
        handleLogout={handleLogout}
      />
    </>
  )
}
