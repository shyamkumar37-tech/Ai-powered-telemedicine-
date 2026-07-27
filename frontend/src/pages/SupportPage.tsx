import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MessageSquare, LifeBuoy, FileText, Lock, Clock } from "lucide-react";

const PremiumBackground = () => (
  <div className="absolute inset-0 pointer-events-none z-0 select-none bg-[#0B1121]">
    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
    <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
    <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
  </div>
);

export interface SupportCardProps {
  Icon?: DynamicState;
  title?: DynamicState;
  description?: DynamicState;
  actionText?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const SupportCard = ({ icon: Icon, title, description, actionText }: SupportCardProps) => (
  <div className="premium-card rounded-3xl p-8 flex flex-col gap-5 group cursor-pointer">
    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:text-cyan-400 group-hover:bg-white/10 transition-all duration-300">
      <Icon size={28} strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.5))' }} />
    </div>
    <div>
      <h3 className="text-xl font-bold text-white mb-2 tc-card__title">{title}</h3>
      <p className="text-slate-300 font-medium leading-relaxed">{description}</p>
    </div>
    <div className="mt-auto pt-4 border-t border-white/5">
      <div className="text-cyan-400 font-bold flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
        {actionText} <ArrowLeft size={16} strokeWidth={3} className="rotate-180" />
      </div>
    </div>
  </div>
);

export default function SupportPage() {
  const { translateUiText = (value: string | number) => value, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const supportTopic = (() => {
    try {
      return new URLSearchParams(location.search || "").get("topic") || "";
    } catch {
      return "";
    }
  })();

  return (
    <div className="min-h-screen relative flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[#0B1121]">
      <PremiumBackground />

      <div className="max-w-[1200px] w-full relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="relative group cursor-default">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400/20 to-blue-500/20 p-[1px] shadow-lg transition-transform duration-500 group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center border border-white/10">
                   <LifeBuoy size={36} className="text-teal-400" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.6))' }} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.2em] text-teal-400 uppercase mb-2 tc-page-eyebrow">
                {(t("teleCareHelpCenter") || "TeleCare+ Help Center")}
              </p>
              <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight tc-page-title">
                {(t("howCanWeHelp") || "How can we help?")}
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-sm backdrop-blur-md"
          >
            <ArrowLeft size={20} strokeWidth={2.5} /> {(t("goBack") || "Go Back")}
          </button>
        </motion.div>

        {/* Dynamic Context Banner */}
        {supportTopic === "password-reset" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mb-10"
          >
            <div className="p-6 rounded-3xl bg-teal-500/10 border border-teal-500/20 shadow-sm flex items-start gap-4 backdrop-blur-md">
              <Lock size={28} strokeWidth={2.5} className="shrink-0 mt-0.5 text-teal-400" /> 
              <div>
                <h3 className="text-lg font-bold text-teal-100 mb-1">{(t("passwordResetAssistance") || "Password Reset Assistance")}</h3>
                <p className="text-teal-200/80 font-medium leading-relaxed">
                  {(t("ifYouRequestedAPasswordResetButDidnTReceiveTheEmailPleaseCheckYourSpamFolderIfYouStillCanTAccessYourAccountOurSecureRecoveryTeamCanManuallyVerifyYourIdentity") || "If you requested a password reset but didn't receive the email, please check your spam folder. If you still can't access your account, our secure recovery team can manually verify your identity.")}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <SupportCard 
            icon={Phone} 
            title={(t("callSupport") || "Call Support")} 
            description={(t("speakDirectlyWithOurTechnicalSupportTeamAvailable247ForUrgentAccessIssues") || "Speak directly with our technical support team. Available 24/7 for urgent access issues.")}
            actionText="+1 (800) 555-0199" 
          />
          <SupportCard 
            icon={Mail} 
            title={(t("emailAssistance") || "Email Assistance")} 
            description={(t("sendUsADetailedMessageWeTypicallyRespondToAllTechnicalInquiriesWithin2Hours") || "Send us a detailed message. We typically respond to all technical inquiries within 2 hours.")}
            actionText="support@telecareplus.app" 
          />
          <SupportCard 
            icon={MessageSquare} 
            title={(t("liveChat") || "Live Chat")} 
            description={(t("chatWithOurAutomatedAssistantOrGetRoutedToALiveAgentForQuickTroubleshooting") || "Chat with our automated assistant or get routed to a live agent for quick troubleshooting.")}
            actionText={(t("startChat") || "Start Chat")} 
          />
          <SupportCard 
            icon={FileText} 
            title={(t("userGuides") || "User Guides")} 
            description={(t("browseOurExtensiveLibraryOfArticlesTutorialsAndVideosToLearnHowToUseThePlatform") || "Browse our extensive library of articles, tutorials, and videos to learn how to use the platform.")}
            actionText={(t("browseArticles") || "Browse Articles")} 
          />
          <SupportCard 
            icon={Lock} 
            title={(t("accountSecurity") || "Account & Security")} 
            description={(t("manageTwoFactorAuthenticationTrustedDevicesAndReviewRecentLoginActivity") || "Manage two-factor authentication, trusted devices, and review recent login activity.")}
            actionText={(t("viewSecurity") || "View Security")} 
          />
          <SupportCard 
            icon={Clock} 
            title={(t("systemStatus") || "System Status")} 
            description={(t("checkIfAnyTeleCareSystemsOrPartnerIntegrationsAreCurrentlyExperiencingDowntime") || "Check if any TeleCare+ systems or partner integrations are currently experiencing downtime.")}
            actionText={(t("allSystemsOperational") || "All Systems Operational")} 
          />
        </motion.div>

      </div>
    </div>
  );
}
