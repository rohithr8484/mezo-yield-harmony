import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";
import FAQSection from "@/components/FAQSection";
import ServicesOverview from "@/components/ServicesOverview";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <DeveloperSection />
      <ServicesOverview />
      <FAQSection />
    </PageLayout>
  );
};

export default Index;
