import { IS_MAINNET } from "@/constants";

// ============================================
// USDCx TOKEN CONFIGURATION
// Circle's xReserve bridged stablecoin
// 6 decimals (same as USDC)
// ============================================

export const USDCX = {
  mainnet: {
    ADDRESS: "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE",
    NAME: "usdcx",
    ASSET: "usdcx-token",
  },
  testnet: {
    ADDRESS: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    NAME: "usdcx",
    ASSET: "usdcx-token",
  },
};

export const USDCX_DECIMALS = 6;
export const USDCX_MULTIPLIER = 1_000_000;

// ============================================
// CONTRACT CONFIGURATION
// ============================================

export const CONTRACTS = {
  mainnet: {
    // CineBlock Contract (update after mainnet deployment)
    CINEBLOCK_ADDRESS: "",
    CINEBLOCK_NAME: "cineblock",
    // USDCx Token on Mainnet
    USDCX_ADDRESS: USDCX.mainnet.ADDRESS,
    USDCX_NAME: USDCX.mainnet.NAME,
    USDCX_ASSET: USDCX.mainnet.ASSET,
  },
  testnet: {
    // CineBlock Contract (update after testnet deployment)
    CINEBLOCK_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
    CINEBLOCK_NAME: "cineblock",
    // USDCx Token on Testnet
    USDCX_ADDRESS: USDCX.testnet.ADDRESS,
    USDCX_NAME: USDCX.testnet.NAME,
    USDCX_ASSET: USDCX.testnet.ASSET,
    // SIP-010 Trait
    TRAIT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
    TRAIT_NAME: "sip010-trait",
  },
};

export function getContractConfig() {
  return IS_MAINNET ? CONTRACTS.mainnet : CONTRACTS.testnet;
}

const config = getContractConfig();

export const CINEBLOCK_ADDRESS = config.CINEBLOCK_ADDRESS;
export const CINEBLOCK_NAME = config.CINEBLOCK_NAME;
export const USDCX_ADDRESS = config.USDCX_ADDRESS;
export const USDCX_NAME = config.USDCX_NAME;
export const USDCX_ASSET = config.USDCX_ASSET;

// Full USDCx contract identifier
export const USDCX_CONTRACT_ID = `${USDCX_ADDRESS}.${USDCX_NAME}`;
export const USDCX_ASSET_ID = `${USDCX_CONTRACT_ID}::${USDCX_ASSET}`;

// ============================================
// CONTRACT FUNCTIONS (for reference)
// ============================================

export const CINEBLOCK_FUNCTIONS = {
  // Read-Only
  readOnly: [
    { name: "get-last-token-id", args: [] },
    { name: "get-last-film-id", args: [] },
    { name: "get-total-investments", args: [] },
    { name: "get-total-usdcx-raised", args: [] },
    { name: "get-treasury", args: [] },
    { name: "get-film", args: ["film-id: uint"] },
    { name: "get-token-details", args: ["token-id: uint"] },
    { name: "get-investor-holdings", args: ["film-id: uint", "investor: principal"] },
    { name: "get-owner", args: ["token-id: uint"] },
    { name: "is-admin", args: ["address: principal"] },
    { name: "calculate-tokens", args: ["film-id: uint", "usdcx-amount: uint"] },
    { name: "preview-investment", args: ["film-id: uint", "usdcx-amount: uint"] },
  ],
  // Public (write) functions
  public: [
    {
      name: "create-film",
      args: [
        "title: string-ascii 100",
        "director: string-ascii 100",
        "description: string-ascii 256",
        "funding-goal: uint (USDCx)",
        "token-price: uint (USDCx per token)",
        "token-symbol: string-ascii 10",
      ],
      admin: true,
    },
    {
      name: "update-film",
      args: [
        "film-id: uint",
        "title: string-ascii 100",
        "director: string-ascii 100",
        "description: string-ascii 256",
        "is-active: bool",
      ],
      admin: true,
    },
    {
      name: "invest-with-usdcx",
      args: ["film-id: uint", "usdcx-amount: uint", "usdcx-token: trait"],
      admin: false,
      description: "Invest USDCx in a film project",
    },
    {
      name: "invest-in-film",
      args: ["film-id: uint", "amount: uint"],
      admin: false,
      description: "Demo investment (no token transfer)",
    },
    {
      name: "transfer",
      args: ["token-id: uint", "sender: principal", "recipient: principal"],
      admin: false,
    },
    {
      name: "add-admin",
      args: ["new-admin: principal"],
      admin: true,
    },
    {
      name: "remove-admin",
      args: ["admin-to-remove: principal"],
      admin: true,
    },
    {
      name: "close-film-funding",
      args: ["film-id: uint"],
      admin: true,
    },
    {
      name: "set-treasury",
      args: ["new-treasury: principal"],
      admin: true,
    },
  ],
};

export const CINEBLOCK_MAPS = [
  { name: "films", keyType: "{ film-id: uint }" },
  { name: "film-tokens", keyType: "{ token-id: uint }" },
  { name: "investor-holdings", keyType: "{ film-id: uint, investor: principal }" },
  { name: "admins", keyType: "{ admin: principal }" },
];

export const CINEBLOCK_VARS = [
  { name: "last-token-id", type: "uint" },
  { name: "last-film-id", type: "uint" },
  { name: "total-investments", type: "uint" },
  { name: "total-usdcx-raised", type: "uint" },
  { name: "treasury", type: "principal" },
];

// ============================================
// USDCx HELPER FUNCTIONS
// ============================================

export function formatUSDCx(microUnits: number | bigint): string {
  const value = Number(microUnits) / USDCX_MULTIPLIER;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export function parseUSDCx(amount: string): number {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return 0;
  return Math.floor(parsed * USDCX_MULTIPLIER);
}

export function formatUSDCxDisplay(microUnits: number | bigint): string {
  return `$${formatUSDCx(microUnits)} USDCx`;
}
