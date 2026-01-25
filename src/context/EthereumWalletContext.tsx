"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem"
import { sepolia } from "viem/chains"

interface EthereumWalletState {
  isConnected: boolean
  isConnecting: boolean
  address: Address | null
  chainId: number | null
  publicClient: PublicClient | null
  walletClient: WalletClient | null
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchToSepolia: () => Promise<void>
}

const EthereumWalletContext = createContext<EthereumWalletState | null>(null)

export function EthereumWalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null)
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeClients = useCallback((account: Address) => {
    if (typeof window === "undefined" || !window.ethereum) return

    const pub = createPublicClient({
      chain: sepolia,
      transport: http("https://ethereum-sepolia.publicnode.com"),
    })

    const wallet = createWalletClient({
      account,
      chain: sepolia,
      transport: custom(window.ethereum),
    })

    setPublicClient(pub)
    setWalletClient(wallet)
  }, [])

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return

      try {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as Address[]

        if (accounts.length > 0) {
          const account = accounts[0]
          setAddress(account)
          setIsConnected(true)
          initializeClients(account)

          const currentChainId = await window.ethereum.request({
            method: "eth_chainId",
          })
          setChainId(parseInt(currentChainId as string, 16))
        }
      } catch (error) {
        console.error("Failed to check connection:", error)
      }
    }

    checkConnection()
  }, [initializeClients])

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = (accounts: unknown) => {
      const accts = accounts as Address[]
      if (accts.length === 0) {
        setAddress(null)
        setIsConnected(false)
        setWalletClient(null)
      } else {
        const account = accts[0]
        setAddress(account)
        setIsConnected(true)
        initializeClients(account)
      }
    }

    const handleChainChanged = (newChainId: unknown) => {
      setChainId(parseInt(newChainId as string, 16))
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [initializeClients])

  const connect = useCallback(async () => {
    setError(null)

    if (typeof window === "undefined" || !window.ethereum) {
      const errorMessage = "No Ethereum wallet found. Please install MetaMask or another wallet extension."
      setError(errorMessage)
      return
    }

    setIsConnecting(true)

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as Address[]

      if (accounts.length > 0) {
        const account = accounts[0]
        setAddress(account)
        setIsConnected(true)
        initializeClients(account)

        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        })
        setChainId(parseInt(currentChainId as string, 16))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      setError(message)
      console.error("Failed to connect:", err)
    } finally {
      setIsConnecting(false)
    }
  }, [initializeClients])

  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setWalletClient(null)
    setChainId(null)
  }, [])

  const switchToSepolia = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID
      })
    } catch (error: unknown) {
      // If Sepolia is not added, add it
      const err = error as { code?: number }
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://ethereum-sepolia.publicnode.com"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        })
      } else {
        throw error
      }
    }
  }, [])

  return (
    <EthereumWalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        chainId,
        publicClient,
        walletClient,
        error,
        connect,
        disconnect,
        switchToSepolia,
      }}
    >
      {children}
    </EthereumWalletContext.Provider>
  )
}

export function useEthereumWallet() {
  const context = useContext(EthereumWalletContext)
  if (!context) {
    throw new Error("useEthereumWallet must be used within an EthereumWalletProvider")
  }
  return context
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (data: unknown) => void) => void
      removeListener: (event: string, callback: (data: unknown) => void) => void
    }
  }
}
