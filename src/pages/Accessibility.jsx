import React from "react";
import { motion } from "framer-motion";

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Accessibility() {
  return (
    <div className="min-h-screen" dir="rtl">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">הצהרת נגישות</h1>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="glass-card rounded-2xl p-8 md:p-12 max-w-none text-foreground space-y-8">
          <p className="text-muted-foreground leading-relaxed">
            בחברת קינג דיויד בע"מ אנו רואים חשיבות עליונה במתן שירות שוויוני לכלל לקוחותינו, לרבות גולשי אתר האינטרנט. על כן חברתנו משקיעה מאמצים ומשאבים רבים לצורך הנגשת אתר האינטרנט של החברה.
          </p>

          <Section title="רכיבי הנגישות באתר">
            <ul className="list-disc pr-6 space-y-2">
              <li><strong className="text-foreground">תקינה</strong> – האתר מותאם לצפייה ונתמך על ידי הדפדפנים השכיחים.</li>
              <li><strong className="text-foreground">תוכן</strong> – תוכן האתר נכתב בצורה פשוטה וברורה. התכנים מחולקים למספר רמות תוכן, כשכל רמה מחולקת לנושאים שונים.</li>
              <li><strong className="text-foreground">קישורים</strong> – הקישורים באתר מונגשים באופן שניתן לזהותם.</li>
              <li><strong className="text-foreground">תמונות</strong> – שימוש בטקסט חלופי לתמונות.</li>
              <li><strong className="text-foreground">עיצוב</strong> – באתר הוטמעו עיצובים מותאמים לגולשים עם לקויות ראייה.</li>
              <li><strong className="text-foreground">מבנה האתר</strong> – ניווט נוח וברור עם תפריטי מידע הבנויים באמצעות רשימות, לאפשר התמצאות פשוטה ומהירה.</li>
              <li><strong className="text-foreground">תפריט הנגשה</strong> – באתר הותקן תפריט הנגשה. לחיצה על התפריט מאפשרת פתיחה של כפתורי ההנגשה.</li>
            </ul>
          </Section>

          <Section title="האפשרויות בתפריט ההנגשה">
            <ul className="list-disc pr-6 space-y-1">
              <li>ניווט על-ידי מקלדת.</li>
              <li>מעבר לטופס יצירת קשר.</li>
              <li>שליטה על גודל הפונט באתר.</li>
              <li>עצירת אלמנטים נעים וחסימת הבהובים.</li>
              <li>בחירת ניגודיות צבעים על בסיס רקע כהה או בהיר.</li>
              <li>בחירה בהתאמת תצוגה לעיוורי צבעים.</li>
              <li>מעבר להצהרת הנגישות.</li>
              <li>סגירת רכיב הנגישות.</li>
            </ul>
          </Section>

          <Section title="גלישה באמצעות מקלדת">
            <p>
              <strong className="text-foreground">הגדלת תצוגה:</strong> ניתן להגדיל את התצוגה באתר על-ידי לחיצה בו-זמנית על המקשים "Ctrl" ו-"+". להקטנה — "Ctrl" ו-"-". כמו כן ניתן לשנות את גודל הפונטים באמצעות כפתורי הגדלת/הקטנת פונט שבתפריט ההנגשה.
            </p>
            <p>
              <strong className="text-foreground">הפעלת האתר באמצעות מקלדת:</strong> גולשים המתקשים בהפעלת עכבר יכולים לגלוש באתר באמצעות מקלדת. לחיצה על מקש Tab תעביר בין הקישורים השונים בעמוד, ולחיצה על Enter תפעיל את הקישור המסומן.
            </p>
          </Section>

          <Section title="נגישות סניפי החברה">
            <p>סניפי החברה נגישים: קיימת כניסה נגישה ללא מדרגות, ודלת הכניסה רחבה ומאפשרת כניסה באמצעות כיסא גלגלים. המרווחים בין דלפקי ומוצרי החנות גדולים ומאפשרים תנועה באמצעות כיסא גלגלים.</p>
            <p>בשל מיקומן של חנויות הרשת לא קיימת חניית נכים צמודה לחנות, אך נמצאת בקרבת מקום.</p>
          </Section>

          <Section title="סייג לנגישות">
            <p>חשוב לנו לציין כי למרות המאמצים שאנו משקיעים להנגיש את כלל הדפים באתר, ייתכן ויתגלו חלקים באתר שטרם נגישים (בין אם מקורם באתרים אחרים ובין אם עקב מגבלות טכנולוגיות). כחלק ממחויבותנו לאפשר שימוש באתר לכלל לקוחותינו לרבות אנשים עם מוגבלויות, אנו ממשיכים במאמצים לשמר ולשפר את רמת הנגישות באתר ככל האפשר.</p>
          </Section>

          <Section title="צרו עמנו קשר">
            <p>במידה וחרף מאמצנו נתקלתם בקושי, נשמח לקבל כל תגובה, רעיון והצעה בנושא הנגישות באמצעות טופס יצירת קשר באתר. כדי שנוכל לטפל בבעיה בדרך הטובה ביותר, צרפו בבקשה פרטים מלאים ככל שניתן:</p>
            <ul className="list-disc pr-6 space-y-1">
              <li>תיאור הבעיה בה נתקלתם.</li>
              <li>מהי הפעולה שניסיתם לבצע?</li>
              <li>באיזה עמוד גלשתם?</li>
              <li>באיזה דפדפן גלשתם?</li>
            </ul>
            <p>אנחנו נטפל בבעיה ונחזור אליכם בהקדם עם פרטים על טיפולה.</p>
          </Section>

          <Section title="רכז/ת הנגישות">
            <p>אחראית בנושא הנגישות בחברתנו היא הגב' רעות גולדשטיין, אשר תשמח לעמוד לרשותכם:</p>
            <ul className="list-disc pr-6 space-y-1">
              <li>טלפון: <a href="tel:0526504435" className="text-primary">052-6504435</a></li>
              <li>מייל: <a href="mailto:reutgold3@gmail.com" className="text-primary">reutgold3@gmail.com</a></li>
            </ul>
          </Section>

          <Section title="בעיות קיימות">
            <p>המסמכים באתר בתהליך הנגשה. במידה ונתקלתם במסמך שאינו נגיש ואתם צריכים אותו בפורמט נגיש, נא שילחו לנו פנייה באמצעות טופס יצירת קשר המפרט איזה מסמך אתם צריכים ואנחנו ננגיש אותו עבורכם.</p>
          </Section>
        </div>
      </motion.div>
    </div>
  );
}
