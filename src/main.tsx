import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from 'react-dom/client'
import './index.css'

// Lazy load heavy providers and app to reduce initial bundle
const ThemeProvider = lazy(() => import("next-themes").then(m => ({ default: m.ThemeProvider })));
const AuthProvider = lazy(() => import("@/contexts/AuthContext"));
const App = lazy(() => import('./App.tsx'));

// Minimal loading fallback
const AppLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<AppLoader />}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);
