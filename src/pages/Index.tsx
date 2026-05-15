import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <DeveloperSection />
    </PageLayout>
  );
};

export default Index;
