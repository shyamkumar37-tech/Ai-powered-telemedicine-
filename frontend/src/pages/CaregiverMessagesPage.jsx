import MessagingWorkspace from "../components/MessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function CaregiverMessagesPage() {
  const { t } = useLanguage();
  return <MessagingWorkspace role="CAREGIVER" title={t("caregiverMessages")} />;
}
