import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowLeft, ArrowRight, RotateCcw, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { fallbackProducts } from "@/data/fallbackProducts";

/**
 * יועץ המזרנים — a lightweight guided questionnaire that helps visitors
 * narrow down which mattress suits them best, then surfaces 2–3
 * personalised recommendations from the live product catalog (falling
 * back to the bundled product data when the API is unavailable).
 *
 * The bot is completely client-side — no external API, no backend — so
 * it works even without Supabase/base44 configured.
 */

// ---------------------------------------------------------------------
// Questionnaire definition
// ---------------------------------------------------------------------

const QUESTIONS = [
  {
    id: "audience",
    title: "למי המזרן?",
    subtitle: "כדי להתאים את המידה והמבנה",
    options: [
      { value: "couple", label: "זוגי", hint: '140—200 ס"מ' },
      { value: "single", label: "יחיד / נוער", hint: '80—120 ס"מ' },
      { value: "bed", label: "מחפש מיטה (לא מזרן)", hint: "מיטות מרופדות" },
    ],
  },
  {
    id: "firmness",
    title: "איך אתם אוהבים את המזרן?",
    subtitle: "תחושת השינה המועדפת עליכם",
    skipWhen: (a) => a.audience === "bed",
    options: [
      { value: "soft", label: "רך ומפנק", hint: "שוקע בנוחות" },
      { value: "medium", label: "בינוני ומאוזן", hint: "הכי פופולרי" },
      { value: "firm", label: "קשיח ותומך", hint: "תחושת יציבות" },
    ],
  },
  {
    id: "needs",
    title: "יש לכם צורך מיוחד?",
    subtitle: "אפשר לדלג, וגם לבחור כמה",
    skipWhen: (a) => a.audience === "bed",
    multi: true,
    options: [
      { value: "back", label: "כאבי גב / צוואר" },
      { value: "hot", label: "מתחממים בלילה" },
      { value: "allergy", label: "אלרגיות / רגישות" },
      { value: "couple-diff", label: "זוג עם העדפות שונות" },
      { value: "none", label: "אין צורך מיוחד" },
    ],
  },
  {
    id: "budget",
    title: "מהו התקציב המשוער?",
    subtitle: "המחירים מתייחסים למחיר המבצע בפועל",
    options: [
      { value: 2500, label: "עד ₪2,500", hint: "חסכוני" },
      { value: 4500, label: "₪2,500 — ₪4,500", hint: "משתלם" },
      { value: 7000, label: "₪4,500 — ₪7,000", hint: "פרימיום" },
      { value: 99999, label: "ללא מגבלה", hint: "הטוב ביותר" },
    ],
  },
];

// ---------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------

const effectivePrice = (p) => Number(p.sale_price || p.price || 0);

function scoreProducts(products, answers) {
  const { audience, firmness, needs = [], budget } = answers;

  // Category gate
  const byAudience = (p) => {
    const cat = (p.category || "").toLowerCase();
    if (audience === "bed") return cat.includes("מיט");
    if (audience === "couple") return cat.includes("זוגי") && !cat.includes("מיט");
    if (audience === "single") return cat.includes("יחיד") || cat.includes("נוער");
    return true;
  };

  const pool = products.filter(byAudience);
  if (!pool.length) return [];

  // Desired hardness window (1–10 scale on product.hardness)
  const hardnessTarget =
    firmness === "soft" ? 3 : firmness === "firm" ? 8 : 5;

  const hasAny = (text, keywords) =>
    keywords.some((k) => (text || "").includes(k));

  const scored = pool.map((p) => {
    let score = 0;
    const haystack = [
      p.description,
      ...(p.features || []),
      ...(p.technologies || []).map((t) => (typeof t === "string" ? t : t.name)),
    ]
      .filter(Boolean)
      .join(" ");

    // Firmness proximity (0–5 points). Beds have no hardness; skip.
    if (p.hardness != null && firmness) {
      const dist = Math.abs(Number(p.hardness) - hardnessTarget);
      score += Math.max(0, 5 - dist);
    }

    // Special needs
    if (needs.includes("back") && hasAny(haystack, ["אורטופד", "אנטומית", "תמיכה", "Balance"])) score += 3;
    if (needs.includes("hot") && hasAny(haystack, ["סירקולציה", "אוורור", "נושם", "CircuTech", "Circu"])) score += 3;
    if (needs.includes("allergy") && hasAny(haystack, ["אנטי-בקטריאלי", "היפואלרגני", "אנטיבקטריאלי"])) score += 3;
    if (needs.includes("couple-diff") && hasAny(haystack, ["Balance", "איזון", "פיזור"])) score += 3;

    // Budget fit: free within budget, penalty if over.
    const price = effectivePrice(p);
    if (price <= budget) {
      // Prefer products that use the budget well (closer to top of
      // budget = often better quality) but don't over-reward.
      score += 2;
      score += Math.min(2, (price / budget) * 2);
    } else {
      // Over budget → heavy penalty, but still eligible so we don't
      // return an empty list for very low budgets.
      score -= 4;
    }

    // Gentle preference for on-sale / featured items.
    if (p.is_on_sale) score += 0.5;
    if (p.is_featured) score += 0.5;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.product);
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export default function MattressFinderBot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const { data: apiProducts } = useQuery({
    queryKey: ["bot-products"],
    queryFn: async () => {
      try {
        return await base44.entities.Product.list("-created_date", 100);
      } catch {
        return [];
      }
    },
    initialData: [],
    enabled: open,
  });

  const products = apiProducts?.length > 0 ? apiProducts : fallbackProducts;

  // Flatten the question list based on skip predicates derived from
  // the current answers.
  const activeQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => !q.skipWhen || !q.skipWhen(answers));
  }, [answers]);

  const current = activeQuestions[step];
  const total = activeQuestions.length;

  const recommendations = useMemo(() => {
    if (!done) return [];
    return scoreProducts(products, answers);
  }, [done, products, answers]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the panel is open on mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const restart = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => Math.max(0, s - 1));
  };

  const pickSingle = (value) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);

    // "Looking for a bed" short-circuits the mattress questions and
    // jumps straight to budget.
    if (current.id === "audience" && value === "bed") {
      // Recompute skip — subsequent questions may now be filtered
      // out, so the next visible step is the budget.
      const next_active = QUESTIONS.filter((q) => !q.skipWhen || !q.skipWhen(next));
      const budgetIdx = next_active.findIndex((q) => q.id === "budget");
      setStep(budgetIdx === -1 ? step + 1 : budgetIdx);
      return;
    }

    if (step + 1 >= total) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  };

  const toggleMulti = (value) => {
    const existing = Array.isArray(answers[current.id]) ? answers[current.id] : [];
    let next;
    if (value === "none") {
      next = ["none"];
    } else {
      const withoutNone = existing.filter((v) => v !== "none");
      next = withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    }
    setAnswers({ ...answers, [current.id]: next });
  };

  const multiHasSelection =
    current?.multi && Array.isArray(answers[current.id]) && answers[current.id].length > 0;

  const continueMulti = () => {
    if (step + 1 >= total) setDone(true);
    else setStep(step + 1);
  };

  return (
    <>
      {/* Floating launcher — sits just above the WhatsApp button. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="פתיחת יועץ המזרנים"
        className="fixed left-5 z-30 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}
      >
        <Sparkles className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping opacity-40" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[420px] max-h-[90vh] flex flex-col
                         rounded-2xl overflow-hidden border border-primary/25 bg-background shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bot-title"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-b border-primary/15 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 id="bot-title" className="text-base font-semibold text-foreground leading-tight">
                      יועץ המזרנים של King David
                    </h2>
                    <p className="text-xs text-foreground/60 font-light">
                      4 שאלות קצרות ונמצא עבורכם את המזרן המושלם
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="סגירה"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress dots */}
                {!done && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {activeQuestions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === step
                            ? "w-8 bg-primary"
                            : i < step
                            ? "w-4 bg-primary/60"
                            : "w-4 bg-primary/15"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {!done ? (
                  <div className="p-5">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={current.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22 }}
                      >
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {current.title}
                        </h3>
                        <p className="text-xs text-foreground/60 font-light mb-4">
                          {current.subtitle}
                        </p>

                        <div className="space-y-2">
                          {current.options.map((opt) => {
                            const isSelected = current.multi
                              ? Array.isArray(answers[current.id]) &&
                                answers[current.id].includes(opt.value)
                              : answers[current.id] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  current.multi
                                    ? toggleMulti(opt.value)
                                    : pickSingle(opt.value)
                                }
                                className={`w-full text-right px-4 py-3 rounded-xl border transition-all group
                                  ${
                                    isSelected
                                      ? "border-primary bg-primary/10 text-foreground"
                                      : "border-primary/15 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/5 text-foreground/85"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {current.multi && (
                                      <span
                                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0
                                          ${
                                            isSelected
                                              ? "bg-primary border-primary text-primary-foreground"
                                              : "border-primary/40"
                                          }`}
                                      >
                                        {isSelected ? "✓" : ""}
                                      </span>
                                    )}
                                    {opt.hint && (
                                      <span className="text-[11px] text-foreground/45 font-light">
                                        {opt.hint}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {opt.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      המלצות מותאמות עבורכם
                    </h3>
                    <p className="text-xs text-foreground/60 font-light mb-4">
                      {recommendations.length > 0
                        ? "לפי התשובות שמסרתם:"
                        : "לא מצאנו התאמה מדויקת — נסו לשנות תקציב או צרכים."}
                    </p>

                    <div className="space-y-3">
                      {recommendations.map((p) => {
                        const price = effectivePrice(p);
                        return (
                          <Link
                            key={p.id}
                            to={`/ProductDetail?id=${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-primary/15 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/5 transition-all group"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-card shrink-0">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary/30 text-lg">
                                  KD
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-foreground/50 font-light truncate">
                                {p.category}
                              </p>
                              {price > 0 && (
                                <p className="text-sm text-primary font-semibold mt-0.5">
                                  ₪{price.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <ArrowLeft className="w-4 h-4 text-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                          </Link>
                        );
                      })}
                    </div>

                    <Link
                      to="/Shop"
                      onClick={() => setOpen(false)}
                      className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/60 hover:text-primary transition-colors"
                    >
                      לצפייה בקטלוג המלא
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="border-t border-primary/10 px-5 py-3 flex items-center justify-between gap-3 bg-foreground/[0.02]">
                {!done ? (
                  <>
                    <button
                      onClick={goBack}
                      disabled={step === 0}
                      className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      חזרה
                    </button>
                    {current?.multi && (
                      <button
                        onClick={continueMulti}
                        disabled={!multiHasSelection}
                        className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        המשך
                      </button>
                    )}
                    <span className="text-[11px] text-foreground/40 font-light">
                      שלב {step + 1} מתוך {total}
                    </span>
                  </>
                ) : (
                  <>
                    <button
                      onClick={restart}
                      className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      התחל מחדש
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all"
                    >
                      סגור
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
