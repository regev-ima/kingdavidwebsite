import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "מקום מדהים! שירות יוצא מן הכלל. אני ממש רוצה לשבח את מתן ישראל סוכן המכירות האגדי על השירות הכי טוב שקיבלתי בכל תהליך בניית הבית שלי. ולידן המנהל המקסים שלו. והמזרונים שרכשתי — אין דברים כאלה!",
  },
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "קורל — עובדת מדהימה! איזה שירות אדיב, אי אפשר לתאר במילים על הדאגה והחמימות ויחס לבבי. הלוואי שכל מקום שאני הולך לקנות מוצרים תהיה אחת כזאת כמו קורל. אלופה מספר 1! וכמובן התאימה לי מזרן בטלפון לצרכים שלי.",
  },
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "אופק עזר לנו בחנות המפעל בראשון לציון, בחור חייכן ונעים, עם סבלנות אין קץ. מכר לי מזרן מושלם! בדיוק מה שחיפשתי! תודה לך!",
  },
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "רוצה להמליץ על נציג בשם צח, שעושה את חוויית הקנייה לטובה יותר. מעבר לזה שהוא מדהים, הוא גם מקצועי. ממליצה מאוד!",
  },
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "לא קבעתי פגישה, מתן קיבל אותי בצורה מדהימה, נתן את העצות הנכונות ויצאתי בזכותו עם מיטה ב-0 פשרות.",
  },
  {
    name: "לקוח/ה מרוצה",
    stars: 5,
    text: "מזרן מעולה מצוין נוח. מזרן איכותי לשינה ערבה וטובה עם תמיכה בגב ובכל הגוף. קניתי ואני ממש מרוצה.",
  },
];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
        ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">מה הלקוחות שלנו אומרים</h1>
          <p className="text-foreground/60">חוויות אמיתיות מלקוחות מרוצים</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="glass-card glass-highlight rounded-2xl p-6 flex flex-col"
            >
              <StarRating count={review.stars} />
              <p className="text-foreground/80 leading-relaxed flex-1 mb-4">
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="text-muted-foreground text-sm font-medium">{review.name}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center glass-strong rounded-2xl glass-highlight p-10"
        >
          <h2 className="text-2xl font-bold text-foreground mb-3">גם אתם רוצים לישון כמו מלכים?</h2>
          <p className="text-muted-foreground mb-6">גלו את מגוון המזרנים שלנו ומצאו את המתאים לכם</p>
          <Link to="/Shop">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-xl glow-gold">
              לחנות
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
