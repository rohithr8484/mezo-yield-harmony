import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import DeveloperSection from "@/components/DeveloperSection";
import FAQSection from "@/components/FAQSection";
import ServicesOverview from "@/components/ServicesOverview";
import HomepageMotion from "@/components/HomepageMotion";

const Index = () => {
  return (
    <PageLayout>
      <HomepageMotion>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <DeveloperSection />
      <ServicesOverview />
      <FAQSection />
      </HomepageMotion>
    </PageLayout>
  );
};

export default Index;
