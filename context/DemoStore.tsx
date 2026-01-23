import { createContext, useContext, useState, ReactNode, useCallback } from "react"

// ========================================
// TYPES
// ========================================

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

interface DemoState {
  isGuest: boolean
  guestAddress: string
  films: Film[]
}

interface DemoContextType extends DemoState {
  signInAsGuest: () => void
  signOut: () => void
}

// ========================================
// INITIAL MOCK DATA
// ========================================

const MOCK_FILMS: Film[] = [
  {
    id: 1,
    title: "Neon Dreams",
    genre: "Sci-Fi",
    description: "A cyberpunk thriller set in 2087 Tokyo where reality and virtual worlds collide. Follow detective Maya Chen as she uncovers a conspiracy that threatens both dimensions.",
    imageUri: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=800",
    director: "Sarah Chen",
    year: 2026,
    fundingGoal: 500000,
    currentFunding: 125000,
    tokenSymbol: "NEON",
  },
  {
    id: 2,
    title: "The Last Frontier",
    genre: "Documentary",
    description: "An intimate look at the communities living on the edge of climate change, documenting their resilience and adaptation in the face of environmental challenges.",
    imageUri: "https://images.unsplash.com/photo-1518173946687-a4c036bc3c9c?w=800",
    director: "Michael Torres",
    year: 2026,
    fundingGoal: 250000,
    currentFunding: 175000,
    tokenSymbol: "FRNT",
  },
  {
    id: 3,
    title: "Midnight in Marrakech",
    genre: "Drama",
    description: "A sweeping romantic drama following two strangers who meet in the vibrant markets of Morocco and discover love, loss, and redemption across continents.",
    imageUri: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
    director: "Amira Benali",
    year: 2026,
    fundingGoal: 350000,
    currentFunding: 280000,
    tokenSymbol: "MRKCH",
  },
]

const STORAGE_KEY = "cineblock-demo-state"
const GUEST_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"

// ========================================
// CONTEXT
// ========================================

const DemoContext = createContext<DemoContextType | null>(null)

function getInitialState(): DemoState {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Fall through to default
      }
    }
  }

  return {
    isGuest: false,
    guestAddress: GUEST_ADDRESS,
    films: MOCK_FILMS,
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(getInitialState)

  const signInAsGuest = useCallback(() => {
    const newState = {
      isGuest: true,
      guestAddress: GUEST_ADDRESS,
      films: MOCK_FILMS,
    }
    setState(newState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      isGuest: false,
      guestAddress: GUEST_ADDRESS,
      films: MOCK_FILMS,
    })
  }, [])

  const value: DemoContextType = {
    ...state,
    signInAsGuest,
    signOut,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo(): DemoContextType {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider")
  }
  return context
}

export { GUEST_ADDRESS }
