// WalletModal.jsx
import React, { useState } from 'react';
import { Modal } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setWalletModalOpen, setWalletDetails, setIsWalletConnected } from '../redux/reducers/walletsReducer';
import { idlFactory } from '../../../declarations/ckbtc_ledger';
import { artemis } from '../integration/ArtemisAutoConnect';
import Button from '../components/Common/Button'

const connectObj = { whitelist: ['ryjl3-tyaaa-aaaaa-aaaba-cai'], host: 'https://icp0.io/' }

export const WalletModal = () => {
    const dispatch = useDispatch();
    const isWalletModalOpen = useSelector(state => state.wallets.isWalletModalOpen);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWalletConnect = () => {
        dispatch(setWalletModalOpen(false));
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleWallet = () => {
        dispatch(setWalletModalOpen(false));
        dispatch(setIsWalletConnected(true));
        // handle navigation here if needed
    };

    async function WalletConnect(id, name) {
        const status = await artemis.connect(id, connectObj);
        const ledgerActor = await artemis.getCanisterActor(process.env.CANISTER_ID_CKBTC_LEDGER, idlFactory);
        if (status && artemis?.principalId && artemis?.provider) {
            const walletDetails = {
                provider: artemis.provider,
                ledgerActor: ledgerActor,
                principalId: artemis.principalId,
                accountId: artemis.accountId,
                walletActive: artemis.walletActive,
                balance: artemis.balance,
                wallets: artemis.wallets,
                canisterActors: artemis.canisterActors,
                getWalletBalance: artemis.getWalletBalance()
            };
            console.log(walletDetails);
            dispatch(setWalletDetails(walletDetails));
            dispatch(setIsWalletConnected(true));
        } else {
            console.log("login issue");
        }
    }

    const handleDisconnect = async () => {
        const disconnect = await artemis.disconnect();
        console.log("Disconnect", disconnect);
        location.reload();
    };

    return (

        <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
            <div className='w-[300px] absolute bg-gray-100  shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
                <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
                <div className='flex flex-col gap-2 mt-3 text-sm'>

                    {artemis?.wallets.map((item, index) => (
                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
                            key={index}
                            onClick={() => WalletConnect(item?.id, item?.name)}
                        >
                            {item.name}
                            <div className='w-9 h-9'>
                                <img src={item?.icon} alt="connect_wallet_icon" className='object-fill min-w-9 h-9 bg-white  rounded-lg p-1' />
                            </div>
                        </div>))}

                    {/* <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => { artemis.connect("dfinity") }}>
                    Internet Identity
                    <div className='w-8 h-8'>
                        <img src={icplogo} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                    </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => { artemis.connect("plug") }}>
                    Plug
                    <div className='w-8 h-8'>
                        <img src={plug} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                    </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => { artemis.connect("bitfinity") }}>
                    Bifinity
                    <div className='w-8 h-8'>
                        <img src={bifinity} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                    </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => { artemis.connect("nfid") }}>
                    NFID
                    <div className='w-8 h-8'>
                        <img src={nfid} alt="connect_wallet_icon" className='object-fill w-8 h-8 rounded-[50%]' />
                    </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => { artemis.connect("metamask") }}>
                    Metamask
                    <div className='w-8 h-8'>
                        <img src="https://raw.githubusercontent.com/sonicdex/artemis/main/assets/metamask.svg" alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                    </div>
                </div> */}
                </div>
                <p className='w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>Track wallet balance in read-only mode</p>
                {/* <Button
                    title="Disconnect"
                    className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 px-20 shadow-lg font-semibold text-sm"
                    onClickHandler={handleDisconnect}
                /> */}
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
    )

}