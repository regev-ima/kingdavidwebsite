import React from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrownOrnament } from "@/components/ui/royal-ornament";

export default function ClubSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Rich gold gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(42,60%,25%)] via-[hsl(42,55%,30%)] to-[hsl(42,60%,25%)]" />

      {/* Damask pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0 L24 8 L32 8 L26 14 L28 22 L20 18 L12 22 L14 14 L8 8 L16 8 Z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-6">
              <CrownOrnament className="!text-white/30" />
            </div>

            <h2 className="text-sm tracking-[0.4em] uppercase text-white/50 font-light mb-3">
              הצטרפו למועדון
            </h2>
            <h3 className="text-4xl md:text-5xl font-sans-hebrew font-semibold text-white mb-8">
              KING DAVID CLUB
            </h3>

            <div className="w-16 h-px bg-white/20 mx-auto mb-8" />

            <p className="text-white/60 text-base leading-relaxed mb-10 max-w-xl mx-auto font-light">
              הצטרפו למועדון קינג דיוויד ותקבלו גישה בלעדית להנחות מיוחדות,
              טיפים מקצועיים לשינה איכותית, הזמנות לאירועים בלעדיים,
              ושירות אישי שירים את רמת השינה שלכם
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-10 text-white/40 text-sm font-light">
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" /> הנחות בלעדיות
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> אירועים VIP
              </span>
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4" /> שירות אישי
              </span>
            </div>

            <Button className="bg-transparent border border-white/25 text-white hover:bg-white/10 font-light text-base px-10 h-13 rounded-none tracking-wide transition-all">
              לפרטים והצטרפות
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
