import { Artemis } from 'artemis-web3-adapter';

export const artemis = new Artemis();

export const useWallet = async () => {
    const connectObj = { whitelist: ['ryjl3-tyaaa-aaaaa-aaaba-cai'], host: 'https://icp0.io/' }
    const walletStatus = await artemis.autoConnect(connectObj);
    if (walletStatus && artemis?.principalId && artemis?.provider) {
        // dispatch(walletActions.setWalletLoaded({
        //     principleId: artemis.principalId,
        //     accountId: artemis.accountId,
        //     walletActive: artemis.walletActive
        // }));
    } else {
        // dispatch(walletActions.setOnwalletList(walletState.Idle));
    }
};