import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import GovernanceSection from "@/components/GovernanceSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <GovernanceSection />
      <StatsSection />
      <DeveloperSection />
      <Footer />
    </div>
  );
};

export default Index;
