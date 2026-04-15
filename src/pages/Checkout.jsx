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
import AddressAutocomplete from "@/components/shop/checkout/AddressAutocomplete";
import { base44 } from "@/api/base44Client";
import { isSupabaseConfigured } from "@/lib/supabase";

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
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      street: "",
      place_id: "",
      formatted_address: "",
      apartment: "",
      notes: "",
    },
  });

  // Derived state for the Google Places autocomplete. Watching these
  // fields keeps the visible "selected address" chip in sync with
  // react-hook-form values.
  const placeId = watch("place_id");
  const formattedAddress = watch("formatted_address");
  const selectedPlace = placeId
    ? { placeId, formattedAddress, city: watch("city"), street: watch("street") }
    : null;

  const handleAddressSelect = (parsed) => {
    setValue("city", parsed.city, { shouldValidate: true });
    setValue("street", parsed.street, { shouldValidate: true });
    setValue("place_id", parsed.placeId, { shouldValidate: true });
    setValue("formatted_address", parsed.formattedAddress, { shouldValidate: true });
    clearErrors(["city", "street", "place_id"]);
  };

  const handleAddressClear = () => {
    setValue("city", "", { shouldValidate: true });
    setValue("street", "", { shouldValidate: true });
    setValue("place_id", "", { shouldValidate: true });
    setValue("formatted_address", "", { shouldValidate: true });
  };

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
    msg += `*כתובת:* ${data.formatted_address || `${data.street}, ${data.city}`}`;
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

  async function persistOrderToCRM(num, data) {
    if (!isSupabaseConfigured) {
      console.warn("[checkout] Supabase not configured — skipping CRM persistence.");
      return;
    }
    const payload = getCheckoutPayload();

    // Translate website cart -> kcrm orders.items JSONB shape.
    const itemsJsonb = payload.items.map((item) => ({
      product_id: item.productId,
      variation_id: item.variationId,
      sku: item.sku,
      name: item.name,
      size: item.size || null,
      quantity: item.quantity,
      with_storage: item.withStorage,
      unit_price: item.unitPrice,
      addons: item.addons || [],
      addons_unit_price: item.addonsUnitPrice || 0,
      line_total: item.lineTotal,
      image_url: item.imageUrl,
    }));

    const extras = {
      shipping: payload.shipping,
      with_assembly: payload.withAssembly,
      assembly: payload.assembly,
      payment_method: paymentMethod,
      website_notes: data.notes || null,
      google_place_id: data.place_id || null,
      google_formatted_address: data.formatted_address || null,
    };

    const orderRow = {
      order_number: num,
      source: "website",
      payment_status: "pending",
      production_status: "new",
      delivery_status: "pending",
      customer_name: data.fullName,
      customer_phone: data.phone,
      customer_email: data.email,
      delivery_address: [data.street, data.apartment].filter(Boolean).join(", ") || null,
      delivery_city: data.city,
      apartment_number: data.apartment || null,
      items: itemsJsonb,
      extras,
      subtotal: payload.subtotal,
      discount_total: 0,
      vat_amount: 0,
      total: payload.total,
      notes_sales: data.notes || null,
    };

    try {
      await base44.entities.Order.create(orderRow);
    } catch (err) {
      console.error("[checkout] Failed to persist order to CRM:", err);
      toast({
        title: "ההזמנה התקבלה",
        description: "נציג יחזור אליך בהקדם. (שמירת CRM נכשלה — בדוק לוגים)",
      });
    }
  }

  async function onSubmit(data) {
    const num = generateOrderNumber();
    setOrderNumber(num);

    if (paymentMethod === "credit") {
      toast({ title: "בקרוב", description: "תשלום בכרטיס אשראי יהיה זמין בקרוב" });
      return;
    }

    await persistOrderToCRM(num, data);

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
                <label className="text-sm font-medium text-foreground/80">כתובת *</label>
                <AddressAutocomplete
                  value={selectedPlace}
                  onSelect={handleAddressSelect}
                  onClear={handleAddressClear}
                  onManualFallback={(text) => {
                    // Fallback for environments without a Google Maps API key —
                    // accept the raw text so checkout still works. The CRM team
                    // will see `place_id: "manual"` and review manually.
                    setValue("formatted_address", text, { shouldValidate: true });
                    setValue("street", text, { shouldValidate: true });
                    setValue("place_id", "manual", { shouldValidate: true });
                  }}
                  error={errors.place_id?.message || errors.street?.message || errors.city?.message}
                />
                {/* Hidden fields so react-hook-form picks up Google-populated values */}
                <input type="hidden" {...register("city")} />
                <input type="hidden" {...register("street")} />
                <input type="hidden" {...register("place_id")} />
                <input type="hidden" {...register("formatted_address")} />
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
