import { Copy, Wallet as WalletIcon, LogOut, Bitcoin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useDemo } from "@/context/DemoStore"
import { useStacksWallet } from "@/context/StacksWalletContext"

function Wallet() {
  const navigate = useNavigate()
  const { isConnected, address, disconnectWallet } = useStacksWallet()
  const demo = useDemo()

  const isAuthenticated = isConnected || demo.isGuest
  const walletAddress = demo.isGuest ? demo.guestAddress : address || ""

  function copyWalletAddress() {
    navigator.clipboard.writeText(walletAddress)
    toast.success("Address copied to clipboard!")
  }

  function handleDisconnect() {
    if (demo.isGuest) {
      demo.signOut()
    } else {
      disconnectWallet()
    }
    navigate("/onboarding")
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-background-0 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-background-100 rounded-2xl p-8 text-center border border-background-300">
          <WalletIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-typography-950 text-2xl font-semibold mb-2 font-outfit">
            Connect Your Wallet
          </h2>
          <p className="text-typography-600 mb-6">
            Connect your Stacks wallet to view your portfolio
          </p>
          <button
            onClick={() => navigate("/connect-wallet")}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-outfit mb-2">Wallet</h1>
          <p className="text-typography-600">Manage your Stacks wallet and holdings</p>
        </div>

        {/* Wallet Card */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center">
              <WalletIcon className="w-7 h-7 text-primary-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-typography-950 font-outfit">
                {demo.isGuest ? "Guest Wallet" : "Stacks Wallet"}
              </h2>
              {demo.isGuest && (
                <span className="inline-block px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-background-0 rounded-xl p-4 mb-6">
            <p className="text-sm text-typography-500 mb-2">Wallet Address</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-typography-950 font-mono text-sm truncate">
                {walletAddress}
              </code>
              <button
                onClick={copyWalletAddress}
                className="p-2 hover:bg-background-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-typography-500" />
              </button>
            </div>
          </div>

          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-typography-500">STX Balance</span>
              </div>
              <p className="text-2xl font-bold text-typography-950 font-mono">
                {demo.isGuest ? "1,000.00" : "0.00"}
              </p>
            </div>
            <div className="bg-primary-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-typography-500">Film Tokens</span>
              </div>
              <p className="text-2xl font-bold text-typography-950 font-mono">
                {demo.isGuest ? "3" : "0"}
              </p>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 py-3 bg-background-200 hover:bg-background-300 text-typography-950 font-medium rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {demo.isGuest ? "Sign Out" : "Disconnect Wallet"}
          </button>
        </div>

        {/* Network Info */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-typography-950 mb-4 font-outfit">Network</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-typography-600">Stacks Testnet</span>
            </div>
            <span className="text-sm text-typography-500 font-mono">nakamoto.stacks.co</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet
