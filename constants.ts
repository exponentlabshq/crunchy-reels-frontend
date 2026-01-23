// Stacks Network Configuration
export const NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? "testnet"
export const IS_MAINNET = NETWORK === "mainnet"

// Contract addresses - update these after deployment
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? ""
export const CONTRACT_NAME = "cineblock"

// App configuration
export const APP_NAME = "CineBlock"
export const APP_DESCRIPTION = "Tokenized Film Investment on Bitcoin"
export const APP_ICON = "/icon.png"

export const IS_DEV = Boolean(import.meta.env.DEV)
export const IS_PROD = Boolean(import.meta.env.PROD)
