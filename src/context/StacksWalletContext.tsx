"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { AppConfig, UserSession, showConnect, disconnect } from "@stacks/connect";
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

  const connect = useCallback(() => {
    setIsConnecting(true);

    showConnect({
      appDetails: {
        name: APP_NAME,
        icon: window.location.origin + APP_ICON,
      },
      redirectTo: "/",
      onFinish: () => {
        const userData = userSession.loadUserData();
        const networkAddress = IS_MAINNET
          ? userData.profile.stxAddress?.mainnet
          : userData.profile.stxAddress?.testnet;

        setAddress(networkAddress ?? null);
        setStxAddress(networkAddress ?? null);
        setIsConnected(true);
        setIsConnecting(false);
      },
      onCancel: () => {
        setIsConnecting(false);
      },
      userSession,
    });
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
