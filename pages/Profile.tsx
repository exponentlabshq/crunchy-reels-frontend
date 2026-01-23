import { User as UserIcon, Copy, Film, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDemo } from "@/context/DemoStore"
import { useStacksWallet } from "@/context/StacksWalletContext"

function Profile() {
  const navigate = useNavigate()
  const { isConnected, address } = useStacksWallet()
  const demo = useDemo()
  const [copiedAddress, setCopiedAddress] = useState(false)

  const isAuthenticated = isConnected || demo.isGuest
  const walletAddress = demo.isGuest ? demo.guestAddress : address || ""

  function handleCopyAddress() {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-background-0 overflow-y-auto flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-background-100 rounded-2xl p-8 text-center border border-background-300">
          <UserIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-typography-950 text-2xl font-semibold mb-2 font-outfit">
            Connect Your Wallet
          </h2>
          <p className="text-typography-600 mb-6">Connect your Stacks wallet to view your profile</p>
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

  const shortAddress = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`

  return (
    <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-outfit mb-2">Profile</h1>
          <p className="text-typography-600">Your CineBlock investor profile</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-background-100 border border-background-300 rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-orange-500 flex items-center justify-center mb-4">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold text-typography-950 font-outfit mb-1">
                {demo.isGuest ? "Guest Investor" : "Investor"}
              </h2>
              
              {demo.isGuest && (
                <span className="inline-block px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full mb-4">
                  Demo Mode
                </span>
              )}

              <div className="w-full mt-4">
                <div className="flex items-center justify-center gap-2 bg-background-0 px-4 py-2 rounded-xl">
                  <code className="text-typography-600 text-sm font-mono">{shortAddress}</code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-background-100 rounded transition-colors"
                  >
                    <Copy className={`w-4 h-4 ${copiedAddress ? "text-green-500" : "text-typography-500"}`} />
                  </button>
                </div>
                {copiedAddress && (
                  <p className="text-green-500 text-xs mt-2">Address copied!</p>
                )}
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="lg:col-span-2 bg-background-100 border border-background-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Film className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-typography-950 font-outfit">Your Holdings</h3>
            </div>

            {demo.isGuest ? (
              <div className="space-y-4">
                {demo.films.slice(0, 2).map((film) => (
                  <div
                    key={film.id}
                    className="flex items-center gap-4 bg-background-0 rounded-xl p-4"
                  >
                    <img
                      src={film.imageUri}
                      alt={film.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-typography-950 font-medium">{film.title}</h4>
                      <p className="text-sm text-typography-500">{film.genre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-500 font-mono font-medium">250 ${film.tokenSymbol}</p>
                      <p className="text-sm text-typography-500">~$250</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Film className="w-12 h-12 text-typography-400 mx-auto mb-3" />
                <p className="text-typography-600 font-medium mb-1">No Holdings Yet</p>
                <p className="text-typography-500 text-sm mb-4">
                  Start investing in films to see your holdings here
                </p>
                <button
                  onClick={() => navigate("/films")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Browse Films
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary-500 font-mono">
              {demo.isGuest ? "2" : "0"}
            </p>
            <p className="text-sm text-typography-500">Films Invested</p>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary-500 font-mono">
              ${demo.isGuest ? "500" : "0"}
            </p>
            <p className="text-sm text-typography-500">Total Invested</p>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500 font-mono">
              {demo.isGuest ? "+12.5%" : "0%"}
            </p>
            <p className="text-sm text-typography-500">Portfolio Change</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
