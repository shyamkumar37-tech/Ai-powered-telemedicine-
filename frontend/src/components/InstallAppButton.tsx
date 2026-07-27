import { useEffect, useState } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function InstallAppButton() {
  const { t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const [promptEvent, setPromptEvent] = useState<DynamicStateObject | null>(null);
  const [installed, setInstalled] = useState<DynamicState>(false);
  const [installing, setInstalling] = useState<DynamicState>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: DynamicStateObject) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) {
      return;
    }
    setInstalling(true);
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
    setInstalling(false);
  };

  const unavailable = !promptEvent && !installed;
  const buttonLabel = installed
    ? t("installReady")
    : installing
      ? t("installing")
      : unavailable
        ? (t("pWAInstallComingSoon") || "PWA install coming soon")
        : t("installApp");

  return (
    <div className="install-card">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">{(t("mobileAccess") || "Mobile access")}</p>
        <h3 className="mt-2 font-semibold text-white">{t("installReady")}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        {unavailable
          ? (t("browserInstallSupportIsNotAvailableInThisSessionYetTheWebAppRemainsFullyUsableInTheBrowser") || "Browser install support is not available in this session yet. The web app remains fully usable in the browser.")
          : t("installHelp")}
      </p>
      <button
        type="button"
        className="install-card__button"
        onClick={handleInstall}
        disabled={!promptEvent || installed || installing}
        aria-label={buttonLabel}
        data-voice-label={buttonLabel}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
