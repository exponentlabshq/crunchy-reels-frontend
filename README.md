# CineBlock Frontend

React frontend for CineBlock - Tokenized Film Investment on Bitcoin L2 (Stacks).

## Overview

CineBlock enables users to invest in tokenized film projects using the Stacks blockchain, secured by Bitcoin.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@stacks/connect** - Wallet connection
- **React Query** - Server state management
- **React Router** - Navigation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Stacks wallet (Leather or Xverse)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (shadcn)
├── context/            # React contexts
│   ├── DemoStore.tsx   # Demo mode state
│   └── StacksWalletContext.tsx  # Wallet connection
├── pages/              # Route pages
│   ├── Films.tsx       # Browse films
│   ├── Wallet.tsx      # Wallet management
│   ├── Profile.tsx     # User profile
│   ├── Onboarding.tsx  # Welcome flow
│   └── ConnectWallet.tsx
├── types/              # TypeScript types
├── utils/              # Utility functions
├── lib/                # Library utilities
├── assets/             # Static assets
├── App.tsx             # Main app component
├── main.tsx            # Entry point
├── index.css           # Global styles
└── constants.ts        # App constants
```

## Features

- **Stacks Wallet Integration** - Connect with Leather or Xverse wallet
- **Browse Films** - Discover film investment opportunities
- **Investment Tracking** - View your portfolio and holdings
- **Demo Mode** - Explore the app without connecting a wallet

## Environment Variables

Create a `.env` file:

```env
VITE_STACKS_NETWORK=testnet
VITE_CONTRACT_ADDRESS=your_contract_address
```

## Wallet Connection

The app supports Stacks wallet connection via `@stacks/connect`:

```tsx
import { useStacksWallet } from "@/context/StacksWalletContext"

function MyComponent() {
  const { isConnected, address, connect, disconnectWallet } = useStacksWallet()
  
  return isConnected ? (
    <p>Connected: {address}</p>
  ) : (
    <button onClick={connect}>Connect Wallet</button>
  )
}
```

## Styling

Uses Tailwind CSS with a custom orange/amber theme inspired by Bitcoin:

- **Primary**: Orange (#f97316)
- **Background**: Slate dark theme
- **Typography**: Light text on dark backgrounds

## License

MIT
