import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().min(2, "נא להזין שם מלא"),
  phone: z
    .string()
    .min(1, "נא להזין מספר טלפון")
    .regex(/^05\d[-]?\d{7}$/, "מספר טלפון לא תקין (05X-XXXXXXX)"),
  email: z
    .string()
    .min(1, "נא להזין כתובת אימייל")
    .email("כתובת אימייל לא תקינה"),
});

export const shippingSchema = z.object({
  city: z.string().min(2, "נא להזין עיר"),
  street: z.string().min(2, "נא להזין רחוב ומספר"),
  apartment: z.string().optional(),
  notes: z.string().optional(),
});

export const checkoutSchema = contactSchema.merge(shippingSchema);

export const clubSignupSchema = contactSchema.extend({
  city: z.string().optional(),
  notes: z.string().optional(),
});
