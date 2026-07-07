import { useEffect, useRef, useState } from "react";
import DashboardSkeleton from "./ui/DashboardSkeleton";
import PageSkeleton from "./ui/PageSkeleton";

export default function PageLayout({ variant = "page", children }) {
  const contentRef = useRef(null);
  const [hasContent, setHasContent] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(window.__TELECARE_LAYOUT_READY__);
  });

  useEffect(() => {
    if (hasContent) {
      return () => {};
    }

    const node = contentRef.current;
    if (!node) {
      return () => {};
    }

    const check = () => {
      if (!node) {
        return;
      }
      const hasRenderableContent = node.childNodes.length > 0;
      if (hasRenderableContent) {
        setHasContent(true);
        if (typeof window !== "undefined") {
          window.__TELECARE_LAYOUT_READY__ = true;
        }
      }
    };

    check();
    const observer = new MutationObserver(() => {
      if (!hasContent) {
        check();
      }
    });
    observer.observe(node, { childList: true, subtree: true, characterData: true });

    const timer = window.setInterval(() => {
      if (!hasContent) {
        check();
      }
    }, 1200);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [hasContent]);

  const showDashboard = variant === "dashboard" || variant === "shell";

  return (
    <div className="page-shell">
      {!hasContent ? (
        <div className="page-shell__skeleton" aria-live="polite">
          {showDashboard ? <DashboardSkeleton /> : <PageSkeleton />}
          <p className="page-shell__note">Loading your workspace...</p>
        </div>
      ) : null}
      <div ref={contentRef} className="page-shell__content">
        {children}
      </div>
    </div>
  );
}
