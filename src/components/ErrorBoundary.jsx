import React from "react";

/**
 * Catches render/lifecycle errors below it so a single broken component
 * can't unmount the whole React tree and leave the visitor on a blank
 * white page.
 *
 * Used twice in the app:
 *   - around the page <Outlet /> in Layout, so the navbar + footer survive
 *     and the visitor can navigate away from a broken page
 *   - at the very top in App, as a last resort if Layout itself throws
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div dir="rtl" className="min-h-[50vh] flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-sans-hebrew font-semibold text-foreground mb-3">
            משהו השתבש בטעינת העמוד
          </h2>
          <p className="text-sm text-muted-foreground font-light mb-6">
            אנחנו כבר על זה. אפשר לרענן את הדף או לחזור לעמוד הבית.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-primary/30 text-foreground/80 hover:text-primary hover:border-primary/50 transition-colors tracking-wide font-light"
            >
              רענון הדף
            </button>
            <a
              href="/Home"
              className="px-6 py-2 border border-primary/30 text-foreground/80 hover:text-primary hover:border-primary/50 transition-colors tracking-wide font-light"
            >
              לעמוד הבית
            </a>
          </div>
        </div>
      </div>
    );
  }
}
