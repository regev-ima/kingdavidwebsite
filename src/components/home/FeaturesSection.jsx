import React from "react";
import { TrialNightIcon, FactoryIcon, ModelsIcon, WarrantyBadgeIcon } from "@/components/icons/CustomIcons";
import { motion } from "framer-motion";
import { SectionDivider, CornerOrnament } from "@/components/ui/royal-ornament";

const features = [
  {
    icon: TrialNightIcon,
    number: "30",
    unit: "לילות",
    title: "ניסיון ללא ניילון",
    description: "רק אצלנו תוכלו להוציא את הניילון ולנסות את המזרן 30 לילות מלאים בבית.",
  },
  {
    icon: FactoryIcon,
    number: "40",
    unit: "שנה",
    title: "ייצור ישראלי",
    description: "מפעל קרית מלאכי, עבודת יד ישראלית, חומרי גלם איכותיים. תוצרת ישראל אמיתית מ-1985.",
  },
  {
    icon: ModelsIcon,
    number: "100+",
    unit: "דגמים",
    title: "המגוון הרחב בישראל",
    description: "מקשיח לרך, מקפיצים לויסקו, מיחיד לקינג. אנחנו מוצאים את המזרן שמתאים בדיוק לכם.",
  },
  {
    icon: WarrantyBadgeIcon,
    number: "20",
    unit: "שנות אחריות",
    title: "האחריות הארוכה בשוק",
    description: "אנחנו כל כך בטוחים באיכות הייצור שלנו, שאנחנו לוקחים אחריות לעשורים הבאים.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 marble-bg relative">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Framed section with corner ornaments */}
        <div className="relative border border-primary/10 p-8 md:p-14">
          <CornerOrnament position="top-right" />
          <CornerOrnament position="top-left" />
          <CornerOrnament position="bottom-right" />
          <CornerOrnament position="bottom-left" />

          <div className="text-center mb-14">
            <SectionDivider className="mb-4" />
            <h2 className="text-3xl md:text-5xl font-cormorant font-semibold text-foreground mb-3">
              למה לבחור בקינג דיוויד?
            </h2>
            <p className="text-muted-foreground text-sm font-light">
              למעלה מ-40 שנות ניסיון בייצור מזרנים ומיטות באיכות ללא פשרות
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center mb-4 mx-auto group-hover:border-primary/40 group-hover:shadow-[0_0_16px_hsl(42_70%_55%/0.1)] transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                <div className="mb-3">
                  <span className="text-4xl md:text-5xl font-cormorant-sc font-semibold text-primary leading-none">{feature.number}</span>
                  <span className="text-xs text-primary/60 font-light mr-1">{feature.unit}</span>
                </div>

                <h3 className="text-base font-cormorant font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
