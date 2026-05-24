import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";
import FAQSection from "@/components/FAQSection";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <DeveloperSection />
      <FAQSection />
    </PageLayout>
  );
};

export default Index;
