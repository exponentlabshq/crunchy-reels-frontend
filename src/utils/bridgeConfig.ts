import { type Address } from "viem"

// Sepolia Testnet Contract Addresses
export const SEPOLIA_USDC: Address = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
export const SEPOLIA_XRESERVE: Address = "0x008888878f94C0d87defdf0B07f46B93C1934442"

// Stacks Testnet Contract Addresses
export const STACKS_USDCX_CONTRACT = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx"
export const STACKS_XRESERVE_CONTRACT = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1"

// xReserve Protocol Constants
export const STACKS_DOMAIN_ID = 10003
export const USDC_DECIMALS = 6

// ERC20 ABI (only approve function needed)
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const

// xReserve ABI (depositToRemote function)
export const XRESERVE_ABI = [
  {
    name: "depositToRemote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "value", type: "uint256" },
      { name: "remoteDomain", type: "uint32" },
      { name: "remoteRecipient", type: "bytes32" },
      { name: "localToken", type: "address" },
      { name: "maxFee", type: "uint256" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
] as const

// ============================================
// STACKS ADDRESS ENCODING
// ============================================

// C32 alphabet used by Stacks (different from base58!)
const C32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

/**
 * Decode c32 string to byte array using BigInt for precision
 * Returns 25 bytes: version (1) + hash160 (20) + checksum (4)
 */
function c32Decode(input: string): Uint8Array {
  // Convert c32 string to BigInt
  let n = BigInt(0)
  for (const char of input.toUpperCase()) {
    const index = C32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid c32 character: ${char}`)
    }
    n = n * 32n + BigInt(index)
  }

  // Convert BigInt to bytes
  const bytes: number[] = []
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn))
    n = n >> 8n
  }

  // Pad to correct length: version (1) + hash160 (20) + checksum (4) = 25 bytes
  while (bytes.length < 25) {
    bytes.unshift(0)
  }

  return new Uint8Array(bytes)
}

/**
 * Validate a Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false

  const validPrefixes = ["SP", "SM", "ST", "SN"]
  const prefix = address.substring(0, 2)

  if (!validPrefixes.includes(prefix)) return false
  if (address.length < 38 || address.length > 41) return false

  const addressBody = address.substring(2).toUpperCase()
  for (const char of addressBody) {
    if (!C32_ALPHABET.includes(char)) return false
  }

  return true
}

/**
 * Convert a Stacks address to bytes32 format for xReserve
 * 
 * Stacks address format: [S/M][P/T] + c32check(version + hash160 + checksum)
 * The c32 body decodes to 25 bytes: version (1) + hash160 (20) + checksum (4)
 * 
 * We encode to 32 bytes: 11 zero bytes + version (1) + hash160 (20)
 */
export function stacksAddressToBytes32(stacksAddress: string): `0x${string}` {
  if (!isValidStacksAddress(stacksAddress)) {
    throw new Error(`Invalid Stacks address format: ${stacksAddress}`)
  }

  try {
    const prefix = stacksAddress.substring(0, 2)
    const addressBody = stacksAddress.substring(2)

    // Determine version byte from prefix
    let versionByte: number
    switch (prefix) {
      case "SP":
        versionByte = 22 // mainnet single-sig
        break
      case "SM":
        versionByte = 20 // mainnet multi-sig
        break
      case "ST":
        versionByte = 26 // testnet single-sig
        break
      case "SN":
        versionByte = 21 // testnet multi-sig
        break
      default:
        throw new Error(`Unknown address prefix: ${prefix}`)
    }

    // Decode the c32 body: version (1) + hash160 (20) + checksum (4) = 25 bytes
    const decoded = c32Decode(addressBody)

    // Extract hash160: skip version byte (0), take bytes 1-20, exclude checksum (21-24)
    const hash160 = decoded.slice(1, 21)

    if (hash160.length !== 20) {
      throw new Error(`Invalid hash160 length: ${hash160.length}`)
    }

    // Build 32-byte output: 11 zero bytes + version (1) + hash160 (20) = 32 bytes
    const bytes32 = new Uint8Array(32)
    bytes32[11] = versionByte
    bytes32.set(hash160, 12)

    // Convert to hex
    const hex = Array.from(bytes32)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    return `0x${hex}` as `0x${string}`
  } catch (error) {
    console.error("Error encoding Stacks address:", error)
    throw new Error("Invalid Stacks address format")
  }
}

// Default max fee (0 = no limit, protocol determines actual fee)
export const DEFAULT_MAX_FEE = BigInt(0)

// Sepolia chain ID
export const SEPOLIA_CHAIN_ID = 11155111
