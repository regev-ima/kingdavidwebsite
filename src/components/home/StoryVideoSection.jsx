import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

// The Channel 2 segment, which is published on YouTube. Hosting it here instead
// would mean an 18MB file that .gitignore already refuses to keep, pulled in
// full by every visitor; YouTube streams it at a bitrate that suits the device.
const YOUTUBE_ID = "VPHYv2Qc-kQ";

export default function StoryVideoSection() {
  // The player is only loaded once somebody asks for it. Until then the panel
  // is a still frame and costs ~55KB instead of a megabyte of player code, and
  // nothing is requested from YouTube at all — so no third-party cookies are
  // set on people who never press play.
  const [playerLoaded, setPlayerLoaded] = useState(false);

  return (
    <section className="py-24 md:py-32">
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
            <h2 className="text-4xl md:text-5xl font-sans-hebrew font-semibold text-foreground mb-4">
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
              <p className="text-foreground/80 font-sans-hebrew text-lg italic">
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

            {/* 16:9, matching the segment. The old 4:3 panel cropped the
                picture on both sides, and would have letterboxed the embed. */}
            <div className="relative rounded-sm overflow-hidden aspect-video bg-card">
              {playerLoaded ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1`}
                  title="קינג דיוויד — כתבה בערוץ 2"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlayerLoaded(true)}
                  aria-label="נגן את הכתבה בערוץ 2"
                  className="absolute inset-0 w-full h-full cursor-pointer group"
                >
                  <img
                    src="/images/general/kingdavid-tv-poster.jpg"
                    alt="שלט המפעל של קינג דיוויד בקריית מלאכי"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={1280}
                    height={720}
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors duration-300 group-hover:bg-black/30">
                    <div className="w-20 h-20 rounded-full border border-primary/40 flex items-center justify-center bg-background/30 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="w-8 h-8 text-primary mr-[-2px]" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border border-primary/15 rounded-sm px-3 py-1.5 text-primary/80 text-xs font-light">
                    כתבה בערוץ 2
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
