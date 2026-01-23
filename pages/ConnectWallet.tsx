import { useNavigate } from "react-router-dom"
import { Wallet as WalletIcon, Film, Bitcoin, UserCircle } from "lucide-react"
import { useEffect } from "react"
import { useDemo } from "@/context/DemoStore"
import { useStacksWallet } from "@/context/StacksWalletContext"

function ConnectWallet() {
  const navigate = useNavigate()
  const { isConnected, isConnecting, connect } = useStacksWallet()
  const { isGuest, signInAsGuest } = useDemo()

  useEffect(() => {
    if (isConnected || isGuest) {
      navigate("/films")
    }
  }, [isConnected, isGuest, navigate])

  function handleGuestSignIn() {
    signInAsGuest()
    navigate("/films")
  }

  return (
    <div className="flex-1 bg-background-0 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-primary-500/30">
            <WalletIcon className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-typography-950 text-3xl font-semibold mb-3 font-outfit">
            Connect Your Wallet
          </h1>
          <p className="text-typography-600 text-lg max-w-md mx-auto">
            Connect your Stacks wallet to invest in tokenized film projects on Bitcoin L2
          </p>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-md mb-8 grid grid-cols-1 gap-4">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Film className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-semibold mb-1">Invest in Films</h3>
              <p className="text-typography-600 text-sm">
                Own tokenized shares of film projects. Be part of cinema history.
              </p>
            </div>
          </div>

          <div className="bg-background-100 border border-background-300 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bitcoin className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-semibold mb-1">Bitcoin Secured</h3>
              <p className="text-typography-600 text-sm">
                Built on Stacks, Bitcoin's smart contract layer. Maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Buttons */}
        <div className="w-full max-w-md space-y-4">
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-14 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WalletIcon className="w-5 h-5" />
                <span>Connect Stacks Wallet</span>
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-background-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background-0 px-2 text-typography-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGuestSignIn}
            className="w-full flex items-center justify-center gap-3 bg-background-100 hover:bg-background-200 border border-background-300 hover:border-background-400 text-typography-950 rounded-xl h-14 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCircle className="w-5 h-5" />
            <span>Continue as Guest</span>
          </button>

          <p className="text-center text-typography-500 text-xs">
            Guest mode lets you explore the app with demo data
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet
