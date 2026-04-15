import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { CrownOrnament } from "@/components/ui/royal-ornament";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-primary/10 relative">
      {/* Crown ornament centered on top border */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4">
        <CrownOrnament />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img src="/images/general/logo-full.png" alt="KING DAVID" className="h-16 w-auto object-contain brightness-0 invert opacity-80" />
            </div>
            <p className="text-primary/70 text-sm font-sans-hebrew italic mb-3">
              לישון כמו שלא ישנת אף פעם
            </p>
            <p className="text-foreground/40 text-xs leading-relaxed font-light">
              למעלה מ-40 שנות ניסיון בייצור מזרנים, מיטות וספות נוער. חומרי גלם משובחים וטכנולוגיות מתקדמות לשינה מושלמת.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-sans-hebrew font-semibold text-lg mb-4 text-primary/80">ניווט מהיר</h3>
            <div className="space-y-2">
              {[
                { label: "מזרנים", path: "/Shop/מזרנים" },
                { label: "מיטות", path: "/Shop/מיטות" },
                { label: "מבצעים", path: "/Shop/מבצעים" },
                { label: "אודות", path: "/About" },
                { label: "שאלות ותשובות", path: "/FAQ" },
                { label: "ביקורות", path: "/Reviews" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-foreground/40 hover:text-primary transition-colors text-sm font-light"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Branch Info */}
          <div>
            <h3 className="font-sans-hebrew font-semibold text-lg mb-4 text-primary/80">סניפים</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-sm text-foreground/70">אולם תצוגה ראשון לציון</p>
                <div className="flex items-start gap-2 mt-1 text-foreground/40 text-xs font-light">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>רח׳ בן צבי 23, ראשל"צ</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-foreground/40 text-xs font-light">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>א'-ה' 09:00-20:00 | ו' 09:00-13:00</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-sm text-foreground/70">מפעל קרית מלאכי</p>
                <div className="flex items-start gap-2 mt-1 text-foreground/40 text-xs font-light">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>רחוב עמל 6, קרית מלאכי (בתיאום מראש)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-sans-hebrew font-semibold text-lg mb-4 text-primary/80">צור קשר</h3>
            <div className="space-y-3">
              <a href="tel:1700700464" className="flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors text-sm font-light">
                <Phone className="w-3.5 h-3.5" />
                1700-700-464
              </a>
              <a href="https://wa.me/972549632221" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors text-sm font-light">
                <Phone className="w-3.5 h-3.5" />
                054-963-2221 (WhatsApp)
              </a>
              <a href="mailto:info@kingdavid4u.co.il" className="flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors text-sm font-light">
                <Mail className="w-3.5 h-3.5" />
                info@kingdavid4u.co.il
              </a>
              <div className="flex items-center gap-3 mt-4">
                <a href="https://www.facebook.com/kD4you/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-primary/15 flex items-center justify-center hover:border-primary/40 transition-all text-foreground/40 hover:text-primary">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-primary/15 flex items-center justify-center hover:border-primary/40 transition-all text-foreground/40 hover:text-primary">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-primary/15 flex items-center justify-center hover:border-primary/40 transition-all text-foreground/40 hover:text-primary">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-foreground/30 text-xs font-light">
            &copy; {new Date().getFullYear()} King David מזרנים. כל הזכויות שמורות.
          </p>
          <div className="flex gap-4 text-xs text-foreground/30 font-light">
            <Link to="/Terms" className="hover:text-primary transition-colors">תנאי שימוש</Link>
            <Link to="/Privacy" className="hover:text-primary transition-colors">מדיניות פרטיות</Link>
            <Link to="/Returns" className="hover:text-primary transition-colors">ביטולים והחזרות</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
