# ShortStarter Frontend

A Next.js 15 application for ShortStarter - a tokenized film investment platform on Bitcoin L2 (Stacks).

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Blockchain**: Stacks (Bitcoin L2)
- **Wallet**: @stacks/connect
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your configuration
```

### Environment Variables

```env
# Stacks Network Configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet

# ShortStarter Contract Address (after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

### Development

```bash
# Start development server (with Turbopack)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format:write
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/             # Authenticated routes with nav
│   │   │   ├── films/
│   │   │   ├── wallet/
│   │   │   └── profile/
│   │   ├── onboarding/
│   │   ├── connect-wallet/
│   │   ├── contract-tester/   # Development/debug page
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── TabNavigation.tsx
│   ├── context/
│   │   ├── DemoStore.tsx
│   │   └── StacksWalletContext.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── contractCalls.ts
│   │   ├── contractConfig.ts
│   │   └── stacksApi.ts
│   ├── config.ts
│   ├── constants.ts
│   └── env.js
├── public/
│   ├── icon.png
│   ├── apple-touch-icon.png
│   └── manifest.webmanifest
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Features

- **Film Investment**: Browse and invest in tokenized film projects
- **USDCx Integration**: Invest using Circle's bridged stablecoin
- **Wallet Management**: Connect Stacks wallet, view balances
- **Demo Mode**: Explore the app without a wallet
- **Contract Tester**: Development tool for smart contract interaction

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format:write` | Format code with Prettier |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Stacks Documentation](https://docs.stacks.co)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
