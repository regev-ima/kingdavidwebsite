import React, { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { countdownTo } from "@/lib/pricing";

/**
 * Live ticking countdown to a sale's end time. Updates once per second.
 * No-op if endsAt is missing or already in the past.
 *
 * Props:
 *   endsAt    — string | Date
 *   compact   — render a small badge instead of the full card
 *   onExpire  — optional callback fired when the countdown hits zero
 */
export default function SaleCountdown({ endsAt, compact = false, onExpire }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!endsAt) return undefined;
    const endTime = new Date(endsAt).getTime();
    if (Number.isNaN(endTime) || endTime <= Date.now()) return undefined;

    const tick = () => setNow(new Date());
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [endsAt]);

  if (!endsAt) return null;

  const c = countdownTo(endsAt, now);

  useEffect(() => {
    if (c.expired && typeof onExpire === "function") onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.expired]);

  if (c.expired) return null;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/25 text-destructive text-[11px] font-mono font-semibold"
        dir="ltr"
      >
        <Clock className="w-3 h-3" />
        {c.labelShort}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/25">
      <Flame className="w-4 h-4 text-destructive shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-foreground/70 mb-0.5 font-light">המבצע מסתיים בעוד</p>
        <p className="text-sm font-mono font-semibold text-destructive tracking-wide" dir="ltr">
          {c.labelLong}
        </p>
      </div>
    </div>
  );
}
