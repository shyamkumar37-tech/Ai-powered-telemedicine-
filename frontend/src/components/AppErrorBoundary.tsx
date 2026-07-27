import React from "react";
import { trackRuntimeException, tryRecoverChunkLoad } from "../services/telemetry";
import { DynamicStateObject } from "./../types/DynamicState";

const FALLBACK_COPY = {
  en: {
    title: "App failed to load",
    body: "A shared startup error blocked the page before it could render.",
    message: "The app failed to load."
  },
  hi: {
    title: "ऐप लोड नहीं हो सका",
    body: "एक साझा प्रारंभिक त्रुटि के कारण पेज रेंडर होने से पहले रुक गया।",
    message: "ऐप लोड नहीं हो सका।"
  },
  ml: {
    title: "ആപ്പ് ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു",
    body: "പേജ് റെൻഡർ ചെയ്യുന്നതിന് മുമ്പ് ഒരു പിശക് കാരണം തടസ്സപ്പെട്ടു.",
    message: "ആപ്പ് ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു."
  },
  te: {
    title: "యాప్ లోడ్ అవ్వలేదు",
    body: "పేజీ రెండర్ కావడానికి ముందే లోపం కారణంగా ఆగిపోయింది.",
    message: "యాప్ లోడ్ అవ్వలేదు."
  },
  pa: {
    title: "ਐਪ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ",
    body: "ਪੰਨਾ ਰੈਂਡਰ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਇੱਕ ਗਲਤੀ ਕਾਰਨ ਰੁਕ ਗਿਆ।",
    message: "ਐਪ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ।"
  },
  ta: {
    title: "பயன்பாட்டை ஏற்ற முடியவில்லை",
    body: "பக்கம் ரெண்டர் ஆவதற்கு முன்பே பிழை காரணமாக நிறுத்தப்பட்டது.",
    message: "பயன்பாட்டை ஏற்ற முடியவில்லை."
  }
};

function readBoundaryLanguage() {
  if (typeof window !== "undefined") {
    try {
      const queryLanguage = new URL(window.location.href).searchParams.get("lang");
      if (queryLanguage && (FALLBACK_COPY as DynamicStateObject)[queryLanguage]) {
        return queryLanguage;
      }
    } catch {
      // Ignore malformed URL issues.
    }

    try {
      const stored = localStorage.getItem("telecareplus-language")
        || sessionStorage.getItem("telecareplus-language")
        || document.documentElement?.lang;
      if (stored && (FALLBACK_COPY as DynamicStateObject)[stored]) {
        return stored;
      }
    } catch {
      // Ignore storage access failures.
    }
  }
  return "en";
}

export default class AppErrorBoundary extends React.Component<DynamicStateObject, DynamicStateObject> {
  language: string;

  constructor(props: DynamicStateObject) {
    super(props);
    this.language = readBoundaryLanguage();
    this.state = {
      hasError: false,
      message: ""
    };
    this.handleGlobalError = this.handleGlobalError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    const language = readBoundaryLanguage();
    const copy = (FALLBACK_COPY as DynamicStateObject)[language] ?? FALLBACK_COPY.en;
    return {
      hasError: true,
      message: error?.message || copy.message
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    trackRuntimeException({
      kind: "component-render-error",
      message: error?.message || "Render Error",
      stack: info.componentStack
    });
    tryRecoverChunkLoad(error);
  }

  componentDidMount() {
    window.addEventListener("error", this.handleGlobalError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleGlobalError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  handleGlobalError(event: ErrorEvent) {
    const error = event.error || new Error(event.message || "Unknown global error");
    const language = readBoundaryLanguage();
    const copy = (FALLBACK_COPY as DynamicStateObject)[language] ?? FALLBACK_COPY.en;
    this.language = language;
    this.setState({
      hasError: true,
      message: error?.message || copy.message
    });
    trackRuntimeException({
      kind: "window-runtime-error",
      message: String(error?.message || copy.message)
    });
    tryRecoverChunkLoad(error);
  }

  handleUnhandledRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason || "Unhandled rejection"));
    const language = readBoundaryLanguage();
    const copy = (FALLBACK_COPY as DynamicStateObject)[language] ?? FALLBACK_COPY.en;
    this.language = language;
    this.setState({
      hasError: true,
      message: error?.message || copy.message
    });
    trackRuntimeException({
      kind: "unhandled-rejection",
      message: String(error?.message || copy.message)
    });
    tryRecoverChunkLoad(error);
  }

  render() {
    if (this.state.hasError) {
      const copy = (FALLBACK_COPY as DynamicStateObject)[this.language] ?? FALLBACK_COPY.en;
      return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-[var(--surface-color)] p-8 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-[var(--text-color)]">
              {copy.title}
            </h1>
            <p className="mb-6 text-[var(--text-secondary)]">
              {copy.body}
            </p>
            <div className="mb-8 rounded-lg bg-[var(--background-color)] p-4 text-left font-mono text-sm text-[var(--text-color)]">
              <div className="mb-2 font-semibold text-red-500">Error Details:</div>
              <div className="overflow-auto max-h-32 whitespace-pre-wrap break-words text-xs">
                {String(this.state.message || copy.message)}
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-[var(--primary-color)] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
