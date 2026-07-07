import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { askChatbotQuestion, fetchChatbotHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

function normalizeChatbotEntry(entry, fallbackAnswer) {
  return {
    id: entry?.id ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: typeof entry?.question === "string" && entry.question.trim()
      ? entry.question.trim()
      : "",
    answer: typeof entry?.answer === "string" && entry.answer.trim()
      ? entry.answer.trim()
      : fallbackAnswer,
    urgencyLabel: entry?.urgencyLabel || "INFO",
    suggestedActions: Array.isArray(entry?.suggestedActions)
      ? entry.suggestedActions.filter((item) => typeof item === "string" && item.trim())
      : []
  };
}

export default function PatientChatbotPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const fallbackAnswer = translateUiText(
    "Guidance is temporarily unavailable. Please review your symptoms with your doctor or try again shortly."
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!patientId) {
      setHistory([]);
      setLoading(false);
      setError(t("unableLoadChatbotHistory"));
      return;
    }

    setLoading(true);
    runWithRequestTimeout(
      (signal) => fetchChatbotHistory(patientId, { signal }),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!active) {
          return;
        }
        const normalizedHistory = Array.isArray(data)
          ? data.map((entry) => normalizeChatbotEntry(entry, fallbackAnswer))
          : [];
        setHistory(normalizedHistory);
        setError("");
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setHistory([]);
        setError(getApiErrorMessage(err, t("unableLoadChatbotHistory")));
        logAsyncFailure("patient-chatbot:history", err, { patientId });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fallbackAnswer, patientId, reloadToken, t]);

  const ask = async () => {
    if (sending) {
      return;
    }

    if (!patientId) {
      setError(t("unableGetChatbotGuidance"));
      return;
    }
    if (!question.trim()) {
      setError(t("enterQuestionForCareAssistant"));
      return;
    }
    setSending(true);
    try {
      const response = await askChatbotQuestion({ patientId, question: question.trim() });
      const normalizedResponse = normalizeChatbotEntry(response, fallbackAnswer);
      setHistory((current) => [normalizedResponse, ...current]);
      setQuestion("");
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableGetChatbotGuidance")));
      logAsyncFailure("patient-chatbot:ask", err, { patientId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("chatbotTitle")}
        action={
          <button
            className="btn-primary"
            type="button"
            disabled={sending || !patientId || !question.trim()}
            onClick={ask}
            aria-label={sending ? t("thinking") : t("askAssistant")}
            data-voice-label={sending ? t("thinking") : t("askAssistant")}
          >
            {sending ? t("thinking") : t("askAssistant")}
          </button>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          {translateUiText("This assistant supports continuity care using the record on file. It is not a diagnosis service and does not replace clinician review or emergency care.")}
        </p>
        <textarea
          className="field min-h-28 resize-y"
          placeholder={t("chatbotPlaceholder")}
          aria-label={t("chatbotPlaceholder")}
          data-voice-label={t("chatbotPlaceholder")}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        {error ? (
          <ErrorStateCard
            title={t("unableLoadChatbotHistory")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={t("chatHistory")}>
        {loading && !history.length ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !history.length ? (
          <EmptyStateCard
            title={t("noChatbotGuidance")}
            body={translateUiText("Ask a question to see guidance here.")}
          />
        ) : null}
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-mist p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t("patientQuestion")}</p>
                  <LocalizedText as="p" className="mt-2 text-sm text-ink" value={entry.question || translateUiText("No question recorded.")} />
                </div>
                <Badge value={entry.urgencyLabel} />
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">{t("telecareResponse")}</p>
                <LocalizedText as="p" className="mt-2 text-sm text-slate-700" value={entry.answer} />
              </div>
              {!!entry.suggestedActions?.length && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-500">{t("suggestedActions")}</p>
                  <div className="space-y-2">
                    {entry.suggestedActions.map((action) => (
                      <LocalizedText key={action} as="div" className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700" value={action} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
