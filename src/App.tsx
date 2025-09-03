import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SyncDataProvider } from "@/components/sync/SyncDataProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ✅ المكون الجديد لمعالجة callback
const AuthCallbackHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("جاري معالجة استجابة Google...");
    
    setTimeout(() => {
      navigate("/");
    }, 1000);
  }, [navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>جاري تسجيل الدخول</h2>
      <p>انتظر قليلاً...</p>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SyncDataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ✅ Route الجديد */}
            <Route path="/auth/google/callback" element={<AuthCallbackHandler />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SyncDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;