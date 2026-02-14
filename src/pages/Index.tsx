import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import GovernanceSection from "@/components/GovernanceSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <GovernanceSection />
      <StatsSection />
      <DeveloperSection />
    </PageLayout>
  );
};

export default Index;
