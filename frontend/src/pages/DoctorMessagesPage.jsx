import MessagingWorkspace from "../components/MessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function DoctorMessagesPage() {
  const { t } = useLanguage();
  return <MessagingWorkspace role="DOCTOR" title={t("patientMessages")} />;
}
