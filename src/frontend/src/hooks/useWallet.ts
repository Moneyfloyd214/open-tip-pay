import { useCallback, useEffect, useState } from "react";

export interface WalletConnection {
  address: string;
  provider: "metamask" | "walletconnect";
}

export function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is available
  const isMetaMaskAvailable =
    typeof window !== "undefined" &&
    typeof (window as any).ethereum !== "undefined";

  const connectMetaMask = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskAvailable) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue.",
      );
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;

      // Request account access
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setIsConnecting(false);
        return address;
      }
      throw new Error("No accounts found");
    } catch (err: any) {
      console.error("MetaMask connection error:", err);

      if (err.code === 4001) {
        setError("Connection request was rejected");
      } else {
        setError(err.message || "Failed to connect to MetaMask");
      }

      setIsConnecting(false);
      return null;
    }
  }, [isMetaMaskAvailable]);

  const openWalletSend = useCallback(
    (recipientAddress: string, amount?: string) => {
      if (!isMetaMaskAvailable) {
        setError("MetaMask is not installed");
        return;
      }

      try {
        const ethereum = (window as any).ethereum;

        // Open MetaMask with pre-filled transaction
        ethereum
          .request({
            method: "eth_sendTransaction",
            params: [
              {
                to: recipientAddress,
                from: ethereum.selectedAddress,
                value: amount
                  ? `0x${(Number.parseFloat(amount) * 1e18).toString(16)}`
                  : "0x0",
              },
            ],
          })
          .catch((err: any) => {
            if (err.code !== 4001) {
              // Ignore user rejection
              console.error("Transaction error:", err);
            }
          });
      } catch (err: any) {
        console.error("Failed to open wallet send:", err);
        setError("Failed to open wallet");
      }
    },
    [isMetaMaskAvailable],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isMetaMaskAvailable,
    isConnecting,
    error,
    connectMetaMask,
    openWalletSend,
    clearError,
  };
}
