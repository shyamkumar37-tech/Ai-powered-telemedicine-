import { useEffect, useState } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";

export default function InstallAppButton() {
  const { t, translateUiText = (value) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
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
        ? translateUiText("PWA install coming soon")
        : t("installApp");

  return (
    <div className="install-card">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">{translateUiText("Mobile access")}</p>
        <h3 className="mt-2 font-semibold text-white">{t("installReady")}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        {unavailable
          ? translateUiText("Browser install support is not available in this session yet. The web app remains fully usable in the browser.")
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
