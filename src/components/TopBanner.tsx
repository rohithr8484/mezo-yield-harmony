import { useState } from "react";
import { X } from "lucide-react";

const TopBanner = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-banner py-2.5 px-4 flex items-center justify-center gap-3 relative">
      <span className="text-primary-foreground text-sm font-medium">
        Earn at least 4% BTC APY with Mezo Earn, limited availability.
      </span>
      <a
        href="#"
        className="inline-flex items-center gap-1 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/20 transition-colors"
      >
        Lock BTC →
      </a>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TopBanner;
