import React from "react";
import { motion } from "framer-motion";

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">מדיניות פרטיות</h1>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="glass-card rounded-2xl p-8 md:p-12 prose prose-lg max-w-none text-foreground space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            קינג דיויד מזרנים מתחייבת לשמור על פרטיותכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם.
          </p>

          <h2 className="text-xl font-bold text-foreground">מידע שאנו אוספים</h2>
          <p className="text-muted-foreground leading-relaxed">
            אנו עשויים לאסוף מידע אישי כגון שם, כתובת אימייל, מספר טלפון וכתובת, כאשר אתם יוצרים קשר עימנו או מבצעים הזמנה.
          </p>

          <h2 className="text-xl font-bold text-foreground">שימוש במידע</h2>
          <p className="text-muted-foreground leading-relaxed">
            המידע שנאסף ישמש אותנו לצורך עיבוד הזמנות, מתן שירות לקוחות, שיפור השירות ושליחת עדכונים (בכפוף להסכמתכם).
          </p>

          <h2 className="text-xl font-bold text-foreground">אבטחת מידע</h2>
          <p className="text-muted-foreground leading-relaxed">
            אנו נוקטים באמצעי אבטחה מקובלים כדי להגן על המידע האישי שלכם מפני גישה בלתי מורשית, שינוי, חשיפה או הרס.
          </p>

          <h2 className="text-xl font-bold text-foreground">יצירת קשר</h2>
          <p className="text-muted-foreground leading-relaxed">
            לכל שאלה בנושא מדיניות הפרטיות, ניתן לפנות אלינו בטלפון 1700-700-464.
          </p>
        </div>
      </motion.div>
    </div>
  );
}