import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react';
import { idlFactory } from '../../../declarations/ckbtc_ledger';
import {
    setIsWalletConnected,
    setWalletModalOpen,
    setWalletDetails
} from '../redux/reducers/walletsReducer';
import { Artemis } from 'artemis-web3-adapter';

const connectObj = { whitelist: ['ryjl3-tyaaa-aaaaa-aaaba-cai'], host: 'https://icp0.io/' }
export const artemis = new Artemis();

export default function ArtemisAutoConnect() {
    const dispatch = useDispatch()
    const { isWalletCreated, isWalletModalOpen, walletDetails, isWalletConnected } = useSelector(state => state.wallets)

    useEffect(() => {
        const initlog = async () => {
            try {
                const status = await artemis.autoConnect(connectObj)
                console.log('------------------------------------------')
                if (status && artemis?.principalId && artemis?.provider) {
                    console.log("Artemis provider:", artemis.provider)

                    if (typeof artemis.provider.createActor !== 'function') {
                        console.error("createActor method is not available on the provider")
                        return
                    }

                    const ledgerActor = await artemis.getCanisterActor(process.env.CANISTER_ID_CKBTC_LEDGER, idlFactory)

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
                    dispatch(setWalletDetails(walletDetails))
                    dispatch(setIsWalletConnected(true));

                    console.log("Ledger actor", ledgerActor)
                    console.log("principleId", artemis.principalId)
                    console.log("accountId: ", artemis.accountId)
                    console.log("walletActive:", artemis.walletActive)
                    console.log("balance:", artemis.balance)
                    console.log("wallets:", artemis.wallets)
                    console.log("canisterActors:", artemis.canisterActors)
                    console.log("getWalletBalance:", artemis.getWalletBalance())
                    console.log('------------------------------------------')
                } else {
                    console.log("Issue while login")
                }
            } catch (error) {
                console.error("Error during wallet initialization", error)
            }
        }
        initlog()
    }, [])

    return (
        <div>
            Artemis
        </div>
    )
}