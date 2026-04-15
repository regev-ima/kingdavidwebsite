import React from "react";
import { ComfortZoneIcon, CircuTechIcon, BalanceIcon } from "@/components/icons/CustomIcons";
import { motion } from "framer-motion";
import { SectionDivider } from "@/components/ui/royal-ornament";

const technologies = [
  {
    icon: ComfortZoneIcon,
    name: "5 אזורי נוחות",
    subtitle: "ComfortZone 5D",
    description: "5 אזורי תמיכה מותאמים אישית לכתפיים, גב תחתון וחלוקת משקל מושלמת",
  },
  {
    icon: CircuTechIcon,
    name: "מערכת סירקולציה",
    subtitle: "CircuTech",
    description: "עשרות אלפי נקודות מגע לשיפור זרימת הדם והסירקולציה הטבעית בזמן השינה",
  },
  {
    icon: BalanceIcon,
    name: "מערכת איזון",
    subtitle: "Balance System",
    description: "יציבות מרבית, תמיכת מרכז כובד ופיזור לחץ אופטימלי על כל משטח השינה",
  },
];

export default function TechnologiesSection() {
  return (
    <section className="py-24 md:py-32 marble-bg relative">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <SectionDivider className="mb-4" />
          <h2 className="text-3xl md:text-4xl font-sans-hebrew font-semibold text-foreground mb-3">
            הטכנולוגיות שלנו
          </h2>
          <p className="text-muted-foreground text-sm font-light tracking-wide">
            חדשנות ישראלית לשינה מושלמת
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {technologies.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="royal-card rounded-lg p-8 group text-center"
            >
              <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center mb-6 mx-auto group-hover:border-primary/40 group-hover:shadow-[0_0_20px_hsl(42_70%_55%/0.1)] transition-all duration-300">
                <tech.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-sans-hebrew font-semibold text-foreground mb-1">{tech.name}</h3>
              <p className="text-xs text-primary/60 font-light tracking-wider mb-3 uppercase">{tech.subtitle}</p>
              <p className="text-muted-foreground text-sm leading-relaxed font-light">{tech.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
