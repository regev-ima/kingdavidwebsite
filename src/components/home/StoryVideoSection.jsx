import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoryVideoSection() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted && videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            setHasStarted(true);
          }).catch(() => {});
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-xs tracking-[0.3em] text-primary/60 uppercase mb-3 font-light">ברוכים הבאים לממלכת</p>
            <h2 className="text-4xl md:text-5xl font-cormorant font-semibold text-foreground mb-4">
              KING DAVID
            </h2>
            <p className="text-muted-foreground text-sm font-light mb-8">
              הסיפור שלנו
            </p>

            <div className="w-12 h-px bg-primary/30 mb-8" />

            <div className="space-y-5 text-foreground/60 leading-relaxed font-light">
              <p>
                אנחנו בקינג דיוויד, חלמנו חלום והגשמנו אותו — הפכנו את השינה לאומנות, ואנחנו צובעים בדייקנות את קנבס השינה והחלומות מאז 1985, עם למעלה מ-40 שנות ניסיון.
              </p>
              <p>
                המפעל שלנו, הממוקם בקריית מלאכי, הוא קצת כמו סטודיו-אמן. אנו מייצרים את המזרונים, המיטות וספות הנוער שלנו בעבודת יד — תוך שימוש בחומרי גלם משובחים וטכנולוגיות חדשניות בלבד.
              </p>
              <p className="text-foreground/80 font-cormorant text-lg italic">
                "כאלו אנחנו — מגשימים חלומות."
              </p>
            </div>

            <Link to="/About" className="inline-block mt-8">
              <Button variant="outline" className="border-primary/20 text-foreground/70 hover:border-primary/40 hover:text-primary font-light px-8 h-12 rounded-none tracking-wide">
                לקרוא עוד
              </Button>
            </Link>
          </motion.div>

          {/* Video side with gold frame */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Decorative gold frame */}
            <div className="absolute -inset-3 border border-primary/15 rounded-sm pointer-events-none" />
            <div className="absolute -inset-1 border border-primary/8 rounded-sm pointer-events-none" />

            <div
              className="relative rounded-sm overflow-hidden aspect-[4/3] cursor-pointer group bg-card"
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                src="/images/general/kingdavid-tv.mp4"
                className="w-full h-full object-cover"
                playsInline
                muted
                loop
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
                <div className="w-20 h-20 rounded-full border border-primary/40 flex items-center justify-center bg-background/30 backdrop-blur-sm transition-transform group-hover:scale-110">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-primary" />
                  ) : (
                    <Play className="w-8 h-8 text-primary mr-[-2px]" />
                  )}
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border border-primary/15 rounded-sm px-3 py-1.5 text-primary/80 text-xs font-light">
                כתבה בערוץ 2
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
