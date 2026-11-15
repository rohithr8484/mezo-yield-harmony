import { useEffect, useRef, type ReactNode } from "react";

/** Homepage-only effects; animation never controls content or navigation. */
export default function HomepageMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const home = root.current;
    if (!home) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const active = new Set<Animation>();
    let dispose = () => {};

    const configure = () => {
      dispose();
      if (preference.matches) return;
      const image = home.querySelector<HTMLElement>(".animate-float-slow");
      const hero = image?.closest("section");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          const element = target as HTMLElement;
          const siblings = Array.from(element.parentElement?.children ?? []);
          const card = element.matches("article, .grid > div, [data-state], .flex.flex-wrap > span");
          const index = Math.max(0, siblings.indexOf(element));
          const animation = element.animate([
            { opacity: 0.15, transform: `translate3d(0, ${card ? 44 : 30}px, 0) scale(${card ? 0.96 : 1})` },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ], {
            duration: card ? 1250 : 1100,
            delay: Math.min(index, 5) * (card ? 95 : 40),
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "backwards",
          });
          active.add(animation);
          animation.onfinish = () => active.delete(animation);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

      home.querySelectorAll<HTMLElement>("h2, h2 + p, section header, .grid > div, article, [data-radix-collection-item], .flex.flex-wrap > span").forEach((element) => {
        if (element.closest("header") && element.tagName !== "HEADER") return;
        if (element.closest("article") && element.tagName !== "ARTICLE") return;
        observer.observe(element);
      });
      // Accordion items have state attributes, but buttons/content are never animated here.
      home.querySelectorAll<HTMLElement>("#faq .space-y-3 > div").forEach((element) => observer.observe(element));

      let frame = 0;
      let currentX = 0;
      let currentY = 0;
      let pointerX = 0;
      let pointerY = 0;
      let inView = true;
      const stageObserver = new IntersectionObserver(([entry]) => {
        inView = entry?.isIntersecting ?? false;
        schedule();
      });
      const tick = () => {
        frame = 0;
        if (!image || !hero || !inView || document.hidden) return;
        const bounds = hero.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
        const targetX = pointerX * 9;
        const targetY = progress * 48 + pointerY * 7;
        currentX += (targetX - currentX) * 0.075;
        currentY += (targetY - currentY) * 0.075;
        image.style.translate = `${currentX.toFixed(2)}px ${currentY.toFixed(2)}px`;
        if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.1) schedule();
      };
      function schedule() {
        if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
      }
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || !hero) return;
        const bounds = hero.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
        pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
        schedule();
      };
      const leave = () => { pointerX = 0; pointerY = 0; schedule(); };
      hero?.addEventListener("pointermove", move);
      hero?.addEventListener("pointerleave", leave);
      if (hero) stageObserver.observe(hero);
      window.addEventListener("scroll", schedule, { passive: true });
      document.addEventListener("visibilitychange", schedule);
      schedule();

      dispose = () => {
        observer.disconnect();
        stageObserver.disconnect();
        cancelAnimationFrame(frame);
        active.forEach((animation) => animation.cancel());
        active.clear();
        hero?.removeEventListener("pointermove", move);
        hero?.removeEventListener("pointerleave", leave);
        window.removeEventListener("scroll", schedule);
        document.removeEventListener("visibilitychange", schedule);
        image?.style.removeProperty("translate");
      };
    };
    configure();
    preference.addEventListener("change", configure);
    return () => {
      dispose();
      preference.removeEventListener("change", configure);
    };
  }, []);

  return <div ref={root} className="homepage-motion contents" data-no-reveal>{children}</div>;
}