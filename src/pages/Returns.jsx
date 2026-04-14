import React from "react";
import { motion } from "framer-motion";

export default function Returns() {
  return (
    <div className="min-h-screen">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">מדיניות ביטולים והחזרות</h1>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="glass-card rounded-2xl p-8 md:p-12 prose prose-lg max-w-none text-foreground space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            החזרת מוצרים וביטול הרכישה תהיינה בהתאם ובכפוף להוראות החוק, לרבות הוראות חוק הגנת הצרכן, התשמ"א – 1981, הוראות חוק המכר ותקנות הגנת הצרכן.
          </p>

          <h2 className="text-xl font-bold text-foreground">30 לילות ניסיון</h2>
          <p className="text-muted-foreground leading-relaxed">
            ניתן לנסות את המזרן למשך 30 לילות ללא ניילון, ללא התחייבות וללא עלות הובלה חזרה. במקרה של אי שביעות רצון, נאסוף את המזרן ונחזיר את הכסף במלואו.
          </p>

          <h2 className="text-xl font-bold text-foreground">ביטול עסקה</h2>
          <p className="text-muted-foreground leading-relaxed">
            ניתן לבטל את העסקה בתוך 14 ימי עסקים מיום קבלת המוצר, בהתאם לחוק הגנת הצרכן. דמי ביטול יחולו בהתאם לחוק.
          </p>

          <h2 className="text-xl font-bold text-foreground">מדיניות משלוחים</h2>
          <p className="text-muted-foreground leading-relaxed">
            הובלת מזרן עד הבית בעלות של ₪250. הרכבה (במקרה של מיטות) בעלות נוספת של ₪150. משלוחי מיטות מרופדות או כל מוצר המצריך הובלה והרכבה - עלות ₪500. המשלוחים אינם כוללים את הצפון הרחוק ואזור אילת.
          </p>

          <h2 className="text-xl font-bold text-foreground">אחריות</h2>
          <p className="text-muted-foreground leading-relaxed">
            טווח האחריות על המזרנים שלנו הוא בין 10 שנים ועד 20 שנות אחריות, תלוי בסוג המזרן. האחריות ניתנת על ידי המלך דוד תעשיות מזרנים בע"מ בהתאם לתקנון.
          </p>

          <h2 className="text-xl font-bold text-foreground">החלפה / החזרה</h2>
          <p className="text-muted-foreground leading-relaxed">
            במקרה של החלפה או החזרה, עלות ההובלה תחול על חשבון הלקוח בלבד.
          </p>
        </div>
      </motion.div>
    </div>
  );
}