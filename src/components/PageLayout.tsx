import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";

const useScrollReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const main = document.querySelector("main");
    if (!main) return;

    const targets = Array.from(
      main.querySelectorAll<HTMLElement>("section, article, .ops-card, .ui-card"),
    ).filter((el) => !el.closest("[data-no-reveal]"));

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);
};

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      {/* Presentation-only ambient orbs; never interactive */}
      <div aria-hidden="true" className="ambient-orbs">
        <span className="ambient-orb ambient-orb-primary" />
        <span className="ambient-orb ambient-orb-accent" />
        <span className="ambient-orb ambient-orb-magenta" />
      </div>
      <TopBanner />
      <Navbar />
      <main className="app-motion pb-16">{children}</main>
    </div>
  );
};

export default PageLayout;
