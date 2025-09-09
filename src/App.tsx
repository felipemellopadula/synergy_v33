import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Import essential components directly
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import VideoPage from "./pages/Video";
import ImagePage from "./pages/Image";
import TranslatorPage from "./pages/Translator";
import WritePage from "./pages/Write";
import TranscribePage from "./pages/Transcribe";
import SettingsPage from "./pages/Settings";
import Share from "./pages/Share";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Create queryClient
const queryClient = new QueryClient();

// Providers wrapper for all routes
const ProvidersWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {children}
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => (
  <BrowserRouter>
    <ProvidersWrapper>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/share" element={<Share />} />
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />
        <Route path="/video" element={
          <ProtectedRoute><VideoPage /></ProtectedRoute>
        } />
        <Route path="/image" element={
          <ProtectedRoute><ImagePage /></ProtectedRoute>
        } />
        <Route path="/translator" element={
          <ProtectedRoute><TranslatorPage /></ProtectedRoute>
        } />
        <Route path="/write" element={
          <ProtectedRoute><WritePage /></ProtectedRoute>
        } />
        <Route path="/transcribe" element={
          <ProtectedRoute><TranscribePage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProvidersWrapper>
  </BrowserRouter>
);

export default App;