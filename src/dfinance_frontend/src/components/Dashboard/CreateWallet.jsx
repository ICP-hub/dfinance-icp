import React, { useEffect, useState } from 'react'
import Button from '../Button'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    setIsWalletConnected,
    setWalletModalOpen,
    setWalletDetails
} from '../../redux/reducers/walletsReducer'
import { Modal } from '@mui/material'
import { useAuth } from "../../utils/useAuthClient"
import Element from "../../../public/Elements.svg"
import MySupply from './MySupply'
import icplogo from '../../../public/icp.png'
import plug from "../../../public/plug.png"
import bifinity from "../../../public/bifinity.png"
import nfid from "../../../public/nfid.png"
import { idlFactory as TokenIdl } from "../../../../declarations/ckbtc_ledger/index";
import { idlFactory } from '../../../../declarations/ckbtc_ledger';
import { Artemis } from 'artemis-web3-adapter';
import { artemis } from '../../integration/ArtemisAutoConnect'
import { WalletModal } from '../WalletModal'

const connectObj = { whitelist: ['ryjl3-tyaaa-aaaaa-aaaba-cai'], host: 'https://icp0.io/' }
// const conObj = { canisterId: "huw6a-6uaaa-aaaaa-qaaua-cai", interfaceFactory: TokenIdl }
// const artemisWalletAdapter = new Artemis(connectObj);



const CreateWallet = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { isWalletModalOpen, walletDetails, isWalletConnected } = useSelector(state => state.wallets)
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const walletProviders = useSelector(state => state.wallets.walletDetails.wallets);

    const {
        isAuthenticated,
        login,
    } = useAuth();

    const handleWalletConnect = () => {
        dispatch(setWalletModalOpen(!isWalletModalOpen))
    }

    const handleWallet = () => {
        dispatch(setWalletModalOpen(false))
        dispatch(setIsWalletConnected(true))
        navigate('/dashboard')
    }

    useEffect(() => {
        if (isWalletConnected) {
            navigate('/dashboard')
        }
    }, [isWalletConnected]);

    const loginHandler = async (provider) => {
        dispatch(setWalletDetails({ provider }));
        login(provider.id)
            .then(() => {
                console.log('Login successful');
            })
            .catch((error) => {
                console.error('Login failed', error);
            });
    };

    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    async function WalletConnect(id, name) {
        const status = await artemis.connect(id, connectObj)
        const ledgerActor = await artemis.getCanisterActor(process.env.CANISTER_ID_CKBTC_LEDGER, idlFactory)
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
            }
            console.log(walletDetails)
            dispatch(setWalletDetails(walletDetails))
            dispatch(setIsWalletConnected(true))
        } else {
            console.log("login issue");
        }
    }

    const handleDisconnect = async () => {
        const disconnect = await artemis.disconnect()
        console.log("Disconnect", disconnect)
        location.reload()
    }

    return (
        <>
            {isWalletConnected ? <MySupply /> : <div className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
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
                <WalletModal />
            </div>}

        </>
    )
}

export default CreateWallet