import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardPro from "./pages/DashboardPro";
import AddPolitician from "./pages/AddPolitician";
import Competitors from "./pages/Competitors";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Legislativo from "./pages/Legislativo";
import Demographics from "./pages/Demographics";
import MessageTest from "./pages/MessageTest";
import HateSpeech from "./pages/HateSpeech";
import Onboarding from "./pages/Onboarding";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardPro />} />
          <Route path="/add-politician" element={<AddPolitician />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
            <Route path="/team" element={<Team />} />
            <Route path="/legislativo" element={<Legislativo />} />
            <Route path="/demographics" element={<Demographics />} />
            <Route path="/message-test" element={<MessageTest />} />
            <Route path="/hate-speech" element={<HateSpeech />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/api-docs" element={<ApiDocs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// Trigger Lovable sync - Fri Feb  6 00:25:15 UTC 2026
