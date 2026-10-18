import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      <Navbar />
      <main className="app-motion pb-16">{children}</main>
    </div>
  );
};

export default PageLayout;
