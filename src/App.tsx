import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import CorporateDealsPage from "./pages/CorporateDealsPage";
import DealDetailsPage from "./pages/DealDetailsPage";
import DealAnalyticsPage from "./pages/DealAnalyticsPage";
import SearchPage from "./pages/SearchPage";
import BorrowerDetailsPage from "./pages/BorrowerDetailsPage";
import MarketScanPage from "./pages/MarketScanPage";
import ClauseManagementPage from "./pages/ClauseManagementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrandingProvider>
        <HashRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Navigate to="/corporate-deals" replace /></ProtectedRoute>} />
              <Route path="/corporate-deals" element={<ProtectedRoute><CorporateDealsPage /></ProtectedRoute>} />
              <Route path="/deals/:consultationId" element={<ProtectedRoute><DealDetailsPage /></ProtectedRoute>} />
              <Route path="/deals/:consultationId/analytics" element={<ProtectedRoute><DealAnalyticsPage /></ProtectedRoute>} />
              <Route path="/borrower/:consultationId" element={<ProtectedRoute><BorrowerDetailsPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/market-scan" element={<ProtectedRoute><MarketScanPage /></ProtectedRoute>} />
              <Route path="/clause-management" element={<ProtectedRoute><ClauseManagementPage /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </HashRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
