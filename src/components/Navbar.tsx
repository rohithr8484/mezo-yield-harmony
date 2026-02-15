import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { useBitcoinAccount } from "@mezo-org/passport";
import WalletButton from "./WalletButton";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Governance", href: "/governance" },
  { label: "Staking & Rewards", href: "/staking" },
  { label: "Developer Infrastructure", href: "/developer" },
  { label: "Earn", href: "/earn" },
  { label: "Build", href: "/build" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-display">M</span>
          </div>
          <span className="text-xl font-bold font-display text-foreground">Mezo</span>
          <span className="px-2 py-0.5 rounded-full bg-bitcoin/10 text-bitcoin text-[10px] font-bold uppercase tracking-wider">
            Testnet
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {isConnected && (
            <a
              href="https://explorer.test.mezo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorer ↗
            </a>
          )}
          <WalletButton />
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3">
            <WalletButton />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
