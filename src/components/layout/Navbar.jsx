import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, ShoppingCart, Sun, Moon, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { useTheme } from "@/lib/ThemeContext";
import CartDrawer from "@/components/shop/CartDrawer";
import MegaMenu from "@/components/layout/MegaMenu";

// Links with `megaMenu: <Hebrew category group>` open a product preview
// dropdown on hover.
const navLinks = [
  { label: "בית", path: "/Home" },
  { label: "אודות", path: "/About" },
  { label: "מזרנים", path: "/Shop/מזרנים", megaMenu: "מזרנים" },
  { label: "מיטות", path: "/Shop/מיטות", megaMenu: "מיטות" },
  { label: "מבצעים", path: "/Shop/מבצעים" },
  { label: "שאלות ותשובות", path: "/FAQ" },
  { label: "ביקורות", path: "/Reviews" },
  { label: "צור קשר", path: "/Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "מזרנים" | "מיטות" | null
  const closeTimer = useRef(null);
  const location = useLocation();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mega menu whenever the route changes
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  const openMega = (key) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenMenu(key);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const linkClass = (path, active) =>
    `relative px-3 py-2 text-[13px] tracking-wide font-light transition-all flex items-center gap-1 ${
      active
        ? "text-primary"
        : "text-foreground/60 hover:text-primary"
    }`;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Top Banner */}
        <div className={`bg-[hsl(42,75%,35%)] text-[hsl(40,20%,92%)] text-center py-2 text-xs tracking-wide font-light transition-all duration-300 overflow-hidden ${scrolled ? "h-0 py-0 opacity-0" : "h-auto opacity-100"}`}>
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <span>30 לילות ניסיון ללא סיכון</span>
            <span className="hidden sm:inline opacity-40">|</span>
            <span className="hidden sm:inline">אחריות עד 20 שנה</span>
            <span className="hidden sm:inline opacity-40">|</span>
            <span className="hidden sm:inline">משלוח עד הבית</span>
          </div>
        </div>

        {/* Main Nav */}
        <div className={`relative transition-all duration-300 ${
          scrolled
            ? "bg-[hsl(225,20%,4%)]/95 backdrop-blur-lg shadow-lg"
            : "bg-[hsl(225,20%,4%)]/60 backdrop-blur-md"
        }`}>
          {/* Gold line under nav */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative flex items-center justify-between h-16 md:h-[72px]">
              {/* Logo — right side (RTL start) */}
              <Link to="/Home" className="group shrink-0">
                <img
                  src="/images/general/logo-full.png"
                  alt="KING DAVID"
                  className="h-12 md:h-14 w-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </Link>

              {/* Desktop nav links — absolutely centered */}
              <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {navLinks.map((link) => {
                  const active = location.pathname === link.path;
                  const hasMenu = Boolean(link.megaMenu);
                  return (
                    <div
                      key={link.path}
                      onMouseEnter={() => hasMenu && openMega(link.megaMenu)}
                      onMouseLeave={() => hasMenu && scheduleClose()}
                      className="relative"
                    >
                      <Link to={link.path} className={linkClass(link.path, active)}>
                        {link.label}
                        {hasMenu && (
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                              openMenu === link.megaMenu ? "rotate-180 text-primary" : ""
                            }`}
                          />
                        )}
                      </Link>
                      {/* Active underline */}
                      {active && (
                        <span className="absolute bottom-0 left-3 right-3 h-px bg-primary/70" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions — left side (RTL end). Visual order right->left:
                  theme | cart | phone                                    */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/50 hover:text-primary transition-all"
                  aria-label={theme === "dark" ? "מעבר למצב יום" : "מעבר למצב לילה"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </button>
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-foreground/50 hover:text-primary transition-all"
                  aria-label="סל קניות"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="w-px h-5 bg-primary/15 mx-1" />
                <a
                  href="tel:1700700464"
                  className="flex items-center gap-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden xl:inline">1700-700-464</span>
                </a>
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative w-11 h-11 rounded-full flex items-center justify-center text-foreground/60 hover:text-primary transition-colors"
                  aria-label="סל קניות"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  className="w-11 h-11 rounded-full flex items-center justify-center text-foreground/60 hover:text-primary transition-colors"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mega menus — absolutely positioned below the main nav bar */}
          <MegaMenu
            open={openMenu === "מזרנים"}
            category="מזרנים"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onNavigate={() => setOpenMenu(null)}
          />
          <MegaMenu
            open={openMenu === "מיטות"}
            category="מיטות"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onNavigate={() => setOpenMenu(null)}
          />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-[hsl(225,20%,4%)]/95 backdrop-blur-xl border-b border-primary/10 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-light tracking-wide transition-all ${
                      location.pathname === link.path
                        ? "text-primary bg-primary/5"
                        : "text-foreground/70 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-primary/10 my-2" />
                <a
                  href="tel:1700700464"
                  className="flex items-center gap-2 px-4 py-3 text-primary font-medium"
                >
                  <Phone className="w-4 h-4" />
                  1700-700-464
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer */}
      <div className={`transition-all duration-300 ${scrolled ? "h-16 md:h-[72px]" : "h-[104px] md:h-[108px]"}`} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
