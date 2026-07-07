import { useEffect, useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchMoodEntries, fetchMoodTrends, fetchStressRecommendations, logMoodEntry } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";

const MOOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function AiMoodInsightsPanel({ patientId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [trend, setTrend] = useState(null);
  const [stress, setStress] = useState(null);
  const [score, setScore] = useState(6);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    if (!patientId) {
      return;
    }
    setLoading(true);
    try {
      const [entryData, trendData, stressData] = await Promise.allSettled([
        fetchMoodEntries(patientId),
        fetchMoodTrends(patientId),
        fetchStressRecommendations(patientId)
      ]);
      if (entryData.status === "fulfilled") {
        setEntries(Array.isArray(entryData.value) ? entryData.value : []);
      }
      if (trendData.status === "fulfilled") {
        setTrend(trendData.value);
      }
      if (stressData.status === "fulfilled") {
        setStress(stressData.value);
      }
      const failed = [entryData, trendData, stressData].find((item) => item.status === "rejected");
      setError(failed ? getApiErrorMessage(failed.reason, t("unableLoadMedicalRecords")) : "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [patientId, t]);

  const submitEntry = async () => {
    if (!patientId) return;
    setMessage("");
    setError("");
    try {
      const payload = {
        moodScore: Number(score),
        notes: notes.trim()
      };
      await logMoodEntry(patientId, payload);
      setNotes("");
      setMessage(translateUiText("Mood check-in saved."));
      await loadInsights();
    } catch (err) {
      setError(getApiErrorMessage(err, translateUiText("Unable to save mood check-in.")));
    }
  };

  const latestEntry = useMemo(() => (Array.isArray(entries) ? entries[0] : null), [entries]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title={translateUiText("Mood journal")}>
        <div className="grid gap-3">
          <label className="text-sm text-slate-600">
            {translateUiText("How are you feeling today? (1-10)")}
          </label>
          <select
            className="field"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            aria-label={translateUiText("Mood score")}
            data-voice-label={translateUiText("Mood score")}
          >
            {MOOD_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <textarea
            className="field min-h-24 resize-y"
            placeholder={translateUiText("Optional note about how you feel")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button className="btn-primary" type="button" onClick={submitEntry}>
            {translateUiText("Save mood check-in")}
          </button>
          {message ? <p className="text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        </div>
        {latestEntry ? (
          <div className="mt-4 rounded-2xl bg-mist p-4 text-sm text-slate-700">
            <p className="font-semibold">{translateUiText("Latest entry")}</p>
            <p className="text-xs text-slate-500">{latestEntry.createdAt}</p>
            <p className="mt-1">{translateUiText("Mood score")}: {latestEntry.moodScore}</p>
            {latestEntry.notes ? <p className="mt-1">{latestEntry.notes}</p> : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Mood trend summary")}>
        {loading ? <p className="text-sm text-slate-500">{t("loadingMedicalRecords")}</p> : null}
        {!loading && trend ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{trend.summary}</p>
            <ul className="list-disc pl-5">
              {trend.highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="text-xs text-slate-500">{trend.disclaimer}</p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Stress coping recommendations")}>
        {stress ? (
          <div className="space-y-2 text-sm text-slate-700">
            <ul className="list-disc pl-5">
              {stress.recommendations.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {stress.rationale?.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {stress.rationale.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">{stress.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingMedicalRecords")}</p>}
      </SectionCard>
    </div>
  );
}
