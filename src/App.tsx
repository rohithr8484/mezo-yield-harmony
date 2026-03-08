import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/Web3Provider";
import Index from "./pages/Index";
import Governance from "./pages/Governance";
import Staking from "./pages/Staking";
import Bridge from "./pages/Bridge";
import Earn from "./pages/Earn";
import Build from "./pages/Build";
import Developer from "./pages/Developer";
import Predict from "./pages/Predict";
import Trade from "./pages/Trade";
import NotFound from "./pages/NotFound";

const App = () => (
  <Web3Provider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/staking" element={<Staking />} />
          <Route path="/bridge" element={<Bridge />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/build" element={<Build />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </Web3Provider>
);

export default App;

