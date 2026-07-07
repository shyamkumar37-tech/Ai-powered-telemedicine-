import MessagingWorkspace from "../components/MessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function PatientMessagesPage() {
  const { t } = useLanguage();
  return <MessagingWorkspace role="PATIENT" title={t("careMessages")} />;
}
