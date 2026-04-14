import React from "react";
import { motion } from "framer-motion";

export default function Terms() {
  return (
    <div className="min-h-screen">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">תנאי שימוש</h1>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="glass-card rounded-2xl p-8 md:p-12 prose prose-lg max-w-none text-foreground space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            ברוכים הבאים לאתר של קינג דיויד מזרנים. השימוש באתר זה כפוף לתנאים המפורטים להלן. עצם הגלישה באתר מהווה הסכמה לתנאים אלו.
          </p>

          <h2 className="text-xl font-bold text-foreground">הזמנות ורכישות</h2>
          <p className="text-muted-foreground leading-relaxed">
            המחירים המוצגים באתר כוללים מע"מ אלא אם צוין אחרת. החברה שומרת לעצמה את הזכות לשנות את המחירים בכל עת ללא הודעה מוקדמת. ההזמנה תאושר רק לאחר קבלת אישור טלפוני מנציג החברה.
          </p>

          <h2 className="text-xl font-bold text-foreground">אחריות למוצרים</h2>
          <p className="text-muted-foreground leading-relaxed">
            תינתן אחריות למזרנים בהתאם לתנאי האחריות המופיעים בפרק האחריות באתר. האחריות חלה על פגמים בייצור בלבד ואינה חלה על בלאי טבעי, שימוש לא נכון או נזק מכוון.
          </p>

          <h2 className="text-xl font-bold text-foreground">קניין רוחני</h2>
          <p className="text-muted-foreground leading-relaxed">
            כל התכנים באתר, לרבות תמונות, טקסטים, עיצובים ולוגואים, הם רכושה הבלעדי של קינג דיויד מזרנים ואין לעשות בהם שימוש ללא אישור בכתב.
          </p>

          <h2 className="text-xl font-bold text-foreground">יצירת קשר</h2>
          <p className="text-muted-foreground leading-relaxed">
            לכל שאלה או בירור בנוגע לתנאי השימוש, ניתן לפנות אלינו בטלפון 1700-700-464 או באמצעות טופס יצירת הקשר באתר.
          </p>
        </div>
      </motion.div>
    </div>
  );
}