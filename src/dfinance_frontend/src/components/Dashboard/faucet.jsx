import React, { useEffect, useState } from 'react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setIsWalletConnected, setWalletModalOpen } from '../../redux/reducers/utilityReducer';
import { Modal } from '@mui/material';
import { useAuth } from '../../utils/useAuthClient';
import FaucetDetails from './FaucetDetails';
import Element from '../../../public/Elements.svg';

const Faucet = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isWalletCreated, isWalletModalOpen } = useSelector((state) => state.utility);
    const { isAuthenticated, login } = useAuth();
    const [isTestnetMode, setIsTestnetMode] = useState(true); // Add state for testnet mode

    
  const handleTestnetModeToggle = () => {
    setIsTestnetMode((prevMode) => !prevMode);
  };
    useEffect(() => {
        if (isWalletCreated) {
            navigate('/dashboard/wallet-details');
        }
    }, [isWalletCreated, navigate]);

    const handleWalletConnect = () => {
        dispatch(setWalletModalOpen(!isWalletModalOpen));
    };

    const handleWallet = () => {
        dispatch(setWalletModalOpen(!isWalletModalOpen));
        dispatch(setIsWalletConnected(true));
        navigate('/Faucet/Faucet-details');
    };

    const loginHandler = async (val) => {
        await login(val);
    };

    return (
        <>
            {isTestnetMode && (
                <>
                    <h1 className="text-[#5B62FE] dark:text-darkText text-sm inline-flex items-center md:ms-14">
                        <img
                            src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"
                            alt="Icp Logo"
                            className="mx-2 w-6 h-6"
                        />
                        ICP Market
                    </h1>
                    <div className="w-full md2:w-8/12 dxl:w-10/12 -mt-4  md:ms-10 p-6">
                        <p className="text-[#5B62FE] text-sm text-justify  dark:text-darkTextSecondary">
                        With testnet Faucet you can get free assets to test the Dfinance Protocol. Make sure to switch your wallet provider to the appropriate testnet network, select desired asset, and click ‘Faucet’ to get tokens transferred to your wallet. The assets on a testnet are not “real,” meaning they have no monetary value. Learn more
                        </p>
                    </div>
                    {isAuthenticated ? (
                        <FaucetDetails />
                    ) : (
                        <div className="relative w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
                            <div className="absolute right-0 top-0 h-full md:w-1/2 pointer-events-none sxs3:w-[65%] z-[-1]">
                                <img
                                    src={Element}
                                    alt="Elements"
                                    className="h-full w-full object-cover rounded-r-3xl opacity-70 filter drop-shadow-[0_0_0_#fffff] dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                                />
                            </div>
                            <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg dark:text-darkText">
                                Please, connect your wallet
                            </h1>
                            <p className="text-[#737373] my-2 font-medium text-center dark:text-darkTextSecondary">
                                Please connect your wallet to get free testnet assets
                            </p>

                            <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />

                            <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
                                <div className="w-[300px] absolute bg-gray-100 shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground">
                                    <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
                                    <div className='flex flex-col gap-2 mt-3 text-sm'>
                                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkGradientEnd dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("ii")}>
                                            Internet Identity
                                            <div className='w-8 h-8'>
                                                <img src={"https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                            </div>
                                        </div>
                                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkGradientEnd dark:hover:bg-[#8782d8] dark:text-darkText">
                                            Plug
                                            <div className='w-8 h-8'>
                                                <img src={"/plug.png.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                            </div>
                                        </div>
                                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkGradientEnd dark:hover:bg-[#8782d8] dark:text-darkText">
                                            Bifinity
                                            <div className='w-8 h-8'>
                                                <img src={"/bifinity.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                            </div>
                                        </div>
                                        <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkGradientEnd dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("nfid")}>
                                            NFID
                                            <div className='w-8 h-8'>
                                                <img src={"/nfid.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                            </div>
                                        </div>
                                    </div>
                                    <p className='w-full text-xs my-3 text-gray-600 dark:text-red-400'>Track wallet balance in read-only mode</p>

                                    <div className="w-full">
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-[#8CC0D7] focus:outline-none focus:border-blue-500 placeholder:text-[#8CC0D7] text-xs rounded-md dark:bg-transparent"
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
                    )}
                </>
            )}
        </>
    );
};

export default Faucet;
