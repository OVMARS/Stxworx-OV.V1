import { useWallet } from './WalletProvider';
import { Wallet } from 'lucide-react';

export function WalletConnectButton() {
    const { isSignedIn, userAddress, connect, disconnect } = useWallet();

    if (isSignedIn && userAddress) {
        return (
            <div className="flex items-center gap-2">
                <div className="hidden md:block text-sm font-medium text-slate-400">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </div>
                <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-700 transition-colors border border-slate-700"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={connect}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/20"
        >
            <Wallet className="w-4 h-4" />
            Connect Wallet
        </button>
    );
}
