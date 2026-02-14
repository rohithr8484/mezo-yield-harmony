import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
