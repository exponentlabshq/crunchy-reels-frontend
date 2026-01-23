import "./index.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { Toaster as HotToaster } from "react-hot-toast"

import App from "@/App.tsx"
import { Toaster } from "@/components/ui/toaster.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { StacksWalletProvider } from "@/context/StacksWalletContext"
import { DemoProvider } from "@/context/DemoStore"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DemoProvider>
      <StacksWalletProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={100}>
            <App />
            <Toaster />
            <HotToaster
              position="top-center"
              containerStyle={{
                top: 20,
                zIndex: 9999,
              }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: "rgb(15, 23, 42)",
                  color: "rgb(248, 250, 252)",
                  border: "1px solid rgb(30, 41, 59)",
                },
                success: {
                  iconTheme: {
                    primary: "rgb(249, 115, 22)",
                    secondary: "white",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "rgb(239, 68, 68)",
                    secondary: "white",
                  },
                },
              }}
            />
          </TooltipProvider>
        </QueryClientProvider>
      </StacksWalletProvider>
    </DemoProvider>
  </React.StrictMode>,
)
