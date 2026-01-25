"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowDown,
  ArrowRightLeft,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import toast from "react-hot-toast"
import { parseUnits, formatUnits } from "viem"
import { sepolia } from "viem/chains"

import { useRouter } from "next/navigation"
import { useEthereumWallet, EthereumWalletProvider } from "@/context/EthereumWalletContext"
import { useStacksWallet } from "@/context/StacksWalletContext"
import { Eye, Wallet } from "lucide-react"
import {
  SEPOLIA_USDC,
  SEPOLIA_XRESERVE,
  STACKS_DOMAIN_ID,
  USDC_DECIMALS,
  ERC20_ABI,
  XRESERVE_ABI,
  stacksAddressToBytes32,
  isValidStacksAddress,
  DEFAULT_MAX_FEE,
  SEPOLIA_CHAIN_ID,
} from "@/utils/bridgeConfig"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type BridgeStep = "idle" | "approving" | "approved" | "depositing" | "completed" | "error"

export default function BridgePage() {
  return (
    <EthereumWalletProvider>
      <BridgeContent />
    </EthereumWalletProvider>
  )
}

function BridgeContent() {
  const router = useRouter()
  const {
    isConnected: isEthConnected,
    isConnecting: isEthConnecting,
    address: ethAddress,
    chainId,
    connect: connectEth,
    switchToSepolia,
    publicClient,
    walletClient,
    error: ethError,
  } = useEthereumWallet()

  const { isConnected: isStacksConnected, isDemoMode, address: stacksAddress, exitDemoMode } = useStacksWallet()

  function handleExitDemoMode() {
    exitDemoMode()
    router.push("/connect-wallet")
  }

  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<BridgeStep>("idle")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null)
  const [allowance, setAllowance] = useState<bigint | null>(null)
  const [sendToOther, setSendToOther] = useState(false)
  const [customRecipient, setCustomRecipient] = useState("")

  const isWrongNetwork = chainId !== null && chainId !== SEPOLIA_CHAIN_ID
  const parsedAmount = amount ? parseUnits(amount, USDC_DECIMALS) : BigInt(0)
  const hasEnoughAllowance = allowance !== null && allowance >= parsedAmount

  const recipientAddress = sendToOther ? customRecipient.trim() : stacksAddress
  const isValidRecipient = recipientAddress ? isValidStacksAddress(recipientAddress) : false
  const showRecipientError = sendToOther && customRecipient.trim() && !isValidRecipient

  // Show toast when Ethereum wallet error occurs
  useEffect(() => {
    if (ethError) {
      toast.error(ethError)
    }
  }, [ethError])

  useEffect(() => {
    async function fetchBalanceAndAllowance() {
      if (!publicClient || !ethAddress) return

      try {
        const [balance, currentAllowance] = await Promise.all([
          publicClient.readContract({
            address: SEPOLIA_USDC,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [ethAddress],
          }),
          publicClient.readContract({
            address: SEPOLIA_USDC,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [ethAddress, SEPOLIA_XRESERVE],
          }),
        ])

        setUsdcBalance(balance)
        setAllowance(currentAllowance)
      } catch (error) {
        console.error("Failed to fetch balance:", error)
      }
    }

    fetchBalanceAndAllowance()
  }, [publicClient, ethAddress, step])

  async function handleApprove() {
    if (!walletClient || !ethAddress || !publicClient) {
      toast.error("Wallet not connected")
      return
    }

    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error("Enter a valid amount")
      return
    }

    setStep("approving")

    try {
      const hash = await walletClient.writeContract({
        address: SEPOLIA_USDC,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [SEPOLIA_XRESERVE, parsedAmount],
        chain: sepolia,
        account: ethAddress,
      })

      toast.loading("Approving USDC...", { id: "approve" })

      await publicClient.waitForTransactionReceipt({ hash })

      toast.success("USDC approved!", { id: "approve" })
      setStep("approved")
      setAllowance(parsedAmount)
    } catch (error) {
      console.error("Approval failed:", error)
      toast.error("Approval failed", { id: "approve" })
      setStep("error")
    }
  }

  async function handleDeposit() {
    if (!walletClient || !ethAddress || !publicClient || !stacksAddress) {
      toast.error("Wallets not connected")
      return
    }

    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error("Enter a valid amount")
      return
    }

    if (!recipientAddress || !isValidRecipient) {
      toast.error("Invalid recipient address")
      return
    }

    setStep("depositing")

    try {
      const recipientBytes32 = stacksAddressToBytes32(recipientAddress)

      const hash = await walletClient.writeContract({
        address: SEPOLIA_XRESERVE,
        abi: XRESERVE_ABI,
        functionName: "depositToRemote",
        args: [
          parsedAmount,
          STACKS_DOMAIN_ID,
          recipientBytes32,
          SEPOLIA_USDC,
          DEFAULT_MAX_FEE,
          "0x" as `0x${string}`,
        ],
        chain: sepolia,
        account: ethAddress,
      })

      setTxHash(hash)
      toast.loading("Bridging USDC to Stacks...", { id: "deposit" })

      await publicClient.waitForTransactionReceipt({ hash })

      toast.success("Bridge transaction submitted!", { id: "deposit" })
      setStep("completed")
    } catch (error) {
      console.error("Deposit failed:", error)
      toast.error("Bridge failed", { id: "deposit" })
      setStep("error")
    }
  }

  function handleReset() {
    setStep("idle")
    setAmount("")
    setTxHash(null)
    setSendToOther(false)
    setCustomRecipient("")
  }

  // Demo mode - Bridge not available
  if (isDemoMode) {
    return (
      <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#111113] border border-amber-500/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Demo Mode Active</h2>
              <p className="text-sm text-[#6B6B70] mb-6">
                The bridge requires a connected wallet to transfer assets between chains.
                Connect your wallet to access this feature.
              </p>
              <button
                onClick={handleExitDemoMode}
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              <button
                onClick={() => router.push("/films")}
                className="w-full mt-3 py-3 text-[#8B8B90] hover:text-white text-sm font-medium transition-colors"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not connected to either wallet
  if (!isEthConnected || !isStacksConnected) {
    return (
      <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-white mb-2">Bridge</h1>
              <p className="text-sm text-[#6B6B70]">
                Connect wallets to bridge USDC → USDCx
              </p>
            </div>

            <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 space-y-4">
              {/* Ethereum */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isEthConnected
                    ? "border-success-500/50 bg-success-500/5"
                    : "border-[#1F1F23] hover:border-[#2A2A2E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center">
                      <span className="text-white font-bold">E</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Ethereum</p>
                      <p className="text-xs text-[#6B6B70]">Sepolia</p>
                    </div>
                  </div>
                  {isEthConnected ? (
                    <div className="flex items-center gap-1.5 text-success-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={connectEth}
                      disabled={isEthConnecting}
                      className="px-4 py-2 bg-[#627EEA] hover:bg-[#5268c4] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isEthConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Stacks */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isStacksConnected
                    ? "border-success-500/50 bg-success-500/5"
                    : "border-[#1F1F23] hover:border-[#2A2A2E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5546FF] flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Stacks</p>
                      <p className="text-xs text-[#6B6B70]">Testnet</p>
                    </div>
                  </div>
                  {isStacksConnected ? (
                    <div className="flex items-center gap-1.5 text-success-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <a
                      href="/connect-wallet"
                      className="px-4 py-2 bg-[#5546FF] hover:bg-[#4438cc] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Connect
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wrong network
  if (isWrongNetwork) {
    return (
      <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#111113] border border-warning-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-warning-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-warning-500" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Wrong Network</h2>
              <p className="text-sm text-[#8B8B90] mb-6">
                Switch to Sepolia to continue
              </p>
              <button
                onClick={switchToSepolia}
                className="w-full py-3 bg-warning-500 hover:bg-warning-600 text-white font-medium rounded-xl transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (step === "completed") {
    return (
      <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Bridge Initiated</h2>
              <p className="text-sm text-[#8B8B90] mb-6">
                Please allow time for the minting process.<br/>USDCx will arrive in 5-30 minutes
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400 mb-6"
                >
                  View on Etherscan
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#1A1A1D] hover:bg-[#2A2A2E] text-white font-medium rounded-xl transition-colors"
              >
                Bridge More
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main bridge UI - Aerodrome style
  return (
    <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8 pt-12">
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">Bridge</h1>
            <p className="text-sm text-[#6B6B70]">Bridge USDC from Ethereum Sepolia to USDCx on Stacks</p>
          </div>

        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Please Be Patient:</AlertTitle>
          <AlertDescription>
          After initiating the bridge, the Reserve attestation service will mint USDCx to the recipient's Stacks wallet. <br/><span className="text-orange-400">This could take 5-30 minutes.</span>
          </AlertDescription>
        </Alert>

          {/* Bridge Card */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl overflow-hidden mt-4">
            {/* From Section */}
            <div className="p-4 border-b border-[#1F1F23]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">From</span>
                <span className="text-xs text-[#6B6B70]">
                  Balance{" "}
                  <span className="text-[#8B8B90]">
                    {usdcBalance !== null ? formatUnits(usdcBalance, USDC_DECIMALS) : "0"} USDC
                  </span>
                  {usdcBalance !== null && usdcBalance > BigInt(0) && (
                    <button
                      onClick={() => setAmount(formatUnits(usdcBalance, USDC_DECIMALS))}
                      className="ml-2 text-primary-500 hover:text-primary-400"
                    >
                      MAX
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1D] rounded-lg border border-[#2A2A2E]">
                    <div className="w-5 h-5 rounded-full bg-[#2775CA] flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">$</span>
                    </div>
                    <span className="text-sm font-medium text-white">USDC</span>
               
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    disabled={step !== "idle" && step !== "approved" && step !== "error"}
                    className="bg-transparent text-2xl font-medium text-white placeholder:text-[#3A3A3E] outline-none text-right w-32 disabled:opacity-50"
                  />
                  <span className="text-xs text-[#6B6B70]">Sepolia</span>
                </div>
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="relative h-0">
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-9 h-9 bg-[#1A1A1D] border border-[#2A2A2E] rounded-lg flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-[#8B8B90]" />
                </div>
              </div>
            </div>

            {/* To Section */}
            <div className="p-4 border-b border-[#1F1F23]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">To</span>
                <span className="text-xs text-[#6B6B70]">Stacks Testnet</span>
              </div>

              <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1D] rounded-lg border border-[#2A2A2E]">
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">$</span>
                    </div>
                    <span className="text-sm font-medium text-white">USDCx</span>
           
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-medium text-[#4A4A4E]">
                    {amount || "0"}
                  </span>
                  <span className="text-xs text-[#6B6B70]">~$0.0</span>
                </div>
              </div>
            </div>

            {/* Recipient Section */}
            <div className="p-4 border-b border-[#1F1F23]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B6B70]">Recipient</span>
                <button
                  type="button"
                  onClick={() => {
                    setSendToOther(!sendToOther)
                    if (sendToOther) setCustomRecipient("")
                  }}
                  disabled={step !== "idle" && step !== "approved" && step !== "error"}
                  className="text-xs text-primary-500 hover:text-primary-400 disabled:opacity-50"
                >
                  {sendToOther ? "Use my wallet" : "Send to other"}
                </button>
              </div>

              {sendToOther ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    placeholder="ST... or SP..."
                    disabled={step !== "idle" && step !== "approved" && step !== "error"}
                    className={`w-full bg-[#0A0A0B] border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#3A3A3E] outline-none transition-colors disabled:opacity-50 font-mono ${
                      showRecipientError
                        ? "border-error-500"
                        : "border-[#2A2A2E] focus:border-primary-500/50"
                    }`}
                  />
                  {showRecipientError && (
                    <p className="text-xs text-error-500">Invalid address</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#8B8B90] font-mono truncate">
                  {stacksAddress}
                </p>
              )}
            </div>

            {/* Info Row */}
            <div className="px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-[#6B6B70]">Fee</span>
              <span className="text-[#8B8B90]">~0.25%</span>
            </div>

            {/* Action Button */}
            <div className="p-4 pt-0">
              {!hasEnoughAllowance && step !== "approved" ? (
                <button
                  onClick={handleApprove}
                  disabled={
                    !amount ||
                    parsedAmount <= BigInt(0) ||
                    step === "approving" ||
                    (usdcBalance !== null && parsedAmount > usdcBalance) ||
                    !isValidRecipient
                  }
                  className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-[#1A1A1D] disabled:text-[#4A4A4E] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {step === "approving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve USDC"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDeposit}
                  disabled={
                    !amount ||
                    parsedAmount <= BigInt(0) ||
                    step === "depositing" ||
                    (usdcBalance !== null && parsedAmount > usdcBalance) ||
                    !isValidRecipient
                  }
                  className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-[#1A1A1D] disabled:text-[#4A4A4E] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {step === "depositing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Bridging...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      Bridge
                    </>
                  )}
                </button>
              )}

              {step === "error" && (
                <button
                  onClick={handleReset}
                  className="w-full mt-2 py-2.5 text-sm text-[#8B8B90] hover:text-white transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          </div>

          {/* Wallet Status Pills */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] rounded-full border border-[#1F1F23]">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-xs text-[#8B8B90]">ETH</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] rounded-full border border-[#1F1F23]">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-xs text-[#8B8B90]">STX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
