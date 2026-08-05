import { DynamicState } from "./../types/DynamicState";
import { useLanguage } from "../context/LanguageContext";
import ChatInterface from "./ChatInterface";
import PremiumSectionCard from "./PremiumSectionCard";

export interface PremiumMessagingWorkspaceProps {
  role?: DynamicState;
  title?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PremiumMessagingWorkspace({ role, title }: PremiumMessagingWorkspaceProps) {
  const { t } = useLanguage();
  return (
    <div className="h-[800px] w-full animate-fadeSlideUp">
      <PremiumSectionCard title={title || t("messages")} className="h-full flex flex-col p-0 overflow-hidden">
         <div className="flex-1 min-h-0 w-full h-full bg-white text-ink">
            <ChatInterface />
         </div>
      </PremiumSectionCard>
    </div>
  );
}
