# CrunchyReels - Project Summary

## Overview

**CrunchyReels** is a blockchain-based investment platform for anime short-form video content creators. Built on the Stacks blockchain (Bitcoin L2), it enables users to invest in tokenized anime projects, own shares of creator content, earn revenue from streaming performance, and trade film tokens.

## Core Concept

The platform connects anime creators with investors through tokenized film projects:

1. **Creators** list their anime projects with funding goals
2. **Investors** purchase film tokens using USDCx stablecoin (1:1 exchange rate)
3. **Revenue** from content performance is distributed proportionally to token holders
4. **Token holders** can claim earnings or withdraw their entire position

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, Tailwind CSS v4, Radix UI |
| State | TanStack Query (React Query v5) |
| Blockchain | Stacks (Bitcoin L2) |
| Smart Contracts | Clarity |
| Stablecoin | USDCx (Circle's bridged USDC) |
| Wallet | Stacks Connect (Leather wallet) |

## Key Features

### For Investors
- **Browse Projects**: Explore anime investment opportunities with detailed metrics
- **Invest**: Purchase film tokens using USDCx stablecoin
- **Portfolio Tracking**: Monitor holdings, balances, and performance
- **Revenue Claims**: Receive and claim dividend payouts from film performance
- **Position Management**: Withdraw investments (burns tokens, returns principal + earnings)

### For Exploration
- **Demo Mode**: Explore the platform without connecting a wallet
- **Watch Shorts**: Preview anime content clips from creators
- **Funding Progress**: Track project funding toward goals

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── onboarding/        # 3-slide intro carousel
│   ├── connect-wallet/    # Wallet connection & demo entry
│   └── (app)/             # Protected routes
│       ├── films/         # Browse all projects
│       ├── films/[id]/    # Film detail & investment
│       └── wallet/        # Wallet management
├── components/            # UI components (shadcn/ui based)
├── context/               # Wallet state management
├── utils/                 # Contract calls, API utilities
├── data/                  # Film media assets
└── types/                 # TypeScript interfaces
```

## User Flow

```
Onboarding → Connect Wallet → Browse Films → View Details → Invest → Manage Portfolio
                  ↓
            Demo Mode (limited features)
```

## Smart Contract Integration

The app interacts with a Clarity smart contract for:

| Function | Purpose |
|----------|---------|
| `buy-film-tokens` | Invest USDCx for film tokens |
| `claim-revenue` | Claim accumulated earnings |
| `withdraw-and-claim` | Close position and withdraw all |
| `transfer-film-tokens` | Send tokens to another user |
| `get-balance` | Check token holdings |
| `get-claimable-revenue` | View pending earnings |

## Key Data Models

### Film
- ID, title, symbol, description, producer
- Max supply (goal), tokens sold, USDCx raised
- Active status, creation block

### User Holdings
- Film ID, token amount, USDCx value
- Claimable revenue, total claimed

## Configuration

- **Network**: Configurable between Stacks testnet and mainnet
- **Contract Address**: Set via `NEXT_PUBLIC_CONTRACT_ADDRESS`
- **USDCx**: Circle's bridged stablecoin (6 decimals)

## Key Implementation Details

- **1:1 Token Exchange**: $X USDCx = X film tokens
- **Burn on Withdrawal**: Tokens are burned when exiting a position
- **Revenue Distribution**: Proportional to token holdings
- **Demo Mode**: LocalStorage persistence for exploration
- **Transaction Links**: All transactions link to Hiro block explorer
