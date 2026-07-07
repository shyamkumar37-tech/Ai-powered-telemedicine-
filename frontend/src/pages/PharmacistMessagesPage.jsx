import MessagingWorkspace from "../components/MessagingWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function PharmacistMessagesPage() {
  const { t } = useLanguage();
  return <MessagingWorkspace role="PHARMACIST" title={t("careMessages")} />;
}
