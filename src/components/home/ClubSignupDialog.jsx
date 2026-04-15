import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { clubSignupSchema } from "@/lib/validationSchemas";
import { base44 } from "@/api/base44Client";

export default function ClubSignupDialog({ open, onOpenChange }) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clubSignupSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      notes: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await base44.entities.ClubSignup.create({
        full_name: values.fullName,
        phone: values.phone,
        email: values.email,
        city: values.city || null,
        notes: values.notes || null,
        source: "website",
      });
      toast({
        title: "ההרשמה התקבלה",
        description: "ברוכים הבאים למועדון KING DAVID CLUB — ניצור איתכם קשר בקרוב.",
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "אירעה שגיאה",
        description: "לא הצלחנו להשלים את ההרשמה. נסו שוב או פנו אלינו בטלפון.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md bg-[hsl(42,55%,12%)] border-white/10 text-white"
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Crown className="w-8 h-8 text-white/80" fill="currentColor" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-center text-xl tracking-wide">
            הצטרפות למועדון KING DAVID CLUB
          </DialogTitle>
          <DialogDescription className="text-center text-white/60">
            מלאו את הפרטים וניצור איתכם קשר עם הטבות מיוחדות לחברי המועדון.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-white/70 mb-1 block">שם מלא</label>
            <Input
              {...register("fullName")}
              placeholder="שם פרטי ושם משפחה"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">טלפון</label>
            <Input
              {...register("phone")}
              placeholder="05X-XXXXXXX"
              inputMode="tel"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
            />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">אימייל</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">עיר (אופציונלי)</label>
            <Input
              {...register("city")}
              placeholder="תל אביב, ירושלים..."
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">הערות (אופציונלי)</label>
            <Textarea
              {...register("notes")}
              rows={3}
              placeholder="ספרו לנו על מה הייתם רוצים לשמוע"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-[hsl(42,55%,20%)] hover:bg-white/90 font-medium h-11 rounded-none tracking-wide"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                שולח...
              </span>
            ) : (
              "הצטרפות למועדון"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
