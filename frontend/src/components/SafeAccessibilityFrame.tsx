import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import AccessibilityFrame from "./AccessibilityFrame";
import { DynamicStateObject } from "./../types/DynamicState";

const FALLBACK_COPY = {
  en: {
    title: "Accessibility tools are temporarily unavailable",
    body: "The app is still running, but the screen-reader and voice-assistant layer did not load right now. Refreshing or changing pages will retry it."
  },
  hi: {
    title: "\u0938\u0941\u0917\u092e\u094d\u092f\u0924\u093e \u0909\u092a\u0915\u0930\u0923 \u0905\u0938\u094d\u0925\u093e\u092f\u0940 \u0930\u0942\u092a \u0938\u0947 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902",
    body: "\u090f\u092a \u091a\u0932 \u0930\u0939\u093e \u0939\u0948, \u0932\u0947\u0915\u093f\u0928 \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u0914\u0930 \u0935\u0949\u0907\u0938 \u0938\u0939\u093e\u092f\u0915 \u092a\u0930\u0924 \u0907\u0938 \u0938\u092e\u092f \u0932\u094b\u0921 \u0928\u0939\u0940\u0902 \u0939\u0941\u0908\u0964 \u0930\u093f\u092b\u094d\u0930\u0947\u0936 \u092f\u093e \u092a\u0947\u091c \u092c\u0926\u0932\u0928\u0947 \u092a\u0930 \u0939\u092e \u0907\u0938\u0947 \u092b\u093f\u0930 \u0938\u0947 \u0932\u094b\u0921 \u0915\u0930\u0947\u0902\u0917\u0947\u0964"
  },
  ml: {
    title: "\u0d2a\u0d4d\u0d30\u0d35\u0d47\u0d36\u0d28 \u0d38\u0d57\u0d15\u0d30\u0d4d\u0d2f \u0d09\u0d2a\u0d15\u0d30\u0d23\u0d19\u0d4d\u0d19\u0d7e \u0d24\u0d3e\u0d7d\u0d15\u0d4d\u0d15\u0d3e\u0d32\u0d3f\u0d15\u0d2e\u0d3e\u0d2f\u0d3f \u0d32\u0d2d\u0d4d\u0d2f\u0d2e\u0d32\u0d4d\u0d32",
    body: "\u0d06\u0d2a\u0d4d\u0d2a\u0d4d \u0d2a\u0d4d\u0d30\u0d35\u0d7c\u0d24\u0d4d\u0d24\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d41, \u0d2a\u0d15\u0d4d\u0d37\u0d47 \u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d31\u0d41\u0d02 \u0d36\u0d2c\u0d4d\u0d26 \u0d38\u0d39\u0d3e\u0d2f \u0d2a\u0d3e\u0d33\u0d3f\u0d2f\u0d41\u0d02 \u0d07\u0d2a\u0d4d\u0d2a\u0d4b\u0d7e \u0d32\u0d4b\u0d21\u0d4d \u0d1a\u0d46\u0d2f\u0d4d\u0d24\u0d3f\u0d32\u0d4d\u0d32. \u0d2a\u0d47\u0d1c\u0d4d \u0d2e\u0d3e\u0d31\u0d4d\u0d31\u0d41\u0d15\u0d2f\u0d4b \u0d31\u0d3f\u0d2b\u0d4d\u0d30\u0d46\u0d37\u0d4d \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15\u0d2f\u0d4b \u0d1a\u0d46\u0d2f\u0d4d\u0d24\u0d3e\u0d7d \u0d35\u0d40\u0d23\u0d4d\u0d1f\u0d41\u0d02 \u0d36\u0d4d\u0d30\u0d2e\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d02."
  },
  te: {
    title: "\u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41 \u0c38\u0c3e\u0c27\u0c28\u0c3e\u0c32\u0c41 \u0c24\u0c3e\u0c24\u0c4d\u0c15\u0c3e\u0c32\u0c3f\u0c15\u0c02\u0c17\u0c3e \u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c32\u0c47\u0c35\u0c41",
    body: "\u0c2f\u0c3e\u0c2a\u0c4d \u0c2a\u0c28\u0c3f\u0c1a\u0c47\u0c38\u0c4d\u0c24\u0c4b\u0c02\u0c26\u0c3f, \u0c15\u0c3e\u0c28\u0c40 \u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d \u0c2e\u0c30\u0c3f\u0c2f\u0c41 \u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c38\u0c39\u0c3e\u0c2f\u0c15 \u0c2a\u0c4a\u0c30 \u0c2a\u0c4d\u0c30\u0c38\u0c4d\u0c24\u0c41\u0c24\u0c02 \u0c32\u0c4b\u0c21\u0c4d \u0c15\u0c3e\u0c32\u0c47\u0c26\u0c41. \u0c30\u0c3f\u0c2b\u0c4d\u0c30\u0c46\u0c37\u0c4d \u0c32\u0c47\u0c26\u0c3e \u0c2a\u0c47\u0c1c\u0c40 \u0c2e\u0c3e\u0c30\u0c4d\u0c2a\u0c41\u0c24\u0c4b \u0c2e\u0c33\u0c4d\u0c32\u0c40 \u0c2a\u0c4d\u0c30\u0c2f\u0c24\u0c4d\u0c28\u0c3f\u0c38\u0c4d\u0c24\u0c3e\u0c2e\u0c41."
  },
  pa: {
    title: "\u0a2a\u0a39\u0a41\u0a70\u0a1a\u0a2f\u0a4b\u0a17\u0a24\u0a3e \u0a38\u0a3e\u0a27\u0a28 \u0a05\u0a38\u0a25\u0a3e\u0a08 \u0a24\u0a4c\u0a30 \u0a24\u0a47 \u0a09\u0a2a\u0a32\u0a2c\u0a27 \u0a28\u0a39\u0a40\u0a02 \u0a39\u0a28",
    body: "\u0a10\u0a2a \u0a1a\u0a71\u0a32 \u0a30\u0a39\u0a40 \u0a39\u0a48, \u0a2a\u0a30 \u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a05\u0a24\u0a47 \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a38\u0a39\u0a3e\u0a07\u0a24\u0a3e \u0a2a\u0a30\u0a24 \u0a07\u0a38 \u0a35\u0a47\u0a32\u0a47 \u0a32\u0a4b\u0a21 \u0a28\u0a39\u0a40\u0a02 \u0a39\u0a4b\u0a08\u0964 \u0a30\u0a3f\u0a2b\u0a4d\u0a30\u0a48\u0a38\u0a3c \u0a1c\u0a3e\u0a02 \u0a2a\u0a47\u0a1c \u0a2c\u0a26\u0a32\u0a23 \u0a28\u0a3e\u0a32 \u0a05\u0a38\u0a40\u0a02 \u0a26\u0a41\u0a2c\u0a3e\u0a30\u0a3e \u0a15\u0a4b\u0a38\u0a3c\u0a3f\u0a38\u0a3c \u0a15\u0a30\u0a3e\u0a02\u0a17\u0a47\u0964"
  },
  ta: {
    title: "\u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd \u0b95\u0bb0\u0bc1\u0bb5\u0bbf\u0b95\u0bb3\u0bcd \u0ba4\u0bb1\u0bcd\u0b95\u0bbe\u0bb2\u0bbf\u0b95\u0bae\u0bbe\u0b95 \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8",
    body: "\u0baa\u0baf\u0ba9\u0bcd\u0baa\u0bbe\u0b9f\u0bc1 \u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1, \u0b86\u0ba9\u0bbe\u0bb2\u0bcd \u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b89\u0ba4\u0bb5\u0bbf \u0b85\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b87\u0baa\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 \u0b8f\u0bb1\u0bcd\u0bb1\u0baa\u0bcd\u0baa\u0b9f\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8. \u0baa\u0bc1\u0ba4\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0ba4\u0bcd\u0ba4\u0bbe\u0bb2\u0bcd \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0baa\u0b95\u0bcd\u0b95\u0ba4\u0bcd\u0ba4\u0bc8 \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bbf\u0ba9\u0bbe\u0bb2\u0bcd \u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0baf\u0bb2\u0bcd\u0bb5\u0bcb\u0bae\u0bcd."
  }
};

class AccessibilityErrorBoundary extends React.Component<DynamicStateObject, DynamicStateObject> {
  constructor(props: DynamicStateObject) {
    super(props);
    this.state = {
      hasError: false,
      message: ""
    };
  }

  static getDerivedStateFromError(error: DynamicStateObject) {
    return {
      hasError: true,
      message: error?.message || "Accessibility tools are temporarily unavailable."
    };
  }

  componentDidUpdate(prevProps: DynamicStateObject) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({
        hasError: false,
        message: ""
      });
    }
  }

  componentDidCatch(error: DynamicStateObject) {
    if (typeof console !== "undefined") {
      console.error("Accessibility layer failed. Falling back to base app shell.", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children}
          <div className="fixed bottom-4 left-4 z-[80] max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-panel" role="alert">
            <p className="font-semibold">{this.props.fallbackTitle}</p>
            <p className="mt-1">{this.props.fallbackBody}</p>
            {this.state.message ? (
              <p className="mt-2 text-xs text-amber-800/90">{this.state.message}</p>
            ) : null}
          </div>
        </>
      );
    }

    return this.props.childrenWithAccessibility;
  }
}

export interface SafeAccessibilityFrameProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SafeAccessibilityFrame({ children }: SafeAccessibilityFrameProps) {
  const location = useLocation();
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const fallbackCopy = (FALLBACK_COPY as DynamicStateObject)[language] ?? FALLBACK_COPY.en;

  return (
    <AccessibilityErrorBoundary
      resetKey={`${location.pathname}:${language}`}
      fallbackTitle={fallbackCopy.title}
      fallbackBody={fallbackCopy.body}
      childrenWithAccessibility={<AccessibilityFrame>{children}</AccessibilityFrame>}
    >
      {children}
    </AccessibilityErrorBoundary>
  );
}
