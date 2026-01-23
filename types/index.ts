export interface Film {
  id: number
  title: string
  genre: string
  description: string
  imageUri: string
  director: string
  year: number
  fundingGoal: number
  currentFunding: number
  tokenSymbol: string
}

export interface FilmToken {
  filmId: number
  filmTitle: string
  tokenSymbol: string
  amount: number
  value: number
  imageUri?: string
}

export interface Portfolio {
  totalValue: number
  change: number
  changePercent: number
  holdings: FilmToken[]
}

export interface InvestmentTransaction {
  id: string
  filmId: number
  filmTitle: string
  amount: number
  tokens: number
  date: Date
  type: "invest" | "sell"
  status: "completed" | "pending" | "failed"
}

export interface UserProfile {
  address: string
  isConnected: boolean
  stxBalance: number
  totalFilmsInvested: number
  totalInvested: number
}
