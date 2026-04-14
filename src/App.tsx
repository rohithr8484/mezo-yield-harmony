import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/Web3Provider";
import Index from "./pages/Index";
import Governance from "./pages/Governance";
import ProposalDetail from "./pages/ProposalDetail";
import DeveloperServices from "./pages/DeveloperServices";
import NotFound from "./pages/NotFound";
import GovernanceChatBot from "./components/GovernanceChatBot";

const App = () => (
  <Web3Provider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/governance/:id" element={<ProposalDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GovernanceChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </Web3Provider>
);

export default App;

