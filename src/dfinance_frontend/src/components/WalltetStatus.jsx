import React from 'react';
import { useAuth } from "../utils/useAuthClient"; // Adjust the import path as necessary

const WalletStatus = () => {
    const { isAuthenticated, walletConnected, walletInfo } = useAuth();

    return (
        <div>
            <h1>Authentication Status</h1>
            <p>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</p>
            <h1>Wallet Status</h1>
            <p>{walletConnected ? "Wallet Connected" : "Wallet Not Connected"}</p>
            {walletConnected && (
                <div>
                    <h2>Wallet Information</h2>
                    <pre>{JSON.stringify(walletInfo, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default WalletStatus;
