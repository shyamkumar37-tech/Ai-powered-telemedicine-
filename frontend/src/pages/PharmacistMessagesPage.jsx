import PremiumMessagingWorkspace from "../components/PremiumMessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function PharmacistMessagesPage() {
  const { t } = useLanguage();
  return <PremiumMessagingWorkspace role="PHARMACIST" title={t("careMessages")} />;
}
