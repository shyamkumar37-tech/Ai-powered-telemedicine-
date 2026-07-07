import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCaregiverFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Users } from "lucide-react";

export default function CaregiverFamilyNetworkPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchCaregiverFamilyNetwork(caregiverId)
      .then((data) => {
        setNetwork(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadCaregiverFamilyNetwork"))))
      .finally(() => setLoading(false));
  }, [caregiverId]);

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-600" />
          <LocalizedText as="span" value={t("familyCareNetwork")} minLength={4} />
        </span>
      )}
    >
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadCaregiverFamilyNetwork")}
          body={error}
        />
      ) : null}
      {!loading && !error && !(network?.linkedPatients?.length) ? (
        <EmptyStateCard
          title={t("noLinkedFamilies")}
          body={translateDisplayText(language, "Linked families will appear here once patients share access.")}
        />
      ) : null}
      <div className="space-y-4">
        {(network?.linkedPatients || []).map((item) => (
          <div key={item.patientId} className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.patientName}</p>
                <p className="text-sm text-slate-500">{item.sharedSupport ? t("sharedSupport") : t("singleSupport")}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clinic">
                {(Array.isArray(item.caregivers) ? item.caregivers.length : 0)} {t("caregiversLabel")}
              </span>
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.coordinationNote} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(Array.isArray(item.caregivers) ? item.caregivers : []).map((caregiver) => (
                <div key={caregiver.caregiverId} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-ink">{caregiver.caregiverName}</p>
                  <p className="mt-1 text-slate-500">{translateDisplayText(language, caregiver.relationshipLabel || t("caregiverCredential"))}</p>
                  <p className="mt-1">{caregiver.phone}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
