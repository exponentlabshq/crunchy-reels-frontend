import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { IS_MAINNET } from "@/constants";

const network = IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET;
const STACKS_API_BASE_URL = IS_MAINNET
  ? "https://api.mainnet.hiro.so"
  : "https://api.testnet.hiro.so";

// ============================================
// TYPES
// ============================================

interface StacksApiResponse<T> {
  okay?: boolean;
  result?: string;
  data?: string;
  proof?: string;
  count?: number;
  total?: number;
  results?: T[];
  [key: string]: unknown;
}

export interface Transaction {
  tx_id: string;
  tx_status: string;
  tx_type: string;
  fee_rate: string;
  sender_address: string;
  sponsored: boolean;
  block_height: number;
  burn_block_time: number;
  block_time?: number;
  receipt_time?: number;
  parent_tx_id: string;
  tx_index: number;
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo: string;
  };
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args: {
      hex: string;
      repr: string;
      name: string;
      type: string;
    }[];
  };
  smart_contract?: {
    contract_id: string;
    source_code: string;
  };
  ft_transfers?: {
    asset_identifier: string;
    amount: string;
    sender?: string;
    recipient?: string;
  }[];
  [key: string]: unknown;
}

export interface TransactionListResponse {
  limit: number;
  offset: number;
  total: number;
  results: Transaction[];
}

// ============================================
// CONTRACT INTERFACE
// ============================================

/**
 * Get contract interface (functions, maps, variables)
 * GET /v2/contracts/interface/{contract_address}/{contract_name}
 */
export async function getContractInterface(contractAddress: string, contractName: string) {
  const url = `${STACKS_API_BASE_URL}/v2/contracts/interface/${contractAddress}/${contractName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching contract interface: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get contract source code
 * GET /v2/contracts/source/{contract_address}/{contract_name}
 */
export async function getContractSource(contractAddress: string, contractName: string) {
  const url = `${STACKS_API_BASE_URL}/v2/contracts/source/${contractAddress}/${contractName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching contract source: ${response.statusText}`);
  }
  return response.json() as Promise<{
    source: string;
    publish_height: number;
    proof: string;
  }>;
}

// ============================================
// DATA MAPS & VARIABLES
// ============================================

/**
 * Get specific data-map entry
 * POST /v2/map_entry/{contract_address}/{contract_name}/{map_name}
 */
export async function getMapEntry(
  contractAddress: string,
  contractName: string,
  mapName: string,
  keyHex: string
) {
  const url = `${STACKS_API_BASE_URL}/v2/map_entry/${contractAddress}/${contractName}/${mapName}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(keyHex),
  });
  if (!response.ok) {
    throw new Error(`Error fetching map entry: ${response.statusText}`);
  }
  return response.json() as Promise<{ data: string; proof?: string }>;
}

/**
 * Get contract data variable
 * GET /v2/data_var/{principal}/{contract_name}/{var_name}
 */
export async function getDataVar(contractAddress: string, contractName: string, varName: string) {
  const url = `${STACKS_API_BASE_URL}/v2/data_var/${contractAddress}/${contractName}/${varName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching data variable: ${response.statusText}`);
  }
  return response.json() as Promise<{ data: string; proof?: string }>;
}

/**
 * Get constant value from contract
 * GET /v2/constant_val/{contract_address}/{contract_name}/{constant_name}
 */
export async function getConstantVal(
  contractAddress: string,
  contractName: string,
  constantName: string
) {
  const url = `${STACKS_API_BASE_URL}/v2/constant_val/${contractAddress}/${contractName}/${constantName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching constant value: ${response.statusText}`);
  }
  return response.json() as Promise<{ data: string }>;
}

// ============================================
// READ-ONLY FUNCTIONS
// ============================================

/**
 * Call read-only function
 * POST /v2/contracts/call-read/{contract_address}/{contract_name}/{function_name}
 */
export async function callReadOnlyFunction(
  contractAddress: string,
  contractName: string,
  functionName: string,
  senderAddress: string,
  args: string[] = []
) {
  const url = `${STACKS_API_BASE_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: senderAddress,
      arguments: args,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error calling read-only function: ${response.statusText}`);
  }
  return response.json() as Promise<StacksApiResponse<unknown>>;
}

// ============================================
// ACCOUNT & TRANSACTION DATA
// ============================================

/**
 * Get account balances including fungible tokens
 */
export async function getAccountBalances(address: string) {
  const url = `${STACKS_API_BASE_URL}/extended/v1/address/${address}/balances`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching account balances: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get account transactions
 * GET /extended/v1/address/{address}/transactions
 */
export async function getAccountTransactions(address: string, limit = 50, offset = 0) {
  const url = `${STACKS_API_BASE_URL}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching account transactions: ${response.statusText}`);
  }
  return response.json() as Promise<TransactionListResponse>;
}

/**
 * Get account mempool (pending) transactions
 */
export async function getAccountMempoolTransactions(address: string, limit = 50, offset = 0) {
  const url = `${STACKS_API_BASE_URL}/extended/v1/address/${address}/mempool?limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching mempool transactions: ${response.statusText}`);
  }
  return response.json() as Promise<TransactionListResponse>;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(txId: string) {
  const url = `${STACKS_API_BASE_URL}/extended/v1/tx/${txId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching transaction: ${response.statusText}`);
  }
  return response.json();
}

// ============================================
// NFT DATA
// ============================================

/**
 * Get NFT holdings for an address
 */
export async function getNftHoldings(address: string, limit = 50, offset = 0) {
  const url = `${STACKS_API_BASE_URL}/extended/v1/tokens/nft/holdings?principal=${address}&limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching NFT holdings: ${response.statusText}`);
  }
  return response.json();
}

// ============================================
// BLOCK INFO
// ============================================

/**
 * Get current block height
 */
export async function getCurrentBlockHeight() {
  const url = `${STACKS_API_BASE_URL}/extended/v1/block?limit=1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching block info: ${response.statusText}`);
  }
  const data = (await response.json()) as { results?: { height: number }[] };
  return data.results?.[0]?.height ?? 0;
}

// ============================================
// HELPERS
// ============================================

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

export function getExplorerUrl(txId: string): string {
  const base = IS_MAINNET ? "https://explorer.stacks.co/txid" : "https://explorer.hiro.so/txid";
  return `${base}/${txId}?chain=${IS_MAINNET ? "mainnet" : "testnet"}`;
}

export { network, STACKS_API_BASE_URL };
