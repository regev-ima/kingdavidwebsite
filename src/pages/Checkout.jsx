import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, MessageCircle, CreditCard, CheckCircle2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/lib/CartContext";
import { checkoutSchema } from "@/lib/validationSchemas";
import OrderSummary from "@/components/shop/checkout/OrderSummary";

const PAYMENT_METHODS = [
  {
    id: "phone",
    label: "הזמנה טלפונית",
    description: "נציג יחזור אליכם לסיום ההזמנה",
    icon: Phone,
    disabled: false,
  },
  {
    id: "whatsapp",
    label: "הזמנה בוואטסאפ",
    description: "שלחו הזמנה ישירות בוואטסאפ",
    icon: MessageCircle,
    disabled: false,
  },
  {
    id: "credit",
    label: "כרטיס אשראי",
    description: "תשלום מאובטח",
    icon: CreditCard,
    disabled: true,
  },
];

function generateOrderNumber() {
  return "KD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, getCheckoutPayload, clearCart, orderTotal } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("phone");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      street: "",
      apartment: "",
      notes: "",
    },
  });

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4" dir="rtl">
        <h1 className="text-2xl font-bold text-foreground mb-2">הסל ריק</h1>
        <p className="text-muted-foreground mb-6">הוסיפו מוצרים לסל לפני שתמשיכו לתשלום</p>
        <Button
          onClick={() => navigate("/Shop")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground glow-gold h-11"
        >
          לחנות
        </Button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12" dir="rtl">
        <div className="glass-card p-8 md:p-12 max-w-lg w-full space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">ההזמנה שלכם התקבלה!</h1>
          <p className="text-muted-foreground">
            מספר הזמנה: <span className="font-mono text-foreground">{orderNumber}</span>
          </p>
          <p className="text-muted-foreground">
            {paymentMethod === "phone"
              ? "נציג יצור איתכם קשר בהקדם לסיום ההזמנה."
              : "ההזמנה נשלחה בהצלחה דרך וואטסאפ."}
          </p>
          <Button
            onClick={() => navigate("/Shop")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-gold h-14 w-full text-base"
          >
            חזרה לחנות
          </Button>
        </div>
      </div>
    );
  }

  function buildWhatsAppMessage(data) {
    const payload = getCheckoutPayload();
    let msg = `*הזמנה חדשה - King David*\n\n`;
    msg += `*שם:* ${data.fullName}\n`;
    msg += `*טלפון:* ${data.phone}\n`;
    msg += `*אימייל:* ${data.email}\n`;
    msg += `*כתובת:* ${data.street}, ${data.city}`;
    if (data.apartment) msg += ` דירה ${data.apartment}`;
    msg += `\n`;
    if (data.notes) msg += `*הערות:* ${data.notes}\n`;
    msg += `\n*פריטים:*\n`;
    payload.items.forEach((item) => {
      msg += `- ${item.name}`;
      if (item.size) msg += ` (${item.size})`;
      if (item.withStorage) msg += ` + ארגז מצעים`;
      msg += ` x${item.quantity} = ₪${item.lineTotal.toLocaleString()}\n`;
    });
    msg += `\n*סכום ביניים:* ₪${payload.subtotal.toLocaleString()}`;
    msg += `\n*משלוח:* ₪${payload.shipping}`;
    if (payload.withAssembly) msg += `\n*הרכבה:* ₪${payload.assembly}`;
    msg += `\n*סה"כ:* ₪${payload.total.toLocaleString()}`;
    return encodeURIComponent(msg);
  }

  function onSubmit(data) {
    const num = generateOrderNumber();
    setOrderNumber(num);

    if (paymentMethod === "credit") {
      toast({ title: "בקרוב", description: "תשלום בכרטיס אשראי יהיה זמין בקרוב" });
      return;
    }

    if (paymentMethod === "whatsapp") {
      const msg = buildWhatsAppMessage(data);
      window.open(`https://wa.me/972549632221?text=${msg}`, "_blank");
    }

    clearCart();
    setOrderComplete(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12" dir="rtl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 min-h-[44px]"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">השלמת הזמנה</h1>

      {/* Mobile order summary */}
      <div className="lg:hidden mb-6">
        <OrderSummary collapsibleOnMobile />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form sections */}
        <div className="lg:col-span-7 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Contact */}
            <section className="glass-card p-6 md:p-8 space-y-5">
              <h2 className="text-lg font-bold text-foreground">פרטי התקשרות</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">שם מלא *</label>
                <Input
                  {...register("fullName")}
                  className="h-11"
                  placeholder="שם מלא"
                />
                {errors.fullName && <p className="text-sm text-red-400">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">טלפון *</label>
                <Input
                  {...register("phone")}
                  className="h-11"
                  placeholder="05X-XXXXXXX"
                  type="tel"
                  dir="ltr"
                />
                {errors.phone && <p className="text-sm text-red-400">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">אימייל *</label>
                <Input
                  {...register("email")}
                  className="h-11"
                  placeholder="your@email.com"
                  type="email"
                  dir="ltr"
                />
                {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
              </div>
            </section>

            {/* Section 2: Shipping */}
            <section className="glass-card p-6 md:p-8 space-y-5">
              <h2 className="text-lg font-bold text-foreground">כתובת למשלוח</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">עיר *</label>
                <Input
                  {...register("city")}
                  className="h-11"
                  placeholder="עיר"
                />
                {errors.city && <p className="text-sm text-red-400">{errors.city.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">רחוב ומספר *</label>
                <Input
                  {...register("street")}
                  className="h-11"
                  placeholder="רחוב ומספר בית"
                />
                {errors.street && <p className="text-sm text-red-400">{errors.street.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">דירה / קומה</label>
                <Input
                  {...register("apartment")}
                  className="h-11"
                  placeholder="דירה / קומה (אופציונלי)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">הערות למשלוח</label>
                <Textarea
                  {...register("notes")}
                  placeholder="הערות נוספות (אופציונלי)"
                  rows={3}
                />
              </div>
            </section>

            {/* Section 3: Payment method */}
            <section className="glass-card p-6 md:p-8 space-y-5">
              <h2 className="text-lg font-bold text-foreground">אמצעי תשלום</h2>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      type="button"
                      key={method.id}
                      disabled={method.disabled}
                      onClick={() => !method.disabled && setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all min-h-[44px] text-right ${
                        isSelected
                          ? "border-primary/50 bg-primary/[0.08] ring-1 ring-primary/30"
                          : "border-white/[0.08] glass hover:border-white/[0.15]"
                      } ${method.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-foreground/60"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{method.label}</span>
                          {method.disabled && (
                            <Badge variant="glass" className="text-[10px] px-1.5 py-0">בקרוב</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? "border-primary" : "border-white/20"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl glow-gold text-base"
            >
              {isSubmitting ? "שולח..." : "שלחו הזמנה"}
            </Button>
          </form>
        </div>

        {/* Desktop order summary sidebar */}
        <div className="lg:col-span-5 hidden lg:block">
          <OrderSummary collapsibleOnMobile={false} />
        </div>
      </div>
    </div>
  );
}
