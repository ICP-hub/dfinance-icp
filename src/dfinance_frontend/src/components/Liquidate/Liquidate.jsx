import React, { useEffect, useState } from 'react'
import Button from '../Common/Button'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Modal } from '@mui/material'
import { useAuth } from "../../utils/useAuthClient"
import Element from "../../../public/element/Elements.svg"
import icplogo from '../../../public/wallet/icp.png'
import plug from "../../../public/wallet/plug.png"
import bifinity from "../../../public/wallet/bifinity.png"
import nfid from "../../../public/wallet/nfid.png"
import { ChevronLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import DebtStatus from "./DebtStatus"
import { setUserData } from '../../redux/reducers/userReducer'
import {
    setIsWalletConnected,
    setWalletModalOpen,
    setConnectedWallet
} from '../../redux/reducers/utilityReducer'

const Liquidate = () => {
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




    const [showDebtStatus, setShowDebtStatus] = useState(false);
    const [showWarning, setShowWarning] = useState(false); // Warning state



    useEffect(() => {
        if (isWalletCreated) {
            navigate('/dashboard/wallet-details')
        }

        // Hide the warning if the user becomes authenticated
        if (isAuthenticated) {
            setShowWarning(false);
        }
    }, [isWalletCreated, isAuthenticated]);





    const { pathname } = useLocation();
    const dashboardTitle = pathname.includes("/market") ? "Market" : "Dashboard";
    const theme = useSelector((state) => state.theme.theme);
    const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

    const handleLiquidateClick = () => {
        if (!isAuthenticated) {
            setShowWarning(true); // Show warning if not authenticated
        } else {
            setShowDebtStatus(true); // Show DebtStatus component if authenticated
        }
    }

    const handleBackClick = () => {
        setShowDebtStatus(false);
    }

    return (
        <>
            <div className="full">
                <div className="flex h-[60px] gap-5 -ml-3">
                    <div className="lg1:-mt-0 mt-[20px] cursor-pointer" onClick={() => navigate(-1)}>
                        <ChevronLeft size={30} color={chevronColor} />
                    </div>
                    <h1 className="text-[#2A1F9D] text-xl font-bold inline-flex items-center lg1:mt-0 mt-10 mb-8 dark:text-darkText ml-1">
                        Liquidation
                    </h1>
                </div>

                {!showDebtStatus ? (
                    <div className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
                        <div className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none">
                            <img
                                src={Element}
                                alt="Elements"
                                className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                            />
                        </div>
                        <h1 className="text-[#2A1F9D] font-bold my-2 text-xl dark:text-darkText mb-3">
                            Check Users in Debt
                        </h1>

                        {/* Display the warning if not authenticated */}
                        {showWarning && (
                            <div className="text-red-500 font-bold mb-4">
                                Please connect your wallet to check the debt status.
                            </div>
                        )}

                        <Button title="Get Debt Status" onClickHandler={handleLiquidateClick} />
                    </div>
                ) : (
                    <DebtStatus onBackClick={handleBackClick} />
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
            </div>
        </>
    )
}

export default Liquidate;
