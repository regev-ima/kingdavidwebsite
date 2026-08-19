import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.Lead.create({
        full_name: form.name,
        phone: form.phone,
        email: form.email || null,
        subject: form.subject || null,
        message: form.message,
        source: "website",
        source_form: "contact_page",
        tags: ["אתר"],
      });
      setSubmitted(true);
      toast({ title: "הפנייה נשלחה בהצלחה!", description: "ניצור אתכם קשר בהקדם." });
    } catch (err) {
      console.error("[Contact] lead submission failed:", err);
      toast({
        title: "אירעה שגיאה",
        description: "לא הצלחנו לשלוח את הפנייה. נסו שוב או פנו אלינו בטלפון.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">צרו קשר</h1>
          <p className="text-foreground/60">נשמח לעזור לכם למצוא את המזרן המושלם</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Right column - Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 order-1"
          >
            {/* Phone */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 glass rounded-xl border-primary/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">טלפון</h3>
                  <a href="tel:1700700464" className="text-primary font-bold text-xl">1700-700-464</a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 glass rounded-xl border-primary/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">אימייל</h3>
                  <a href="mailto:pnina@kingdavid4u.co.il" className="text-primary font-medium">pnina@kingdavid4u.co.il</a>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 glass rounded-xl border-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">וואטסאפ</h3>
                  <a
                    href="https://wa.me/9721700700464"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium"
                  >
                    שלחו הודעה בוואטסאפ
                  </a>
                </div>
              </div>
            </div>

            {/* Showroom */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="font-bold text-foreground text-lg mb-4">אולם תצוגה</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">האצ&quot;ל 39, א.ת חדש ראשל&quot;צ</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">א&apos;-ה&apos; 09:00-20:00 | ו&apos; 09:00-13:00</span>
                </div>
              </div>
            </div>

            {/* Factory */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="font-bold text-foreground text-lg mb-4">מפעל</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">רחוב עמל 6, קרית מלאכי</span>
                </div>
                <p className="text-muted-foreground text-sm">(בתיאום מראש)</p>
              </div>
            </div>

            {/* Social */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="font-bold text-foreground text-lg mb-4">עקבו אחרינו</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/kingdavid4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/kingdavid4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@kingdavid4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Left column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2"
          >
            {submitted ? (
              <div className="glass-strong rounded-2xl p-10 text-center glass-highlight">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">תודה על פנייתכם!</h2>
                <p className="text-muted-foreground">נציג שלנו ייצור אתכם קשר בהקדם.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 glass-highlight space-y-5 sticky top-24">
                <h2 className="text-xl font-bold text-foreground mb-2">שלחו לנו הודעה</h2>
                <div>
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">נושא הפנייה</Label>
                  <Select
                    value={form.subject}
                    onValueChange={(value) => setForm({ ...form, subject: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחרו נושא" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sleep-consultation">ייעוץ שינה</SelectItem>
                      <SelectItem value="product-question">שאלה על מוצר</SelectItem>
                      <SelectItem value="customer-service">שירות לקוחות</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">הודעה *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl gap-2 glow-gold"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "שולח..." : "שלחו הודעה"}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
