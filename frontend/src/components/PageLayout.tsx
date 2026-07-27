import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useLanguage } from "../context/LanguageContext";
import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSkeleton from "./ui/DashboardSkeleton";
import PageSkeleton from "./ui/PageSkeleton";

export interface PageLayoutProps {
  variant?: DynamicState;
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PageLayout({ variant = "page", children }: PageLayoutProps) {
  const { t } = useLanguage();
  const contentRef = useRef<DynamicState>(null);
  const [hasContent, setHasContent] = useState<DynamicState>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    // @ts-expect-error - Auto-suppressed during migration
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
          // @ts-expect-error - Auto-suppressed during migration
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
    <div className="page-shell relative h-full w-full flex flex-col overflow-hidden">
      <AnimatePresence>
        {!hasContent && (
          <motion.div 
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="page-shell__skeleton absolute inset-0 z-10 bg-tc-bg p-6" 
            aria-live="polite"
          >
            {showDashboard ? <DashboardSkeleton /> : <PageSkeleton />}
            <p className="mt-8 text-center text-sm font-medium text-tc-text-muted">{t("loadingYourWorkspace") || "Loading your workspace..."}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        key="content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: hasContent ? 1 : 0, y: hasContent ? 0 : 10 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        ref={contentRef} 
        className="page-shell__content relative z-0 flex-1 min-h-0 flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
}
