package com.telecareplus.service.impl;

import com.telecareplus.ai.ml.HfInferenceClient;
import com.telecareplus.dto.TranslationDtos;
import com.telecareplus.service.GenerativeAiService;
import com.telecareplus.service.TranslationService;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TranslationServiceImpl implements TranslationService {

    private final GenerativeAiService generativeAiService;
    private final HfInferenceClient hfInferenceClient;
    private static final Map<String, Map<String, String>> LOCAL_EXACT_TRANSLATIONS = Map.of(
            "hi", Map.ofEntries(
                    Map.entry("Dashboard", "डैशबोर्ड"),
                    Map.entry("Profile", "प्रोफ़ाइल"),
                    Map.entry("Triage", "ट्रायेज"),
                    Map.entry("Book", "बुक"),
                    Map.entry("Appointments", "अपॉइंटमेंट"),
                    Map.entry("Prescriptions", "प्रिस्क्रिप्शन"),
                    Map.entry("Reminders", "रिमाइंडर"),
                    Map.entry("Health", "स्वास्थ्य"),
                    Map.entry("Messages", "संदेश"),
                    Map.entry("AI Chatbot", "एआई चैटबॉट"),
                    Map.entry("IVR Booking", "आईवीआर बुकिंग"),
                    Map.entry("Future Care", "भविष्य देखभाल"),
                    Map.entry("Observations", "अवलोकन"),
                    Map.entry("Family Network", "परिवार नेटवर्क"),
                    Map.entry("Voice Assist", "वॉइस असिस्ट"),
                    Map.entry("Timeline", "टाइमलाइन"),
                    Map.entry("Language", "भाषा"),
                    Map.entry("Logout", "लॉगआउट"),
                    Map.entry("Total appointments", "कुल अपॉइंटमेंट"),
                    Map.entry("Pending reminders", "लंबित रिमाइंडर"),
                    Map.entry("Adherence %", "अनुपालन %"),
                    Map.entry("Follow-up due", "फॉलो-अप देय"),
                    Map.entry("All teleconsult and follow-up history", "सभी टेली-परामर्श और फॉलो-अप इतिहास"),
                    Map.entry("Medication tasks still open", "दवा संबंधी कार्य अभी खुले हैं"),
                    Map.entry("Upcoming continuity care items", "आगामी निरंतर देखभाल कार्य"),
                    Map.entry("Continuity snapshot", "निरंतरता सारांश"),
                    Map.entry("Most recent triage category", "सबसे हाल की ट्रायज श्रेणी"),
                    Map.entry("Prescription history", "प्रिस्क्रिप्शन इतिहास"),
                    Map.entry("Risk profile", "जोखिम प्रोफ़ाइल"),
                    Map.entry("Active care plans", "सक्रिय केयर प्लान"),
                    Map.entry("Accessibility", "सुगम्यता"),
                    Map.entry("Accessibility tools", "सुगम्यता उपकरण"),
                    Map.entry("Screen reader", "स्क्रीन रीडर"),
                    Map.entry("Large text", "बड़ा अक्षर"),
                    Map.entry("High contrast", "उच्च कॉन्ट्रास्ट"),
                    Map.entry("Read page", "पेज पढ़ें"),
                    Map.entry("Stop", "रोकें"),
                    Map.entry("Voice commands", "वॉइस कमांड")
            ),
            "ml", Map.ofEntries(
                    Map.entry("Dashboard", "ഡാഷ്ബോർഡ്"),
                    Map.entry("Profile", "പ്രൊഫൈൽ"),
                    Map.entry("Triage", "ട്രയാജ്"),
                    Map.entry("Book", "ബുക്ക്"),
                    Map.entry("Appointments", "അപ്പോയിന്റ്മെന്റുകൾ"),
                    Map.entry("Prescriptions", "പ്രിസ്ക്രിപ്ഷനുകൾ"),
                    Map.entry("Reminders", "റിമൈൻഡറുകൾ"),
                    Map.entry("Health", "ആരോഗ്യം"),
                    Map.entry("Messages", "സന്ദേശങ്ങൾ"),
                    Map.entry("AI Chatbot", "എഐ ചാറ്റ്ബോട്ട്"),
                    Map.entry("IVR Booking", "ഐവിആർ ബുക്കിംഗ്"),
                    Map.entry("Future Care", "ഭാവി പരിചരണം"),
                    Map.entry("Observations", "നിരീക്ഷണങ്ങൾ"),
                    Map.entry("Family Network", "കുടുംബ ശൃംഖല"),
                    Map.entry("Voice Assist", "ശബ്ദ സഹായി"),
                    Map.entry("Timeline", "ടൈംലൈൻ"),
                    Map.entry("Language", "ഭാഷ"),
                    Map.entry("Logout", "ലോഗ്ഔട്ട്"),
                    Map.entry("Total appointments", "ആകെ അപ്പോയിന്റ്മെന്റുകൾ"),
                    Map.entry("Pending reminders", "ബാക്കി റിമൈൻഡറുകൾ"),
                    Map.entry("Adherence %", "അനുസരണ %"),
                    Map.entry("Follow-up due", "ഫോളോ-അപ്പ് ബാക്കി"),
                    Map.entry("All teleconsult and follow-up history", "എല്ലാ ടെലികൺസൾട്ടും ഫോളോ-അപ്പ് ചരിത്രവും"),
                    Map.entry("Medication tasks still open", "മരുന്ന് ജോലികൾ ഇപ്പോഴും തുറന്നിരിക്കുന്നു"),
                    Map.entry("Upcoming continuity care items", "വരാനിരിക്കുന്ന തുടർച്ചാ പരിചരണ പ്രവർത്തികൾ"),
                    Map.entry("Continuity snapshot", "തുടർച്ചാ അവലോകനം"),
                    Map.entry("Most recent triage category", "സമീപകാല ത്രിയേജ് വിഭാഗം"),
                    Map.entry("Prescription history", "മരുന്ന് രേഖ ചരിത്രം"),
                    Map.entry("Risk profile", "അപകട പ്രൊഫൈൽ"),
                    Map.entry("Active care plans", "സജീവ പരിചരണ പദ്ധതികൾ"),
                    Map.entry("Accessibility", "പ്രവേശനസൗകര്യം"),
                    Map.entry("Accessibility tools", "പ്രവേശനസൗകര്യ ഉപകരണങ്ങൾ"),
                    Map.entry("Screen reader", "സ്ക്രീൻ റീഡർ"),
                    Map.entry("Large text", "വലിയ അക്ഷരം"),
                    Map.entry("High contrast", "ഉയർന്ന കോൺട്രാസ്റ്റ്"),
                    Map.entry("Read page", "പേജ് വായിക്കുക"),
                    Map.entry("Stop", "നിർത്തുക"),
                    Map.entry("Voice commands", "ശബ്ദ കമാൻഡുകൾ")
            ),
            "te", Map.ofEntries(
                    Map.entry("Dashboard", "డాష్‌బోర్డ్"),
                    Map.entry("Profile", "ప్రొఫైల్"),
                    Map.entry("Triage", "ట్రయాజ్"),
                    Map.entry("Book", "బుక్"),
                    Map.entry("Appointments", "అపాయింట్‌మెంట్లు"),
                    Map.entry("Prescriptions", "ప్రిస్క్రిప్షన్లు"),
                    Map.entry("Reminders", "రిమైండర్లు"),
                    Map.entry("Health", "ఆరోగ్యం"),
                    Map.entry("Messages", "సందేశాలు"),
                    Map.entry("AI Chatbot", "ఏఐ చాట్‌బాట్"),
                    Map.entry("IVR Booking", "ఐవీఆర్ బుకింగ్"),
                    Map.entry("Future Care", "భవిష్య సంరక్షణ"),
                    Map.entry("Observations", "పరిశీలనలు"),
                    Map.entry("Family Network", "కుటుంబ నెట్‌వర్క్"),
                    Map.entry("Voice Assist", "వాయిస్ అసిస్ట్"),
                    Map.entry("Timeline", "టైమ్‌లైన్"),
                    Map.entry("Language", "భాష"),
                    Map.entry("Logout", "లాగౌట్"),
                    Map.entry("Total appointments", "మొత్తం అపాయింట్‌మెంట్లు"),
                    Map.entry("Pending reminders", "పెండింగ్ రిమైండర్లు"),
                    Map.entry("Adherence %", "అనుసరణ %"),
                    Map.entry("Follow-up due", "ఫాలో-అప్ బాకీ"),
                    Map.entry("All teleconsult and follow-up history", "అన్ని టెలి సంప్రదింపులు మరియు ఫాలో-అప్ చరిత్ర"),
                    Map.entry("Medication tasks still open", "మందుల పనులు ఇంకా మిగిలి ఉన్నాయి"),
                    Map.entry("Upcoming continuity care items", "రాబోయే కొనసాగింపు సంరక్షణ పనులు"),
                    Map.entry("Continuity snapshot", "కొనసాగింపు సారాంశం"),
                    Map.entry("Most recent triage category", "ఇటీవలి ట్రియాజ్ వర్గం"),
                    Map.entry("Prescription history", "ప్రిస్క్రిప్షన్ చరిత్ర"),
                    Map.entry("Risk profile", "ప్రమాద ప్రొఫైల్"),
                    Map.entry("Active care plans", "సక్రియ సంరక్షణ ప్రణాళికలు"),
                    Map.entry("Accessibility", "ప్రవేశ సౌలభ్యం"),
                    Map.entry("Accessibility tools", "ప్రవేశ సౌలభ్య సాధనాలు"),
                    Map.entry("Screen reader", "స్క్రీన్ రీడర్"),
                    Map.entry("Large text", "పెద్ద అక్షరాలు"),
                    Map.entry("High contrast", "అధిక కాంట్రాస్ట్"),
                    Map.entry("Read page", "పేజీ చదవండి"),
                    Map.entry("Stop", "ఆపు"),
                    Map.entry("Voice commands", "వాయిస్ కమాండ్‌లు")
            ),
            "pa", Map.ofEntries(
                    Map.entry("Dashboard", "ਡੈਸ਼ਬੋਰਡ"),
                    Map.entry("Profile", "ਪ੍ਰੋਫ਼ਾਈਲ"),
                    Map.entry("Triage", "ਟਰਾਇਅਜ"),
                    Map.entry("Book", "ਬੁੱਕ"),
                    Map.entry("Appointments", "ਅਪਾਇੰਟਮੈਂਟਸ"),
                    Map.entry("Prescriptions", "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ"),
                    Map.entry("Reminders", "ਰਿਮਾਈਂਡਰ"),
                    Map.entry("Health", "ਸਿਹਤ"),
                    Map.entry("Messages", "ਸੁਨੇਹੇ"),
                    Map.entry("AI Chatbot", "ਏਆਈ ਚੈਟਬੋਟ"),
                    Map.entry("IVR Booking", "ਆਈਵੀਆਰ ਬੁਕਿੰਗ"),
                    Map.entry("Future Care", "ਭਵਿੱਖੀ ਦੇਖਭਾਲ"),
                    Map.entry("Observations", "ਨਿਰੀਖਣ"),
                    Map.entry("Family Network", "ਪਰਿਵਾਰਕ ਨੈੱਟਵਰਕ"),
                    Map.entry("Voice Assist", "ਆਵਾਜ਼ ਸਹਾਇਕ"),
                    Map.entry("Timeline", "ਟਾਈਮਲਾਈਨ"),
                    Map.entry("Language", "ਭਾਸ਼ਾ"),
                    Map.entry("Logout", "ਲਾਗਆਉਟ"),
                    Map.entry("Total appointments", "ਕੁੱਲ ਅਪਾਇੰਟਮੈਂਟ"),
                    Map.entry("Pending reminders", "ਬਕਾਇਆ ਰਿਮਾਈਂਡਰ"),
                    Map.entry("Adherence %", "ਅਨੁਸਰਣ %"),
                    Map.entry("Follow-up due", "ਫਾਲੋ-ਅੱਪ ਬਕਾਇਆ"),
                    Map.entry("All teleconsult and follow-up history", "ਸਾਰੇ ਟੈਲੀ ਕਨਸਲਟ ਅਤੇ ਫਾਲੋ-ਅੱਪ ਇਤਿਹਾਸ"),
                    Map.entry("Medication tasks still open", "ਦਵਾਈ ਦੇ ਕੰਮ ਅਜੇ ਵੀ ਖੁੱਲ੍ਹੇ ਹਨ"),
                    Map.entry("Upcoming continuity care items", "ਆਉਣ ਵਾਲੇ ਨਿਰੰਤਰ ਦੇਖਭਾਲ ਕੰਮ"),
                    Map.entry("Continuity snapshot", "ਨਿਰੰਤਰਤਾ ਸੰਖੇਪ"),
                    Map.entry("Most recent triage category", "ਸਭ ਤੋਂ ਨਵੀਂ ਟ੍ਰਾਇਅਜ ਸ਼੍ਰੇਣੀ"),
                    Map.entry("Prescription history", "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਇਤਿਹਾਸ"),
                    Map.entry("Risk profile", "ਖਤਰਾ ਪ੍ਰੋਫਾਈਲ"),
                    Map.entry("Active care plans", "ਸਰਗਰਮ ਕੇਅਰ ਪਲਾਨ"),
                    Map.entry("Accessibility", "ਪਹੁੰਚਯੋਗਤਾ"),
                    Map.entry("Accessibility tools", "ਪਹੁੰਚਯੋਗਤਾ ਸਾਧਨ"),
                    Map.entry("Screen reader", "ਸਕ੍ਰੀਨ ਰੀਡਰ"),
                    Map.entry("Large text", "ਵੱਡਾ ਲਿਖਤ"),
                    Map.entry("High contrast", "ਉੱਚ ਕਾਂਟ੍ਰਾਸਟ"),
                    Map.entry("Read page", "ਪੰਨਾ ਪੜ੍ਹੋ"),
                    Map.entry("Stop", "ਰੋਕੋ"),
                    Map.entry("Voice commands", "ਆਵਾਜ਼ ਕਮਾਂਡਾਂ")
            ),
            "ta", Map.ofEntries(
                    Map.entry("Dashboard", "டாஷ்போர்டு"),
                    Map.entry("Profile", "சுயவிவரம்"),
                    Map.entry("Triage", "முன் மதிப்பீடு"),
                    Map.entry("Book", "பதிவு"),
                    Map.entry("Appointments", "நியமனங்கள்"),
                    Map.entry("Prescriptions", "மருந்துச் சீட்டுகள்"),
                    Map.entry("Reminders", "நினைவூட்டல்கள்"),
                    Map.entry("Health", "ஆரோக்கியம்"),
                    Map.entry("Messages", "செய்திகள்"),
                    Map.entry("AI Chatbot", "ஏஐ அரட்டை உதவி"),
                    Map.entry("IVR Booking", "IVR பதிவு"),
                    Map.entry("Future Care", "எதிர்கால பராமரிப்பு"),
                    Map.entry("Observations", "கண்காணிப்புகள்"),
                    Map.entry("Family Network", "குடும்ப வலையமைப்பு"),
                    Map.entry("Voice Assist", "குரல் உதவி"),
                    Map.entry("Timeline", "நேரவரிசை"),
                    Map.entry("Language", "மொழி"),
                    Map.entry("Logout", "வெளியேறு"),
                    Map.entry("Total appointments", "மொத்த நியமனங்கள்"),
                    Map.entry("Pending reminders", "நிலுவையில் உள்ள நினைவூட்டல்கள்"),
                    Map.entry("Adherence %", "பின்பற்றல் %"),
                    Map.entry("Follow-up due", "பின்தொடர் நிலுவை"),
                    Map.entry("All teleconsult and follow-up history", "அனைத்து தொலைஆலோசனை மற்றும் பின்தொடர் வரலாறு"),
                    Map.entry("Medication tasks still open", "மருந்து பணிகள் இன்னும் திறந்துள்ளன"),
                    Map.entry("Upcoming continuity care items", "வரவிருக்கும் தொடர்ச்சி பராமரிப்பு பணிகள்"),
                    Map.entry("Continuity snapshot", "தொடர்ச்சி சுருக்கம்"),
                    Map.entry("Most recent triage category", "அண்மைய முன் மதிப்பீட்டு வகை"),
                    Map.entry("Prescription history", "மருந்துச் சீட்டு வரலாறு"),
                    Map.entry("Risk profile", "ஆபத்து நிலை"),
                    Map.entry("Active care plans", "செயலில் உள்ள பராமரிப்பு திட்டங்கள்"),
                    Map.entry("Accessibility", "அணுகல்"),
                    Map.entry("Accessibility tools", "அணுகல் கருவிகள்"),
                    Map.entry("Screen reader", "திரை வாசிப்பான்"),
                    Map.entry("Large text", "பெரிய எழுத்து"),
                    Map.entry("High contrast", "உயர் மாறுபாடு"),
                    Map.entry("Read page", "பக்கத்தை வாசி"),
                    Map.entry("Stop", "நிறுத்து"),
                    Map.entry("Voice commands", "குரல் கட்டளைகள்")
            )
    );

    @Override
    public TranslationDtos.TranslateResponse translate(TranslationDtos.TranslateRequest request) {
        String text = request == null || request.text() == null ? "" : request.text().trim();
        String sourceLanguage = normalizeLanguage(request == null ? null : request.sourceLanguage(), true);
        String targetLanguage = normalizeLanguage(request == null ? null : request.targetLanguage(), false);

        if (text.isBlank() || targetLanguage.isBlank() || targetLanguage.equals(sourceLanguage)) {
            return new TranslationDtos.TranslateResponse(text, "local", false, sourceLanguage, targetLanguage);
        }

        if (hfInferenceClient.isEnabled()) {
            var hfResult = hfInferenceClient.translate(text, sourceLanguage, targetLanguage);
            if (hfResult.isPresent()) {
                return new TranslationDtos.TranslateResponse(
                        normalizeEncoding(hfResult.get()),
                        "huggingface",
                        true,
                        sourceLanguage,
                        targetLanguage
                );
            }
        }

        return generativeAiService.translateText(text, sourceLanguage, targetLanguage)
                .map((result) -> new TranslationDtos.TranslateResponse(
                        normalizeEncoding(result.text()),
                        result.provider(),
                        true,
                        result.sourceLanguage(),
                        result.targetLanguage()
                ))
                .orElseGet(() -> {
                    String localTranslation = translateLocally(text, targetLanguage);
                    localTranslation = normalizeEncoding(localTranslation);
                    boolean translated = !localTranslation.equals(text);
                    return new TranslationDtos.TranslateResponse(
                            localTranslation,
                            translated ? "local-glossary" : "local",
                            translated,
                            sourceLanguage,
                            targetLanguage
                    );
                });
    }

    private String translateLocally(String text, String targetLanguage) {
        Map<String, String> dictionary = LOCAL_EXACT_TRANSLATIONS.get(targetLanguage);
        if (dictionary == null || text == null || text.isBlank()) {
            return text;
        }

        String translated = dictionary.getOrDefault(text.trim(), text);
        if (looksLikeMojibakeExtended(translated)) {
            return text;
        }
        return translated;
    }

    private boolean looksLikeMojibake(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        return value.contains("Ã")
                || value.contains("Â")
                || value.contains("â")
                || value.contains("�")
                || value.contains("à¤")
                || value.contains("à®")
                || value.contains("à´");
    }

    private String normalizeEncoding(String value) {
        if (!looksLikeMojibakeExtended(value)) {
            return value;
        }

        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
            return value;
        }
    }

    private boolean looksLikeMojibakeExtended(String value) {
        if (looksLikeMojibake(value)) {
            return true;
        }
        if (value == null || value.isBlank()) {
            return false;
        }
        return value.contains("à¤")
                || value.contains("à®")
                || value.contains("à´")
                || value.contains("à°")
                || value.contains("à¨");
    }

    private String normalizeLanguage(String language, boolean allowAuto) {
        if (language == null || language.isBlank()) {
            return allowAuto ? "auto" : "en";
        }

        return switch (language.trim().toLowerCase(Locale.ROOT)) {
            case "auto", "detect" -> allowAuto ? "auto" : "en";
            case "english" -> "en";
            case "hindi" -> "hi";
            case "malayalam" -> "ml";
            case "telugu" -> "te";
            case "punjabi" -> "pa";
            case "tamil" -> "ta";
            default -> language.trim().toLowerCase(Locale.ROOT);
        };
    }
}
