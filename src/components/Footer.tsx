const Footer = () => {
  return (
    <footer className="border-t border-border py-12 bg-card">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs font-display">M</span>
            </div>
            <span className="text-lg font-bold font-display text-foreground">Mezo</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="hover:text-foreground transition-colors">Ecosystem</a>
            <a href="#" className="hover:text-foreground transition-colors">Careers</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Mezo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
