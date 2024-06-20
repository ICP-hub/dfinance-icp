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

    return (
        <div className="w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6">
            <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg">
                Please, connect your wallet
            </h1>
            <p className="text-[#737373] my-2 font-medium text-center">
                Please connect your wallet to see your supplies, borrowings anf
                open positions.
            </p>

            <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />

            <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
                <div className='w-[300px] absolute bg-gray-100  shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white'>
                    <h1 className='font-bold text-blue-900'>Connect a wallet</h1>
                    <div className='flex flex-col gap-2 mt-3 text-sm'>
                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#8782d8] cursor-pointer p-2 rounded-md text-blue-900" onClick={()=>loginHandler("ii")}>
                            Internet Identity
                            <div className='w-8 h-8'>
                                <img src={"https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                            </div>
                        </div>
                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#8782d8] cursor-pointer p-2 rounded-md text-blue-900">
                            Plug
                            <div className='w-8 h-8'>
                                <img src={"/plug.png.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                            </div>
                        </div>
                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#8782d8] cursor-pointer p-2 rounded-md text-blue-900">
                            Bifinity
                            <div className='w-8 h-8'>
                                <img src={"/bifinity.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                            </div>
                        </div>
                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#8782d8] cursor-pointer p-2 rounded-md text-blue-900" onClick={()=>loginHandler("nfid")}>
                            NFID
                            <div className='w-8 h-8'>
                                <img src={"/nfid.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                            </div>
                        </div>
                    </div>
                    <p className='w-full  text-xs my-3 text-gray-600'>Track wallet balance in read-only mode</p>

                    <div className="w-full">
                        <input
                            type="text"
                            className="w-full p-2 border border-blue-500 focus:outline-none focus:border-blue-500 placeholder:text-blue-500 text-blue-500 text-xs rounded-md"
                            placeholder="Enter ethereum address or username"
                        />
                    </div>

                    <div className="w-full flex mt-3">
    <Button 
        title="Connect" 
        onClickHandler={handleWallet} 
        className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 px-20 shadow-lg font-semibold text-sm" 
    />
</div>

                </div>
            </Modal>
        </div>
    )
}

export default CreateWallet