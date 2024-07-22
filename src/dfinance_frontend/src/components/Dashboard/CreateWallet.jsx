import React, { useEffect, useState } from 'react'
import Button from '../Button'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    setIsWalletConnected,
    setWalletModalOpen
} from '../../redux/reducers/utilityReducer'

import { Modal } from '@mui/material'
import { useAuth } from "../../utils/useAuthClient"
import Element from "../../../public/Elements.svg"
import MySupply from './MySupply'
import icplogo from '../../../public/icp.png'
import plug from "../../../public/plug.png"
import bifinity from "../../../public/bifinity.png"
import nfid from "../../../public/nfid.png"

const CreateWallet = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility)
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
        <>
            {isAuthenticated ? <MySupply /> : <div className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
                <div className="absolute right-0 top-0 h-full w-full md:w-1/2 pointer-events-none">
                <img
                    src={Element}
                    alt="Elements"
                    className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                // Ensure image scales properly
                />
            </div>
                <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg dark:text-darkText">
                    Please, connect your wallet
                </h1>
                <p className="text-[#737373] my-2 font-medium text-center dark:text-darkTextSecondary">
                    Please connect your wallet to see your supplies, borrowings anf
                    open positions.
                </p>

                <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />

                <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
                    <div className='w-[300px] absolute bg-gray-100  shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
                        <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
                        <div className='flex flex-col gap-2 mt-3 text-sm'>
                            <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("ii")}>
                                Internet Identity
                                <div className='w-8 h-8'>
                                    <img src={icplogo} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                </div>
                            </div>
                            <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText">
                                Plug
                                <div className='w-8 h-8'>
                                    <img src={plug} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                </div>
                            </div>
                            <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText">
                                Bifinity
                                <div className='w-8 h-8'>
                                    <img src={bifinity} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                </div>
                            </div>
                            <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("nfid")}>
                                NFID
                                <div className='w-8 h-8'>
                                    <img src={nfid} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
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
                </Modal>
            </div>}

        </>
    )
}

export default CreateWallet