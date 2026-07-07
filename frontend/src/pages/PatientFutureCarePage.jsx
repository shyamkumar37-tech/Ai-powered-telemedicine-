import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchAdaptiveTriage,
  fetchCopilotRecommendations,
  fetchDeteriorationInsight,
  fetchFollowUpAutopilot
} from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientFutureCarePage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [deterioration, setDeterioration] = useState(null);
  const [copilot, setCopilot] = useState(null);
  const [adaptive, setAdaptive] = useState(null);
  const [autopilot, setAutopilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!patientId) {
      setDeterioration(null);
      setCopilot(null);
      setAdaptive(null);
      setAutopilot(null);
      setError(t("unableLoadFutureCare"));
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled([
      runWithRequestTimeout((signal) => fetchDeteriorationInsight(patientId, { signal }), { signal: controller.signal }),
      runWithRequestTimeout((signal) => fetchCopilotRecommendations(patientId, { signal }), { signal: controller.signal }),
      runWithRequestTimeout((signal) => fetchAdaptiveTriage(patientId, { signal }), { signal: controller.signal }),
      runWithRequestTimeout((signal) => fetchFollowUpAutopilot(patientId, { signal }), { signal: controller.signal })
    ])
      .then(([deteriorationResult, copilotResult, adaptiveResult, autopilotResult]) => {
        if (!active) {
          return;
        }
        const nextDeterioration = deteriorationResult.status === "fulfilled" ? deteriorationResult.value : null;
        const nextCopilot = copilotResult.status === "fulfilled" ? copilotResult.value : null;
        const nextAdaptive = adaptiveResult.status === "fulfilled" ? adaptiveResult.value : null;
        const nextAutopilot = autopilotResult.status === "fulfilled" ? autopilotResult.value : null;

        setDeterioration(nextDeterioration);
        setCopilot(nextCopilot);
        setAdaptive(nextAdaptive);
        setAutopilot(nextAutopilot);

        if (!nextDeterioration && !nextCopilot && !nextAdaptive && !nextAutopilot) {
          const resolvedError = getApiErrorMessage(
            deteriorationResult.status === "rejected"
              ? deteriorationResult.reason
              : copilotResult.status === "rejected"
                ? copilotResult.reason
                : adaptiveResult.status === "rejected"
                  ? adaptiveResult.reason
                  : autopilotResult.reason,
            t("unableLoadFutureCare")
          );
          setError(resolvedError);
          [deteriorationResult, copilotResult, adaptiveResult, autopilotResult]
            .filter((result) => result.status === "rejected")
            .forEach((result, index) => {
              logAsyncFailure(`patient-future-care:${index}`, result.reason, { patientId });
            });
        } else {
          setError("");
        }
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
  }, [patientId, reloadToken, t]);

  return (
    <div className="space-y-6">
      <SectionCard title={t("futureCareHub")}>
        <p className="mb-4 text-sm text-slate-600">
          {translateUiText("Future-care guidance highlights continuity risk and follow-up priorities from the record on file. It is supportive guidance, not certified clinical diagnosis or triage approval.")}
        </p>
        {loading ? <LoadingSkeleton lines={3} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadFutureCare")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
        {deterioration ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("predictedDeteriorationScore")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{deterioration.predictedScore}/100</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("riskProfile")}</p>
              <div className="mt-2"><Badge value={deterioration.predictedRiskLevel} /></div>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("sharedCaregivers")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{deterioration.activeCaregiverCount}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("abnormalObservations")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{deterioration.abnormalObservationCount}</p>
            </div>
          </div>
        ) : null}
        {deterioration?.summary ? <LocalizedText as="p" className="mt-4 text-sm text-slate-700" value={deterioration.summary} /> : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t("contributingFactors")}>
          {(deterioration?.contributingFactors || []).length ? (
            <div className="space-y-3">
              {(deterioration?.contributingFactors || []).map((factor) => (
                <LocalizedText key={factor} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={factor} />
              ))}
            </div>
          ) : !loading && !error ? (
            <EmptyStateCard
              title={translateUiText("No contributing factors")}
              body={translateUiText("No contributing risk factors are available yet.")}
            />
          ) : null}
        </SectionCard>
        <SectionCard title={t("recommendedActions")}>
          {(deterioration?.recommendedActions || []).length ? (
            <div className="space-y-3">
              {(deterioration?.recommendedActions || []).map((action) => (
                <LocalizedText key={action} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={action} />
              ))}
            </div>
          ) : !loading && !error ? (
            <EmptyStateCard
              title={translateUiText("No recommended actions")}
              body={translateUiText("No recommended actions are available yet.")}
            />
          ) : null}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t("copilotHeadline")}>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-600">{t("patientActions")}</p>
              {(copilot?.patientActions || []).length ? (
                <div className="space-y-2">
                  {(copilot?.patientActions || []).map((item) => (
                    <LocalizedText key={item} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={item} />
                  ))}
                </div>
              ) : <EmptyStateCard title={translateUiText("No patient actions")} body={translateUiText("No patient actions are available yet.")} />}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-600">{t("caregiverActions")}</p>
              {(copilot?.caregiverActions || []).length ? (
                <div className="space-y-2">
                  {(copilot?.caregiverActions || []).map((item) => (
                    <LocalizedText key={item} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={item} />
                  ))}
                </div>
              ) : <EmptyStateCard title={translateUiText("No caregiver actions")} body={translateUiText("No caregiver actions are available yet.")} />}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-600">{t("doctorActions")}</p>
              {(copilot?.doctorActions || []).length ? (
                <div className="space-y-2">
                  {(copilot?.doctorActions || []).map((item) => (
                    <LocalizedText key={item} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={item} />
                  ))}
                </div>
              ) : <EmptyStateCard title={translateUiText("No doctor actions")} body={translateUiText("No doctor actions are available yet.")} />}
            </div>
            {copilot?.escalationDecision ? <LocalizedText as="p" className="text-sm font-semibold text-clinic" value={copilot.escalationDecision} /> : null}
          </div>
        </SectionCard>

        <SectionCard title={t("adaptiveTriage")}>
          {adaptive?.rationale ? <LocalizedText as="p" className="mb-4 text-sm text-slate-600" value={adaptive.rationale} /> : null}
          {(adaptive?.questions || []).length ? (
            <div className="space-y-3">
              {(adaptive?.questions || []).map((question) => (
                <LocalizedText key={question} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={question} />
              ))}
            </div>
          ) : !loading && !error ? (
            <EmptyStateCard
              title={translateUiText("No adaptive triage prompts")}
              body={translateUiText("No adaptive triage prompts are available yet.")}
            />
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title={t("followUpAutopilot")}>
        {autopilot ? (
          <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="space-y-4">
              <div className="rounded-2xl bg-mist p-4">
                <p className="text-sm text-slate-500">{t("nextFollowUpDate")}</p>
                <p className="mt-2 text-xl font-semibold text-ink">{autopilot.nextFollowUpDate}</p>
              </div>
              <div className="rounded-2xl bg-mist p-4">
                <p className="text-sm text-slate-500">{t("urgencyLabel")}</p>
                <p className="mt-2 text-xl font-semibold text-ink">{translateDisplayText(language, autopilot.urgencyLabel)}</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-600">{t("autopilotTasks")}</p>
                <div className="space-y-2">
                  {(autopilot.tasks || []).map((task) => (
                    <LocalizedText key={task} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={task} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-600">{t("reasons")}</p>
                <div className="space-y-2">
                  {(autopilot.reasons || []).map((reason) => (
                    <LocalizedText key={reason} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={reason} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !loading && !error ? (
          <EmptyStateCard
            title={translateUiText("No follow-up plan")}
            body={translateUiText("No automated follow-up plan is available yet.")}
          />
        ) : null}
      </SectionCard>
    </div>
  );
}
