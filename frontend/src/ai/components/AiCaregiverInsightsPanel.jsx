import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchBehavioralDeviations, fetchCaregiverPriorityQueue, fetchCheckInScript } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";

export default function AiCaregiverInsightsPanel({ caregiverId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [priority, setPriority] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deviations, setDeviations] = useState(null);
  const [script, setScript] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caregiverId) return;
    fetchCaregiverPriorityQueue(caregiverId)
      .then((data) => {
        setPriority(data);
        const first = Array.isArray(data?.patients) ? data.patients[0] : null;
        if (first) {
          setSelectedPatient(first.patientId);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadCaregiverDashboard"))));
  }, [caregiverId, t]);

  useEffect(() => {
    if (!selectedPatient) return;
    fetchBehavioralDeviations(selectedPatient)
      .then((data) => setDeviations(data))
      .catch(() => {});
    fetchCheckInScript(selectedPatient)
      .then((data) => setScript(data))
      .catch(() => {});
  }, [selectedPatient]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title={translateUiText("Priority visit queue")}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {priority ? (
          <div className="space-y-2 text-sm text-slate-700">
            {(Array.isArray(priority.patients) ? priority.patients : []).map((patient) => (
              <button
                key={patient.patientId}
                type="button"
                className={`w-full rounded-2xl px-4 py-3 text-left ${selectedPatient === patient.patientId ? "bg-clinic text-white" : "bg-mist"}`}
                onClick={() => setSelectedPatient(patient.patientId)}
              >
                <p className="font-semibold">{patient.patientName}</p>
                <p className="text-xs">{translateUiText("Priority")} {patient.priorityScore}</p>
              </button>
            ))}
            <p className="text-xs text-slate-500">{priority.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingCaregiverDashboard")}</p>}
      </SectionCard>

      <SectionCard title={translateUiText("Behavioral deviation alerts")}>
        {deviations ? (
          <div className="space-y-2 text-sm text-slate-700">
            {(Array.isArray(deviations.alerts) ? deviations.alerts : []).map((item) => <p key={item}>{item}</p>)}
            {Array.isArray(deviations.rationale) && deviations.rationale.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {deviations.rationale.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">{deviations.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingCaregiverDashboard")}</p>}
      </SectionCard>

      <SectionCard title={translateUiText("Check-in scripts")}>
        {script ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{script.script}</p>
            {Array.isArray(script.rationale) && script.rationale.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {script.rationale.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">{script.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingCaregiverDashboard")}</p>}
      </SectionCard>
    </div>
  );
}
