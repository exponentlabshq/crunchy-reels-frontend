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
    // ShortStarter Contract (update after mainnet deployment)
    SHORTSTARTER_ADDRESS: "",
    SHORTSTARTER_NAME: "shortstarter",
    // USDCx Token on Mainnet
    USDCX_ADDRESS: USDCX.mainnet.ADDRESS,
    USDCX_NAME: USDCX.mainnet.NAME,
    USDCX_ASSET: USDCX.mainnet.ASSET,
  },
  testnet: {
    // ShortStarter Contract (update after testnet deployment)
    SHORTSTARTER_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
    SHORTSTARTER_NAME: "shortstarter",
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

export const SHORTSTARTER_ADDRESS = config.SHORTSTARTER_ADDRESS;
export const SHORTSTARTER_NAME = config.SHORTSTARTER_NAME;
export const USDCX_ADDRESS = config.USDCX_ADDRESS;
export const USDCX_NAME = config.USDCX_NAME;
export const USDCX_ASSET = config.USDCX_ASSET;

// Full USDCx contract identifier
export const USDCX_CONTRACT_ID = `${USDCX_ADDRESS}.${USDCX_NAME}`;
export const USDCX_ASSET_ID = `${USDCX_CONTRACT_ID}::${USDCX_ASSET}`;

// ============================================
// CONTRACT FUNCTIONS (for reference)
// ============================================

export const SHORTSTARTER_FUNCTIONS = {
  // Read-Only
  readOnly: [
    { name: "get-last-film-id", args: [] },
    { name: "get-total-usdcx-collected", args: [] },
    { name: "get-usdcx-contract", args: [] },
    { name: "get-film", args: ["film-id: uint"] },
    { name: "get-balance", args: ["film-id: uint", "holder: principal"] },
    { name: "get-tokens-available", args: ["film-id: uint"] },
    { name: "get-holder-count", args: ["film-id: uint"] },
    { name: "is-admin", args: ["address: principal"] },
    { name: "preview-purchase", args: ["film-id: uint", "usdcx-amount: uint"] },
    { name: "get-portfolio-item", args: ["film-id: uint", "holder: principal"] },
    // Revenue functions
    { name: "get-film-revenue", args: ["film-id: uint"] },
    { name: "get-claimable-revenue", args: ["film-id: uint", "holder: principal"] },
    { name: "get-user-total-claimed", args: ["film-id: uint", "holder: principal"] },
    { name: "preview-withdrawal", args: ["film-id: uint", "holder: principal"] },
    { name: "get-user-position", args: ["film-id: uint", "holder: principal"] },
  ],
  // Public (write) functions
  public: [
    {
      name: "create-film",
      args: [
        "title: string-ascii 100",
        "symbol: string-ascii 10",
        "description: string-ascii 256",
        "max-supply: uint",
      ],
      admin: true,
    },
    {
      name: "set-film-active",
      args: ["film-id: uint", "is-active: bool"],
      admin: true,
    },
    {
      name: "buy-film-tokens",
      args: ["film-id: uint", "usdcx-amount: uint", "usdcx-token: trait"],
      admin: false,
      description: "Buy film tokens with USDCx (1:1 exchange)",
    },
    {
      name: "buy-film-tokens-demo",
      args: ["film-id: uint", "amount: uint"],
      admin: false,
      description: "Demo purchase (no USDCx transfer)",
    },
    {
      name: "transfer-film-tokens",
      args: ["film-id: uint", "amount: uint", "recipient: principal"],
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
      name: "set-usdcx-contract",
      args: ["new-usdcx-contract: principal"],
      admin: true,
    },
    // Revenue functions
    {
      name: "deposit-revenue",
      args: ["film-id: uint", "amount: uint", "usdcx-token: trait"],
      admin: true,
      description: "Deposit film revenue for distribution to holders",
    },
    {
      name: "claim-revenue",
      args: ["film-id: uint", "usdcx-token: trait"],
      admin: false,
      description: "Claim accumulated revenue earnings",
    },
    {
      name: "withdraw-and-claim",
      args: ["film-id: uint", "usdcx-token: trait"],
      admin: false,
      description: "Withdraw position: claims pending revenue + returns principal",
    },
  ],
};

export const SHORTSTARTER_MAPS = [
  { name: "films", keyType: "{ film-id: uint }" },
  { name: "token-balances", keyType: "{ film-id: uint, holder: principal }" },
  { name: "film-holder-count", keyType: "{ film-id: uint }" },
  { name: "admins", keyType: "{ admin: principal }" },
  // Revenue distribution maps
  { name: "film-revenue", keyType: "{ film-id: uint }" },
  { name: "dividend-per-token", keyType: "{ film-id: uint }" },
  { name: "user-dividend-debt", keyType: "{ film-id: uint, holder: principal }" },
  { name: "user-total-claimed", keyType: "{ film-id: uint, holder: principal }" },
];

export const SHORTSTARTER_VARS = [
  { name: "last-film-id", type: "uint" },
  { name: "total-usdcx-collected", type: "uint" },
  { name: "usdcx-contract-address", type: "(optional principal)" },
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
