import { useState } from "react"
import { 
  Code2, 
  FileCode, 
  Database, 
  Play, 
  Send,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Film
} from "lucide-react"
import toast from "react-hot-toast"
import { useStacksWallet } from "@/context/StacksWalletContext"
import { 
  serializeCV, 
  deserializeCV, 
  cvToJSON,
  uintCV,
  principalCV,
  tupleCV,
} from "@stacks/transactions"
import {
  getContractInterface,
  getContractSource,
  getMapEntry,
  getDataVar,
  callReadOnlyFunction,
  getExplorerUrl,
  bytesToHex,
  getAccountBalances,
} from "@/utils/stacksApi"
import {
  CINEBLOCK_ADDRESS,
  CINEBLOCK_NAME,
  USDCX_ADDRESS,
  USDCX_NAME,
  USDCX_ASSET_ID,
  CINEBLOCK_FUNCTIONS,
  CINEBLOCK_MAPS,
  CINEBLOCK_VARS,
  formatUSDCx,
  parseUSDCx,
  USDCX_DECIMALS,
} from "@/utils/contractConfig"
import {
  createFilm,
  investInFilm,
  investWithUsdcx,
  addAdmin,
  closeFilmFunding,
  transferUsdcx,
} from "@/utils/contractCalls"

type Tab = "info" | "read" | "write" | "maps" | "vars" | "usdcx"

interface OutputResult {
  success: boolean
  data?: unknown
  error?: string
  txId?: string
}

function ContractTester() {
  const { isConnected, address } = useStacksWallet()
  const [activeTab, setActiveTab] = useState<Tab>("info")
  const [output, setOutput] = useState<OutputResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<"cineblock" | "usdcx">("cineblock")

  // Form states
  const [functionName, setFunctionName] = useState("")
  const [functionArgs, setFunctionArgs] = useState("")
  const [mapName, setMapName] = useState("films")
  const [mapKey, setMapKey] = useState("")

  // Write function form states
  const [writeForm, setWriteForm] = useState({
    // create-film (amounts in USDCx display format)
    title: "Indie Sci-Fi Project",
    director: "Jane Director",
    description: "A groundbreaking independent sci-fi film funded by USDCx",
    fundingGoal: "10000", // 10,000 USDCx
    tokenPrice: "100",    // 100 USDCx per token
    tokenSymbol: "ISF1",
    // invest-in-film
    filmId: "1",
    investAmount: "500", // 500 USDCx
    // transfer
    tokenId: "1",
    recipient: "",
    // admin
    adminAddress: "",
    // usdcx transfer
    usdcxAmount: "100",
    usdcxRecipient: "",
  })

  const contractAddress = selectedContract === "cineblock" ? CINEBLOCK_ADDRESS : USDCX_ADDRESS
  const contractName = selectedContract === "cineblock" ? CINEBLOCK_NAME : USDCX_NAME

  async function handleApiCall(callFn: () => Promise<unknown>) {
    setLoading(true)
    setOutput(null)
    try {
      const result = await callFn()
      setOutput({ success: true, data: result })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setOutput({ success: false, error: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleContractCall(callFn: () => Promise<string>) {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    setLoading(true)
    setOutput(null)
    try {
      const txId = await callFn()
      setOutput({ success: true, txId })
      toast.success("Transaction submitted!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed"
      setOutput({ success: false, error: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function serializeArg(cv: any): string {
    const serialized = serializeCV(cv)
    return typeof serialized === "string" ? serialized : bytesToHex(serialized)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Interface", icon: <Code2 className="w-4 h-4" /> },
    { id: "read", label: "Read", icon: <Play className="w-4 h-4" /> },
    { id: "write", label: "Write", icon: <Send className="w-4 h-4" /> },
    { id: "maps", label: "Maps", icon: <Database className="w-4 h-4" /> },
    { id: "vars", label: "Variables", icon: <FileCode className="w-4 h-4" /> },
    { id: "usdcx", label: "USDCx", icon: <DollarSign className="w-4 h-4" /> },
  ]

  return (
    <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-typography-950 font-outfit">
                Contract Tester
              </h1>
              <p className="text-xs text-green-500 font-medium">
                Programming USDCx on Stacks Builder Challenge
              </p>
            </div>
          </div>
          <p className="text-typography-600">
            Debug and test CineBlock smart contracts powered by USDCx
          </p>
        </div>

        {/* Contract Selector */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-typography-500 uppercase tracking-wider mb-2 block">
                Contract
              </label>
              <div className="relative">
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value as "cineblock" | "usdcx")}
                  className="w-full appearance-none bg-background-0 border border-background-300 rounded-xl px-4 py-3 pr-10 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cineblock">🎬 CineBlock NFT</option>
                  <option value="usdcx">💵 USDCx Token</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-typography-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex-[2]">
              <label className="text-xs font-bold text-typography-500 uppercase tracking-wider mb-2 block">
                Contract ID
              </label>
              <div className="flex items-center gap-2 bg-background-0 border border-background-300 rounded-xl px-4 py-3">
                <code className="flex-1 text-sm text-typography-700 font-mono truncate">
                  {contractAddress ? `${contractAddress}.${contractName}` : "Not configured"}
                </code>
                {contractAddress && (
                  <button
                    onClick={() => copyToClipboard(`${contractAddress}.${contractName}`)}
                    className="p-1 hover:bg-background-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-typography-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {selectedContract === "cineblock" && !CINEBLOCK_ADDRESS && (
            <div className="mt-4 flex items-center gap-2 text-orange-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-background-100 text-typography-600 hover:bg-background-200 border border-background-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6 mb-6">
          {/* Interface Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                Contract Interface
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleApiCall(() => getContractInterface(contractAddress, contractName))}
                  className="py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={loading || !contractAddress}
                >
                  <Code2 className="w-4 h-4" />
                  Fetch Interface
                </button>
                <button
                  onClick={() => handleApiCall(() => getContractSource(contractAddress, contractName))}
                  className="py-3 px-4 bg-background-200 hover:bg-background-300 text-typography-950 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-background-300"
                  disabled={loading || !contractAddress}
                >
                  <FileCode className="w-4 h-4" />
                  Fetch Source
                </button>
              </div>
            </div>
          )}

          {/* Read Tab */}
          {activeTab === "read" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                Read-Only Functions
              </h3>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CINEBLOCK_FUNCTIONS.readOnly
                  .filter(fn => fn.args.length === 0)
                  .map((fn) => (
                    <button
                      key={fn.name}
                      onClick={() => handleApiCall(async () => {
                        const result = await callReadOnlyFunction(
                          CINEBLOCK_ADDRESS,
                          CINEBLOCK_NAME,
                          fn.name,
                          CINEBLOCK_ADDRESS,
                          []
                        )
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) }
                        }
                        return result
                      })}
                      className="py-2.5 px-3 bg-background-200 hover:bg-background-300 text-typography-950 rounded-xl text-sm font-medium transition-colors border border-background-300"
                      disabled={loading || !CINEBLOCK_ADDRESS}
                    >
                      {fn.name}
                    </button>
                  ))}
              </div>

              {/* Custom Function Call */}
              <div className="border-t border-background-300 pt-6 space-y-4">
                <h4 className="font-medium text-typography-950">Custom Read Call</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-typography-500 uppercase tracking-wider mb-2 block">
                      Function Name
                    </label>
                    <input
                      type="text"
                      value={functionName}
                      onChange={(e) => setFunctionName(e.target.value)}
                      placeholder="e.g., get-film"
                      className="w-full bg-background-0 border border-background-300 rounded-xl px-4 py-3 text-typography-950 placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-typography-500 uppercase tracking-wider mb-2 block">
                      Arguments (hex, comma-separated)
                    </label>
                    <input
                      type="text"
                      value={functionArgs}
                      onChange={(e) => setFunctionArgs(e.target.value)}
                      placeholder="Leave empty if none"
                      className="w-full bg-background-0 border border-background-300 rounded-xl px-4 py-3 text-typography-950 placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => handleApiCall(async () => {
                      const args = functionArgs ? functionArgs.split(",").map(s => s.trim()) : []
                      const result = await callReadOnlyFunction(
                        CINEBLOCK_ADDRESS,
                        CINEBLOCK_NAME,
                        functionName,
                        CINEBLOCK_ADDRESS,
                        args
                      )
                      if (result.okay && result.result) {
                        return { ...result, decoded: cvToJSON(deserializeCV(result.result)) }
                      }
                      return result
                    })}
                    className="py-3 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    disabled={loading || !functionName || !CINEBLOCK_ADDRESS}
                  >
                    <Play className="w-4 h-4" />
                    Execute
                  </button>
                </div>
              </div>

              {/* Preset Functions with Args */}
              <div className="border-t border-background-300 pt-6 space-y-4">
                <h4 className="font-medium text-typography-950">Preset Queries</h4>
                
                {/* Get Film */}
                <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                  <label className="text-sm font-medium text-typography-700 mb-2 flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Get Film by ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm(f => ({ ...f, filmId: e.target.value }))}
                      placeholder="Film ID"
                      className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleApiCall(async () => {
                        const result = await callReadOnlyFunction(
                          CINEBLOCK_ADDRESS,
                          CINEBLOCK_NAME,
                          "get-film",
                          CINEBLOCK_ADDRESS,
                          [`0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`]
                        )
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) }
                        }
                        return result
                      })}
                      className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                      disabled={loading || !CINEBLOCK_ADDRESS}
                    >
                      Query
                    </button>
                  </div>
                </div>

                {/* Preview Investment */}
                <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                  <label className="text-sm font-medium text-typography-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Preview Investment (USDCx)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm(f => ({ ...f, filmId: e.target.value }))}
                      placeholder="Film ID"
                      className="w-24 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      value={writeForm.investAmount}
                      onChange={(e) => setWriteForm(f => ({ ...f, investAmount: e.target.value }))}
                      placeholder="USDCx Amount"
                      className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleApiCall(async () => {
                        const usdcxMicro = parseUSDCx(writeForm.investAmount)
                        const result = await callReadOnlyFunction(
                          CINEBLOCK_ADDRESS,
                          CINEBLOCK_NAME,
                          "preview-investment",
                          CINEBLOCK_ADDRESS,
                          [
                            `0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`,
                            `0x${serializeArg(uintCV(usdcxMicro))}`
                          ]
                        )
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) }
                        }
                        return result
                      })}
                      className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                      disabled={loading || !CINEBLOCK_ADDRESS}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Check Admin */}
                <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                  <label className="text-sm font-medium text-typography-700 mb-2 block">Check Admin Status</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={writeForm.adminAddress || address || ""}
                      onChange={(e) => setWriteForm(f => ({ ...f, adminAddress: e.target.value }))}
                      placeholder="Address"
                      className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleApiCall(async () => {
                        const addr = writeForm.adminAddress || address
                        if (!addr) throw new Error("No address")
                        const result = await callReadOnlyFunction(
                          CINEBLOCK_ADDRESS,
                          CINEBLOCK_NAME,
                          "is-admin",
                          CINEBLOCK_ADDRESS,
                          [`0x${serializeArg(principalCV(addr))}`]
                        )
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) }
                        }
                        return result
                      })}
                      className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                      disabled={loading || !CINEBLOCK_ADDRESS}
                    >
                      Check
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Write Tab */}
          {activeTab === "write" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                  Write Functions
                </h3>
                {!isConnected && (
                  <span className="text-sm text-orange-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Connect wallet to execute
                  </span>
                )}
              </div>

              {/* Create Film */}
              <div className="bg-background-0 rounded-xl p-5 border border-background-300 space-y-4">
                <h4 className="font-medium text-typography-950 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-bold rounded">ADMIN</span>
                  <Film className="w-4 h-4" />
                  Create Film Project
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Title</label>
                    <input
                      type="text"
                      value={writeForm.title}
                      onChange={(e) => setWriteForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Director</label>
                    <input
                      type="text"
                      value={writeForm.director}
                      onChange={(e) => setWriteForm(f => ({ ...f, director: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-typography-500 mb-1 block">Description</label>
                    <input
                      type="text"
                      value={writeForm.description}
                      onChange={(e) => setWriteForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Funding Goal (USDCx)</label>
                    <input
                      type="number"
                      value={writeForm.fundingGoal}
                      onChange={(e) => setWriteForm(f => ({ ...f, fundingGoal: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Token Price (USDCx per token)</label>
                    <input
                      type="number"
                      value={writeForm.tokenPrice}
                      onChange={(e) => setWriteForm(f => ({ ...f, tokenPrice: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Token Symbol</label>
                    <input
                      type="text"
                      value={writeForm.tokenSymbol}
                      onChange={(e) => setWriteForm(f => ({ ...f, tokenSymbol: e.target.value }))}
                      maxLength={10}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleContractCall(() => 
                    createFilm(
                      writeForm.title,
                      writeForm.director,
                      writeForm.description,
                      parseUSDCx(writeForm.fundingGoal),
                      parseUSDCx(writeForm.tokenPrice),
                      writeForm.tokenSymbol
                    )
                  )}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
                >
                  <Send className="w-4 h-4" />
                  Create Film
                </button>
              </div>

              {/* Invest with USDCx */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-green-500/30 space-y-4">
                <h4 className="font-medium text-typography-950 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Invest with USDCx
                </h4>
                <p className="text-sm text-typography-600">
                  Invest real USDCx (Circle's bridged stablecoin) into a film project
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Film ID</label>
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm(f => ({ ...f, filmId: e.target.value }))}
                      className="w-full bg-background-0 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">USDCx Amount</label>
                    <input
                      type="number"
                      value={writeForm.investAmount}
                      onChange={(e) => setWriteForm(f => ({ ...f, investAmount: e.target.value }))}
                      className="w-full bg-background-0 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleContractCall(() => 
                    investWithUsdcx(
                      parseInt(writeForm.filmId), 
                      parseUSDCx(writeForm.investAmount),
                      address!
                    )
                  )}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
                >
                  <DollarSign className="w-4 h-4" />
                  Invest ${writeForm.investAmount} USDCx
                </button>
              </div>

              {/* Demo Invest (no token) */}
              <div className="bg-background-0 rounded-xl p-5 border border-background-300 space-y-4">
                <h4 className="font-medium text-typography-950 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs font-bold rounded">DEMO</span>
                  Invest (No Token Transfer)
                </h4>
                <p className="text-sm text-typography-500">
                  For testing - mints film tokens without actual USDCx transfer
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Film ID</label>
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm(f => ({ ...f, filmId: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Amount (micro-units)</label>
                    <input
                      type="number"
                      value={parseUSDCx(writeForm.investAmount)}
                      onChange={(e) => setWriteForm(f => ({ ...f, investAmount: (parseInt(e.target.value) / 1_000_000).toString() }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleContractCall(() => 
                    investInFilm(parseInt(writeForm.filmId), parseUSDCx(writeForm.investAmount))
                  )}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
                >
                  <Send className="w-4 h-4" />
                  Demo Invest
                </button>
              </div>

              {/* Admin Functions */}
              <div className="bg-background-0 rounded-xl p-5 border border-background-300 space-y-4">
                <h4 className="font-medium text-typography-950 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-bold rounded">ADMIN</span>
                  Admin Functions
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Add Admin Address</label>
                    <input
                      type="text"
                      value={writeForm.adminAddress}
                      onChange={(e) => setWriteForm(f => ({ ...f, adminAddress: e.target.value }))}
                      placeholder="ST..."
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleContractCall(() => addAdmin(writeForm.adminAddress))}
                      className="w-full py-2.5 bg-background-200 hover:bg-background-300 text-typography-950 rounded-xl font-medium transition-colors border border-background-300"
                      disabled={loading || !isConnected || !writeForm.adminAddress}
                    >
                      Add Admin
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Close Funding (Film ID)</label>
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm(f => ({ ...f, filmId: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleContractCall(() => closeFilmFunding(parseInt(writeForm.filmId)))}
                      className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                      disabled={loading || !isConnected}
                    >
                      Close Funding
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maps Tab */}
          {activeTab === "maps" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                Data Maps
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-typography-500 uppercase tracking-wider mb-2 block">
                    Map Name
                  </label>
                  <div className="relative">
                    <select
                      value={mapName}
                      onChange={(e) => setMapName(e.target.value)}
                      className="w-full appearance-none bg-background-0 border border-background-300 rounded-xl px-4 py-3 pr-10 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {CINEBLOCK_MAPS.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.keyType})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-typography-500 pointer-events-none" />
                  </div>
                </div>

                {/* Quick map queries */}
                {mapName === "films" && (
                  <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                    <label className="text-sm font-medium text-typography-700 mb-2 block">Query Film by ID</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={mapKey}
                        onChange={(e) => setMapKey(e.target.value)}
                        placeholder="Film ID"
                        className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleApiCall(async () => {
                          const key = tupleCV({ "film-id": uintCV(parseInt(mapKey)) })
                          const hexKey = `0x${serializeArg(key)}`
                          const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey)
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) }
                          }
                          return result
                        })}
                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                        disabled={loading || !mapKey || !CINEBLOCK_ADDRESS}
                      >
                        Query
                      </button>
                    </div>
                  </div>
                )}

                {mapName === "film-tokens" && (
                  <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                    <label className="text-sm font-medium text-typography-700 mb-2 block">Query Token by ID</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={mapKey}
                        onChange={(e) => setMapKey(e.target.value)}
                        placeholder="Token ID"
                        className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleApiCall(async () => {
                          const key = tupleCV({ "token-id": uintCV(parseInt(mapKey)) })
                          const hexKey = `0x${serializeArg(key)}`
                          const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey)
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) }
                          }
                          return result
                        })}
                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                        disabled={loading || !mapKey || !CINEBLOCK_ADDRESS}
                      >
                        Query
                      </button>
                    </div>
                  </div>
                )}

                {mapName === "admins" && (
                  <div className="bg-background-0 rounded-xl p-4 border border-background-300">
                    <label className="text-sm font-medium text-typography-700 mb-2 block">Query Admin by Address</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mapKey || address || ""}
                        onChange={(e) => setMapKey(e.target.value)}
                        placeholder="ST..."
                        className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleApiCall(async () => {
                          const addr = mapKey || address
                          if (!addr) throw new Error("No address")
                          const key = tupleCV({ "admin": principalCV(addr) })
                          const hexKey = `0x${serializeArg(key)}`
                          const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey)
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) }
                          }
                          return result
                        })}
                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                        disabled={loading || !CINEBLOCK_ADDRESS}
                      >
                        Query
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variables Tab */}
          {activeTab === "vars" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                Data Variables
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CINEBLOCK_VARS.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handleApiCall(async () => {
                      const result = await getDataVar(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, v.name)
                      if (result.data) {
                        return { ...result, decoded: cvToJSON(deserializeCV(result.data)) }
                      }
                      return result
                    })}
                    className="py-3 px-4 bg-background-200 hover:bg-background-300 text-typography-950 rounded-xl text-sm font-medium transition-colors border border-background-300 text-left"
                    disabled={loading || !CINEBLOCK_ADDRESS}
                  >
                    <div className="font-mono text-xs text-typography-500 mb-1">{v.type}</div>
                    <div>{v.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* USDCx Tab */}
          {activeTab === "usdcx" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-typography-950 font-outfit">
                    USDCx Token
                  </h3>
                  <p className="text-xs text-typography-500">
                    Circle's bridged USDC via xReserve protocol
                  </p>
                </div>
              </div>

              {/* USDCx Info */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-typography-500">Contract:</span>
                    <code className="ml-2 text-typography-700 font-mono text-xs">
                      {USDCX_ADDRESS}.{USDCX_NAME}
                    </code>
                  </div>
                  <div>
                    <span className="text-typography-500">Decimals:</span>
                    <span className="ml-2 text-typography-700">{USDCX_DECIMALS}</span>
                  </div>
                  <div>
                    <span className="text-typography-500">Asset ID:</span>
                    <code className="ml-2 text-typography-700 font-mono text-xs">
                      {USDCX_ASSET_ID}
                    </code>
                  </div>
                </div>
              </div>

              {/* Check Balance */}
              <div className="bg-background-0 rounded-xl p-5 border border-background-300 space-y-4">
                <h4 className="font-medium text-typography-950">Check USDCx Balance</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={writeForm.adminAddress || address || ""}
                    onChange={(e) => setWriteForm(f => ({ ...f, adminAddress: e.target.value }))}
                    placeholder="Address"
                    className="flex-1 bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => handleApiCall(async () => {
                      const addr = writeForm.adminAddress || address
                      if (!addr) throw new Error("No address")
                      const balances = await getAccountBalances(addr)
                      const usdcxBalance = balances.fungible_tokens?.[USDCX_ASSET_ID]?.balance || "0"
                      return {
                        address: addr,
                        usdcx_balance_micro: usdcxBalance,
                        usdcx_balance_display: `$${formatUSDCx(BigInt(usdcxBalance))} USDCx`,
                        stx_balance: balances.stx?.balance || "0",
                      }
                    })}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    disabled={loading}
                  >
                    Check Balance
                  </button>
                </div>
              </div>

              {/* Transfer USDCx */}
              <div className="bg-background-0 rounded-xl p-5 border border-background-300 space-y-4">
                <h4 className="font-medium text-typography-950">Transfer USDCx</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Amount (USDCx)</label>
                    <input
                      type="number"
                      value={writeForm.usdcxAmount}
                      onChange={(e) => setWriteForm(f => ({ ...f, usdcxAmount: e.target.value }))}
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-typography-500 mb-1 block">Recipient</label>
                    <input
                      type="text"
                      value={writeForm.usdcxRecipient}
                      onChange={(e) => setWriteForm(f => ({ ...f, usdcxRecipient: e.target.value }))}
                      placeholder="ST..."
                      className="w-full bg-background-100 border border-background-300 rounded-xl px-4 py-2.5 text-typography-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleContractCall(() => 
                    transferUsdcx(parseUSDCx(writeForm.usdcxAmount), address!, writeForm.usdcxRecipient)
                  )}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={loading || !isConnected || !writeForm.usdcxRecipient}
                >
                  <Send className="w-4 h-4" />
                  Transfer ${writeForm.usdcxAmount} USDCx
                </button>
              </div>

              {/* Bridge Info */}
              <div className="bg-background-200/50 rounded-xl p-4 border border-background-300">
                <h4 className="font-medium text-typography-950 mb-2">About USDCx Bridge</h4>
                <p className="text-sm text-typography-600 mb-3">
                  USDCx is bridged from Ethereum via Circle's xReserve protocol. Deposits are initiated on Ethereum and automatically minted on Stacks.
                </p>
                <a 
                  href="https://docs.stacks.co/more-guides/bridging-usdcx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  Learn more about bridging USDCx
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="bg-background-950 rounded-2xl border border-background-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-background-800">
            <span className="text-sm font-medium text-typography-400">Output</span>
            <div className="flex items-center gap-2">
              {output?.txId && (
                <a
                  href={getExplorerUrl(output.txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {output && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(output, null, 2))}
                  className="p-1.5 hover:bg-background-800 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-typography-500" />
                </button>
              )}
              <button
                onClick={() => setOutput(null)}
                className="p-1.5 hover:bg-background-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-typography-500" />
              </button>
            </div>
          </div>
          <div className="p-4 min-h-[200px] max-h-[400px] overflow-auto">
            {loading && (
              <div className="flex items-center gap-3 text-primary-400">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
            {!loading && output?.success === false && (
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-mono">{output.error}</span>
              </div>
            )}
            {!loading && output?.success && output.txId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Transaction Submitted</span>
                </div>
                <code className="text-xs font-mono text-typography-400 break-all block">
                  {output.txId}
                </code>
              </div>
            )}
            {!loading && output?.success && output.data !== undefined && (
              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                {JSON.stringify(output.data as object, null, 2)}
              </pre>
            )}
            {!loading && !output && (
              <span className="text-sm text-typography-600 italic">
                Output will appear here...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractTester
