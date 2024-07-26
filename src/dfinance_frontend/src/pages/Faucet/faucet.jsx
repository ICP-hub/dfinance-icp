import React, { useEffect, useState } from 'react';
import Button from '../../components/Common/Button';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setIsWalletConnected, setWalletModalOpen } from '../../redux/reducers/utilityReducer';
import { Modal } from '@mui/material';
// import { useAuth } from '../../utils/useAuthClient';
import FaucetDetails from '../../components/Faucet/FaucetDetails';
import Element from '../../../public/element/Elements.svg';


import icplogo from '../../../public/wallet/icp.png'
import plug from "../../../public/wallet/plug.png"
import bifinity from "../../../public/wallet/bifinity.png"
import nfid from "../../../public/wallet/nfid.png"
import { WalletModal } from '../../components/WalletModal';


const Faucet = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // const { isWalletCreated, isWalletModalOpen } = useSelector((state) => state.utility);
    const { isWalletModalOpen, walletDetails, isWalletConnected } = useSelector(state => state.wallets)
    // const { isAuthenticated, login } = useAuth();
    const [isTestnetMode, setIsTestnetMode] = useState(true); // Add state for testnet mode


    const handleTestnetModeToggle = () => {
        setIsTestnetMode((prevMode) => !prevMode);
    };

    const handleWalletConnect = () => {
        dispatch(setWalletModalOpen(!isWalletModalOpen))
        // dispatch(setIsWalletCreated(true))
    }

    const handleWallet = () => {
        dispatch(setWalletModalOpen(!isWalletModalOpen))
        dispatch(setIsWalletConnected(true))
        navigate('/dashboard')
    }

    // useEffect(() => {
    //     if (isWalletCreated) {
    //         navigate('/dashboard/faucet-details')
    //     }
    // }, [isWalletCreated]);



    // const loginHandler = async (val) => {
    //     await login(val);
    // };

    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    return (
        <>
            {isTestnetMode && (
                <>
                    <h1 className="text-[#2A1F9D] text-xl inline-flex items-center mb-8 dark:text-darkText ml-1">
                        <img src={icplogo} alt="Icp Logo" className="mx-2 w-9 h-9 mr-3 border-2 border-[#2A1F9D] rounded-[50%]" />
                        ICP Market
                    </h1>
                    <div className="w-full -mt-4 p-6 ml-3">
                        <p className="text-[#707086] text-sm text-justify  dark:text-darkTextSecondary">
                            With testnet Faucet you can get free assets to test the Dfinance Protocol. Make sure to switch your wallet provider to the appropriate testnet network, select desired asset, and click ‘Faucet’ to get tokens transferred to your wallet. The assets on a testnet are not “real,” meaning they have no monetary value. <a href='#' className='underline italic'>Learn more</a>
                        </p>
                    </div>
                    {isWalletConnected ? (
                        <FaucetDetails />
                    ) : (
                        <div className="relative w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
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
                                Please connect your wallet to get free testnet assets
                            </p>

                            <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />

                            {!isWalletConnected && (
                                <WalletModal />
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default Faucet;
