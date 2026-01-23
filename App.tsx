import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import TabNavigation from "./components/TabNavigation"
import Films from "./pages/Films"
import Wallet from "./pages/Wallet"
import Profile from "./pages/Profile"
import Onboarding from "./pages/Onboarding"
import ConnectWallet from "./pages/ConnectWallet"
import ContractTester from "./pages/ContractTester"
import "./index.css"
import { useEffect } from "react"

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])
  
  return (
    <Router>
      <div className="min-h-screen bg-background-0 flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/connect-wallet" element={<ConnectWallet />} />
          {/* Hidden contract tester for development/debugging */}
          <Route path="/contract-tester" element={<ContractTester />} />
          <Route
            path="/*"
            element={
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                <TabNavigation variant="sidebar" />
                
                <main className="flex-1 overflow-hidden">
                  <Routes>
                    <Route path="/films" element={<Films />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </main>
                
                <TabNavigation variant="bottom" />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
