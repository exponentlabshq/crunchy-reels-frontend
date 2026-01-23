import { openContractCall } from "@stacks/connect"
import {
  uintCV,
  principalCV,
  stringAsciiCV,
  boolCV,
  noneCV,
  contractPrincipalCV,
  serializeCV,
  deserializeCV,
  cvToJSON,
  PostConditionMode,
  FungiblePostCondition,
} from "@stacks/transactions"
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network"
import { IS_MAINNET } from "@/constants"
import { 
  CINEBLOCK_ADDRESS, 
  CINEBLOCK_NAME,
  USDCX_ADDRESS,
  USDCX_NAME,
  USDCX_ASSET_ID,
} from "./contractConfig"
import { callReadOnlyFunction, bytesToHex } from "./stacksApi"

const network = IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET

// ============================================
// HELPER FUNCTIONS
// ============================================

function serializeArg(cv: ReturnType<typeof uintCV>): string {
  const serialized = serializeCV(cv)
  return typeof serialized === "string" ? serialized : bytesToHex(serialized)
}

export function parseReadOnlyResult(result: { okay?: boolean; result?: string }) {
  if (!result.okay || !result.result) {
    return { success: false, error: "Call failed" }
  }
  const decoded = deserializeCV(result.result)
  return { success: true, data: cvToJSON(decoded) }
}

// ============================================
// CINEBLOCK NFT - READ ONLY CALLS
// ============================================

export async function getLastTokenId() {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-last-token-id",
    CINEBLOCK_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

export async function getLastFilmId() {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-last-film-id",
    CINEBLOCK_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

export async function getTotalInvestments() {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-total-investments",
    CINEBLOCK_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

export async function getTotalUsdcxRaised() {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-total-usdcx-raised",
    CINEBLOCK_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

export async function getTreasury() {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-treasury",
    CINEBLOCK_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

export async function getFilm(filmId: number) {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-film",
    CINEBLOCK_ADDRESS,
    [`0x${serializeArg(uintCV(filmId))}`]
  )
  return parseReadOnlyResult(result)
}

export async function getTokenDetails(tokenId: number) {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-token-details",
    CINEBLOCK_ADDRESS,
    [`0x${serializeArg(uintCV(tokenId))}`]
  )
  return parseReadOnlyResult(result)
}

export async function getInvestorHoldings(filmId: number, investor: string) {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "get-investor-holdings",
    CINEBLOCK_ADDRESS,
    [
      `0x${serializeArg(uintCV(filmId))}`,
      `0x${serializeArg(principalCV(investor))}`
    ]
  )
  return parseReadOnlyResult(result)
}

export async function isAdmin(address: string) {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "is-admin",
    CINEBLOCK_ADDRESS,
    [`0x${serializeArg(principalCV(address))}`]
  )
  return parseReadOnlyResult(result)
}

export async function previewInvestment(filmId: number, usdcxAmount: number) {
  const result = await callReadOnlyFunction(
    CINEBLOCK_ADDRESS,
    CINEBLOCK_NAME,
    "preview-investment",
    CINEBLOCK_ADDRESS,
    [
      `0x${serializeArg(uintCV(filmId))}`,
      `0x${serializeArg(uintCV(usdcxAmount))}`
    ]
  )
  return parseReadOnlyResult(result)
}

// ============================================
// CINEBLOCK NFT - WRITE CALLS
// ============================================

export function createFilm(
  title: string,
  director: string,
  description: string,
  fundingGoal: number,
  tokenPrice: number,
  tokenSymbol: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "create-film",
      functionArgs: [
        stringAsciiCV(title),
        stringAsciiCV(director),
        stringAsciiCV(description),
        uintCV(fundingGoal),
        uintCV(tokenPrice),
        stringAsciiCV(tokenSymbol),
      ],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

export function updateFilm(
  filmId: number,
  title: string,
  director: string,
  description: string,
  isActive: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "update-film",
      functionArgs: [
        uintCV(filmId),
        stringAsciiCV(title),
        stringAsciiCV(director),
        stringAsciiCV(description),
        boolCV(isActive),
      ],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

// Invest with USDCx (real token transfer)
export function investWithUsdcx(
  filmId: number,
  usdcxAmount: number,
  senderAddress: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Post condition for USDCx transfer
    const postCondition: FungiblePostCondition = {
      type: "ft-postcondition",
      address: senderAddress,
      condition: "eq",
      amount: usdcxAmount,
      asset: USDCX_ASSET_ID,
    }

    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "invest-with-usdcx",
      functionArgs: [
        uintCV(filmId),
        uintCV(usdcxAmount),
        contractPrincipalCV(USDCX_ADDRESS, USDCX_NAME),
      ],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [postCondition],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

// Demo invest (no token transfer)
export function investInFilm(filmId: number, amount: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "invest-in-film",
      functionArgs: [
        uintCV(filmId),
        uintCV(amount),
      ],
      network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

export function transferToken(
  tokenId: number,
  sender: string,
  recipient: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "transfer",
      functionArgs: [
        uintCV(tokenId),
        principalCV(sender),
        principalCV(recipient),
      ],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

export function addAdmin(newAdmin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "add-admin",
      functionArgs: [principalCV(newAdmin)],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

export function closeFilmFunding(filmId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      contractAddress: CINEBLOCK_ADDRESS,
      contractName: CINEBLOCK_NAME,
      functionName: "close-film-funding",
      functionArgs: [uintCV(filmId)],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}

// ============================================
// USDCx TOKEN - READ ONLY
// ============================================

export async function getUsdcxBalance(address: string) {
  const result = await callReadOnlyFunction(
    USDCX_ADDRESS,
    USDCX_NAME,
    "get-balance",
    USDCX_ADDRESS,
    [`0x${serializeArg(principalCV(address))}`]
  )
  return parseReadOnlyResult(result)
}

export async function getUsdcxTotalSupply() {
  const result = await callReadOnlyFunction(
    USDCX_ADDRESS,
    USDCX_NAME,
    "get-total-supply",
    USDCX_ADDRESS,
    []
  )
  return parseReadOnlyResult(result)
}

// ============================================
// USDCx TOKEN - TRANSFER
// ============================================

export function transferUsdcx(
  amount: number,
  sender: string,
  recipient: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const postCondition: FungiblePostCondition = {
      type: "ft-postcondition",
      address: sender,
      condition: "eq",
      amount: amount,
      asset: USDCX_ASSET_ID,
    }

    const options = {
      contractAddress: USDCX_ADDRESS,
      contractName: USDCX_NAME,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount),
        principalCV(sender),
        principalCV(recipient),
        noneCV(),
      ],
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [postCondition],
      onFinish: (data: { txId: string }) => resolve(data.txId),
      onCancel: () => reject(new Error("Transaction canceled")),
    }
    void openContractCall(options)
  })
}
