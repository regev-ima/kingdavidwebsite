import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Award, Shield, Heart, Users, Sparkles, Factory, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true },
});

export default function About() {
  return (
    <div>
      {/* 1. Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/general/about_number_section.jpg" alt="מפעל קינג דיוויד" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative text-center px-4 py-20">
          <motion.div {...fadeIn()}>
            <img src="/images/general/crown-logo.png" alt="" className="w-14 h-12 mx-auto mb-6 object-contain brightness-0 invert opacity-40" />
            <p className="text-sm tracking-[0.3em] uppercase text-white/50 mb-4">הסיפור שלנו</p>
            <h1 className="text-4xl md:text-6xl font-bold text-white font-sans-hebrew mb-6">
              ברוכים הבאים לממלכת
              <br />
              <span className="text-primary">קינג דיוויד</span>
            </h1>
            <div className="w-16 h-px bg-primary/50 mx-auto mb-6" />
            <p className="text-white/60 text-lg max-w-xl mx-auto">הפכנו את השינה לאומנות מאז 1985</p>
          </motion.div>
        </div>
      </section>

      {/* 2. Origin Story */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeIn()}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">חלמנו חלום — והגשמנו אותו</h2>
            <div className="space-y-6 text-foreground/70 text-lg leading-relaxed">
              <p>אנחנו בקינג דיוויד, חלמנו חלום והגשמנו אותו — הפכנו את השינה לאומנות, ואנחנו צובעים בדייקנות את קנבס השינה והחלומות מאז 1985, עם למעלה מ-40 שנות ניסיון.</p>
              <p>מטרת העל של מייסד החברה, <strong className="text-foreground">שוקי רחמני</strong> — להתאים את המזרנים לקהל היעד ולמזג האוויר הישראלי, לזהות את הצרכים הפרטניים של כל לקוח, ולייצר את המגוון הרחב ביותר שקיים בארץ.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Timeline */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeIn()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">40 שנה של מצוינות</h2>
            <p className="text-muted-foreground">ציוני דרך בדרך לשינה מושלמת</p>
          </motion.div>
          <div className="relative">
            <div className="absolute right-1/2 top-0 bottom-0 w-px bg-primary/20 hidden md:block" />
            {[
              { year: "1985", title: "ההקמה", text: "שוקי רחמני מייסד את ׳המלך דוד תעשיות מזרנים בע״מ׳ בקרית מלאכי. חזון אחד: לייצר את המזרן הישראלי המושלם." },
              { year: "2000", title: "צמיחה", text: "החברה מתרחבת ל-100+ נקודות מכירה ברחבי הארץ. המפעל עובר שדרוג עם טכנולוגיות ייצור מתקדמות." },
              { year: "2015", title: "חדשנות", text: "השקת טכנולוגיות ComfortZone 5D, CircuTech ו-Balance System. מזרנים בהתאמה אישית לכל סוג גוף." },
              { year: "2025", title: "היום", text: "למעלה מ-100 דגמים בלעדיים, סניף דגל בראשון לציון, 30 לילות ניסיון ללא ניילון, ועד 20 שנות אחריות." },
            ].map((m, i) => (
              <motion.div key={m.year} {...fadeIn(i * 0.1)} className={`relative flex items-start gap-6 mb-12 last:mb-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                <div className={`flex-1 ${i % 2 === 0 ? "md:text-left" : "md:text-right"}`}>
                  <div className="glass-card rounded-2xl p-6 md:p-8">
                    <span className="text-3xl font-bold text-primary font-sans-hebrew">{m.year}</span>
                    <h3 className="text-xl font-bold text-foreground mt-2 mb-2">{m.title}</h3>
                    <p className="text-foreground/60 leading-relaxed">{m.text}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center w-4 h-4 rounded-full bg-primary border-4 border-background shrink-0 mt-8" />
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Craftsmanship — with image grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image collage — luxury feel */}
            <motion.div {...fadeIn()} className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80"
                  alt="תפירת מזרן בעבודת יד"
                  className="rounded-2xl w-full h-48 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1631049035182-249067d7618e?w=600&q=80"
                  alt="בד כותנה איכותי"
                  className="rounded-2xl w-full h-64 object-cover"
                />
              </div>
              <div className="space-y-3 pt-6">
                <img
                  src="https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&q=80"
                  alt="מזרן יוקרתי בחדר שינה"
                  className="rounded-2xl w-full h-64 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"
                  alt="ריפוד איכותי"
                  className="rounded-2xl w-full h-48 object-cover"
                />
              </div>
            </motion.div>

            <motion.div {...fadeIn(0.2)}>
              <p className="text-sm tracking-[0.2em] text-primary/70 uppercase mb-3">אומנות הייצור</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">כמו סטודיו של אמן</h2>
              <div className="space-y-5 text-foreground/70 leading-relaxed">
                <p>המפעל שלנו, הממוקם בקריית מלאכי, הוא קצת כמו סטודיו-אמן. אנו מייצרים את המזרונים, המיטות וספות הנוער שלנו בעבודת יד — תוך שימוש בחומרי גלם משובחים וטכנולוגיות חדשניות בלבד.</p>
                <p>בניגוד למתחרים, אנו שולטים ב-100% מחומרי הגלם. כך כל מזרן יוצא מהמפעל עם החומרים הטובים ביותר, בדיוק כפי שתוכנן.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Factory, label: "ייצור ישראלי" },
                  { icon: Heart, label: "עבודת יד" },
                  { icon: Shield, label: "שליטה בחומרי גלם" },
                  { icon: Sparkles, label: "טכנולוגיה מתקדמת" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/60">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4b. Craftsmanship Gallery — fullwidth strip */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { src: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=400&q=80", alt: "תפירה ידנית" },
              { src: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&q=80", alt: "בד טבעי" },
              { src: "/images/general/story-25-photo.jpeg", alt: "מזרן קינג דיוויד בייצור" },
              { src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80", alt: "חדר שינה יוקרתי" },
              { src: "/images/general/beds-banner.jpg", alt: "מיטות קינג דיוויד" },
              { src: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&q=80", alt: "מיטה מעוצבת" },
            ].map((img, i) => (
              <motion.div key={i} {...fadeIn(i * 0.05)} className="aspect-square rounded-xl overflow-hidden">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Stats */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: "40+", label: "שנות ניסיון" },
              { number: "100+", label: "דגמים בלעדיים" },
              { number: "100+", label: "נקודות מכירה" },
              { number: "20", label: "שנות אחריות" },
            ].map((stat, i) => (
              <motion.div key={i} {...fadeIn(i * 0.08)} className="text-center">
                <span className="text-4xl md:text-5xl font-bold text-primary font-sans-hebrew">{stat.number}</span>
                <p className="text-sm text-foreground/50 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Values */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeIn()} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">הערכים שמובילים אותנו</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "יועצי שינה מקצועיים", text: "לא סתם אנשי מכירות. יועצים שעברו הכשרה מקצועית על תורת המזרנים והתאמת המזרן לצרכי כל אדם." },
              { icon: Shield, title: "שליטה ב-100% מחומרי הגלם", text: "בניגוד למתחרים, אנו שולטים בכל חומר גלם. כך כל מזרן יוצא מהמפעל עם החומרים הטובים ביותר." },
              { icon: Award, title: "מותג עם היסטוריה", text: "מ-1985 ועד היום — 40 שנה של ניסיון, מומחיות וייצור מזרנים ישראלי. ׳לכל אחד יש את הקינג דיוויד שמתאים לו.׳" },
            ].map((v, i) => (
              <motion.div key={i} {...fadeIn(i * 0.1)} className="glass-card rounded-2xl p-8 text-center border border-primary/[0.08]">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{v.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-sm">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Quote */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(38,40%,38%)] via-[hsl(38,45%,42%)] to-[hsl(38,40%,38%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeIn()}>
            <img src="/images/general/crown-logo.png" alt="" className="w-10 h-8 mx-auto mb-8 object-contain brightness-0 invert opacity-30" />
            <blockquote className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-8 font-sans-hebrew">
              "כאלו אנחנו — מגשימים חלומות."
            </blockquote>
            <p className="text-white/50 text-sm tracking-wide">— שוקי רחמני, מייסד קינג דיוויד</p>
          </motion.div>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeIn()}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">בואו לבקר אותנו</h2>
            <p className="text-foreground/60 text-lg mb-8 max-w-xl mx-auto">מוזמנים לאולם התצוגה שלנו בראשון לציון לנסות את המזרנים ולקבל ייעוץ שינה מקצועי</p>
            <div className="glass-card rounded-2xl p-8 md:p-10 mb-8 max-w-lg mx-auto border border-primary/[0.08]">
              <h3 className="font-bold text-foreground mb-4 text-lg">אולם תצוגה ראשון לציון</h3>
              <p className="text-foreground/60 mb-2">רח׳ בן צבי 23, ראשל"צ</p>
              <p className="text-foreground/60 mb-4">א׳-ה׳ 09:00-20:00 | ו׳ 09:00-13:00</p>
              <a href="tel:1700700464">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 rounded-xl glow-gold gap-2">
                  <Phone className="w-4 h-4" />
                  1700-700-464
                </Button>
              </a>
            </div>
            <Link to="/Shop">
              <Button variant="outline" className="glass font-medium px-8 h-12 rounded-xl gap-2">
                גלו את המוצרים שלנו
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
