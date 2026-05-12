import { z } from "zod";

const phoneValidator = z
  .string()
  .min(1, "נא להזין מספר טלפון")
  .regex(/^05\d[-]?\d{7}$/, "מספר טלפון לא תקין (05X-XXXXXXX)");

const emailValidator = z
  .string()
  .min(1, "נא להזין כתובת אימייל")
  .email("כתובת אימייל לא תקינה");

export const contactSchema = z.object({
  fullName: z.string().min(2, "נא להזין שם מלא"),
  phone: phoneValidator,
  email: emailValidator,
});

export const shippingSchema = z.object({
  // city + street are populated by the Google Places autocomplete.
  // place_id is required to guarantee the address was selected from the
  // Google suggestion list (not free-typed).
  city: z.string().min(2, "נא לבחור כתובת מאומתת"),
  street: z.string().min(2, "נא לבחור כתובת מאומתת"),
  place_id: z.string().min(1, "נא לבחור כתובת מתוך ההצעות של Google"),
  formatted_address: z.string().optional(),
  apartment: z.string().optional(),
  notes: z.string().optional(),
});

// Checkout uses split first/last name so the Hyp payment page can
// pre-fill ClientName + ClientLName cleanly — Hyp keeps them as
// separate required fields.
export const checkoutSchema = z
  .object({
    firstName: z.string().min(1, "נא להזין שם פרטי"),
    lastName: z.string().min(1, "נא להזין שם משפחה"),
    phone: phoneValidator,
    email: emailValidator,
  })
  .merge(shippingSchema);

export const clubSignupSchema = contactSchema.extend({
  city: z.string().optional(),
  notes: z.string().optional(),
});
