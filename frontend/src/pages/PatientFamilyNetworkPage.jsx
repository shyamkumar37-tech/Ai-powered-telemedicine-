import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientFamilyNetworkPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) {
      setNetwork(null);
      setError(t("unableLoadFamilyNetwork"));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPatientFamilyNetwork(patientId)
      .then((data) => {
        setNetwork(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadFamilyNetwork"))))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="space-y-6">
      <SectionCard title={t("familyCareNetwork")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadFamilyNetwork")}
            body={error}
          />
        ) : null}
        {network ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("patient")}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{network.patientName}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("sharedCaregivers")}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{network.caregivers?.length || 0}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("familyNetworkStatus")}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{network.multiCaregiverSupport ? t("sharedSupport") : t("singleSupport")}</p>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard title={t("sharedCaregivers")}>
          {!loading && !error && !(network?.caregivers?.length) ? (
            <EmptyStateCard
              title={t("noCaregiverNetwork")}
              body={translateDisplayText(language, "Caregivers will appear here once they are linked.")}
            />
          ) : null}
          <div className="space-y-4">
            {(network?.caregivers || []).map((caregiver) => (
              <div key={caregiver.caregiverId} className="rounded-2xl bg-mist p-5">
                <p className="font-semibold text-ink">{caregiver.caregiverName}</p>
                <p className="mt-1 text-sm text-slate-500">{translateDisplayText(language, caregiver.relationshipLabel || t("caregiverCredential"))}</p>
                <p className="mt-2 text-sm text-slate-700">{caregiver.phone}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={t("coordinationSummary")}>
          {network ? (
            <div className="space-y-4">
              <LocalizedText as="div" className="rounded-2xl bg-mist p-5 text-sm text-slate-700" value={network.coordinationNote} />
              <LocalizedText as="div" className="rounded-2xl bg-mist p-5 text-sm text-slate-700" value={network.escalationAdvice} />
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
