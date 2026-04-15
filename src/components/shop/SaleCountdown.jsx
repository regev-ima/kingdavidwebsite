import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { countdownTo } from "@/lib/pricing";

/**
 * Live ticking countdown to a sale's end time.
 *
 * variant:
 *   "compact" — small pill (used on ProductCard corner): biggest unit only
 *   "inline"  — single short line to sit next to a price
 *   "full"    — 4-box day/hour/minute/second banner (used on ProductDetail)
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
      <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full
                       bg-background/70 backdrop-blur-md border border-destructive/40
                       text-destructive text-[11px] font-medium whitespace-nowrap">
        <Clock className="w-3 h-3" />
        <span>נשארו {c.primaryLabel}</span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
        <Clock className="w-3.5 h-3.5" />
        המבצע מסתיים בעוד {c.primaryLabel}
      </span>
    );
  }

  // FULL: 4 boxes (d / h / m / s)
  const { days, hours, minutes, seconds } = c;
  const pad = (n) => String(n).padStart(2, "0");

  const boxes = [
    { value: pad(days),    label: "ימים" },
    { value: pad(hours),   label: "שעות" },
    { value: pad(minutes), label: "דקות" },
    { value: pad(seconds), label: "שניות" },
  ];

  return (
    <div className="flex items-stretch gap-2 rounded-xl border border-destructive/25
                    bg-destructive/[0.06] p-3">
      <div className="flex items-center gap-2 pl-2 border-l border-destructive/15">
        <Clock className="w-4 h-4 text-destructive" />
        <span className="text-xs text-foreground/70 font-light whitespace-nowrap">
          המבצע מסתיים בעוד
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        {boxes.map((b) => (
          <div
            key={b.label}
            className="flex flex-col items-center justify-center min-w-[44px] px-2 py-1
                       rounded-lg bg-background/50 border border-destructive/20"
          >
            <span className="font-mono text-base font-semibold text-destructive leading-none tabular-nums">
              {b.value}
            </span>
            <span className="text-[9px] text-foreground/55 mt-0.5 tracking-wide">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
