import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Compact lead-capture form embedded at the end of each blog post.
// Routes straight to the same website_create_lead RPC as the Contact page,
// tagged so the CRM can see which post drove the lead.
export default function LeadInlineForm({ postTitle, postSlug }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await base44.entities.Lead.create({
        full_name: form.name,
        phone: form.phone,
        subject: postTitle ? `מהבלוג: ${postTitle}` : "פנייה מהבלוג",
        message: postSlug ? `פוסט: /blog/${postSlug}` : null,
        source: "website",
        source_form: "blog_post",
        tags: ["אתר", "בלוג"],
      });
      setSubmitted(true);
      toast({ title: "הפנייה נשלחה!", description: "ניצור איתך קשר בהקדם." });
    } catch {
      toast({
        title: "אירעה שגיאה",
        description: "לא הצלחנו לשלוח את הפנייה. נסה שוב או התקשר 1700-700-464.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8 md:p-10 text-center">
        <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-bold text-foreground mb-2">תודה!</h3>
        <p className="text-foreground/70">קיבלנו את הפנייה. נציג יחזור אליך תוך יום עסקים.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-10">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          מחפשים מזרן שיתאים בדיוק לכם?
        </h3>
        <p className="text-foreground/70 mb-6">
          השאירו פרטים ויועץ שינה מטעמנו יחזור אליכם עם המלצה אישית וללא עלות.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <Input
            required
            placeholder="שם מלא"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1"
          />
          <Input
            required
            type="tel"
            inputMode="tel"
            placeholder="טלפון"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            <Send className="w-4 h-4 ml-2" />
            {loading ? "שולח..." : "חזרו אלי"}
          </Button>
        </form>
        <p className="text-xs text-foreground/50 mt-4">
          או התקשרו ישירות <a href="tel:1700700464" className="text-primary font-medium">1700-700-464</a>
        </p>
      </div>
    </div>
  );
}
