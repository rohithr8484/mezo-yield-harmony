import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";

const useScrollReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observed = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (preference.matches) return;
          const element = entry.target as HTMLElement;
          const siblings = Array.from(element.parentElement?.children ?? []);
          const delay = Math.min(siblings.indexOf(element), 4) * 65;
          // Animate over visible content; no class or completion callback gates access.
          const animation = element.animate(
            [
              { opacity: 0.25, transform: "translateY(28px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 950, delay, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -30px 0px" },
    );
    const discover = () => {
      main.querySelectorAll<HTMLElement>("section, article, .ops-card, .ui-card").forEach((element) => {
        if (observed.has(element) || element.closest("[data-no-reveal]")) return;
        // Avoid stacking transforms on both a section and its cards.
        if (element.matches("section") && element.querySelector("article, .ops-card, .ui-card")) return;
        if (!element.matches("section") && element.parentElement?.closest("article, .ops-card, .ui-card")) return;
        observed.add(element);
        observer.observe(element);
      });
    };
    const cancelMotion = () => {
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    };
    discover();
    const mutations = new MutationObserver(discover);
    mutations.observe(main, { childList: true, subtree: true });
    preference.addEventListener("change", cancelMotion);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", cancelMotion);
      animations.forEach((animation) => animation.cancel());
    };
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
