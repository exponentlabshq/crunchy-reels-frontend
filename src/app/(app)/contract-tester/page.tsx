"use client";

import { useState } from "react";
import {
  Code2,
  FileCode,
  Database,
  Play,
  Send,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Film,
  Sparkles,
  ArrowDownToLine,
  Banknote,
  User,
  ShieldAlert,
  AlertTriangle,
  Settings,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStacksWallet } from "@/context/StacksWalletContext";
import { serializeCV, deserializeCV, cvToJSON, uintCV, principalCV, tupleCV, type ClarityValue } from "@stacks/transactions";
import {
  getContractInterface,
  getContractSource,
  getMapEntry,
  getDataVar,
  callReadOnlyFunction,
  getExplorerUrl,
  bytesToHex,
  getAccountBalances,
} from "@/utils/stacksApi";
import {
  SHORTSTARTER_ADDRESS,
  SHORTSTARTER_NAME,
  USDCX_ADDRESS,
  USDCX_NAME,
  USDCX_ASSET_ID,
  SHORTSTARTER_FUNCTIONS,
  SHORTSTARTER_MAPS,
  SHORTSTARTER_VARS,
  formatUSDCx,
  parseUSDCx,
  USDCX_DECIMALS,
} from "@/utils/contractConfig";
import {
  createFilm,
  investInFilm,
  investWithUsdcx,
  addAdmin,
  closeFilmFunding,
  transferUsdcx,
  setUsdcxContract,
  depositRevenue,
  claimRevenue,
  withdrawAndClaim,
  editFilm,
} from "@/utils/contractCalls";
import { USDCX } from "@/utils/contractConfig";

interface OutputResult {
  success: boolean;
  data?: unknown;
  error?: string;
  txId?: string;
}

type Tab = "user" | "admin";

export default function ContractTesterPage() {
  const { isConnected, address } = useStacksWallet();
  const [output, setOutput] = useState<OutputResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<"shortstarter" | "usdcx">("shortstarter");
  const [activeTab, setActiveTab] = useState<Tab>("user");

  // Form states
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [mapName, setMapName] = useState("films");
  const [mapKey, setMapKey] = useState("");

  // Write function form states
  const [writeForm, setWriteForm] = useState({
    title: "Indie Sci-Fi Project",
    description: "A groundbreaking independent sci-fi film funded by USDCx",
    maxSupply: "1000000",
    tokenSymbol: "ISF1",
    filmId: "1",
    investAmount: "500",
    tokenId: "1",
    recipient: "",
    adminAddress: "",
    usdcxAmount: "100",
    usdcxRecipient: "",
    revenueAmount: "1000",
    // Edit film form fields
    editFilmId: "1",
    editTitle: "",
    editDescription: "",
  });

  // USDCx contract config state
  const [selectedUsdcxNetwork, setSelectedUsdcxNetwork] = useState<"mainnet" | "testnet">("testnet");
  const [currentUsdcxContract, setCurrentUsdcxContract] = useState<string>("");
  
  const usdcxContractOptions = {
    mainnet: `${USDCX.mainnet.ADDRESS}.${USDCX.mainnet.NAME}`,
    testnet: `${USDCX.testnet.ADDRESS}.${USDCX.testnet.NAME}`,
  };

  const contractAddress = selectedContract === "shortstarter" ? SHORTSTARTER_ADDRESS : USDCX_ADDRESS;
  const contractName = selectedContract === "shortstarter" ? SHORTSTARTER_NAME : USDCX_NAME;

  async function handleApiCall(callFn: () => Promise<unknown>) {
    setLoading(true);
    setOutput(null);
    try {
      const result = await callFn();
      setOutput({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setOutput({ success: false, error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleContractCall(callFn: () => Promise<string>) {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    setLoading(true);
    setOutput(null);
    try {
      const txId = await callFn();
      setOutput({ success: true, txId });
      toast.success("Transaction submitted!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setOutput({ success: false, error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  function serializeArg(cv: ClarityValue): string {
    const serialized = serializeCV(cv);
    return typeof serialized === "string" ? serialized : bytesToHex(serialized);
  }

  // Consistent styling
  const inputClass = "w-full bg-background-0 border border-background-300 rounded-lg px-3 py-2 text-sm text-typography-950 placeholder:text-typography-400 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const btnBase = "px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5";
  const btnPrimary = `${btnBase} bg-primary-500 hover:bg-primary-600 text-white`;
  const btnSecondary = `${btnBase} bg-background-200 hover:bg-background-300 text-typography-950 border border-background-300`;
  const btnGreen = `${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`;
  const btnOrange = `${btnBase} bg-amber-600 hover:bg-amber-700 text-white`;
  const btnRed = `${btnBase} bg-red-600 hover:bg-red-700 text-white`;
  const cardClass = "bg-background-100 border border-background-300 rounded-xl p-4";
  const labelClass = "text-[10px] font-semibold text-typography-500 uppercase tracking-wider mb-1.5 block";

  function CardHeader({ icon: Icon, title, badge, badgeColor = "green" }: { icon: React.ElementType; title: string; badge?: string; badgeColor?: "green" | "amber" | "red" }) {
    const badgeColors = {
      green: "bg-emerald-500/20 text-emerald-500",
      amber: "bg-amber-500/20 text-amber-500",
      red: "bg-red-500/20 text-red-500",
    };
    return (
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-background-300">
        <div className="w-7 h-7 rounded-lg bg-background-200 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-typography-600" />
        </div>
        <span className="text-sm font-semibold text-typography-950">{title}</span>
        {badge && (
          <span className={`ml-auto px-2 py-0.5 text-[9px] font-bold rounded ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-4">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-typography-950">Contract Tester</h1>
              <p className="text-xs text-emerald-500 font-medium">ShortStarter • USDCx on Stacks</p>
            </div>
          </div>
          {!isConnected && (
            <span className="text-xs text-amber-500 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              Wallet not connected
            </span>
          )}
        </div>

        {/* Contract Selector */}
        {contractAddress.length === 0 && (
          <div className="mb-4">
            <p className="text-xs text-red-500 font-mono bg-red-500/10 px-3 py-2 rounded-lg">
              No contract address found for ShortStarter
            </p>
          </div>
        )}
        <div className={`${cardClass} mb-4`}>
          <div className="flex items-center gap-4">
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value as "shortstarter" | "usdcx")}
              className="appearance-none bg-background-0 border border-background-300 rounded-lg px-3 py-2 text-sm text-typography-950 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="shortstarter">🎬 ShortStarter</option>
              <option value="usdcx">💵 USDCx</option>
            </select>
            <code className="flex-1 text-xs text-typography-500 font-mono truncate bg-background-0 px-3 py-2 rounded-lg border border-background-200">
              {contractAddress}.{contractName}
            </code>
            <button
              onClick={() => copyToClipboard(`${contractAddress}.${contractName}`)}
              className={btnSecondary}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("user")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "user"
                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                : "bg-background-100 text-typography-600 hover:bg-background-200 border border-background-300"
            }`}
          >
            <User className="w-4 h-4" />
            User Functions
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "admin"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-background-100 text-typography-600 hover:bg-background-200 border border-background-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin Functions
          </button>
        </div>

        {/* Admin Warning Banner */}
        {activeTab === "admin" && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-500 mb-1">Admin-Only Functions</h4>
              <p className="text-xs text-typography-600">
                These functions require admin privileges. Transactions will <strong className="text-amber-500">fail</strong> if 
                your connected wallet is not an admin. Use the &quot;Is Admin?&quot; check in User Functions to verify your status.
              </p>
            </div>
          </div>
        )}

        {/* USER TAB CONTENT */}
        {activeTab === "user" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Column 1: Interface & Read */}
            <div className="space-y-4">
              {/* Interface */}
              <div className={cardClass}>
                <CardHeader icon={Code2} title="Contract Interface" />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApiCall(() => getContractInterface(contractAddress, contractName))}
                    className={btnPrimary}
                    disabled={loading || !contractAddress}
                  >
                    Fetch ABI
                  </button>
                  <button
                    onClick={() => handleApiCall(() => getContractSource(contractAddress, contractName))}
                    className={btnSecondary}
                    disabled={loading || !contractAddress}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    Source
                  </button>
                </div>
              </div>

              {/* Read-Only Quick */}
              <div className={cardClass}>
                <CardHeader icon={Play} title="Read-Only Functions" />
                <div className="flex flex-wrap gap-2 mb-4">
                  {SHORTSTARTER_FUNCTIONS.readOnly
                    .filter((fn) => fn.args.length === 0)
                    .map((fn) => (
                      <button
                        key={fn.name}
                        onClick={() =>
                          handleApiCall(async () => {
                            const result = await callReadOnlyFunction(
                              SHORTSTARTER_ADDRESS,
                              SHORTSTARTER_NAME,
                              fn.name,
                              SHORTSTARTER_ADDRESS,
                              []
                            );
                            if (result.okay && result.result) {
                              return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                            }
                            return result;
                          })
                        }
                        className={btnSecondary}
                        disabled={loading || !SHORTSTARTER_ADDRESS}
                      >
                        {fn.name}
                      </button>
                    ))}
                </div>

                {/* Get Film */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={writeForm.filmId}
                    onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                    placeholder="Film ID"
                    className={`${inputClass} w-24`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const result = await callReadOnlyFunction(
                          SHORTSTARTER_ADDRESS,
                          SHORTSTARTER_NAME,
                          "get-film",
                          SHORTSTARTER_ADDRESS,
                          [`0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`]
                        );
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                        }
                        return result;
                      })
                    }
                    className={btnPrimary}
                    disabled={loading || !SHORTSTARTER_ADDRESS}
                  >
                    Get Film
                  </button>
                </div>

                {/* Preview Purchase */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={writeForm.investAmount}
                    onChange={(e) => setWriteForm((f) => ({ ...f, investAmount: e.target.value }))}
                    placeholder="USDCx"
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const usdcxMicro = parseUSDCx(writeForm.investAmount);
                        const result = await callReadOnlyFunction(
                          SHORTSTARTER_ADDRESS,
                          SHORTSTARTER_NAME,
                          "preview-purchase",
                          SHORTSTARTER_ADDRESS,
                          [
                            `0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`,
                            `0x${serializeArg(uintCV(usdcxMicro))}`,
                          ]
                        );
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                        }
                        return result;
                      })
                    }
                    className={btnGreen}
                    disabled={loading || !SHORTSTARTER_ADDRESS}
                  >
                    Preview
                  </button>
                </div>

                {/* Check Admin */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={writeForm.adminAddress || address || ""}
                    onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                    placeholder="Address"
                    className={`${inputClass} flex-1 font-mono text-[11px]`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const addr = writeForm.adminAddress || address;
                        if (!addr) throw new Error("No address");
                        const result = await callReadOnlyFunction(
                          SHORTSTARTER_ADDRESS,
                          SHORTSTARTER_NAME,
                          "is-admin",
                          SHORTSTARTER_ADDRESS,
                          [`0x${serializeArg(principalCV(addr))}`]
                        );
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                        }
                        return result;
                      })
                    }
                    className={btnPrimary}
                    disabled={loading || !SHORTSTARTER_ADDRESS}
                  >
                    Is Admin?
                  </button>
                </div>

                {/* Revenue Functions */}
                <div className="mt-4 pt-4 border-t border-background-300">
                  <p className="text-[10px] text-typography-500 mb-3 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Revenue Queries
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                      placeholder="Film ID"
                      className={`${inputClass} w-24`}
                    />
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const result = await callReadOnlyFunction(
                            SHORTSTARTER_ADDRESS,
                            SHORTSTARTER_NAME,
                            "get-film-revenue",
                            SHORTSTARTER_ADDRESS,
                            [`0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`]
                          );
                          if (result.okay && result.result) {
                            const decoded = cvToJSON(deserializeCV(result.result));
                            return { 
                              ...result, 
                              decoded,
                              formatted: {
                                "total-deposited": formatUSDCx(BigInt(decoded?.["total-deposited"]?.value ?? 0)),
                                "total-claimed": formatUSDCx(BigInt(decoded?.["total-claimed"]?.value ?? 0)),
                              }
                            };
                          }
                          return result;
                        })
                      }
                      className={btnGreen}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                    >
                      Film Revenue
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const addr = writeForm.adminAddress || address;
                          if (!addr) throw new Error("No address");
                          const result = await callReadOnlyFunction(
                            SHORTSTARTER_ADDRESS,
                            SHORTSTARTER_NAME,
                            "get-claimable-revenue",
                            SHORTSTARTER_ADDRESS,
                            [
                              `0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`,
                              `0x${serializeArg(principalCV(addr))}`,
                            ]
                          );
                          if (result.okay && result.result) {
                            const decoded = cvToJSON(deserializeCV(result.result));
                            return { 
                              ...result, 
                              decoded,
                              claimable_usdcx: formatUSDCx(BigInt(decoded?.value ?? 0)),
                            };
                          }
                          return result;
                        })
                      }
                      className={btnGreen}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                    >
                      Claimable
                    </button>
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const addr = writeForm.adminAddress || address;
                          if (!addr) throw new Error("No address");
                          const result = await callReadOnlyFunction(
                            SHORTSTARTER_ADDRESS,
                            SHORTSTARTER_NAME,
                            "preview-withdrawal",
                            SHORTSTARTER_ADDRESS,
                            [
                              `0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`,
                              `0x${serializeArg(principalCV(addr))}`,
                            ]
                          );
                          if (result.okay && result.result) {
                            const decoded = cvToJSON(deserializeCV(result.result));
                            return { 
                              ...result, 
                              decoded,
                              formatted: {
                                "token-balance": formatUSDCx(BigInt(decoded?.["token-balance"]?.value ?? 0)),
                                "principal-return": formatUSDCx(BigInt(decoded?.["principal-return"]?.value ?? 0)),
                                "pending-earnings": formatUSDCx(BigInt(decoded?.["pending-earnings"]?.value ?? 0)),
                                "total-payout": formatUSDCx(BigInt(decoded?.["total-payout"]?.value ?? 0)),
                              }
                            };
                          }
                          return result;
                        })
                      }
                      className={btnSecondary}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Custom Read Call */}
                <div className="mt-4 pt-4 border-t border-background-300">
                  <p className="text-[10px] text-typography-500 mb-3 font-semibold uppercase tracking-wider">Custom Call</p>
                  <input
                    type="text"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    placeholder="function-name"
                    className={`${inputClass} mb-2`}
                  />
                  <input
                    type="text"
                    value={functionArgs}
                    onChange={(e) => setFunctionArgs(e.target.value)}
                    placeholder="args (hex, comma-sep)"
                    className={`${inputClass} mb-2`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const args = functionArgs ? functionArgs.split(",").map((s) => s.trim()) : [];
                        const result = await callReadOnlyFunction(
                          SHORTSTARTER_ADDRESS,
                          SHORTSTARTER_NAME,
                          functionName,
                          SHORTSTARTER_ADDRESS,
                          args
                        );
                        if (result.okay && result.result) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                        }
                        return result;
                      })
                    }
                    className={`${btnPrimary} w-full`}
                    disabled={loading || !functionName || !SHORTSTARTER_ADDRESS}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Execute
                  </button>
                </div>
              </div>

              {/* Data Variables */}
              <div className={cardClass}>
                <CardHeader icon={FileCode} title="Data Variables" />
                <div className="flex flex-wrap gap-2">
                  {SHORTSTARTER_VARS.map((v) => (
                    <button
                      key={v.name}
                      onClick={() =>
                        handleApiCall(async () => {
                          const result = await getDataVar(SHORTSTARTER_ADDRESS, SHORTSTARTER_NAME, v.name);
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                          }
                          return result;
                        })
                      }
                      className={btnSecondary}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                      title={v.type}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: User Write Functions */}
            <div className="space-y-4">
              {/* Invest with USDCx */}
              <div className={cardClass}>
                <CardHeader icon={DollarSign} title="Invest USDCx" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Film ID</label>
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input
                      type="number"
                      value={writeForm.investAmount}
                      onChange={(e) => setWriteForm((f) => ({ ...f, investAmount: e.target.value }))}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      investWithUsdcx(parseInt(writeForm.filmId), parseUSDCx(writeForm.investAmount), address!)
                    )
                  }
                  className={`${btnGreen} w-full`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                >
                  Invest ${writeForm.investAmount} USDCx
                </button>
              </div>

              {/* Demo Invest */}
              <div className={cardClass}>
                <CardHeader icon={Sparkles} title="Demo Invest" badge="DEMO" badgeColor="amber" />
                <p className="text-xs text-typography-500 mb-3">Mints tokens without USDCx transfer for testing</p>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      investInFilm(parseInt(writeForm.filmId), parseUSDCx(writeForm.investAmount), address!)
                    )
                  }
                  className={`${btnOrange} w-full`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                >
                  Demo Invest
                </button>
              </div>

              {/* Claim & Withdraw */}
              <div className={cardClass}>
                <CardHeader icon={Sparkles} title="Claim & Withdraw" />
                
                {/* Claim Revenue */}
                <div className="mb-4">
                  <p className="text-xs text-typography-500 mb-2">
                    Claim your pending revenue earnings from a film.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                      placeholder="Film ID"
                      className={`${inputClass} w-24`}
                    />
                    <button
                      onClick={() =>
                        handleContractCall(() => claimRevenue(parseInt(writeForm.filmId), address!))
                      }
                      className={`${btnGreen} flex-1`}
                      disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Claim Revenue
                    </button>
                  </div>
                </div>

                {/* Withdraw Position */}
                <div className="pt-4 border-t border-background-300">
                  <p className="text-xs text-typography-500 mb-2">
                    Close position: claims revenue + returns principal. Burns tokens.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                      placeholder="Film ID"
                      className={`${inputClass} w-24`}
                    />
                    <button
                      onClick={() =>
                        handleContractCall(() => withdrawAndClaim(parseInt(writeForm.filmId), address!))
                      }
                      className={`${btnSecondary} flex-1`}
                      disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Withdraw All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Maps & USDCx */}
            <div className="space-y-4">
              {/* Data Maps */}
              <div className={cardClass}>
                <CardHeader icon={Database} title="Data Maps" />
                <select
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  className={`${inputClass} mb-3`}
                >
                  {SHORTSTARTER_MAPS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.keyType})
                    </option>
                  ))}
                </select>

                {mapName === "films" && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={mapKey}
                      onChange={(e) => setMapKey(e.target.value)}
                      placeholder="Film ID"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const key = tupleCV({ "film-id": uintCV(parseInt(mapKey)) });
                          const hexKey = `0x${serializeArg(key)}`;
                          const result = await getMapEntry(SHORTSTARTER_ADDRESS, SHORTSTARTER_NAME, mapName, hexKey);
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                          }
                          return result;
                        })
                      }
                      className={btnPrimary}
                      disabled={loading || !mapKey || !SHORTSTARTER_ADDRESS}
                    >
                      Query
                    </button>
                  </div>
                )}

                {mapName === "film-tokens" && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={mapKey}
                      onChange={(e) => setMapKey(e.target.value)}
                      placeholder="Token ID"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const key = tupleCV({ "token-id": uintCV(parseInt(mapKey)) });
                          const hexKey = `0x${serializeArg(key)}`;
                          const result = await getMapEntry(SHORTSTARTER_ADDRESS, SHORTSTARTER_NAME, mapName, hexKey);
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                          }
                          return result;
                        })
                      }
                      className={btnPrimary}
                      disabled={loading || !mapKey || !SHORTSTARTER_ADDRESS}
                    >
                      Query
                    </button>
                  </div>
                )}

                {mapName === "admins" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mapKey || address || ""}
                      onChange={(e) => setMapKey(e.target.value)}
                      placeholder="ST..."
                      className={`${inputClass} flex-1 font-mono text-[11px]`}
                    />
                    <button
                      onClick={() =>
                        handleApiCall(async () => {
                          const addr = mapKey || address;
                          if (!addr) throw new Error("No address");
                          const key = tupleCV({ admin: principalCV(addr) });
                          const hexKey = `0x${serializeArg(key)}`;
                          const result = await getMapEntry(SHORTSTARTER_ADDRESS, SHORTSTARTER_NAME, mapName, hexKey);
                          if (result.data) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                          }
                          return result;
                        })
                      }
                      className={btnPrimary}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                    >
                      Query
                    </button>
                  </div>
                )}
              </div>

              {/* USDCx Section */}
              <div className={cardClass}>
                <CardHeader icon={DollarSign} title="USDCx Token" />
                <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-background-0 rounded-lg p-3 border border-background-200">
                  <div>
                    <span className="text-typography-500">Decimals:</span>
                    <span className="ml-1 text-typography-950 font-medium">{USDCX_DECIMALS}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-typography-500">Asset:</span>
                    <code className="ml-1 text-typography-700 font-mono text-[10px]">{USDCX_ASSET_ID.slice(0, 16)}...</code>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={writeForm.adminAddress || address || ""}
                    onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                    placeholder="Address"
                    className={`${inputClass} flex-1 font-mono text-[11px]`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const addr = writeForm.adminAddress || address;
                        if (!addr) throw new Error("No address");
                        const balances = (await getAccountBalances(addr)) as {
                          fungible_tokens?: Record<string, { balance: string }>;
                          stx?: { balance: string };
                        };
                        const usdcxBalance = balances.fungible_tokens?.[USDCX_ASSET_ID]?.balance ?? "0";
                        return {
                          address: addr,
                          usdcx_balance_micro: usdcxBalance,
                          usdcx_balance_display: `$${formatUSDCx(BigInt(usdcxBalance))} USDCx`,
                          stx_balance: balances.stx?.balance ?? "0",
                        };
                      })
                    }
                    className={btnGreen}
                    disabled={loading}
                  >
                    Balance
                  </button>
                </div>

                {/* Transfer */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input
                      type="number"
                      value={writeForm.usdcxAmount}
                      onChange={(e) => setWriteForm((f) => ({ ...f, usdcxAmount: e.target.value }))}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Recipient</label>
                    <input
                      type="text"
                      value={writeForm.usdcxRecipient}
                      onChange={(e) => setWriteForm((f) => ({ ...f, usdcxRecipient: e.target.value }))}
                      placeholder="ST..."
                      className={`${inputClass} font-mono text-[11px]`}
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      transferUsdcx(parseUSDCx(writeForm.usdcxAmount), address!, writeForm.usdcxRecipient, address!)
                    )
                  }
                  className={`${btnGreen} w-full`}
                  disabled={loading || !isConnected || !writeForm.usdcxRecipient}
                >
                  Transfer ${writeForm.usdcxAmount}
                </button>
              </div>

              {/* Bridge Info */}
              <div className={cardClass}>
                <h4 className="text-sm font-semibold text-typography-950 mb-2">USDCx Bridge</h4>
                <p className="text-xs text-typography-600 mb-3">
                  Bridged from Ethereum via Circle&apos;s xReserve protocol.
                </p>
                <a
                  href="https://docs.stacks.co/more-guides/bridging-usdcx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                >
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TAB CONTENT */}
        {activeTab === "admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Column 1: Admin Setup */}
            <div className="space-y-4">
              {/* Set USDCx Contract (Owner) */}
              <div className={cardClass}>
                <CardHeader icon={Settings} title="USDCx Contract Config" badge="OWNER" badgeColor="amber" />
                <p className="text-xs text-typography-500 mb-3">
                  Configure the official USDCx contract address. Required before token purchases.
                </p>
                <div className="mb-3">
                  <label className={labelClass}>USDCx Contract</label>
                  <select
                    value={selectedUsdcxNetwork}
                    onChange={(e) => setSelectedUsdcxNetwork(e.target.value as "mainnet" | "testnet")}
                    className={inputClass}
                  >
                    <option value="testnet">🧪 Testnet</option>
                    <option value="mainnet">🌐 Mainnet</option>
                  </select>
                </div>
                <code className="block text-[10px] text-typography-500 font-mono break-all mb-3 bg-background-0 p-2 rounded-lg border border-background-200">
                  {usdcxContractOptions[selectedUsdcxNetwork]}
                </code>
                <button
                  onClick={() =>
                    handleContractCall(() => setUsdcxContract(usdcxContractOptions[selectedUsdcxNetwork], address!))
                  }
                  className={`${btnOrange} w-full mb-4`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                >
                  <Send className="w-3.5 h-3.5" />
                  Set USDCx Contract
                </button>
                
                {/* Fetch Current USDCx Contract */}
                <div className="border-t border-background-300 pt-4">
                  <label className={labelClass}>Current Configured USDCx</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentUsdcxContract}
                      readOnly
                      placeholder="Click fetch to load..."
                      className={`${inputClass} flex-1 bg-background-50 cursor-default`}
                    />
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const result = await callReadOnlyFunction(
                            SHORTSTARTER_ADDRESS,
                            SHORTSTARTER_NAME,
                            "get-usdcx-contract",
                            SHORTSTARTER_ADDRESS,
                            []
                          );
                          if (result.okay && result.result) {
                            const decoded = deserializeCV(result.result);
                            const json = cvToJSON(decoded);
                            const value = json?.value ?? "none";
                            setCurrentUsdcxContract(typeof value === "string" ? value : JSON.stringify(value));
                          } else {
                            setCurrentUsdcxContract("Error fetching");
                          }
                        } catch (err) {
                          setCurrentUsdcxContract("Error: " + (err instanceof Error ? err.message : "Unknown"));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={btnSecondary}
                      disabled={loading || !SHORTSTARTER_ADDRESS}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Admin Management */}
              <div className={cardClass}>
                <CardHeader icon={ShieldAlert} title="Admin Management" badge="ADMIN" badgeColor="green" />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={writeForm.adminAddress}
                    onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                    placeholder="ST..."
                    className={`${inputClass} flex-1 font-mono text-[11px]`}
                  />
                  <button
                    onClick={() => handleContractCall(() => addAdmin(writeForm.adminAddress, address!))}
                    className={btnPrimary}
                    disabled={loading || !isConnected || !writeForm.adminAddress}
                  >
                    Add Admin
                  </button>
                </div>
              </div>

              {/* Close Funding */}
              <div className={cardClass}>
                <CardHeader icon={XCircle} title="Close Film Funding" badge="ADMIN" badgeColor="red" />
                <p className="text-xs text-typography-500 mb-3">
                  Permanently close funding for a film. No more investments will be accepted.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={writeForm.filmId}
                    onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                    placeholder="Film ID"
                    className={`${inputClass} w-28`}
                  />
                  <button
                    onClick={() => handleContractCall(() => closeFilmFunding(parseInt(writeForm.filmId), address!))}
                    className={`${btnRed} flex-1`}
                    disabled={loading || !isConnected}
                  >
                    Close Funding
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Film & Revenue */}
            <div className="space-y-4">
              {/* Create Film */}
              <div className={cardClass}>
                <CardHeader icon={Film} title="Create Film" badge="ADMIN" badgeColor="green" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      type="text"
                      value={writeForm.title}
                      onChange={(e) => setWriteForm((f) => ({ ...f, title: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Symbol</label>
                    <input
                      type="text"
                      value={writeForm.tokenSymbol}
                      onChange={(e) => setWriteForm((f) => ({ ...f, tokenSymbol: e.target.value }))}
                      maxLength={10}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Description</label>
                  <input
                    type="text"
                    value={writeForm.description}
                    onChange={(e) => setWriteForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Max Supply (tokens)</label>
                  <input
                    type="number"
                    value={writeForm.maxSupply}
                    onChange={(e) => setWriteForm((f) => ({ ...f, maxSupply: e.target.value }))}
                    className={`${inputClass} font-mono`}
                  />
                  <p className="text-[10px] text-typography-500 mt-1">Total tokens available for purchase (1:1 with USDCx)</p>
                </div>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      createFilm(
                        writeForm.title,
                        writeForm.tokenSymbol,
                        writeForm.description,
                        parseUSDCx(writeForm.maxSupply),
                        address!
                      )
                    )
                  }
                  className={`${btnPrimary} w-full`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                >
                  <Send className="w-3.5 h-3.5" />
                  Create Film
                </button>
              </div>

              {/* Edit Film */}
              <div className={cardClass}>
                <CardHeader icon={Film} title="Edit Film" badge="ADMIN" badgeColor="amber" />
                <p className="text-xs text-typography-500 mb-3">
                  Edit an existing film&apos;s title and description. Cap cannot be changed.
                </p>
                <div className="mb-3">
                  <label className={labelClass}>Film ID</label>
                  <input
                    type="number"
                    value={writeForm.editFilmId}
                    onChange={(e) => setWriteForm((f) => ({ ...f, editFilmId: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>New Title</label>
                  <input
                    type="text"
                    value={writeForm.editTitle}
                    onChange={(e) => setWriteForm((f) => ({ ...f, editTitle: e.target.value }))}
                    placeholder="Enter new title..."
                    className={inputClass}
                  />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>New Description</label>
                  <input
                    type="text"
                    value={writeForm.editDescription}
                    onChange={(e) => setWriteForm((f) => ({ ...f, editDescription: e.target.value }))}
                    placeholder="Enter new description..."
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      editFilm(
                        parseInt(writeForm.editFilmId),
                        writeForm.editTitle,
                        writeForm.editDescription,
                        address!
                      )
                    )
                  }
                  className={`${btnOrange} w-full`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS || !writeForm.editTitle || !writeForm.editDescription}
                >
                  <Send className="w-3.5 h-3.5" />
                  Edit Film
                </button>
              </div>

              {/* Revenue Distribution (Admin) */}
              <div className={cardClass}>
                <CardHeader icon={Banknote} title="Deposit Revenue" badge="ADMIN" badgeColor="amber" />
                <p className="text-xs text-typography-500 mb-3">
                  Distribute film earnings to token holders. Revenue is split proportionally.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Film ID</label>
                    <input
                      type="number"
                      value={writeForm.filmId}
                      onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Revenue (USDCx)</label>
                    <input
                      type="number"
                      value={writeForm.revenueAmount}
                      onChange={(e) => setWriteForm((f) => ({ ...f, revenueAmount: e.target.value }))}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleContractCall(() =>
                      depositRevenue(parseInt(writeForm.filmId), parseUSDCx(writeForm.revenueAmount), address!)
                    )
                  }
                  className={`${btnOrange} w-full`}
                  disabled={loading || !isConnected || !SHORTSTARTER_ADDRESS}
                >
                  <Send className="w-3.5 h-3.5" />
                  Deposit ${writeForm.revenueAmount} Revenue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Output Panel */}
        <div className="bg-background-950 rounded-xl border border-background-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-background-800">
            <span className="text-sm font-medium text-typography-400">Output</span>
            <div className="flex items-center gap-2">
              {output?.txId && (
                <a
                  href={getExplorerUrl(output.txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {output && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(output, null, 2))}
                  className="p-1.5 hover:bg-background-800 rounded transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-typography-500" />
                </button>
              )}
              <button
                onClick={() => setOutput(null)}
                className="p-1.5 hover:bg-background-800 rounded transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-typography-500" />
              </button>
            </div>
          </div>
          <div className="p-4 min-h-[140px] max-h-[280px] overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 text-primary-400">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
            {!loading && output?.success === false && (
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-sm font-mono">{output.error}</span>
              </div>
            )}
            {!loading && output?.success && output.txId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Transaction Submitted</span>
                </div>
                <code className="text-xs font-mono text-typography-400 break-all block bg-background-900 p-2 rounded">{output.txId}</code>
              </div>
            )}
            {!loading && output?.success && output.data !== undefined && (
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(output.data as object, null, 2)}
              </pre>
            )}
            {!loading && !output && (
              <span className="text-sm text-typography-600 italic">Output will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
