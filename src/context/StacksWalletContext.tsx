"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  AppConfig,
  UserSession,
  connect as stacksConnect,
  disconnect,
} from "@stacks/connect";
import { IS_MAINNET } from "@/constants";

const DEMO_MODE_KEY = "shortstarter_demo_mode";

interface StacksWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isDemoMode: boolean;
  address: string | null;
  stxAddress: string | null;
  connect: () => Promise<void>;
  disconnectWallet: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const StacksWalletContext = createContext<StacksWalletState | null>(null);

export function StacksWalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [stxAddress, setStxAddress] = useState<string | null>(null);

  // Check for existing session or demo mode on mount
  useEffect(() => {
    // Check for demo mode first
    const storedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
    if (storedDemoMode === "true") {
      setIsDemoMode(true);
      return;
    }

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
        forceWalletSelect: true,
      });

      // v8 returns addresses directly in response
      console.log("Connect response:", response);
      if (response?.addresses) {
        const stxAddr = response.addresses.find((a) => a.symbol === "STX");
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
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_MODE_KEY);
  }, []);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem(DEMO_MODE_KEY, "true");
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
  }, []);

  return (
    <StacksWalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        isDemoMode,
        address,
        stxAddress,
        connect,
        disconnectWallet,
        enterDemoMode,
        exitDemoMode,
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
