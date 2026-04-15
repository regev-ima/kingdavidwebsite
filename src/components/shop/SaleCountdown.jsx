import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { countdownTo } from "@/lib/pricing";

/**
 * Live ticking countdown to a sale's end time.
 *
 * variant:
 *   "compact" — small pill (used on ProductCard corner): biggest unit only
 *   "inline"  — single short line to sit next to a price
 *   "full"    — wide banner (used on ProductDetail)
 */
export default function SaleCountdown({ endsAt, variant = "full", onExpire }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!endsAt) return undefined;
    const endTime = new Date(endsAt).getTime();
    if (Number.isNaN(endTime) || endTime <= Date.now()) return undefined;

    // seconds tick for "full" & "inline", minutes tick for "compact"
    const intervalMs = variant === "compact" ? 30_000 : 1000;
    const intervalId = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(intervalId);
  }, [endsAt, variant]);

  if (!endsAt) return null;

  const c = countdownTo(endsAt, now);

  useEffect(() => {
    if (c.expired && typeof onExpire === "function") onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.expired]);

  if (c.expired) return null;

  if (variant === "compact") {
    return (
      <span
        dir="rtl"
        className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full
                   bg-background/70 backdrop-blur-md border border-destructive/40
                   text-destructive text-[11px] font-medium whitespace-nowrap"
      >
        <Clock className="w-3 h-3" />
        <span>נשארו {c.primaryLabel}</span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span
        dir="rtl"
        className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium"
      >
        <Clock className="w-3.5 h-3.5" />
        המבצע מסתיים בעוד {c.primaryLabel}
      </span>
    );
  }

  // FULL — single clean line, spelled-out Hebrew, RTL
  // "נותרו עוד 1 יום, 14 שעות, 40 דקות, 08 שניות"
  const { days, hours, minutes, seconds } = c;
  const plural = (n, s, p) => (n === 1 ? s : p);
  const tokens = [
    { v: days,    s: "יום",  p: "ימים" },
    { v: hours,   s: "שעה",  p: "שעות" },
    { v: minutes, s: "דקה",  p: "דקות" },
    { v: seconds, s: "שנייה", p: "שניות" },
  ];
  // Drop leading zeros so we don't say "0 ימים"
  let trimmed = tokens;
  while (trimmed.length > 1 && trimmed[0].v === 0) trimmed = trimmed.slice(1);

  return (
    <div
      dir="rtl"
      className="flex items-center gap-3 rounded-xl border border-destructive/25
                 bg-destructive/[0.06] px-4 py-3"
    >
      <Clock className="w-5 h-5 text-destructive shrink-0" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[11px] text-foreground/60 font-light tracking-wide">
          המבצע מסתיים בעוד
        </p>
        <p className="text-base md:text-lg text-destructive font-medium leading-tight flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {trimmed.map((t, i) => (
            <span key={t.s} className="inline-flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-semibold tabular-nums">{t.v}</span>
              <span className="text-sm md:text-base text-destructive/85">
                {plural(t.v, t.s, t.p)}
              </span>
              {i < trimmed.length - 1 && (
                <span className="text-destructive/35 mx-0.5">·</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
