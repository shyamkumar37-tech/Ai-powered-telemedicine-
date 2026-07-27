import { useEffect, useMemo, useState } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { fetchSystemStatus } from "../services/telecareService";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

const COPY_BASE = {
  title: "System status",
  subtitle: "Health overview for core services and optional channels.",
  loading: "Checking system status...",
  unavailable: "Unable to load system readiness right now.",
  database: "Database",
  ai: "AI guidance",
  otp: "OTP",
  sms: "SMS",
  email: "Email",
  whatsapp: "WhatsApp",
  push: "Push",
  available: "Available",
  unavailableLabel: "Unavailable",
  connected: "Connected",
  disconnected: "Disconnected"
};

const COPY_TRANSLATIONS = {};
/*
  hi: {
    title: "सिस्टम स्थिति",
    subtitle: "डेटाबेस, एआई, OTP और संचार चैनलों की लाइव स्थिति। स्टेटस दिखाते हैं कि कोई निर्भरता लाइव, सीमित, डेमो या निष्क्रिय है।",
    loading: "सिस्टम स्थिति जाँची जा रही है...",
    unavailable: "अभी सिस्टम स्थिति लोड नहीं की जा सकी।",
    warnings: "मौजूदा चेतावनियाँ",
    database: "डेटाबेस",
    ai: "एआई मार्गदर्शन",
    otp: "OTP",
    sms: "SMS",
    email: "ईमेल",
    whatsapp: "व्हाट्सऐप",
    push: "पुश",
    live: "लाइव",
    limited: "सीमित",
    demo: "डेमो",
    disabled: "निष्क्रिय",
    connected: "कनेक्टेड",
    disconnected: "डिस्कनेक्टेड",
    configured: "कॉन्फ़िगर किया गया",
    notConfigured: "कॉन्फ़िगर नहीं"
  },
  ml: {
    title: "സിസ്റ്റം തയ്യാറെടുപ്പ്",
    subtitle: "ഡാറ്റാബേസ്, AI, OTP, ആശയവിനിമയ ചാനലുകളുടെ തത്സമയ ദൃശ്യമാനം. ആശ്രയം ലൈവ്, പരിധിയുള്ളത്, ഡെമോ, അല്ലെങ്കിൽ പ്രവർത്തനരഹിതം ആണോ എന്ന് നിലകൾ കാണിക്കും.",
    loading: "സിസ്റ്റം തയ്യാറെടുപ്പ് പരിശോധിക്കുന്നു...",
    unavailable: "ഇപ്പോൾ സിസ്റ്റം തയ്യാറെടുപ്പ് ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.",
    warnings: "നിലവിലെ മുന്നറിയിപ്പുകൾ",
    database: "ഡാറ്റാബേസ്",
    ai: "AI മാർഗനിർദേശം",
    otp: "OTP",
    sms: "SMS",
    email: "ഇമെയിൽ",
    whatsapp: "വാട്ട്സ്ആപ്പ്",
    push: "പുഷ്",
    live: "ലൈവ്",
    limited: "പരിമിതം",
    demo: "ഡെമോ",
    disabled: "പ്രവർത്തനരഹിതം",
    connected: "ബന്ധിപ്പിച്ചു",
    disconnected: "ബന്ധമില്ല",
    configured: "ക്രമീകരിച്ചു",
    notConfigured: "ക്രമീകരിച്ചിട്ടില്ല"
  },
  te: {
    title: "సిస్టమ్ సిద్ధత",
    subtitle: "డేటాబేస్, AI, OTP మరియు కమ్యూనికేషన్ ఛానళ్లపై ప్రత్యక్ష దృశ్యం. ఒక ఆధార వ్యవస్థ లైవ్, పరిమిత, డెమో లేదా నిలిపివేయబడిందో స్థితులు చూపిస్తాయి.",
    loading: "సిస్టమ్ సిద్ధత తనిఖీ జరుగుతోంది...",
    unavailable: "ఇప్పుడు సిస్టమ్ సిద్ధతను లోడ్ చేయలేకపోయాం.",
    warnings: "ప్రస్తుత హెచ్చరికలు",
    database: "డేటాబేస్",
    ai: "AI మార్గదర్శకం",
    otp: "OTP",
    sms: "SMS",
    email: "ఇమెయిల్",
    whatsapp: "వాట్సాప్",
    push: "పుష్",
    live: "లైవ్",
    limited: "పరిమితం",
    demo: "డెమో",
    disabled: "నిలిపివేయబడింది",
    connected: "కనెక్ట్ అయింది",
    disconnected: "డిస్కనెక్ట్ అయింది",
    configured: "కాన్ఫిగర్ చేయబడింది",
    notConfigured: "కాన్ఫిగర్ చేయలేదు"
  },
  pa: {
    title: "ਸਿਸਟਮ ਤਿਆਰੀ",
    subtitle: "ਡੇਟਾਬੇਸ, AI, OTP ਅਤੇ ਸੰਚਾਰ ਚੈਨਲਾਂ ਦੀ ਲਾਈਵ ਦ੍ਰਿਸ਼ਟਤਾ। ਸਥਿਤੀਆਂ ਦੱਸਦੀਆਂ ਹਨ ਕਿ ਕੋਈ ਨਿਰਭਰਤਾ ਲਾਈਵ, ਸੀਮਿਤ, ਡੈਮੋ ਜਾਂ ਅਸਮਰੱਥ ਹੈ।",
    loading: "ਸਿਸਟਮ ਤਿਆਰੀ ਜਾਂਚੀ ਜਾ ਰਹੀ ਹੈ...",
    unavailable: "ਇਸ ਵੇਲੇ ਸਿਸਟਮ ਤਿਆਰੀ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ।",
    warnings: "ਮੌਜੂਦਾ ਚੇਤਾਵਨੀਆਂ",
    database: "ਡੇਟਾਬੇਸ",
    ai: "AI ਮਾਰਗਦਰਸ਼ਨ",
    otp: "OTP",
    sms: "SMS",
    email: "ਈਮੇਲ",
    whatsapp: "ਵਾਟਸਐਪ",
    push: "ਪੁਸ਼",
    live: "ਲਾਈਵ",
    limited: "ਸੀਮਿਤ",
    demo: "ਡੈਮੋ",
    disabled: "ਅਸਮਰੱਥ",
    connected: "ਜੁੜਿਆ",
    disconnected: "ਜੁੜਿਆ ਨਹੀਂ",
    configured: "ਕੰਫਿਗਰ ਕੀਤਾ",
    notConfigured: "ਕੰਫਿਗਰ ਨਹੀਂ"
  },
  ta: {
    title: "அமைப்பு தயார்நிலை",
    subtitle: "தரவுத்தளம், AI, OTP மற்றும் தொடர்பு சேனல்களின் நேரடி நிலை. ஒரு சார்பு அம்சம் செயல்பாட்டில் உள்ளதா, வரையறுக்கப்பட்டதா, டெமோவா அல்லது முடக்கப்பட்டதா என்பதை நிலைகள் காட்டும்.",
    loading: "அமைப்பு தயார்நிலை சரிபார்க்கப்படுகிறது...",
    unavailable: "இப்போது அமைப்பு தயார்நிலையை ஏற்ற முடியவில்லை.",
    warnings: "தற்போதைய எச்சரிக்கைகள்",
    database: "தரவுத்தளம்",
    ai: "AI வழிகாட்டல்",
    otp: "OTP",
    sms: "SMS",
    email: "மின்னஞ்சல்",
    whatsapp: "வாட்ஸ்அப்",
    push: "புஷ்",
    live: "நேரலை",
    limited: "வரையறுக்கப்பட்டது",
    demo: "டெமோ",
    disabled: "முடக்கப்பட்டது",
    connected: "இணைக்கப்பட்டது",
    disconnected: "இணைக்கப்படவில்லை",
    configured: "கட்டமைக்கப்பட்டது",
    notConfigured: "கட்டமைக்கப்படவில்லை"
  }
*/

const WARNING_TRANSLATIONS = {};
/*
  hi: {
    "OTP is still running in demo mode.": "OTP अभी भी डेमो मोड में चल रहा है।",
    "SMS alerts are not live yet.": "SMS अलर्ट अभी लाइव नहीं हैं।",
    "Email alerts are not live yet.": "ईमेल अलर्ट अभी लाइव नहीं हैं।",
    "WhatsApp alerts are not live yet.": "व्हाट्सऐप अलर्ट अभी लाइव नहीं हैं।",
    "Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.": "विक्रेता सिंक कॉन्फ़िगर न होने तक लैब और वेयरेबल अपलोड अभी मैनुअल कैप्चर पर निर्भर हैं।",
    "Hospital EHR, payment, and insurance integrations are not connected in this environment.": "इस वातावरण में अस्पताल EHR, भुगतान और बीमा इंटीग्रेशन जुड़े नहीं हैं।",
    "Database connectivity is still using a local development endpoint.": "डेटाबेस कनेक्टिविटी अभी भी स्थानीय विकास एंडपॉइंट का उपयोग कर रही है।",
    "JWT signing secret is still using the default development value and must be replaced for production.": "JWT साइनिंग सीक्रेट अभी भी डिफ़ॉल्ट डेवलपमेंट मान का उपयोग कर रहा है और प्रोडक्शन के लिए बदलना होगा।"
  },
  ml: {
    "OTP is still running in demo mode.": "OTP ഇപ്പോഴും ഡെമോ മോഡിലാണ് പ്രവർത്തിക്കുന്നത്.",
    "SMS alerts are not live yet.": "SMS അലർട്ടുകൾ ഇനിയും ലൈവായിട്ടില്ല.",
    "Email alerts are not live yet.": "ഇമെയിൽ അലർട്ടുകൾ ഇനിയും ലൈവായിട്ടില്ല.",
    "WhatsApp alerts are not live yet.": "വാട്ട്സ്ആപ്പ് അലർട്ടുകൾ ഇനിയും ലൈവായിട്ടില്ല.",
    "Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.": "വെൻഡർ സിങ്ക് ക്രമീകരിച്ചിട്ടില്ലെങ്കിൽ ലാബ്, വെയറബിൾ അപ്ലോഡുകൾ ഇപ്പോൾ മാനുവൽ ക്യാപ്ചറിനെ ആശ്രയിക്കുന്നു.",
    "Hospital EHR, payment, and insurance integrations are not connected in this environment.": "ഈ പരിതസ്ഥിതിയിൽ ആശുപത്രി EHR, പേയ്മെന്റ്, ഇൻഷുറൻസ് ഇന്റഗ്രേഷനുകൾ ബന്ധിപ്പിച്ചിട്ടില്ല.",
    "Database connectivity is still using a local development endpoint.": "ഡാറ്റാബേസ് കണക്റ്റിവിറ്റി ഇപ്പോഴും ഒരു പ്രാദേശിക വികസന എൻഡ്‌പോയിന്റ് ഉപയോഗിക്കുന്നു.",
    "JWT signing secret is still using the default development value and must be replaced for production.": "JWT സൈനിംഗ് രഹസ്യം ഇപ്പോഴും ഡിഫോൾട്ട് വികസന മൂല്യം ഉപയോഗിക്കുന്നു; പ്രൊഡക്ഷനിൽ അത് മാറ്റണം."
  },
  te: {
    "OTP is still running in demo mode.": "OTP ఇంకా డెమో మోడ్‌లోనే నడుస్తోంది.",
    "SMS alerts are not live yet.": "SMS అలర్ట్‌లు ఇంకా లైవ్‌లో లేవు.",
    "Email alerts are not live yet.": "ఇమెయిల్ అలర్ట్‌లు ఇంకా లైవ్‌లో లేవు.",
    "WhatsApp alerts are not live yet.": "వాట్సాప్ అలర్ట్‌లు ఇంకా లైవ్‌లో లేవు.",
    "Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.": "వెండర్ సింక్ ఏర్పాటు చేయకపోతే ల్యాబ్ మరియు వేర్‌బుల్ అప్‌లోడ్లు ప్రస్తుతం మాన్యువల్ క్యాప్చర్‌పై ఆధారపడుతున్నాయి.",
    "Hospital EHR, payment, and insurance integrations are not connected in this environment.": "ఈ వాతావరణంలో ఆసుపత్రి EHR, చెల్లింపు, బీమా ఇంటిగ్రేషన్లు కనెక్ట్ కాలేదు.",
    "Database connectivity is still using a local development endpoint.": "డేటాబేస్ కనెక్టివిటీ ఇంకా స్థానిక అభివృద్ధి ఎండ్‌పాయింట్‌ను ఉపయోగిస్తోంది.",
    "JWT signing secret is still using the default development value and must be replaced for production.": "JWT సైనింగ్ సీక్రెట్ ఇప్పటికీ డిఫాల్ట్ అభివృద్ధి విలువనే ఉపయోగిస్తోంది; ప్రొడక్షన్ కోసం దాన్ని మార్చాలి."
  },
  pa: {
    "OTP is still running in demo mode.": "OTP ਅਜੇ ਵੀ ਡੈਮੋ ਮੋਡ ਵਿੱਚ ਚੱਲ ਰਿਹਾ ਹੈ।",
    "SMS alerts are not live yet.": "SMS ਅਲਰਟ ਅਜੇ ਲਾਈਵ ਨਹੀਂ ਹਨ।",
    "Email alerts are not live yet.": "ਈਮੇਲ ਅਲਰਟ ਅਜੇ ਲਾਈਵ ਨਹੀਂ ਹਨ।",
    "WhatsApp alerts are not live yet.": "ਵਾਟਸਐਪ ਅਲਰਟ ਅਜੇ ਲਾਈਵ ਨਹੀਂ ਹਨ।",
    "Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.": "ਜੇ ਵੇਂਡਰ ਸਿੰਕ ਕਨਫਿਗਰ ਨਾ ਹੋਵੇ ਤਾਂ ਲੈਬ ਅਤੇ ਵੇਅਰੇਬਲ ਅਪਲੋਡ ਇਸ ਵੇਲੇ ਮੈਨੂਅਲ ਕੈਪਚਰ 'ਤੇ ਨਿਰਭਰ ਹਨ।",
    "Hospital EHR, payment, and insurance integrations are not connected in this environment.": "ਇਸ ਮਾਹੌਲ ਵਿੱਚ ਹਸਪਤਾਲ EHR, ਭੁਗਤਾਨ ਅਤੇ ਬੀਮਾ ਇੰਟੀਗ੍ਰੇਸ਼ਨ ਜੁੜੇ ਨਹੀਂ ਹਨ।",
    "Database connectivity is still using a local development endpoint.": "ਡੇਟਾਬੇਸ ਕਨੈਕਟਿਵਿਟੀ ਅਜੇ ਵੀ ਸਥਾਨਕ ਵਿਕਾਸ ਐਂਡਪੋਇੰਟ ਵਰਤ ਰਹੀ ਹੈ।",
    "JWT signing secret is still using the default development value and must be replaced for production.": "JWT ਸਾਈਨਿੰਗ ਰਾਜ ਅਜੇ ਵੀ ਡਿਫਾਲਟ ਵਿਕਾਸ ਮੁੱਲ ਵਰਤ ਰਿਹਾ ਹੈ ਅਤੇ ਪ੍ਰੋਡਕਸ਼ਨ ਲਈ ਇਸਨੂੰ ਬਦਲਣਾ ਲਾਜ਼ਮੀ ਹੈ।"
  },
  ta: {
    "OTP is still running in demo mode.": "OTP இன்னும் டெமோ முறையில் இயங்குகிறது.",
    "SMS alerts are not live yet.": "SMS எச்சரிக்கைகள் இன்னும் நேரலையில் இல்லை.",
    "Email alerts are not live yet.": "மின்னஞ்சல் எச்சரிக்கைகள் இன்னும் நேரலையில் இல்லை.",
    "WhatsApp alerts are not live yet.": "வாட்ஸ்அப் எச்சரிக்கைகள் இன்னும் நேரலையில் இல்லை.",
    "Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.": "வெண்டர் ஒத்திசைவு அமைக்கப்படாவிட்டால் ஆய்வக மற்றும் அணியக்கூடிய சாதன பதிவேற்றங்கள் தற்போது கைமுறை பதிவைப் பொறுத்தே உள்ளன.",
    "Hospital EHR, payment, and insurance integrations are not connected in this environment.": "இந்த சூழலில் மருத்துவமனை EHR, பணம் மற்றும் காப்பீட்டு ஒருங்கிணைப்புகள் இணைக்கப்படவில்லை.",
    "Database connectivity is still using a local development endpoint.": "தரவுத்தள இணைப்பு இன்னும் உள்ளூர் மேம்பாட்டு முனையத்தைப் பயன்படுத்துகிறது.",
    "JWT signing secret is still using the default development value and must be replaced for production.": "JWT கையொப்ப ரகசியம் இன்னும் இயல்புநிலை மேம்பாட்டு மதிப்பையே பயன்படுத்துகிறது; தயாரிப்பு சூழலுக்காக அது மாற்றப்பட வேண்டும்."
  }
*/

function summarizeAvailability(value: string | number, text: DynamicStateObject) {
  // @ts-expect-error - Auto-suppressed during migration
  const available = value === true || value === "AVAILABLE";
  return available
    ? { label: text.available, tone: "emerald" }
    : { label: text.unavailableLabel, tone: "rose" };
}

function toneClass(tone: DynamicStateObject) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700";
    case "amber":
      return "bg-amber-50 text-amber-700";
    case "sky":
      return "bg-sky-50 text-sky-700";
    case "rose":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function translateWarning(language: DynamicStateObject, warning: DynamicStateObject, translateUiText: DynamicStateObject) {
  return translateUiText(warning);
}

export interface ReadinessPillProps {
  label?: DynamicState;
  state?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function ReadinessPill({ label, state }: ReadinessPillProps) {
  return (
    <div className="rounded-2xl bg-mist px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass(state.tone)}`}>{state.label}</p>
    </div>
  );
}

export interface SystemReadinessCardProps {
  compact?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SystemReadinessCard({ compact = false }: SystemReadinessCardProps) {
  const { t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const text = useMemo(() => ({
    title: t?.("systemStatusTitle") ?? COPY_BASE.title,
    subtitle: t?.("systemStatusSubtitle") ?? COPY_BASE.subtitle,
    loading: t?.("systemStatusLoading") ?? COPY_BASE.loading,
    unavailable: t?.("systemStatusUnavailable") ?? COPY_BASE.unavailable,
    database: t?.("systemStatusDatabase") ?? COPY_BASE.database,
    ai: t?.("systemStatusAi") ?? COPY_BASE.ai,
    otp: t?.("systemStatusOtp") ?? COPY_BASE.otp,
    sms: t?.("systemStatusSms") ?? COPY_BASE.sms,
    email: t?.("systemStatusEmail") ?? COPY_BASE.email,
    whatsapp: t?.("systemStatusWhatsapp") ?? COPY_BASE.whatsapp,
    push: t?.("systemStatusPush") ?? COPY_BASE.push,
    available: t?.("systemStatusAvailable") ?? COPY_BASE.available,
    unavailableLabel: t?.("systemStatusUnavailableLabel") ?? COPY_BASE.unavailableLabel,
    connected: t?.("systemStatusConnected") ?? COPY_BASE.connected,
    disconnected: t?.("systemStatusDisconnected") ?? COPY_BASE.disconnected
  }), [t]);
  const [status, setStatus] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    let mounted = true;

    fetchSystemStatus()
      .then((data: DynamicStateObject) => {
        if (!mounted) {
          return;
        }
        setStatus(data);
        setError("");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError(text.unavailable);
      });

    return () => {
      mounted = false;
    };
  }, [text.unavailable]);

  const channelStates = useMemo(() => {
    if (!status) {
      return [];
    }

    return [
      {
        label: text.database,
        state: status.database?.connected
          ? { label: text.connected, tone: "emerald" }
          : { label: text.disconnected, tone: "rose" }
      },
      {
        label: text.ai,
        state: summarizeAvailability(status.services?.ai, text)
      },
      {
        label: text.otp,
        state: summarizeAvailability(status.services?.otp, text)
      },
      { label: text.sms, state: summarizeAvailability(status.optionalServices?.sms, text) },
      { label: text.email, state: summarizeAvailability(status.optionalServices?.email, text) },
      { label: text.whatsapp, state: summarizeAvailability(status.optionalServices?.whatsapp, text) },
      { label: text.push, state: summarizeAvailability(status.services?.notifications, text) }
    ];
  }, [status, text]);

  return (
    <div className="glass-card p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-clinic">{text.title}</p>
      {!compact ? (
        <p className="mt-3 text-sm text-slate-600">{text.subtitle}</p>
      ) : null}

      {!status && !error ? (
        <p className="mt-4 text-sm text-slate-500" role="status" aria-live="polite">{text.loading}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
      ) : null}

      {status ? (
        <>
          <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {channelStates.map((item: DynamicStateObject) => (
              <ReadinessPill key={item.label} label={item.label} state={item.state} />
            ))}
          </div>

        </>
      ) : null}
    </div>
  );
}
