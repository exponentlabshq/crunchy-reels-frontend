"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { AppConfig, UserSession, connect as stacksConnect, disconnect } from "@stacks/connect";
import { APP_NAME, APP_ICON, IS_MAINNET } from "@/constants";

interface StacksWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  stxAddress: string | null;
  connect: () => void;
  disconnectWallet: () => void;
}

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const StacksWalletContext = createContext<StacksWalletState | null>(null);

export function StacksWalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [stxAddress, setStxAddress] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const networkAddress = IS_MAINNET
        ? userData.profile.stxAddress?.mainnet
        : userData.profile.stxAddress?.testnet;

      setAddress(networkAddress ?? null);
      setStxAddress(networkAddress ?? null);
      setIsConnected(true);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      const response = await stacksConnect({
        appDetails: {
          name: APP_NAME,
          icon: window.location.origin + APP_ICON,
        },
        userSession,
      });

      // v8 returns addresses directly in response
      console.log("Connect response:", response);
      if (response?.addresses) {
        const stxAddr = response.addresses.find(
          (a: { symbol: string; address: string }) => a.symbol === "STX"
        );
        if (stxAddr) {
          setAddress(stxAddr.address);
          setStxAddress(stxAddr.address);
          setIsConnected(true);
        }
      } else if (userSession.isUserSignedIn()) {
        // Fallback to userSession if available
        const userData = userSession.loadUserData();
        const networkAddress = IS_MAINNET
          ? userData.profile.stxAddress?.mainnet
          : userData.profile.stxAddress?.testnet;

        setAddress(networkAddress ?? null);
        setStxAddress(networkAddress ?? null);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    disconnect();
    userSession.signUserOut();
    setAddress(null);
    setStxAddress(null);
    setIsConnected(false);
  }, []);

  return (
    <StacksWalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        stxAddress,
        connect,
        disconnectWallet,
      }}
    >
      {children}
    </StacksWalletContext.Provider>
  );
}

export function useStacksWallet() {
  const context = useContext(StacksWalletContext);
  if (!context) {
    throw new Error("useStacksWallet must be used within a StacksWalletProvider");
  }
  return context;
}

export { userSession };
