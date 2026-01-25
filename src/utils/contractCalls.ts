"use client";

import { request } from "@stacks/connect";
import {
  Cl,
  uintCV,
  principalCV,
  stringAsciiCV,
  boolCV,
  noneCV,
  contractPrincipalCV,
  serializeCV,
  deserializeCV,
  cvToJSON,
  cvToValue,
  fetchCallReadOnlyFunction,
  type ClarityValue,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { IS_MAINNET, NETWORK } from "@/constants";
import {
  SHORTSTARTER_ADDRESS,
  SHORTSTARTER_NAME,
  USDCX_ADDRESS,
  USDCX_NAME,
  USDCX_ASSET_ID,
} from "./contractConfig";
import { bytesToHex } from "./stacksApi";

// Network configuration
export const STACKS_NETWORK = IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET;
const NETWORK_ENV = NETWORK as "testnet" | "mainnet";

// ============================================
// CORE CONTRACT CALL FUNCTION
// ============================================

interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  userAddress: string;
  postConditionMode?: "allow" | "deny";
}

export async function callContract(params: ContractCallParams): Promise<string> {
  const contractId = `${params.contractAddress}.${params.contractName}` as `${string}.${string}`;

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    address: params.userAddress,
    network: NETWORK_ENV,
    postConditionMode: params.postConditionMode ?? "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ?? 
               (res as { txid?: string; transaction?: string })?.transaction ?? "";
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

  return txid;
}

// ============================================
// READ-ONLY CONTRACT CALLS
// ============================================

export async function readContract(params: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}) {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: params.contractAddress,
    contractName: params.contractName,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    senderAddress: params.senderAddress,
    network: STACKS_NETWORK,
  });

  return cvToValue(result);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function serializeArg(cv: ClarityValue): string {
  const serialized = serializeCV(cv);
  return typeof serialized === "string" ? serialized : bytesToHex(serialized);
}

export function parseReadOnlyResult(result: { okay?: boolean; result?: string }) {
  if (!result.okay || !result.result) {
    return { success: false, error: "Call failed" };
  }
  const decoded = deserializeCV(result.result);
  return { success: true, data: cvToJSON(decoded) };
}

// ============================================
// SHORTSTARTER - READ ONLY CALLS
// ============================================

export async function getLastFilmId() {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-last-film-id",
    functionArgs: [],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getTotalUsdcxCollected() {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-total-usdcx-collected",
    functionArgs: [],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getUsdcxContract() {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-usdcx-contract",
    functionArgs: [],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getFilm(filmId: number) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-film",
    functionArgs: [uintCV(filmId)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getBalance(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-balance",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getTokensAvailable(filmId: number) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-tokens-available",
    functionArgs: [uintCV(filmId)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getHolderCount(filmId: number) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-holder-count",
    functionArgs: [uintCV(filmId)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function isAdmin(address: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "is-admin",
    functionArgs: [principalCV(address)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function previewPurchase(filmId: number, usdcxAmount: number) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "preview-purchase",
    functionArgs: [uintCV(filmId), uintCV(usdcxAmount)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getPortfolioItem(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-portfolio-item",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

// ============================================
// REVENUE & WITHDRAWAL - READ ONLY
// ============================================

export async function getFilmRevenue(filmId: number) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-film-revenue",
    functionArgs: [uintCV(filmId)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getClaimableRevenue(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-claimable-revenue",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getUserTotalClaimed(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-user-total-claimed",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function previewWithdrawal(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "preview-withdrawal",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

export async function getUserPosition(filmId: number, holder: string) {
  return readContract({
    contractAddress: SHORTSTARTER_ADDRESS,
    contractName: SHORTSTARTER_NAME,
    functionName: "get-user-position",
    functionArgs: [uintCV(filmId), principalCV(holder)],
    senderAddress: SHORTSTARTER_ADDRESS,
  });
}

// ============================================
// SHORTSTARTER - WRITE CALLS (using Cl.* for @stacks/connect)
// ============================================

export async function createFilm(
  title: string,
  tokenSymbol: string,
  description: string,
  maxSupply: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.stringAscii(title),
    Cl.stringAscii(tokenSymbol),
    Cl.stringAscii(description),
    Cl.uint(maxSupply),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "create-film",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ??
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

export async function setFilmActive(
  filmId: number,
  isActive: boolean,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.bool(isActive),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "set-film-active",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ??
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

// Edit film title and description (admin only)
// Note: max-supply (cap) cannot be changed after creation
export async function editFilm(
  filmId: number,
  newTitle: string,
  newDescription: string,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.stringAscii(newTitle),
    Cl.stringAscii(newDescription),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "edit-film",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ??
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Film edited:", txid);
  console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

  return txid;
}

// Buy film tokens with USDCx (1:1 exchange, real token transfer)
export async function buyFilmTokens(
  filmId: number,
  usdcxAmount: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  // Debug logging
  console.log("🔍 buyFilmTokens Debug:", {
    contractId,
    SHORTSTARTER_ADDRESS,
    SHORTSTARTER_NAME,
    USDCX_ADDRESS,
    USDCX_NAME,
    filmId,
    usdcxAmount,
    userAddress,
    network: NETWORK_ENV,
  });

  // Validate inputs
  if (!SHORTSTARTER_ADDRESS) {
    throw new Error("SHORTSTARTER_ADDRESS is not set. Check NEXT_PUBLIC_CONTRACT_ADDRESS env variable.");
  }
  if (!userAddress) {
    throw new Error("User address is not provided");
  }

  // Use Cl.* format for @stacks/connect compatibility
  const functionArgs = [
    Cl.uint(filmId),
    Cl.uint(usdcxAmount),
    Cl.contractPrincipal(USDCX_ADDRESS, USDCX_NAME),
  ];

  console.log("🔍 Function args:", functionArgs);

  try {
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "buy-film-tokens",
      functionArgs,
      address: userAddress,
      network: NETWORK_ENV,
      postConditionMode: "allow",
    });

    console.log("🔍 Response:", res);

    const txid = (res as { txid?: string; transaction?: string })?.txid ||
                 (res as { txid?: string; transaction?: string })?.transaction;
    if (!txid) throw new Error("No transaction ID returned");

    console.log("🎉 Transaction broadcast:", txid);
    console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

    return txid;
  } catch (error) {
    console.error("❌ buyFilmTokens Error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Alias for backwards compatibility
export const investWithUsdcx = buyFilmTokens;

// Demo purchase (no USDCx transfer, for testing)
export async function buyFilmTokensDemo(
  filmId: number,
  amount: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.uint(amount),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "buy-film-tokens-demo",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

// Alias for backwards compatibility
export const investInFilm = buyFilmTokensDemo;

export async function transferFilmTokens(
  filmId: number,
  amount: number,
  recipient: string,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.uint(amount),
    Cl.principal(recipient),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "transfer-film-tokens",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

export async function addAdmin(newAdmin: string, userAddress: string): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.principal(newAdmin),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "add-admin",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

// Close film funding by setting it inactive
export async function closeFilmFunding(filmId: number, userAddress: string): Promise<string> {
  return setFilmActive(filmId, false, userAddress);
}

// Set the USDCx contract address (owner/admin only)
export async function setUsdcxContract(
  usdcxContractPrincipal: string,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;
  const parts = usdcxContractPrincipal.split(".");
  const address = parts[0] ?? "";
  const contractNamePart = parts[1];

  const principalArg = contractNamePart
    ? Cl.contractPrincipal(address, contractNamePart)
    : Cl.principal(address);

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "set-usdcx-contract",
    functionArgs: [principalArg],
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "deny",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

// ============================================
// USDCx TOKEN - READ ONLY
// ============================================

export async function getUsdcxBalance(address: string) {
  return readContract({
    contractAddress: USDCX_ADDRESS,
    contractName: USDCX_NAME,
    functionName: "get-balance",
    functionArgs: [principalCV(address)],
    senderAddress: USDCX_ADDRESS,
  });
}

export async function getUsdcxTotalSupply() {
  return readContract({
    contractAddress: USDCX_ADDRESS,
    contractName: USDCX_NAME,
    functionName: "get-total-supply",
    functionArgs: [],
    senderAddress: USDCX_ADDRESS,
  });
}

// ============================================
// USDCx TOKEN - TRANSFER
// ============================================

export async function transferUsdcx(
  amount: number,
  sender: string,
  recipient: string,
  userAddress: string
): Promise<string> {
  const contractId = `${USDCX_ADDRESS}.${USDCX_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(amount),
    Cl.principal(sender),
    Cl.principal(recipient),
    Cl.none(),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "transfer",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Transaction broadcast:", txid);
  return txid;
}

// ============================================
// REVENUE & WITHDRAWAL - WRITE CALLS
// ============================================

// Claim accumulated revenue earnings for a film
export async function claimRevenue(
  filmId: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.contractPrincipal(USDCX_ADDRESS, USDCX_NAME),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "claim-revenue",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Revenue claimed:", txid);
  console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

  return txid;
}

// Withdraw full position: claims pending revenue + returns principal
export async function withdrawAndClaim(
  filmId: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.contractPrincipal(USDCX_ADDRESS, USDCX_NAME),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "withdraw-and-claim",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Position closed:", txid);
  console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

  return txid;
}

// Admin: Deposit revenue for a film (streaming earnings, etc.)
export async function depositRevenue(
  filmId: number,
  amount: number,
  userAddress: string
): Promise<string> {
  const contractId = `${SHORTSTARTER_ADDRESS}.${SHORTSTARTER_NAME}` as `${string}.${string}`;

  const functionArgs = [
    Cl.uint(filmId),
    Cl.uint(amount),
    Cl.contractPrincipal(USDCX_ADDRESS, USDCX_NAME),
  ];

  const res = await request("stx_callContract", {
    contract: contractId,
    functionName: "deposit-revenue",
    functionArgs,
    address: userAddress,
    network: NETWORK_ENV,
    postConditionMode: "allow",
  });

  const txid = (res as { txid?: string; transaction?: string })?.txid ||
               (res as { txid?: string; transaction?: string })?.transaction;
  if (!txid) throw new Error("No transaction ID returned");

  console.log("🎉 Revenue deposited:", txid);
  console.log("🔗 Explorer:", `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`);

  return txid;
}
