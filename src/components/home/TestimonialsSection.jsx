import React, { useRef, useCallback, useEffect, useState } from "react";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { SectionDivider } from "@/components/ui/royal-ornament";

const reviews = [
  { name: "שי פרץ", text: "קינג דיויד אני שמח להודות למרק נציג הסניף שנתן שירות מקצועי ובחירה נכונה עברנו למיטת נוער", rating: 5 },
  { name: "הראל קאופמן", text: "השארתי פרטים באתר תוך יום חזר אליי מארק, סוכן המכירות. נתן שירות אדיב, זמין ומהיר. ממליצה בחום", rating: 5 },
  { name: "נתן האלוף", text: "נתן האלוף עם שירות יוצא דופן. בנועם ובסבלנות רבה. המון תודה.", rating: 5 },
  { name: "עדן לביא", text: "שירות מדהים מהמלצת המזרן ועד ההובלה הביתה ממליצה בחום", rating: 5 },
  { name: "הקהלת קהילות", text: "יש לנו כבר שנים את המזרונים המצוינים שלכם וחזרתי אליכם לקנות מזרון לאמא שלי. השארתי פנייה באת.", rating: 5 },
  { name: "שרה הר סיני", text: "חברה אמינה, איכות מזרונים ברמה מאוד גבוהה, צוות בסניף מאוד מנוסבים, אמפתיים, שירותיים, ומקבלי...", rating: 5 },
  { name: "noa Cembal", text: "קיבלתי מענה טוב בשירות לקוחות", rating: 5 },
  { name: "Moshe Elyahu", text: "שירות מקצועי אדיב מחתשב ומצויין מבחור בשם יצחק", rating: 5 },
  { name: "Haim Gitlin", text: "אני רוצה לומר תודה ליצחק על שירות מדהים סבלנות ועל המקצועיות שלו הלוואי עוד הרבה אנשי מכירות כמוהו.", rating: 5 },
];

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function TestimonialsSection() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft < -10);
    setCanScrollRight(el.scrollLeft > -(el.scrollWidth - el.clientWidth - 10));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (Math.abs(el.scrollLeft) >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -320, behavior: "smooth" });
      }
    }, 3500);
    const pause = () => clearInterval(interval);
    el.addEventListener("mouseenter", pause);
    el.addEventListener("touchstart", pause);
    return () => {
      clearInterval(interval);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("touchstart", pause);
    };
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <SectionDivider className="mb-4" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <GoogleIcon />
            <div className="flex gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-light">ביקורות גוגל</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-cormorant font-semibold text-foreground mb-3">
            מה הלקוחות שלנו אומרים
          </h2>
          <p className="text-muted-foreground text-sm font-light">אלפי לקוחות מרוצים ברחבי הארץ</p>
        </motion.div>

        <div className="relative">
          <button
            onClick={() => scroll(1)}
            className={`absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-primary/20 bg-background/90 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-all ${!canScrollRight && "opacity-30 pointer-events-none"}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll(-1)}
            className={`absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-primary/20 bg-background/90 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-all ${!canScrollLeft && "opacity-30 pointer-events-none"}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth px-1 py-2 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", direction: "rtl" }}
          >
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="shrink-0 w-[280px] sm:w-[300px]"
              >
                <div className="royal-card rounded-lg p-6 mb-3 relative">
                  {/* Gold quotation mark */}
                  <span className="absolute top-3 left-4 text-4xl font-cormorant text-primary/20 leading-none">&ldquo;</span>

                  <div className="flex gap-0.5 mb-3">
                    {Array(review.rating).fill(0).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/70 text-sm leading-relaxed line-clamp-4 font-light">{review.text}</p>
                </div>

                <div className="flex items-center gap-2 px-2">
                  <div className="w-9 h-9 rounded-full border border-primary/20 flex items-center justify-center text-primary font-cormorant font-semibold text-sm shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-cormorant font-semibold text-foreground truncate">{review.name}</p>
                    <p className="text-[11px] text-muted-foreground font-light">לפני חודשיים</p>
                  </div>
                  <GoogleIcon />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
}
