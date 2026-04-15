import React from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import { SectionDivider } from "@/components/ui/royal-ornament";

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 marble-bg relative">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="border border-primary/10 p-10 md:p-16 glass-highlight">
            <SectionDivider className="mb-6" />
            <h2 className="text-3xl md:text-5xl font-sans-hebrew font-semibold text-foreground mb-6">
              מוכנים לשינה
              <span className="gold-shimmer"> הטובה ביותר?</span>
            </h2>
            <p className="text-foreground/50 text-base mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              יועצי השינה שלנו ישמחו לעזור לכם למצוא את המזרן המושלם. התקשרו או שלחו הודעה ונחזור אליכם בהקדם.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="tel:1700700464">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base px-10 h-14 rounded-none tracking-wide gap-2 glow-gold transition-all duration-300">
                  <Phone className="w-5 h-5" />
                  קבעו ייעוץ שינה חינם
                </Button>
              </a>
              <a href="tel:1700700464" className="flex items-center gap-2 text-primary font-sans-hebrew text-xl font-semibold hover:text-primary/80 transition-colors">
                <Phone className="w-5 h-5" />
                1700-700-464
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
