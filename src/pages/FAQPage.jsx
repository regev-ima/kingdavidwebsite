import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const faqCategories = [
  {
    title: "אחריות ושירות",
    items: [
      {
        q: "מה האחריות על המזרנים?",
        a: "טווח האחריות על המזרנים שלנו הוא בין 10 שנים ועד 20 שנות אחריות, תלוי בסוג המזרן. האחריות ניתנת על ידי המלך דוד תעשיות מזרנים בע״מ בהתאם לתקנון.",
      },
      {
        q: "יש תקופת ניסיון?",
        a: "כן! קינג דיויד היא יצרן המזרנים היחיד שמעניק 30 לילות ניסיון לכל הרוכשים.",
      },
      {
        q: "מה קורה אם אני לא מרוצה מהמזרן?",
        a: "ניתן להחזיר או להחליף מזרן תוך 30 יום מיום קבלתו, בתנאי שהמזרן יהיה תקין ללא פגמים, קרעים, כתמים או נוזלים.",
      },
    ],
  },
  {
    title: "משלוח והרכבה",
    items: [
      {
        q: "כמה עולה משלוח?",
        a: "הובלת המזרן עד הבית הינה בעלות של 250 ₪. ניתן ליהנות גם מהרכבה (במקרה של מיטות) בעלות נוספת של 150 ₪. המשלוחים אינם כוללים את הצפון הרחוק והדרום הרחוק.",
      },
      {
        q: "מה זמן האספקה?",
        a: "זמן אספקה הוא 14 ימי עסקים.",
      },
    ],
  },
  {
    title: "נקודות מכירה",
    items: [
      {
        q: "איפה אפשר לנסות את המזרנים?",
        a: "אנו מספקים מזרנים לכ-100 חנויות ברחבי הארץ. בנוסף, תוכלו לראות ולנסות את המזרנים שלנו בחנות המפעל בראשון לציון. סניף ראשון לציון (האצ״ל 39) — ימי א'-ה' 09:00-20:00, ימי שישי 09:00-13:00.",
      },
    ],
  },
  {
    title: "המזרן שלי",
    items: [
      {
        q: "כמה זמן לוקח להתרגל למזרן חדש?",
        a: "תקופת ההסתגלות למזרן חדש אורכת בדרך כלל בין 15 ל-30 ימים. המעבר בין מזרן ישן למזרן חדש וקשיח יותר עשוי לקחת זמן.",
      },
      {
        q: "מה אם אני צריך מידה מיוחדת?",
        a: "למידות מיוחדות יש ליצור קשר עם מחלקת מכירות בטלפון 1700-700-464.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">שאלות ותשובות</h1>
          <p className="text-foreground/60">כל מה שרציתם לדעת על המזרנים והשירות שלנו</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {faqCategories.map((category, catIdx) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
            className="mb-10"
          >
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">{category.title}</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {category.items.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`${catIdx}-${idx}`}
                  className="glass-card rounded-xl px-6"
                >
                  <AccordionTrigger className="text-foreground font-semibold text-right hover:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        ))}

        {/* CTA */}
        <div className="mt-16 text-center glass-strong rounded-2xl glass-highlight p-10">
          <h2 className="text-2xl font-bold text-foreground mb-3">עדיין יש שאלות? דברו איתנו</h2>
          <p className="text-muted-foreground mb-6">אנחנו כאן לעזור! צרו איתנו קשר</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:1700700464">
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Phone className="w-4 h-4" />
                1700-700-464
              </Button>
            </a>
            <Link to="/Contact">
              <Button variant="outline">השאירו פרטים</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
