import React, { useEffect, useRef, useState } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  isGoogleMapsConfigured,
  loadGooglePlaces,
  parseAddressComponents,
} from "@/lib/googleMaps";

/**
 * Google Places autocomplete input for the checkout address.
 *
 * - Restricted to street addresses in Israel (`country: 'il'`, `types: ['address']`)
 * - Rejects free-text: only a Place selected from the dropdown is accepted.
 * - Calls `onSelect(parsed)` with { formattedAddress, placeId, city, street, ... }.
 * - Calls `onClear()` when the user clears the selection.
 *
 * If VITE_GOOGLE_MAPS_API_KEY is not configured the component falls back
 * to a plain input that calls `onManualFallback(value)` — useful for local
 * dev without the key.
 */
export default function AddressAutocomplete({
  value,
  onSelect,
  onClear,
  onManualFallback,
  error,
  placeholder = "חיפוש כתובת (עיר, רחוב ומספר)",
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isGoogleMapsConfigured) {
      setLoadError("Google Maps API key not configured");
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadGooglePlaces()
      .then((places) => {
        if (cancelled || !inputRef.current) return;
        const autocomplete = new places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "il" },
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place || !place.place_id) {
            // User pressed enter without selecting a suggestion — ignore.
            return;
          }
          const parsed = parseAddressComponents(place);
          // Require both a street name AND a street number so we don't
          // accept "Tel Aviv" as a full shipping address.
          if (!parsed.streetName || !parsed.streetNumber) {
            setLoadError("נא לבחור כתובת עם שם רחוב ומספר בית");
            return;
          }
          setLoadError(null);
          onSelect?.(parsed);
        });
        autocompleteRef.current = autocomplete;
        setReady(true);
      })
      .catch((err) => {
        console.error("[AddressAutocomplete] failed to load Google Maps:", err);
        setLoadError("שירות השלמת כתובות לא זמין כעת");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onSelect]);

  // If Google Maps is not configured at all, fall back to manual entry so
  // the checkout still works in dev environments without the key.
  if (!isGoogleMapsConfigured) {
    return (
      <div className="space-y-1.5">
        <div className="relative">
          <Input
            className="h-11 pl-10"
            placeholder={placeholder}
            defaultValue={value?.formattedAddress || ""}
            onBlur={(e) => onManualFallback?.(e.target.value)}
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          השלמת כתובות דרך Google אינה מוגדרת — אנא הזינו ידנית.
        </p>
      </div>
    );
  }

  // A selected place is displayed as a readonly "chip" with a clear button.
  if (value?.placeId) {
    return (
      <div className="space-y-1.5">
        <div className="relative flex items-center gap-2 h-11 px-3 rounded-md border border-primary/30 bg-primary/[0.06]">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">
            {value.formattedAddress}
          </span>
          <button
            type="button"
            onClick={() => onClear?.()}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="נקו כתובת"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          ref={inputRef}
          className="h-11 pl-10"
          placeholder={placeholder}
          disabled={loading && !ready}
          autoComplete="off"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </span>
      </div>
      {loadError && (
        <p className="text-xs text-red-400">{loadError}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-muted-foreground">
        הקלידו ובחרו את הכתובת מהרשימה המוצעת. רק כתובות מאומתות דרך Google יתקבלו.
      </p>
    </div>
  );
}
