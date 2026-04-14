import React, { useRef, useEffect } from "react";
import { Star } from "lucide-react";

const reviews = [
  { name: "שי פרץ", text: "קינג דיויד אני שמח להודות למרק נציג הסניף שנתן שירות מקצועי ובחירה נכונה עברנו למיטת נוער", rating: 5, time: "לפני 6 חודשים" },
  { name: "הראל קאופמן", text: "השארתי פרטים באתר תוך יום חזר אליי מארק, סוכן המכירות. נתן שירות אדיב, זמין ומהיר. ממליצה בחום", rating: 5, time: "לפני 6 חודשים" },
  { name: "נתן האלוף", text: "נתן האלוף עם שירות יוצא דופן. בנועם ובסבלנות רבה. המון תודה.", rating: 5, time: "לפני 6 חודשים" },
  { name: "עדן לביא", text: "שירות מדהים מהמלצת המזרן ועד ההובלה הביתה ממליצה בחום", rating: 5, time: "לפני 6 חודשים" },
  { name: "הקהלת קהילות", text: "יש לנו כבר שנים את המזרונים המצוינים שלכם וחזרתי אליכם לקנות מזרון לאמא שלי. השארתי פנייה באתר.", rating: 5, time: "לפני 6 חודשים" },
  { name: "שרה הר סיני", text: "חברה אמינה, איכות מזרונים ברמה מאוד גבוהה, צוות בסניף מאוד מנוסים, אמפתיים, שירותיים ומקבלים...", rating: 5, time: "לפני 6 חודשים" },
  { name: "מיכל כהן", text: "קניתי מזרן לפני חצי שנה ואני מרוצה מאוד. השינה שלי השתפרה משמעותית. שירות מעולה!", rating: 5, time: "לפני 3 חודשים" },
  { name: "דני לוי", text: "מזרן איכותי במחיר הוגן. ההובלה הייתה מהירה והצוות היה נחמד ומקצועי מאוד.", rating: 5, time: "לפני 4 חודשים" },
];

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Duplicate reviews for seamless infinite loop
const infiniteReviews = [...reviews, ...reviews, ...reviews];

export default function ProductReviewsCarousel() {
  const trackRef = useRef(null);
  const isPaused = useRef(false);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const CARD_WIDTH = 290; // px including gap

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const totalSingle = reviews.length * CARD_WIDTH;
    // Start at the middle set so we can scroll both directions seamlessly
    posRef.current = totalSingle;
    track.style.transform = `translateX(${posRef.current}px)`;

    const speed = 0.6; // px per frame

    const animate = () => {
      if (!isPaused.current) {
        posRef.current += speed; // RTL: positive = scroll right-to-left visually
        // When we've scrolled one full set, reset to avoid drift
        if (posRef.current >= totalSingle * 2) {
          posRef.current = totalSingle;
        }
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-foreground">ביקורות לקוחות</h2>
        <div className="flex items-center gap-1">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <GoogleIcon />
      </div>

      {/* Carousel container */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { isPaused.current = false; }}
      >
        {/* Track — RTL layout: items flow right-to-left */}
        <div
          ref={trackRef}
          className="flex gap-5 py-3"
          style={{ direction: "ltr", width: "max-content" }}
        >
          {infiniteReviews.map((review, i) => (
            <div key={i} className="shrink-0 w-[270px]">
              <div className="glass-card rounded-2xl p-5 mb-3 h-[140px] flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {Array(review.rating).fill(0).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3" dir="rtl">{review.text}</p>
                </div>
              </div>
              {/* Author */}
              <div className="flex items-center gap-2 px-2" dir="rtl">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {review.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{review.name}</p>
                  <p className="text-[10px] text-muted-foreground">{review.time}</p>
                </div>
                <GoogleIcon />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}