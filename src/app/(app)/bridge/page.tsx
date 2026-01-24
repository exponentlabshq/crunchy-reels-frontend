"use client"

import { useState, useEffect } from "react"
import {
  ArrowRight,
  Wallet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowDownUp,
  ExternalLink,
} from "lucide-react"
import toast from "react-hot-toast"
import { parseUnits, formatUnits } from "viem"
import { sepolia } from "viem/chains"

import { useEthereumWallet, EthereumWalletProvider } from "@/context/EthereumWalletContext"
import { useStacksWallet } from "@/context/StacksWalletContext"
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

type BridgeStep = "idle" | "approving" | "approved" | "depositing" | "completed" | "error"

export default function BridgePage() {
  return (
    <EthereumWalletProvider>
      <BridgeContent />
    </EthereumWalletProvider>
  )
}

function BridgeContent() {
  const {
    isConnected: isEthConnected,
    isConnecting: isEthConnecting,
    address: ethAddress,
    chainId,
    connect: connectEth,
    switchToSepolia,
    publicClient,
    walletClient,
  } = useEthereumWallet()

  const { isConnected: isStacksConnected, address: stacksAddress } = useStacksWallet()

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

  // Determine the actual recipient address
  const recipientAddress = sendToOther ? customRecipient.trim() : stacksAddress
  const isValidRecipient = recipientAddress ? isValidStacksAddress(recipientAddress) : false
  const showRecipientError = sendToOther && customRecipient.trim() && !isValidRecipient

  // Fetch USDC balance and allowance
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
          parsedAmount, // value
          STACKS_DOMAIN_ID, // remoteDomain
          recipientBytes32, // remoteRecipient
          SEPOLIA_USDC, // localToken
          DEFAULT_MAX_FEE, // maxFee (0 = no limit)
          "0x" as `0x${string}`, // hookData
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

  // Not connected to either wallet
  if (!isEthConnected || !isStacksConnected) {
    return (
      <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">Bridge</h1>
            <p className="text-typography-600">Bridge USDC from Ethereum to USDCx on Stacks</p>
          </div>

          <div className="bg-background-100 border border-background-300 rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                <ArrowDownUp className="w-10 h-10 text-primary-500" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-typography-950 mb-2">
                  Connect Both Wallets
                </h2>
                <p className="text-typography-500 max-w-md mx-auto">
                  To bridge USDC from Ethereum Sepolia to USDCx on Stacks testnet, you need to
                  connect both your Ethereum and Stacks wallets.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Ethereum Wallet Status */}
                <div
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    isEthConnected
                      ? "border-success-500 bg-success-500/10"
                      : "border-background-300 bg-background-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isEthConnected ? "bg-success-500/20" : "bg-blue-500/20"
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 320 512" fill="currentColor">
                        <path
                          d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"
                          className={isEthConnected ? "fill-success-500" : "fill-blue-500"}
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-typography-950">Ethereum</p>
                      <p className="text-xs text-typography-500">Sepolia Testnet</p>
                    </div>
                    {isEthConnected && (
                      <CheckCircle2 className="w-5 h-5 text-success-500 ml-auto" />
                    )}
                  </div>
                  {!isEthConnected && (
                    <button
                      onClick={connectEth}
                      disabled={isEthConnecting}
                      className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isEthConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4" />
                      )}
                      Connect MetaMask
                    </button>
                  )}
                  {isEthConnected && ethAddress && (
                    <p className="text-xs text-typography-500 font-mono truncate">
                      {ethAddress}
                    </p>
                  )}
                </div>

                {/* Stacks Wallet Status */}
                <div
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    isStacksConnected
                      ? "border-success-500 bg-success-500/10"
                      : "border-background-300 bg-background-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isStacksConnected ? "bg-success-500/20" : "bg-primary-500/20"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                          className={isStacksConnected ? "stroke-success-500" : "stroke-primary-500"}
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-typography-950">Stacks</p>
                      <p className="text-xs text-typography-500">Testnet</p>
                    </div>
                    {isStacksConnected && (
                      <CheckCircle2 className="w-5 h-5 text-success-500 ml-auto" />
                    )}
                  </div>
                  {!isStacksConnected && (
                    <a
                      href="/connect-wallet"
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Stacks
                    </a>
                  )}
                  {isStacksConnected && stacksAddress && (
                    <p className="text-xs text-typography-500 font-mono truncate">
                      {stacksAddress}
                    </p>
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
      <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">Bridge</h1>
            <p className="text-typography-600">Bridge USDC from Ethereum to USDCx on Stacks</p>
          </div>

          <div className="bg-background-100 border border-warning-500/50 rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-warning-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-warning-500" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-typography-950 mb-2">Wrong Network</h2>
                <p className="text-typography-500">
                  Please switch to Sepolia testnet to bridge USDC.
                </p>
              </div>

              <button
                onClick={switchToSepolia}
                className="px-6 py-3 bg-warning-500 hover:bg-warning-600 text-white font-medium rounded-xl transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main bridge UI
  return (
    <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">Bridge</h1>
          <p className="text-typography-600">Bridge USDC from Ethereum Sepolia to USDCx on Stacks</p>
        </div>

        {/* Connected Wallets Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background-100 border border-background-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse" />
              <span className="text-sm text-typography-500">Ethereum</span>
            </div>
            <p className="text-xs text-typography-950 font-mono truncate">{ethAddress}</p>
            {usdcBalance !== null && (
              <p className="text-sm text-primary-500 mt-1">
                {formatUnits(usdcBalance, USDC_DECIMALS)} USDC
              </p>
            )}
          </div>
          <div className="bg-background-100 border border-background-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse" />
              <span className="text-sm text-typography-500">Stacks</span>
            </div>
            <p className="text-xs text-typography-950 font-mono truncate">{stacksAddress}</p>
          </div>
        </div>

        {/* Bridge Card */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6">
          {step === "completed" ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-success-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success-500" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-typography-950 mb-2">
                  Bridge Initiated!
                </h2>
                <p className="text-typography-500 max-w-md mx-auto">
                  Your USDC is being bridged to Stacks. USDCx will be minted to{" "}
                  {sendToOther ? "the recipient address" : "your Stacks wallet"} once the attestation
                  is processed. This may take a few minutes.
                </p>
                {sendToOther && recipientAddress && (
                  <div className="mt-4 bg-background-0 rounded-xl p-3 max-w-md mx-auto">
                    <p className="text-xs text-typography-500 mb-1">Recipient</p>
                    <p className="text-typography-950 font-mono text-sm break-all">{recipientAddress}</p>
                  </div>
                )}
              </div>

              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 transition-colors"
                >
                  View on Etherscan
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={handleReset}
                className="px-6 py-3 bg-background-200 hover:bg-background-300 text-typography-950 font-medium rounded-xl transition-colors"
              >
                Bridge More
              </button>
            </div>
          ) : (
            <>
              {/* From Section */}
              <div className="mb-4">

              {/* Info Note */}
              <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <p className="text-sm text-typography-200">
                  <span className="text-primary-500 font-medium">Important Note:</span> After initiating the
                  bridge, the xReserve attestation service will mint USDCx to the recipient&apos;s Stacks wallet.
                  This typically takes 5-15 minutes. You can send to your own wallet or another address.
                </p>
              </div>
                <label className="block text-sm font-medium text-typography-500 mb-2">From</label>
                <div className="bg-background-0 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-xs">$</span>
                      </div>
                      <div>
                        <p className="text-typography-950 font-medium">USDC</p>
                        <p className="text-xs text-typography-500">Ethereum Sepolia</p>
                      </div>
                    </div>
                    {usdcBalance !== null && (
                      <button
                        onClick={() => setAmount(formatUnits(usdcBalance, USDC_DECIMALS))}
                        className="text-xs text-primary-500 hover:text-primary-400"
                      >
                        Max: {formatUnits(usdcBalance, USDC_DECIMALS)}
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={step !== "idle" && step !== "approved" && step !== "error"}
                    className="w-full bg-transparent text-2xl font-bold text-typography-950 placeholder:text-typography-400 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-10 h-10 bg-background-200 border-4 border-background-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-typography-500 rotate-90" />
                </div>
              </div>

              {/* To Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-typography-500 mb-2">To</label>
                <div className="bg-background-0 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <span className="text-primary-500 font-bold text-xs">$</span>
                    </div>
                    <div>
                      <p className="text-typography-950 font-medium">USDCx</p>
                      <p className="text-xs text-typography-500">Stacks Testnet</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-typography-950">
                    {amount || "0.00"}
                  </p>
                </div>
              </div>

              {/* Recipient Address Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-typography-500">Recipient Address</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSendToOther(!sendToOther)
                      if (sendToOther) setCustomRecipient("")
                    }}
                    disabled={step !== "idle" && step !== "approved" && step !== "error"}
                    className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400 transition-colors disabled:opacity-50"
                  >
                    <div
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        sendToOther ? "bg-primary-500" : "bg-background-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          sendToOther ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                    <span>Send to another address</span>
                  </button>
                </div>

                {sendToOther ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customRecipient}
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      placeholder="Enter Stacks address (ST... or SP...)"
                      disabled={step !== "idle" && step !== "approved" && step !== "error"}
                      className={`w-full bg-background-0 border rounded-xl px-4 py-3 text-typography-950 placeholder:text-typography-400 outline-none transition-colors disabled:opacity-50 font-mono text-sm ${
                        showRecipientError
                          ? "border-error-500 focus:border-error-500"
                          : "border-background-300 focus:border-primary-500"
                      }`}
                    />
                    {showRecipientError && (
                      <p className="text-xs text-error-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Invalid Stacks address format
                      </p>
                    )}
                    {customRecipient.trim() && isValidRecipient && (
                      <p className="text-xs text-success-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid address
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-background-0 border border-background-300 rounded-xl px-4 py-3">
                    <p className="text-xs text-typography-500 mb-1">Your connected wallet</p>
                    <p className="text-typography-950 font-mono text-sm truncate">{stacksAddress}</p>
                  </div>
                )}
              </div>

              {/* Fee Info */}
              <div className="bg-background-0 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-typography-500">Bridge Fee</span>
                  <span className="text-typography-950">
                    ~0.25% (protocol fee)
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-typography-500">Estimated Time</span>
                  <span className="text-typography-950">10-30 minutes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
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
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-background-300 disabled:text-typography-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {step === "approving" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Approving USDC...
                      </>
                    ) : (
                      <>
                        Step 1: Approve USDC
                        <ArrowRight className="w-5 h-5" />
                      </>
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
                    className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-background-300 disabled:text-typography-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {step === "depositing" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Bridging...
                      </>
                    ) : (
                      <>
                        {hasEnoughAllowance ? "Bridge to Stacks" : "Step 2: Bridge to Stacks"}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {step === "error" && (
                  <button
                    onClick={handleReset}
                    className="w-full py-3 bg-background-200 hover:bg-background-300 text-typography-950 font-medium rounded-xl transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>

            </>
          )}
        </div>

        {/* How it Works */}
        <div className="mt-8 bg-background-100 border border-background-300 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-typography-950 mb-4">How Bridging Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-500 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-typography-950 font-medium">Approve USDC</p>
                <p className="text-sm text-typography-500">
                  Allow the xReserve contract to spend your USDC on Sepolia.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-500 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-typography-950 font-medium">Deposit to xReserve</p>
                <p className="text-sm text-typography-500">
                  Initiate the cross-chain transfer targeting your Stacks address or send to another address.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-500 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-typography-950 font-medium">Receive USDCx</p>
                <p className="text-sm text-typography-500">
                  Once attested, USDCx tokens are minted to the recipient&apos;s Stacks wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
