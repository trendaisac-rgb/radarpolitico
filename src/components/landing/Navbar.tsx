import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Radar, Menu, X, LogIn } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/constants";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-card/95 backdrop-blur-sm shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Radar className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">
              Radar Político
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#como-funciona"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#funcionalidades"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#planos"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              Planos
            </a>
            <a
              href="#faq"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              FAQ
            </a>
            <Button variant="ghost" asChild>
              <Link to="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Link>
            </Button>
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <a href="/login">
                Teste Grátis
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a
                href="#como-funciona"
                className="text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Como Funciona
              </a>
              <a
                href="#funcionalidades"
                className="text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Funcionalidades
              </a>
              <a
                href="#planos"
                className="text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Planos
              </a>
              <a
                href="#faq"
                className="text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
              >
                <a href="/login">
                  Teste Grátis
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
