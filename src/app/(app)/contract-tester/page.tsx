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
  ChevronDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Film,
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
} from "@/utils/contractConfig";
import {
  createFilm,
  investInFilm,
  investWithUsdcx,
  addAdmin,
  closeFilmFunding,
  transferUsdcx,
  setUsdcxContract,
} from "@/utils/contractCalls";
import { USDCX } from "@/utils/contractConfig";

interface OutputResult {
  success: boolean;
  data?: unknown;
  error?: string;
  txId?: string;
}

export default function ContractTesterPage() {
  const { isConnected, address } = useStacksWallet();
  const [output, setOutput] = useState<OutputResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<"cineblock" | "usdcx">("cineblock");

  // Form states
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [mapName, setMapName] = useState("films");
  const [mapKey, setMapKey] = useState("");

  // Write function form states
  const [writeForm, setWriteForm] = useState({
    title: "Indie Sci-Fi Project",
    description: "A groundbreaking independent sci-fi film funded by USDCx",
    maxSupply: "1000000", // Total tokens available (in micro-units with 6 decimals)
    tokenSymbol: "ISF1",
    filmId: "1",
    investAmount: "500",
    tokenId: "1",
    recipient: "",
    adminAddress: "",
    usdcxAmount: "100",
    usdcxRecipient: "",
  });

  // USDCx contract config state
  const [selectedUsdcxNetwork, setSelectedUsdcxNetwork] = useState<"mainnet" | "testnet">("testnet");
  const [currentUsdcxContract, setCurrentUsdcxContract] = useState<string>("");
  
  const usdcxContractOptions = {
    mainnet: `${USDCX.mainnet.ADDRESS}.${USDCX.mainnet.NAME}`,
    testnet: `${USDCX.testnet.ADDRESS}.${USDCX.testnet.NAME}`,
  };

  const contractAddress = selectedContract === "cineblock" ? CINEBLOCK_ADDRESS : USDCX_ADDRESS;
  const contractName = selectedContract === "cineblock" ? CINEBLOCK_NAME : USDCX_NAME;

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

  const inputClass = "w-full bg-background-0 border border-background-300 rounded-lg px-2.5 py-1.5 text-sm text-typography-950 placeholder:text-typography-400 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const btnSmall = "px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors";
  const btnPrimary = `${btnSmall} bg-primary-500 hover:bg-primary-600 text-white`;
  const btnSecondary = `${btnSmall} bg-background-200 hover:bg-background-300 text-typography-950 border border-background-300`;
  const btnGreen = `${btnSmall} bg-green-500 hover:bg-green-600 text-white`;
  const btnOrange = `${btnSmall} bg-orange-500 hover:bg-orange-600 text-white`;
  const btnRed = `${btnSmall} bg-red-500 hover:bg-red-600 text-white`;
  const sectionClass = "bg-background-100 border border-background-300 rounded-xl p-3";
  const labelClass = "text-[10px] font-bold text-typography-500 uppercase tracking-wider mb-1 block";

  return (
    <div className="min-h-screen flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-4">
      <div className="max-w-7xl mx-auto px-3 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-typography-950 font-sans">Contract Tester</h1>
              <p className="text-[10px] text-green-500 font-medium">USDCx on Stacks</p>
            </div>
          </div>
          {!isConnected && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Wallet not connected
            </span>
          )}
        </div>

        {/* Contract Selector - Compact */}
        {contractAddress.length === 0 && (
              <div>
                <p className="text-xs text-red-600 font-mono">No contract address found for Cineblock</p>
              </div>
            )}
        <div className="bg-background-100 border border-background-300 rounded-xl p-2.5 mb-4">
          <div className="flex items-center gap-3">
     
            <div className="w-28">
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value as "cineblock" | "usdcx")}
                className=" appearance-none bg-background-0 border border-background-300 rounded-lg px-2 py-1.5 pr-6 text-sm text-typography-950 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="cineblock">🎬 CineBlock</option>
                <option value="usdcx">💵 USDCx</option>
              </select>
            </div>
            <code className="flex-1 text-xs text-typography-600 font-mono truncate">
              {contractAddress}.{contractName}
            </code>
        
            <button
              onClick={() => copyToClipboard(`${contractAddress}.${contractName}`)}
              className="p-1 hover:bg-background-200 rounded transition-colors"
            >
              <Copy className="w-3 h-3 text-typography-500" />
            </button>
          </div>
        </div>

        {/* Set USDCx Contract (Owner) */}
        <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/30 mb-4">
          <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-amber-500" /> USDCx Contract Configuration
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 text-[9px] font-bold rounded ml-auto">OWNER</span>
          </h3>
          <p className="text-[10px] text-typography-500 mb-2">
            Configure the official USDCx contract address. Required before token purchases can be made.
          </p>
          <div className="flex gap-2 items-end mb-3">
            <div className="flex-1">
              <label className={labelClass}>USDCx Contract</label>
              <select
                value={selectedUsdcxNetwork}
                onChange={(e) => setSelectedUsdcxNetwork(e.target.value as "mainnet" | "testnet")}
                className={`${inputClass} w-full`}
              >
                <option value="testnet">🧪 Testnet: {USDCX.testnet.ADDRESS}.{USDCX.testnet.NAME}</option>
                <option value="mainnet">🌐 Mainnet: {USDCX.mainnet.ADDRESS}.{USDCX.mainnet.NAME}</option>
              </select>
            </div>
            <button
              onClick={() =>
                handleContractCall(() => setUsdcxContract(usdcxContractOptions[selectedUsdcxNetwork], address!))
              }
              className={btnOrange}
              disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
            >
              <Send className="w-3 h-3 inline mr-1" /> Set USDCx
            </button>
          </div>
          <code className="block text-[10px] text-typography-500 font-mono break-all mb-3">
            {usdcxContractOptions[selectedUsdcxNetwork]}
          </code>
          
          {/* Fetch Current USDCx Contract */}
          <div className="border-t border-amber-500/20 pt-3">
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
                      CINEBLOCK_ADDRESS,
                      CINEBLOCK_NAME,
                      "get-usdcx-contract",
                      CINEBLOCK_ADDRESS,
                      []
                    );
                    if (result.okay && result.result) {
                      const decoded = deserializeCV(result.result);
                      const json = cvToJSON(decoded);
                      // Extract the principal value from the optional
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
                disabled={loading || !CINEBLOCK_ADDRESS}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {/* Column 1: Interface & Read */}
          <div className="space-y-3">
            {/* Interface */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <Code2 className="w-3 h-3" /> Interface
              </h3>
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
                  <FileCode className="w-3 h-3 inline mr-1" />
                  Source
                </button>
              </div>
            </div>

            {/* Read-Only Quick */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <Play className="w-3 h-3" /> Read-Only
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CINEBLOCK_FUNCTIONS.readOnly
                  .filter((fn) => fn.args.length === 0)
                  .map((fn) => (
                    <button
                      key={fn.name}
                      onClick={() =>
                        handleApiCall(async () => {
                          const result = await callReadOnlyFunction(
                            CINEBLOCK_ADDRESS,
                            CINEBLOCK_NAME,
                            fn.name,
                            CINEBLOCK_ADDRESS,
                            []
                          );
                          if (result.okay && result.result) {
                            return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                          }
                          return result;
                        })
                      }
                      className={btnSecondary}
                      disabled={loading || !CINEBLOCK_ADDRESS}
                    >
                      {fn.name}
                    </button>
                  ))}
              </div>

              {/* Get Film */}
              <div className="flex gap-1.5 mb-2">
                <input
                  type="number"
                  value={writeForm.filmId}
                  onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                  placeholder="Film ID"
                  className={`${inputClass} w-20`}
                />
                <button
                  onClick={() =>
                    handleApiCall(async () => {
                      const result = await callReadOnlyFunction(
                        CINEBLOCK_ADDRESS,
                        CINEBLOCK_NAME,
                        "get-film",
                        CINEBLOCK_ADDRESS,
                        [`0x${serializeArg(uintCV(parseInt(writeForm.filmId)))}`]
                      );
                      if (result.okay && result.result) {
                        return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                      }
                      return result;
                    })
                  }
                  className={btnPrimary}
                  disabled={loading || !CINEBLOCK_ADDRESS}
                >
                  Get Film
                </button>
              </div>

              {/* Preview Purchase */}
              <div className="flex gap-1.5 mb-2">
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
                        CINEBLOCK_ADDRESS,
                        CINEBLOCK_NAME,
                        "preview-purchase",
                        CINEBLOCK_ADDRESS,
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
                  disabled={loading || !CINEBLOCK_ADDRESS}
                >
                  Preview
                </button>
              </div>

              {/* Check Admin */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={writeForm.adminAddress || address || ""}
                  onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                  placeholder="Address"
                  className={`${inputClass} flex-1 font-mono text-[10px]`}
                />
                <button
                  onClick={() =>
                    handleApiCall(async () => {
                      const addr = writeForm.adminAddress || address;
                      if (!addr) throw new Error("No address");
                      const result = await callReadOnlyFunction(
                        CINEBLOCK_ADDRESS,
                        CINEBLOCK_NAME,
                        "is-admin",
                        CINEBLOCK_ADDRESS,
                        [`0x${serializeArg(principalCV(addr))}`]
                      );
                      if (result.okay && result.result) {
                        return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                      }
                      return result;
                    })
                  }
                  className={btnPrimary}
                  disabled={loading || !CINEBLOCK_ADDRESS}
                >
                  Is Admin?
                </button>
              </div>

              {/* Custom Read Call */}
              <div className="mt-3 pt-3 border-t border-background-300">
                <p className="text-[10px] text-typography-500 mb-1.5">Custom Call</p>
                <input
                  type="text"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  placeholder="function-name"
                  className={`${inputClass} mb-1.5`}
                />
                <input
                  type="text"
                  value={functionArgs}
                  onChange={(e) => setFunctionArgs(e.target.value)}
                  placeholder="args (hex, comma-sep)"
                  className={`${inputClass} mb-1.5`}
                />
                <button
                  onClick={() =>
                    handleApiCall(async () => {
                      const args = functionArgs ? functionArgs.split(",").map((s) => s.trim()) : [];
                      const result = await callReadOnlyFunction(
                        CINEBLOCK_ADDRESS,
                        CINEBLOCK_NAME,
                        functionName,
                        CINEBLOCK_ADDRESS,
                        args
                      );
                      if (result.okay && result.result) {
                        return { ...result, decoded: cvToJSON(deserializeCV(result.result)) };
                      }
                      return result;
                    })
                  }
                  className={`${btnPrimary} w-full`}
                  disabled={loading || !functionName || !CINEBLOCK_ADDRESS}
                >
                  <Play className="w-3 h-3 inline mr-1" /> Execute
                </button>
              </div>
            </div>

            {/* Data Variables */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3 h-3" /> Variables
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {CINEBLOCK_VARS.map((v) => (
                  <button
                    key={v.name}
                    onClick={() =>
                      handleApiCall(async () => {
                        const result = await getDataVar(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, v.name);
                        if (result.data) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                        }
                        return result;
                      })
                    }
                    className={btnSecondary}
                    disabled={loading || !CINEBLOCK_ADDRESS}
                    title={v.type}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Write Functions */}
          <div className="space-y-3">
            {/* Create Film */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <Film className="w-3 h-3" /> Create Film
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 text-[9px] font-bold rounded ml-auto">ADMIN</span>
              </h3>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
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
              <div className="mb-2">
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={writeForm.description}
                  onChange={(e) => setWriteForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Max Supply (tokens)</label>
                <input
                  type="number"
                  value={writeForm.maxSupply}
                  onChange={(e) => setWriteForm((f) => ({ ...f, maxSupply: e.target.value }))}
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[9px] text-typography-500 mt-0.5">Total tokens available for purchase (1:1 with USDCx)</p>
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
                disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
              >
                <Send className="w-3 h-3 inline mr-1" /> Create Film
              </button>
            </div>

            {/* Invest with USDCx */}
            <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-3 border border-green-500/30">
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-green-500" /> Invest USDCx
              </h3>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
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
                disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
              >
                Invest ${writeForm.investAmount} USDCx
              </button>
            </div>

            {/* Demo Invest */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-bold rounded">DEMO</span>
                Invest (No Transfer)
              </h3>
              <p className="text-[10px] text-typography-500 mb-2">Mints tokens without USDCx transfer</p>
              <button
                onClick={() =>
                  handleContractCall(() =>
                    investInFilm(parseInt(writeForm.filmId), parseUSDCx(writeForm.investAmount), address!)
                  )
                }
                className={`${btnOrange} w-full`}
                disabled={loading || !isConnected || !CINEBLOCK_ADDRESS}
              >
                Demo Invest
              </button>
            </div>

            {/* Admin Functions */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                Admin
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 text-[9px] font-bold rounded ml-auto">ADMIN</span>
              </h3>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={writeForm.adminAddress}
                  onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                  placeholder="ST..."
                  className={`${inputClass} flex-1 font-mono text-[10px]`}
                />
                <button
                  onClick={() => handleContractCall(() => addAdmin(writeForm.adminAddress, address!))}
                  className={btnPrimary}
                  disabled={loading || !isConnected || !writeForm.adminAddress}
                >
                  Add Admin
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={writeForm.filmId}
                  onChange={(e) => setWriteForm((f) => ({ ...f, filmId: e.target.value }))}
                  placeholder="Film ID"
                  className={`${inputClass} w-20`}
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

          {/* Column 3: Maps & USDCx */}
          <div className="space-y-3">
            {/* Data Maps */}
            <div className={sectionClass}>
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Maps
              </h3>
              <select
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className={`${inputClass} mb-2`}
              >
                {CINEBLOCK_MAPS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.keyType})
                  </option>
                ))}
              </select>

              {mapName === "films" && (
                <div className="flex gap-1.5">
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
                        const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey);
                        if (result.data) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                        }
                        return result;
                      })
                    }
                    className={btnPrimary}
                    disabled={loading || !mapKey || !CINEBLOCK_ADDRESS}
                  >
                    Query
                  </button>
                </div>
              )}

              {mapName === "film-tokens" && (
                <div className="flex gap-1.5">
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
                        const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey);
                        if (result.data) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                        }
                        return result;
                      })
                    }
                    className={btnPrimary}
                    disabled={loading || !mapKey || !CINEBLOCK_ADDRESS}
                  >
                    Query
                  </button>
                </div>
              )}

              {mapName === "admins" && (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={mapKey || address || ""}
                    onChange={(e) => setMapKey(e.target.value)}
                    placeholder="ST..."
                    className={`${inputClass} flex-1 font-mono text-[10px]`}
                  />
                  <button
                    onClick={() =>
                      handleApiCall(async () => {
                        const addr = mapKey || address;
                        if (!addr) throw new Error("No address");
                        const key = tupleCV({ admin: principalCV(addr) });
                        const hexKey = `0x${serializeArg(key)}`;
                        const result = await getMapEntry(CINEBLOCK_ADDRESS, CINEBLOCK_NAME, mapName, hexKey);
                        if (result.data) {
                          return { ...result, decoded: cvToJSON(deserializeCV(result.data)) };
                        }
                        return result;
                      })
                    }
                    className={btnPrimary}
                    disabled={loading || !CINEBLOCK_ADDRESS}
                  >
                    Query
                  </button>
                </div>
              )}
            </div>

            {/* USDCx Section */}
            <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-3 border border-green-500/30">
              <h3 className="text-xs font-semibold text-typography-950 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-green-500" /> USDCx Token
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                <div>
                  <span className="text-typography-500">Decimals:</span>
                  <span className="ml-1 text-typography-700">{USDCX_DECIMALS}</span>
                </div>
                <div className="truncate">
                  <span className="text-typography-500">Asset:</span>
                  <code className="ml-1 text-typography-700 font-mono">{USDCX_ASSET_ID.slice(0, 20)}...</code>
                </div>
              </div>

              {/* Balance Check */}
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={writeForm.adminAddress || address || ""}
                  onChange={(e) => setWriteForm((f) => ({ ...f, adminAddress: e.target.value }))}
                  placeholder="Address"
                  className={`${inputClass} flex-1 font-mono text-[10px]`}
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
              <div className="grid grid-cols-2 gap-1.5 mb-2">
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
                    className={`${inputClass} font-mono text-[10px]`}
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
            <div className={sectionClass}>
              <h4 className="text-xs font-medium text-typography-950 mb-1">USDCx Bridge</h4>
              <p className="text-[10px] text-typography-600 mb-2">
                Bridged from Ethereum via Circle&apos;s xReserve protocol.
              </p>
              <a
                href="https://docs.stacks.co/more-guides/bridging-usdcx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                Learn more <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-background-950 rounded-xl border border-background-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-background-800">
            <span className="text-xs font-medium text-typography-400">Output</span>
            <div className="flex items-center gap-1.5">
              {output?.txId && (
                <a
                  href={getExplorerUrl(output.txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-0.5"
                >
                  Explorer <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {output && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(output, null, 2))}
                  className="p-1 hover:bg-background-800 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-typography-500" />
                </button>
              )}
              <button
                onClick={() => setOutput(null)}
                className="p-1 hover:bg-background-800 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-typography-500" />
              </button>
            </div>
          </div>
          <div className="p-3 min-h-[120px] max-h-[250px] overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 text-primary-400">
                <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            )}
            {!loading && output?.success === false && (
              <div className="flex items-start gap-1.5 text-red-400">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="text-xs font-mono">{output.error}</span>
              </div>
            )}
            {!loading && output?.success && output.txId && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">TX Submitted</span>
                </div>
                <code className="text-[10px] font-mono text-typography-400 break-all block">{output.txId}</code>
              </div>
            )}
            {!loading && output?.success && output.data !== undefined && (
              <pre className="text-[10px] font-mono text-green-400 whitespace-pre-wrap">
                {JSON.stringify(output.data as object, null, 2)}
              </pre>
            )}
            {!loading && !output && (
              <span className="text-xs text-typography-600 italic">Output will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
