import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Element from "../../public/element/Elements.svg";
import { useDispatch, useSelector } from 'react-redux'
import { Modal } from '@mui/material'
import Astro from "../../public/Error/astro.png";
import Globe from "../../public/Error/globe.png";
import { setIsWalletConnected, setWalletModalOpen, setConnectedWallet} from '../redux/reducers/utilityReducer'
import { useAuth } from "../utils/useAuthClient"

import icplogo from '../../public/wallet/icp.png'
import plug from "../../public/wallet/plug.png"
import bifinity from "../../public/wallet/bifinity.png"
import nfid from "../../public/wallet/nfid.png"
import { setUserData } from '../redux/reducers/userReducer';

const Error = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { isWalletCreated, isWalletModalOpen, isSwitchingWallet, connectedWallet } = useSelector(state => state.utility)

    const {
        isAuthenticated,
        login,
        logout,
        principal,
        createLedgerActor,
    } = useAuth()

    const handleWalletConnect = () => {
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

    const handleTakeMeBack = () => {
        navigate('/');
    };

    useEffect(() => {
        if (isWalletCreated) {
            navigate('/dashboard/wallet-details')
        }
    }, [isWalletCreated]);

    return (
        <div className="relative w-full md:w-9/12 mx-auto my-6 min-h-[380px] md:min-h-[530px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd select-none">
            <div className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none">
                <img
                    src={Element}
                    alt="Elements"
                    className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"

                />
            </div>
            <div className="text-center flex flex-col items-center relative mt-20 md:-mt-20">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-2">
                    <div className="text-[140px] sm:text-[100px] md:text-[250px] font-light text-white dark:text-darkText -rotate-12" style={{ fontFamily: 'Vampiro One' }}>4</div>
                    <div className="flex flex-col items-center relative">
                        <img
                            src={Astro}
                            alt="Astronaut"
                            className="w-24 h-24 sm:w-24 sm:h-24 md:w-40 md:h-40 subtle-bounce relative z-40 lg:top-[-5px] left-[14px]" 
                            style={{ marginTop: '-80px', marginLeft: '5px' }}
                        />
                        <img
                            src={Globe}
                            alt="Globe"
                            className="w-24 h-24 sm:w-20 sm:h-20 md:w-40 md:h-40 absolute bottom-0 left-0 z-0"
                            style={{ marginBottom: '-50px' }} 
                        />
                    </div>
                    <div className="text-[140px] sm:text-[100px] md:text-[250px] font-light text-white dark:text-darkText -rotate-12" style={{ fontFamily: 'Vampiro One' }}>4</div>
                </div>

                <p className="text-lg sm:text-xl mb-2 text-[#2A1F9D] font-bold dark:text-darkText -mt-8 md:-mt-12">Uh-oh! Lost in Space</p>
                <p className="text-base sm:text-lg mb-6 text-[#2A1F9D] text-opacity-75 dark:text-darkText md:mb-8">The page you are trying to reach does not exist.</p>

                <button
                    className="px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-md bg-gradient-to-r from-[#EB8863] to-[#81198E] hover:from-[#EB6B63] hover:to-[#7B0F7E] transition-colors duration-300 ease-in-out"
                    onClick={handleTakeMeBack}
                >
                    Take me Back!
                </button>
            </div>

            {(isSwitchingWallet || !isAuthenticated) && (
                <Modal open={isWalletModalOpen} onClose={handleWalletConnect} >
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
    );
}

export default Error;