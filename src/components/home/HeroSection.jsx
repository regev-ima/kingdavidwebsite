import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[100svh] md:min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/69ba8e801b8d893fdd14efd0/311035b31_generated_56cfdb7e.png"
          alt="חדר שינה יוקרתי"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[hsl(225,20%,4%)]/90 via-[hsl(225,20%,4%)]/70 to-[hsl(225,20%,4%)]/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:py-36 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-sm tracking-[0.3em] text-primary/70 uppercase font-light mb-6 font-heebo">
              למעלה מ-40 שנות מצוינות
            </p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-cormorant font-semibold text-[hsl(40,20%,92%)] leading-[1.05] mb-6">
              גלו את המזרן
              <br />
              <span className="gold-shimmer">שישנה לכם את החיים</span>
            </h1>

            <p className="text-base md:text-lg text-[hsl(40,20%,92%)]/60 mb-10 leading-relaxed max-w-xl font-light">
              שאלון של 2 דקות + המלצה מקצועית + 30 לילות ניסיון ללא סיכון.
              <br className="hidden md:block" />
              לא אהבתם? אנחנו מגיעים לאסוף בחינם!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/Shop" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium text-base px-10 h-14 rounded-none tracking-wide transition-all duration-300 glow-gold">
                  גלו את המזרנים שלנו
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <a href="tel:1700700464" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[hsl(40,20%,92%)]/15 text-[hsl(40,20%,92%)]/70 hover:border-primary/40 hover:text-primary font-light text-base px-10 h-14 rounded-none tracking-wide transition-all duration-300">
                  דברו עם יועץ שינה
                </Button>
              </a>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap gap-4 md:gap-6">
              {[
                { number: "40", label: "שנות ייצור" },
                { number: "20", label: "שנות אחריות" },
                { number: "100+", label: "דגמים" },
              ].map(({ number, label }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3 border border-primary/15 bg-[hsl(225,20%,4%)]/40 backdrop-blur-sm">
                  <span className="text-3xl md:text-4xl font-cormorant-sc font-semibold text-primary">{number}</span>
                  <span className="text-xs text-[hsl(40,20%,92%)]/50 font-light">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
