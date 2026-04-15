// Lazy loader for the Google Maps JavaScript API (Places library).
// Uses a global callback to reliably resolve when both `google.maps`
// and `google.maps.places` are populated — onload alone is unreliable
// with the async bootstrap.
//
// Usage:
//   const places = await loadGooglePlaces();
//   new places.Autocomplete(inputEl, { ... });

const SCRIPT_ID = 'google-maps-places-script';
const CALLBACK_NAME = '__kdGoogleMapsReady';

let loadPromise = null;

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
}

export const isGoogleMapsConfigured = Boolean(getGoogleMapsApiKey());

export function loadGooglePlaces() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps.places);
  }

  if (loadPromise) return loadPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Callback fired by Google once the main API and the `places` library
    // are fully initialized. Much more reliable than script.onload.
    window[CALLBACK_NAME] = () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps.places);
      } else {
        reject(new Error('Google Maps Places library unavailable after load'));
      }
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // Another caller already injected the tag; wait for its callback.
      existing.addEventListener('error', () =>
        reject(new Error('Google Maps script failed to load')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=iw&region=IL&callback=${CALLBACK_NAME}&v=weekly`;
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Parse a Google Place result's address_components into a flat shape
 * suitable for the checkout form.
 */
export function parseAddressComponents(place) {
  const components = place?.address_components || [];
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || '';

  const streetNumber = get('street_number');
  const route = get('route');
  const city = get('locality') || get('postal_town') || get('sublocality_level_1') || '';
  const country = get('country');
  const postalCode = get('postal_code');

  const streetLine = [route, streetNumber].filter(Boolean).join(' ').trim();

  return {
    formattedAddress: place?.formatted_address || '',
    placeId: place?.place_id || '',
    city,
    street: streetLine,
    streetName: route,
    streetNumber,
    postalCode,
    country,
    lat: place?.geometry?.location?.lat?.() ?? null,
    lng: place?.geometry?.location?.lng?.() ?? null,
  };
}
