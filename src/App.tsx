import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import PatientListPage from "./pages/PatientListPage";
import PatientDetailsPage from "./pages/PatientDetailsPage";
import PatientListPageIp from "./pages/PatientListPageIp";
import PatientVisitHistoryPage from "./pages/PatientVisitHistoryPage";
import SearchPage from "./pages/SearchPage";
import BorrowerDetailsPage from "./pages/BorrowerDetailsPage";
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
              <Route path="/" element={<ProtectedRoute><Navigate to="/inpatient" replace /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><PatientListPage /></ProtectedRoute>} />
              <Route path="/inpatient" element={<ProtectedRoute><PatientListPageIp /></ProtectedRoute>} />
              <Route path="/consultationId/:consultationId" element={<ProtectedRoute><PatientDetailsPage /></ProtectedRoute>} />
              <Route path="/ip-details/:consultationId" element={<ProtectedRoute><PatientDetailsPage /></ProtectedRoute>} />
              <Route path="/borrower/:consultationId" element={<ProtectedRoute><BorrowerDetailsPage /></ProtectedRoute>} />
              <Route path="/consultationId/:consultationId/visit-history" element={<ProtectedRoute><PatientVisitHistoryPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
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
