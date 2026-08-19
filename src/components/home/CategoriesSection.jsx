import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { SectionDivider } from "@/components/ui/royal-ornament";

// Category art is served from this repo. It used to come from media.base44.com
// — the platform this site was migrated off — which meant the homepage depended
// on a host nobody here controls or pays for.
const categories = [
  {
    title: "מזרנים זוגיים",
    description: "מגוון רחב של מזרנים זוגיים בטכנולוגיות מתקדמות",
    image: "/images/general/cat-double-mattresses.jpg",
    link: "/Shop?category=מזרנים זוגיים",
  },
  {
    title: "מזרני יחיד",
    description: "מזרנים איכותיים למיטת יחיד ומיטה וחצי",
    image: "/images/general/cat-single-mattresses.jpg",
    link: "/Shop?category=מזרני יחיד",
  },
  {
    title: "מיטות מעוצבות",
    description: "מיטות זוגיות מעוצבות בסגנונות שונים",
    image: "/images/general/cat-designer-beds.jpg",
    link: "/Shop?category=מיטות מעוצבות",
  },
  {
    title: "מיטות יהודיות",
    description: "מיטות בהפרדה יהודית עם ארגז מצעים",
    image: "/images/general/cat-jewish-beds.jpg",
    link: "/Shop?category=מיטות יהודיות",
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <SectionDivider className="mb-4" />
          <h2 className="text-3xl md:text-4xl font-sans-hebrew font-semibold text-foreground mb-3">
            הקטגוריות שלנו
          </h2>
          <p className="text-muted-foreground text-sm font-light">
            לכל אחד יש את הקינג דיויד שמתאים לו
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Link to={cat.link} className="group block">
                <div className="relative overflow-hidden rounded-sm aspect-[3/4] border border-primary/10 hover:border-primary/25 transition-all duration-300">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(225,20%,4%)]/80 via-[hsl(225,20%,4%)]/30 to-transparent" />
                  <div className="absolute bottom-0 right-0 left-0 p-6">
                    <h3 className="text-xl font-sans-hebrew font-semibold text-white mb-1">{cat.title}</h3>
                    <p className="text-white/50 text-xs font-light mb-3">{cat.description}</p>
                    {/* Gold underline that reveals on hover */}
                    <div className="w-0 group-hover:w-12 h-px bg-primary transition-all duration-300 mb-3" />
                    <span className="inline-flex items-center gap-1 text-primary text-xs font-light tracking-wide group-hover:gap-2 transition-all">
                      צפו במוצרים
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
