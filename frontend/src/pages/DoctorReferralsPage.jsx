import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createReferral, fetchDoctorReferrals, fetchReferralSuggestions } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";

export default function DoctorReferralsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const [suggestions, setSuggestions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    doctorId,
    patientId: "",
    specialty: "",
    targetFacility: "",
    reason: "",
    recommendationNote: "",
    urgency: "ROUTINE",
    recommendedDate: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const [suggestionData, referralData] = await Promise.all([
        fetchReferralSuggestions(doctorId),
        fetchDoctorReferrals(doctorId)
      ]);
      const safeSuggestions = Array.isArray(suggestionData) ? suggestionData : [];
      const safeReferrals = Array.isArray(referralData) ? referralData : [];
      setSuggestions(safeSuggestions);
      setReferrals(safeReferrals);
      setForm((current) => ({
        ...current,
        doctorId,
        patientId: current.patientId || (safeSuggestions[0]?.patientId ? String(safeSuggestions[0].patientId) : ""),
        specialty: current.specialty || (safeSuggestions[0]?.specialty || ""),
        targetFacility: current.targetFacility || (safeSuggestions[0]?.recommendedFacility || ""),
        urgency: current.urgency || (safeSuggestions[0]?.urgency || "ROUTINE"),
        reason: current.reason || (safeSuggestions[0]?.rationale || "")
      }));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadReferrals")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title={t("referralIntelligence")}
        action={
          <button
            className="btn-primary"
            type="button"
            disabled={saving}
            aria-label={saving ? t("saving") : t("createReferral")}
            data-voice-label={saving ? t("saving") : t("createReferral")}
            onClick={async () => {
              try {
                setSaving(true);
                const created = await createReferral({
                  ...form,
                  doctorId,
                  patientId: Number(form.patientId),
                  recommendedDate: form.recommendedDate || null
                });
                setReferrals((current) => [created, ...current]);
                setMessage(t("referralCreated"));
                setError("");
              } catch (err) {
                setError(getApiErrorMessage(err, t("unableCreateReferral")));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("saving") : t("createReferral")}
          </button>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("patientId")}</span>
            <select
              className="field"
              aria-label={t("patientId")}
              data-voice-label={t("patientId")}
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            >
              <option value="">{t("selectPatient")}</option>
              {suggestions.map((item) => (
                <option key={item.patientId} value={item.patientId}>{item.patientName}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("specialty")}</span>
              <input
                className="field"
                aria-label={t("specialty")}
                data-voice-label={t("specialty")}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("urgency")}</span>
              <select
                className="field"
                aria-label={t("urgency")}
                data-voice-label={t("urgency")}
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                <option value="ROUTINE">{translateDisplayText(language, "ROUTINE")}</option>
                <option value="PRIORITY">{translateDisplayText(language, "PRIORITY")}</option>
                <option value="URGENT">{translateDisplayText(language, "URGENT")}</option>
              </select>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("targetFacility")}</span>
            <input
              className="field"
              aria-label={t("targetFacility")}
              data-voice-label={t("targetFacility")}
              value={form.targetFacility}
              onChange={(e) => setForm({ ...form, targetFacility: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("reason")}</span>
            <textarea
              className="field min-h-24 resize-y"
              aria-label={t("reason")}
              data-voice-label={t("reason")}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("recommendationNote")}</span>
            <textarea
              className="field min-h-24 resize-y"
              aria-label={t("recommendationNote")}
              data-voice-label={t("recommendationNote")}
              value={form.recommendationNote}
              onChange={(e) => setForm({ ...form, recommendationNote: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("recommendedDate")}</span>
            <input
              className="field"
              type="date"
              aria-label={t("recommendedDate")}
              data-voice-label={t("recommendedDate")}
              value={form.recommendedDate}
              onChange={(e) => setForm({ ...form, recommendedDate: e.target.value })}
            />
          </label>
        </div>
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
      </SectionCard>

      <div className="space-y-6">
        <SectionCard title={t("suggestedReferrals")}>
          {loading ? <LoadingSkeleton lines={4} /> : null}
          {!loading && !suggestions.length ? (
            <EmptyStateCard
              title={t("noReferralSuggestions")}
              body={translateDisplayText(language, "Suggestions will appear when continuity signals indicate a referral.")}
            />
          ) : null}
          <div className="space-y-4">
            {suggestions.map((item) => (
              <div key={`${item.patientId}-${item.specialty}`} className="rounded-2xl bg-mist p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{item.patientName}</p>
                    <p className="text-sm text-slate-500">{translateDisplayText(language, item.specialty)}</p>
                  </div>
                  <Badge value={item.urgency} />
                </div>
                <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.rationale} />
                <LocalizedText as="p" className="mt-2 text-sm font-semibold text-clinic" value={item.recommendedFacility} />
                <button
                  className="btn-secondary mt-4"
                  type="button"
                  aria-label={t("useSuggestion")}
                  data-voice-label={t("useSuggestion")}
                  onClick={() => setForm({
                    ...form,
                    doctorId,
                    patientId: String(item.patientId),
                    specialty: item.specialty,
                    targetFacility: item.recommendedFacility,
                    urgency: item.urgency,
                    reason: item.rationale
                  })}
                >
                  {t("useSuggestion")}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("existingReferrals")}>
          {!loading && !referrals.length ? (
            <EmptyStateCard
              title={t("noReferrals")}
              body={translateDisplayText(language, "Created referrals will appear here for tracking.")}
            />
          ) : null}
          <div className="space-y-4">
            {referrals.map((item) => (
              <div key={item.id} className="rounded-2xl bg-mist p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{item.patientName}</p>
                    <p className="text-sm text-slate-500">{translateDisplayText(language, item.specialty)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge value={item.urgency} />
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{translateDisplayText(language, item.status)}</span>
                  </div>
                </div>
                <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.reason} />
                {item.recommendationNote ? <LocalizedText as="p" className="mt-2 text-sm text-slate-600" value={item.recommendationNote} /> : null}
                <LocalizedText as="p" className="mt-2 text-sm font-semibold text-clinic" value={item.targetFacility || "-"} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
