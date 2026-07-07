import React from "react";
import { trackRuntimeException, tryRecoverChunkLoad } from "../services/telemetry";

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
    title: "ആപ്പ് ലോഡ് ചെയ്യാനായില്ല",
    body: "ഒരു പൊതുവായ ആരംഭ പിഴവുകൊണ്ട് പേജ് റൻഡർ ചെയ്യുന്നതിന് മുമ്പ് നിർത്തി.",
    message: "ആപ്പ് ലോഡ് ചെയ്യാനായില്ല."
  },
  te: {
    title: "యాప్ లోడ్ కాలేదు",
    body: "ఒక సాధారణ ప్రారంభ లోపం కారణంగా పేజీ రెండర్ కావడానికి ముందే ఆగిపోయింది.",
    message: "యాప్ లోడ్ కాలేదు."
  },
  pa: {
    title: "ਐਪ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ",
    body: "ਇੱਕ ਸਾਂਝੀ ਸ਼ੁਰੂਆਤੀ ਗਲਤੀ ਕਾਰਨ ਪੇਜ ਰੈਂਡਰ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਰੁਕ ਗਿਆ।",
    message: "ਐਪ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ।"
  },
  ta: {
    title: "ஆப் ஏற்றப்படவில்லை",
    body: "ஒரு பொதுவான ஆரம்ப பிழை காரணமாக பக்கம் ரெண்டர் ஆகும் முன் நிறுத்தப்பட்டது.",
    message: "ஆப் ஏற்றப்படவில்லை."
  }
};

function readBoundaryLanguage() {
  if (typeof window !== "undefined") {
    try {
      const queryLanguage = new URL(window.location.href).searchParams.get("lang");
      if (queryLanguage && FALLBACK_COPY[queryLanguage]) {
        return queryLanguage;
      }
    } catch {
      // Ignore malformed URL issues.
    }

    try {
      const stored = localStorage.getItem("telecareplus-language")
        || sessionStorage.getItem("telecareplus-language")
        || document.documentElement?.lang;
      if (stored && FALLBACK_COPY[stored]) {
        return stored;
      }
    } catch {
      // Ignore storage access failures.
    }
  }

  return "en";
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.language = readBoundaryLanguage();
    this.state = {
      hasError: false,
      message: ""
    };
    this.handleGlobalError = this.handleGlobalError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  static getDerivedStateFromError(error) {
    const language = readBoundaryLanguage();
    const copy = FALLBACK_COPY[language] ?? FALLBACK_COPY.en;
    return {
      hasError: true,
      message: error?.message || copy.message
    };
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", this.handleGlobalError);
      window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("error", this.handleGlobalError);
      window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    }
  }

  componentDidCatch(error) {
    this.language = readBoundaryLanguage();
    trackRuntimeException({
      kind: "app-boundary",
      message: String(error?.message || "The app failed to load.")
    });
    tryRecoverChunkLoad(error);
  }

  handleGlobalError(event) {
    const error = event?.error || new Error(event?.message || "Unknown error");
    const language = readBoundaryLanguage();
    const copy = FALLBACK_COPY[language] ?? FALLBACK_COPY.en;
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

  handleUnhandledRejection(event) {
    const reason = event?.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason || "Unhandled rejection"));
    const language = readBoundaryLanguage();
    const copy = FALLBACK_COPY[language] ?? FALLBACK_COPY.en;
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
      const copy = FALLBACK_COPY[this.language] ?? FALLBACK_COPY.en;
      return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="glass-card w-full max-w-xl p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-clinic">TeleCare+</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">{copy.title}</h1>
            <p className="mt-4 text-sm text-slate-600">
              {copy.body}
            </p>
            <pre className="mt-6 overflow-auto rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
              {this.state.message}
            </pre>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
