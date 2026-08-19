import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const TRUST = [
  { number: "40", label: "שנות ייצור" },
  { number: "20", label: "שנות אחריות" },
  { number: "100+", label: "דגמים" },
];

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax on the image + faint upward drift on the text.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden min-h-[100svh] md:min-h-[92vh] flex items-center"
    >
      {/* Background image with parallax + very slow Ken Burns zoom */}
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0 will-change-transform"
      >
        {/* The homepage's LCP element, and it is full-bleed, so a phone used to
            pull the whole 2560px original — 716KB to paint a 640px-wide screen.
            optimizeImage() cannot help here: it deliberately passes local paths
            through untouched, so the sizes are pre-rendered instead.
            fetchPriority high because the browser otherwise discovers this late
            and deprioritises it, which is the opposite of what an LCP wants. */}
        <img
          src="/images/general/homepage-hero-1280.jpg"
          srcSet={[
            "/images/general/homepage-hero-640.jpg 640w",
            "/images/general/homepage-hero-960.jpg 960w",
            "/images/general/homepage-hero-1280.jpg 1280w",
            "/images/general/homepage-hero-1920.jpg 1920w",
            "/images/general/homepage-hero-2560.jpg 2560w",
          ].join(", ")}
          sizes="100vw"
          width={2560}
          height={1969}
          fetchPriority="high"
          decoding="async"
          alt="חדר שינה יוקרתי"
          className="w-full h-full object-cover"
        />
        {/* Readability gradients */}
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/70 to-background/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        {/* Subtle gold radial glow */}
        <div className="absolute -right-40 top-1/3 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      </motion.div>

      {/* Decorative grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-28 md:py-36 w-full"
      >
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="h-px w-10 bg-primary/50" />
            <p className="text-xs md:text-sm tracking-[0.4em] text-primary/80 uppercase font-light">
              למעלה מ-40 שנות מצוינות
            </p>
          </motion.div>

          {/* Headline — word-by-word reveal */}
          <h1 className="text-5xl md:text-7xl lg:text-[5.25rem] font-sans-hebrew font-semibold text-foreground leading-[1.05] mb-6">
            <RevealLine delay={0.1}>גלו את המזרן</RevealLine>
            <br />
            <RevealLine delay={0.3} className="gold-shimmer">
              שישנה לכם את החיים
            </RevealLine>
          </h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg text-foreground/60 mb-10 leading-relaxed max-w-xl font-light"
          >
            שאלון של 2 דקות + המלצה מקצועית + 30 לילות ניסיון ללא סיכון.
            <br className="hidden md:block" />
            לא אהבתם? אנחנו מגיעים לאסוף בחינם!
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-3 mb-14"
          >
            <Link to="/Shop" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base px-9 h-14 rounded-none tracking-wide transition-all duration-300 glow-gold"
              >
                גלו את המזרנים שלנו
                <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              </Button>
            </Link>
            <a href="tel:1700700464" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border border-foreground/20 text-foreground/80 hover:border-primary hover:text-primary font-light text-base px-9 h-14 rounded-none tracking-wide transition-all duration-300"
              >
                דברו עם יועץ שינה
              </Button>
            </a>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4 md:gap-5"
          >
            {TRUST.map(({ number, label }) => (
              <div
                key={label}
                className="relative flex items-center gap-3 px-5 py-3 border border-primary/20 bg-background/40 backdrop-blur-md transition-all hover:border-primary/45 hover:-translate-y-0.5"
              >
                <span className="text-3xl md:text-4xl font-sans-hebrew font-semibold text-primary leading-none">
                  {number}
                </span>
                <span className="text-[11px] md:text-xs text-foreground/60 font-light tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-foreground/40"
      >
        <span className="text-[10px] tracking-[0.4em] uppercase font-light">גלילה</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.span>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}

// Word-by-word reveal for headline lines.
function RevealLine({ children, delay = 0, className = "" }) {
  const words = String(children).split(" ");
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.85,
              delay: delay + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
