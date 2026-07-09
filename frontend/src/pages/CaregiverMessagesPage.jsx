import PremiumMessagingWorkspace from "../components/PremiumMessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function CaregiverMessagesPage() {
  const { t } = useLanguage();
  return (
    <div className="tcd-animate-in">
      <PremiumMessagingWorkspace role="CAREGIVER" title={t("caregiverMessages")} />
    </div>
  );
}
