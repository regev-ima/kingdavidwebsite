import React from "react";
import { motion } from "framer-motion";

/**
 * 10-step hardness indicator — ● ● ● ● ● ● ● ● ● ●
 * One dot is highlighted (gold, slightly larger, with a soft halo),
 * the others are muted. Labels sit under the endpoints ("רך" on the
 * soft end, "קשיח" on the firm end) to match the site's RTL flow.
 *
 * Props:
 *   value   — 1..10 (the product's hardness)
 *   size    — "sm" | "md" (card vs detail page)
 *   animate — run an entrance animation (true by default)
 */
export default function HardnessScale({ value, size = "md", animate = true }) {
  const safeValue = Math.max(1, Math.min(10, Math.round(Number(value) || 5)));
  const steps = Array.from({ length: 10 }, (_, i) => i + 1);

  // Size tokens
  const dotBase = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  const dotActive = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const gapClass = size === "sm" ? "gap-1" : "gap-1.5";

  // In RTL, the first item in DOM is on the right. We want dot #1
  // (softest = "רך") to be on the right of the line, and dot #10
  // (firmest = "קשיח") on the left. Rendering 1..10 with dir=rtl
  // achieves that naturally.
  return (
    <div dir="rtl" className="w-full select-none">
      {/* Dots row */}
      <div className={`flex items-center justify-between ${gapClass}`}>
        {steps.map((step) => {
          const isActive = step === safeValue;
          const isPassed = step <= safeValue;
          return (
            <React.Fragment key={step}>
              <motion.span
                initial={animate ? { scale: 0.6, opacity: 0 } : false}
                whileInView={animate ? { scale: 1, opacity: 1 } : false}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  delay: animate ? 0.04 * step : 0,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={[
                  "relative shrink-0 rounded-full transition-all",
                  isActive ? dotActive : dotBase,
                  isActive
                    ? "bg-primary shadow-[0_0_0_3px_hsl(42_70%_55%_/_0.18),0_0_14px_hsl(42_70%_55%_/_0.45)]"
                    : isPassed
                    ? "bg-primary/40"
                    : "bg-foreground/15",
                ].join(" ")}
                aria-hidden
              />
              {step < 10 && (
                <span
                  className={[
                    "flex-1 h-px",
                    step < safeValue ? "bg-primary/50" : "bg-foreground/10",
                  ].join(" ")}
                  aria-hidden
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Endpoint labels */}
      <div className={`flex items-center justify-between ${size === "sm" ? "mt-1.5 text-[10px]" : "mt-2 text-[11px]"} text-foreground/55 font-light tracking-wide`}>
        <span>רך</span>
        <span className="text-primary font-medium">
          {safeValue}/10
        </span>
        <span>קשיח</span>
      </div>
    </div>
  );
}
