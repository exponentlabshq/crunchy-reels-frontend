// Stacks Network Configuration
export const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet"
export const IS_MAINNET = NETWORK === "mainnet"

// Contract addresses - update these after deployment
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ""
export const CONTRACT_NAME = "cineblock"

// App configuration
export const APP_NAME = "CineBlock"
export const APP_DESCRIPTION = "Tokenized Film Investment on Bitcoin"
export const APP_ICON = "/icon.png"

export const IS_DEV = process.env.NODE_ENV === "development"
export const IS_PROD = process.env.NODE_ENV === "production"
