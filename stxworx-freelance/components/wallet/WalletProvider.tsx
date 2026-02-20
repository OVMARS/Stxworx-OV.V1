import React, { createContext, useContext, useEffect, useState } from 'react';
import { userSession, authenticate } from '../../lib/stacks';

interface WalletContextType {
    userSession: typeof userSession;
    userData: any;
    userAddress: string | null;
    isSignedIn: boolean;
    connect: () => void;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<any>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            if (userSession.isSignInPending()) {
                console.log('Sign in pending...');
                try {
                    const userData = await userSession.handlePendingSignIn();
                    console.log('Sign in complete', userData);
                    setUserData(userData);
                    setUserAddress(userData.profile?.stxAddress?.testnet || userData.profile?.stxAddress?.mainnet);
                    setIsSignedIn(true);
                } catch (e) {
                    console.error('Error handling pending sign in:', e);
                }
            } else if (userSession.isUserSignedIn()) {
                console.log('User already signed in');
                try {
                    const data = userSession.loadUserData();
                    setUserData(data);
                    setUserAddress(data.profile?.stxAddress?.testnet || data.profile?.stxAddress?.mainnet);
                    setIsSignedIn(true);
                } catch (e) {
                    console.error('Error loading user data:', e);
                }
            } else {
                console.log('No user session found');
            }
        };
        checkSession();
    }, []);

    const connect = () => {
        authenticate((payload) => {
            console.log('Authentication finished', payload);
            if (userSession.isUserSignedIn()) {
                const data = userSession.loadUserData();
                setUserData(data);
                const address = data.profile?.stxAddress?.testnet || data.profile?.stxAddress?.mainnet;
                console.log('User signed in with address:', address);
                setUserAddress(address);
                setIsSignedIn(true);
            } else {
                console.error('User session not signed in after auth');
            }
        });
    };

    const disconnect = () => {
        userSession.signUserOut('');
        setIsSignedIn(false);
        setUserData(null);
        setUserAddress(null);
    };

    return (
        <WalletContext.Provider
            value={{
                userSession,
                userData,
                userAddress,
                isSignedIn,
                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
