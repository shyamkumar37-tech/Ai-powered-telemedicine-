package com.telecareplus.ai;

import com.telecareplus.pharmacy.Prescription;

import com.telecareplus.common.HfInferenceClient;
import com.telecareplus.ai.TranslationDtos;
import com.telecareplus.ai.GenerativeAiService;
import com.telecareplus.ai.TranslationService;
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
                    Map.entry("Dashboard", "à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡"),
                    Map.entry("Profile", "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²"),
                    Map.entry("Triage", "à¤Ÿà¥à¤°à¤¾à¤¯à¥‡à¤œ"),
                    Map.entry("Book", "à¤¬à¥à¤•"),
                    Map.entry("Appointments", "à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ"),
                    Map.entry("Prescriptions", "à¤ªà¥à¤°à¤¿à¤¸à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤¶à¤¨"),
                    Map.entry("Reminders", "à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤°"),
                    Map.entry("Health", "à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯"),
                    Map.entry("Messages", "à¤¸à¤‚à¤¦à¥‡à¤¶"),
                    Map.entry("AI Chatbot", "à¤à¤†à¤ˆ à¤šà¥ˆà¤Ÿà¤¬à¥‰à¤Ÿ"),
                    Map.entry("IVR Booking", "à¤†à¤ˆà¤µà¥€à¤†à¤° à¤¬à¥à¤•à¤¿à¤‚à¤—"),
                    Map.entry("Future Care", "à¤­à¤µà¤¿à¤·à¥à¤¯ à¤¦à¥‡à¤–à¤­à¤¾à¤²"),
                    Map.entry("Observations", "à¤…à¤µà¤²à¥‹à¤•à¤¨"),
                    Map.entry("Family Network", "à¤ªà¤°à¤¿à¤µà¤¾à¤° à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤•"),
                    Map.entry("Voice Assist", "à¤µà¥‰à¤‡à¤¸ à¤…à¤¸à¤¿à¤¸à¥à¤Ÿ"),
                    Map.entry("Timeline", "à¤Ÿà¤¾à¤‡à¤®à¤²à¤¾à¤‡à¤¨"),
                    Map.entry("Language", "à¤­à¤¾à¤·à¤¾"),
                    Map.entry("Logout", "à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ"),
                    Map.entry("Total appointments", "à¤•à¥à¤² à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ"),
                    Map.entry("Pending reminders", "à¤²à¤‚à¤¬à¤¿à¤¤ à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤°"),
                    Map.entry("Adherence %", "à¤…à¤¨à¥à¤ªà¤¾à¤²à¤¨ %"),
                    Map.entry("Follow-up due", "à¤«à¥‰à¤²à¥‹-à¤…à¤ª à¤¦à¥‡à¤¯"),
                    Map.entry("All teleconsult and follow-up history", "à¤¸à¤­à¥€ à¤Ÿà¥‡à¤²à¥€-à¤ªà¤°à¤¾à¤®à¤°à¥à¤¶ à¤”à¤° à¤«à¥‰à¤²à¥‹-à¤…à¤ª à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸"),
                    Map.entry("Medication tasks still open", "à¤¦à¤µà¤¾ à¤¸à¤‚à¤¬à¤‚à¤§à¥€ à¤•à¤¾à¤°à¥à¤¯ à¤…à¤­à¥€ à¤–à¥à¤²à¥‡ à¤¹à¥ˆà¤‚"),
                    Map.entry("Upcoming continuity care items", "à¤†à¤—à¤¾à¤®à¥€ à¤¨à¤¿à¤°à¤‚à¤¤à¤° à¤¦à¥‡à¤–à¤­à¤¾à¤² à¤•à¤¾à¤°à¥à¤¯"),
                    Map.entry("Continuity snapshot", "à¤¨à¤¿à¤°à¤‚à¤¤à¤°à¤¤à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶"),
                    Map.entry("Most recent triage category", "à¤¸à¤¬à¤¸à¥‡ à¤¹à¤¾à¤² à¤•à¥€ à¤Ÿà¥à¤°à¤¾à¤¯à¤œ à¤¶à¥à¤°à¥‡à¤£à¥€"),
                    Map.entry("Prescription history", "à¤ªà¥à¤°à¤¿à¤¸à¥à¤•à¥à¤°à¤¿à¤ªà¥à¤¶à¤¨ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸"),
                    Map.entry("Risk profile", "à¤œà¥‹à¤–à¤¿à¤® à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²"),
                    Map.entry("Active care plans", "à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¥‡à¤¯à¤° à¤ªà¥à¤²à¤¾à¤¨"),
                    Map.entry("Accessibility", "à¤¸à¥à¤—à¤®à¥à¤¯à¤¤à¤¾"),
                    Map.entry("Accessibility tools", "à¤¸à¥à¤—à¤®à¥à¤¯à¤¤à¤¾ à¤‰à¤ªà¤•à¤°à¤£"),
                    Map.entry("Screen reader", "à¤¸à¥à¤•à¥à¤°à¥€à¤¨ à¤°à¥€à¤¡à¤°"),
                    Map.entry("Large text", "à¤¬à¤¡à¤¼à¤¾ à¤…à¤•à¥à¤·à¤°"),
                    Map.entry("High contrast", "à¤‰à¤šà¥à¤š à¤•à¥‰à¤¨à¥à¤Ÿà¥à¤°à¤¾à¤¸à¥à¤Ÿ"),
                    Map.entry("Read page", "à¤ªà¥‡à¤œ à¤ªà¤¢à¤¼à¥‡à¤‚"),
                    Map.entry("Stop", "à¤°à¥‹à¤•à¥‡à¤‚"),
                    Map.entry("Voice commands", "à¤µà¥‰à¤‡à¤¸ à¤•à¤®à¤¾à¤‚à¤¡")
            ),
            "ml", Map.ofEntries(
                    Map.entry("Dashboard", "à´¡à´¾à´·àµà´¬àµ‹àµ¼à´¡àµ"),
                    Map.entry("Profile", "à´ªàµà´°àµŠà´«àµˆàµ½"),
                    Map.entry("Triage", "à´Ÿàµà´°à´¯à´¾à´œàµ"),
                    Map.entry("Book", "à´¬àµà´•àµà´•àµ"),
                    Map.entry("Appointments", "à´…à´ªàµà´ªàµ‹à´¯à´¿à´¨àµà´±àµà´®àµ†à´¨àµà´±àµà´•àµ¾"),
                    Map.entry("Prescriptions", "à´ªàµà´°à´¿à´¸àµà´•àµà´°à´¿à´ªàµà´·à´¨àµà´•àµ¾"),
                    Map.entry("Reminders", "à´±à´¿à´®àµˆàµ»à´¡à´±àµà´•àµ¾"),
                    Map.entry("Health", "à´†à´°àµ‹à´—àµà´¯à´‚"),
                    Map.entry("Messages", "à´¸à´¨àµà´¦àµ‡à´¶à´™àµà´™àµ¾"),
                    Map.entry("AI Chatbot", "à´Žà´ à´šà´¾à´±àµà´±àµà´¬àµ‹à´Ÿàµà´Ÿàµ"),
                    Map.entry("IVR Booking", "à´à´µà´¿à´†àµ¼ à´¬àµà´•àµà´•à´¿à´‚à´—àµ"),
                    Map.entry("Future Care", "à´­à´¾à´µà´¿ à´ªà´°à´¿à´šà´°à´£à´‚"),
                    Map.entry("Observations", "à´¨à´¿à´°àµ€à´•àµà´·à´£à´™àµà´™àµ¾"),
                    Map.entry("Family Network", "à´•àµà´Ÿàµà´‚à´¬ à´¶àµƒà´‚à´–à´²"),
                    Map.entry("Voice Assist", "à´¶à´¬àµà´¦ à´¸à´¹à´¾à´¯à´¿"),
                    Map.entry("Timeline", "à´Ÿàµˆà´‚à´²àµˆàµ»"),
                    Map.entry("Language", "à´­à´¾à´·"),
                    Map.entry("Logout", "à´²àµ‹à´—àµà´”à´Ÿàµà´Ÿàµ"),
                    Map.entry("Total appointments", "à´†à´•àµ† à´…à´ªàµà´ªàµ‹à´¯à´¿à´¨àµà´±àµà´®àµ†à´¨àµà´±àµà´•àµ¾"),
                    Map.entry("Pending reminders", "à´¬à´¾à´•àµà´•à´¿ à´±à´¿à´®àµˆàµ»à´¡à´±àµà´•àµ¾"),
                    Map.entry("Adherence %", "à´…à´¨àµà´¸à´°à´£ %"),
                    Map.entry("Follow-up due", "à´«àµ‹à´³àµ‹-à´…à´ªàµà´ªàµ à´¬à´¾à´•àµà´•à´¿"),
                    Map.entry("All teleconsult and follow-up history", "à´Žà´²àµà´²à´¾ à´Ÿàµ†à´²à´¿à´•àµºà´¸àµ¾à´Ÿàµà´Ÿàµà´‚ à´«àµ‹à´³àµ‹-à´…à´ªàµà´ªàµ à´šà´°à´¿à´¤àµà´°à´µàµà´‚"),
                    Map.entry("Medication tasks still open", "à´®à´°àµà´¨àµà´¨àµ à´œàµ‹à´²à´¿à´•àµ¾ à´‡à´ªàµà´ªàµ‹à´´àµà´‚ à´¤àµà´±à´¨àµà´¨à´¿à´°à´¿à´•àµà´•àµà´¨àµà´¨àµ"),
                    Map.entry("Upcoming continuity care items", "à´µà´°à´¾à´¨à´¿à´°à´¿à´•àµà´•àµà´¨àµà´¨ à´¤àµà´Ÿàµ¼à´šàµà´šà´¾ à´ªà´°à´¿à´šà´°à´£ à´ªàµà´°à´µàµ¼à´¤àµà´¤à´¿à´•àµ¾"),
                    Map.entry("Continuity snapshot", "à´¤àµà´Ÿàµ¼à´šàµà´šà´¾ à´…à´µà´²àµ‹à´•à´¨à´‚"),
                    Map.entry("Most recent triage category", "à´¸à´®àµ€à´ªà´•à´¾à´² à´¤àµà´°à´¿à´¯àµ‡à´œàµ à´µà´¿à´­à´¾à´—à´‚"),
                    Map.entry("Prescription history", "à´®à´°àµà´¨àµà´¨àµ à´°àµ‡à´– à´šà´°à´¿à´¤àµà´°à´‚"),
                    Map.entry("Risk profile", "à´…à´ªà´•à´Ÿ à´ªàµà´°àµŠà´«àµˆàµ½"),
                    Map.entry("Active care plans", "à´¸à´œàµ€à´µ à´ªà´°à´¿à´šà´°à´£ à´ªà´¦àµà´§à´¤à´¿à´•àµ¾"),
                    Map.entry("Accessibility", "à´ªàµà´°à´µàµ‡à´¶à´¨à´¸àµ—à´•à´°àµà´¯à´‚"),
                    Map.entry("Accessibility tools", "à´ªàµà´°à´µàµ‡à´¶à´¨à´¸àµ—à´•à´°àµà´¯ à´‰à´ªà´•à´°à´£à´™àµà´™àµ¾"),
                    Map.entry("Screen reader", "à´¸àµà´•àµà´°àµ€àµ» à´±àµ€à´¡àµ¼"),
                    Map.entry("Large text", "à´µà´²à´¿à´¯ à´…à´•àµà´·à´°à´‚"),
                    Map.entry("High contrast", "à´‰à´¯àµ¼à´¨àµà´¨ à´•àµ‹àµºà´Ÿàµà´°à´¾à´¸àµà´±àµà´±àµ"),
                    Map.entry("Read page", "à´ªàµ‡à´œàµ à´µà´¾à´¯à´¿à´•àµà´•àµà´•"),
                    Map.entry("Stop", "à´¨à´¿àµ¼à´¤àµà´¤àµà´•"),
                    Map.entry("Voice commands", "à´¶à´¬àµà´¦ à´•à´®à´¾àµ»à´¡àµà´•àµ¾")
            ),
            "te", Map.ofEntries(
                    Map.entry("Dashboard", "à°¡à°¾à°·à±â€Œà°¬à±‹à°°à±à°¡à±"),
                    Map.entry("Profile", "à°ªà±à°°à±Šà°«à±ˆà°²à±"),
                    Map.entry("Triage", "à°Ÿà±à°°à°¯à°¾à°œà±"),
                    Map.entry("Book", "à°¬à±à°•à±"),
                    Map.entry("Appointments", "à°…à°ªà°¾à°¯à°¿à°‚à°Ÿà±â€Œà°®à±†à°‚à°Ÿà±à°²à±"),
                    Map.entry("Prescriptions", "à°ªà±à°°à°¿à°¸à±à°•à±à°°à°¿à°ªà±à°·à°¨à±à°²à±"),
                    Map.entry("Reminders", "à°°à°¿à°®à±ˆà°‚à°¡à°°à±à°²à±"),
                    Map.entry("Health", "à°†à°°à±‹à°—à±à°¯à°‚"),
                    Map.entry("Messages", "à°¸à°‚à°¦à±‡à°¶à°¾à°²à±"),
                    Map.entry("AI Chatbot", "à°à° à°šà°¾à°Ÿà±â€Œà°¬à°¾à°Ÿà±"),
                    Map.entry("IVR Booking", "à°à°µà±€à°†à°°à± à°¬à±à°•à°¿à°‚à°—à±"),
                    Map.entry("Future Care", "à°­à°µà°¿à°·à±à°¯ à°¸à°‚à°°à°•à±à°·à°£"),
                    Map.entry("Observations", "à°ªà°°à°¿à°¶à±€à°²à°¨à°²à±"),
                    Map.entry("Family Network", "à°•à±à°Ÿà±à°‚à°¬ à°¨à±†à°Ÿà±â€Œà°µà°°à±à°•à±"),
                    Map.entry("Voice Assist", "à°µà°¾à°¯à°¿à°¸à± à°…à°¸à°¿à°¸à±à°Ÿà±"),
                    Map.entry("Timeline", "à°Ÿà±ˆà°®à±â€Œà°²à±ˆà°¨à±"),
                    Map.entry("Language", "à°­à°¾à°·"),
                    Map.entry("Logout", "à°²à°¾à°—à±Œà°Ÿà±"),
                    Map.entry("Total appointments", "à°®à±Šà°¤à±à°¤à°‚ à°…à°ªà°¾à°¯à°¿à°‚à°Ÿà±â€Œà°®à±†à°‚à°Ÿà±à°²à±"),
                    Map.entry("Pending reminders", "à°ªà±†à°‚à°¡à°¿à°‚à°—à± à°°à°¿à°®à±ˆà°‚à°¡à°°à±à°²à±"),
                    Map.entry("Adherence %", "à°…à°¨à±à°¸à°°à°£ %"),
                    Map.entry("Follow-up due", "à°«à°¾à°²à±‹-à°…à°ªà± à°¬à°¾à°•à±€"),
                    Map.entry("All teleconsult and follow-up history", "à°…à°¨à±à°¨à°¿ à°Ÿà±†à°²à°¿ à°¸à°‚à°ªà±à°°à°¦à°¿à°‚à°ªà±à°²à± à°®à°°à°¿à°¯à± à°«à°¾à°²à±‹-à°…à°ªà± à°šà°°à°¿à°¤à±à°°"),
                    Map.entry("Medication tasks still open", "à°®à°‚à°¦à±à°² à°ªà°¨à±à°²à± à°‡à°‚à°•à°¾ à°®à°¿à°—à°¿à°²à°¿ à°‰à°¨à±à°¨à°¾à°¯à°¿"),
                    Map.entry("Upcoming continuity care items", "à°°à°¾à°¬à±‹à°¯à±‡ à°•à±Šà°¨à°¸à°¾à°—à°¿à°‚à°ªà± à°¸à°‚à°°à°•à±à°·à°£ à°ªà°¨à±à°²à±"),
                    Map.entry("Continuity snapshot", "à°•à±Šà°¨à°¸à°¾à°—à°¿à°‚à°ªà± à°¸à°¾à°°à°¾à°‚à°¶à°‚"),
                    Map.entry("Most recent triage category", "à°‡à°Ÿà±€à°µà°²à°¿ à°Ÿà±à°°à°¿à°¯à°¾à°œà± à°µà°°à±à°—à°‚"),
                    Map.entry("Prescription history", "à°ªà±à°°à°¿à°¸à±à°•à±à°°à°¿à°ªà±à°·à°¨à± à°šà°°à°¿à°¤à±à°°"),
                    Map.entry("Risk profile", "à°ªà±à°°à°®à°¾à°¦ à°ªà±à°°à±Šà°«à±ˆà°²à±"),
                    Map.entry("Active care plans", "à°¸à°•à±à°°à°¿à°¯ à°¸à°‚à°°à°•à±à°·à°£ à°ªà±à°°à°£à°¾à°³à°¿à°•à°²à±"),
                    Map.entry("Accessibility", "à°ªà±à°°à°µà±‡à°¶ à°¸à±Œà°²à°­à±à°¯à°‚"),
                    Map.entry("Accessibility tools", "à°ªà±à°°à°µà±‡à°¶ à°¸à±Œà°²à°­à±à°¯ à°¸à°¾à°§à°¨à°¾à°²à±"),
                    Map.entry("Screen reader", "à°¸à±à°•à±à°°à±€à°¨à± à°°à±€à°¡à°°à±"),
                    Map.entry("Large text", "à°ªà±†à°¦à±à°¦ à°…à°•à±à°·à°°à°¾à°²à±"),
                    Map.entry("High contrast", "à°…à°§à°¿à°• à°•à°¾à°‚à°Ÿà±à°°à°¾à°¸à±à°Ÿà±"),
                    Map.entry("Read page", "à°ªà±‡à°œà±€ à°šà°¦à°µà°‚à°¡à°¿"),
                    Map.entry("Stop", "à°†à°ªà±"),
                    Map.entry("Voice commands", "à°µà°¾à°¯à°¿à°¸à± à°•à°®à°¾à°‚à°¡à±â€Œà°²à±")
            ),
            "pa", Map.ofEntries(
                    Map.entry("Dashboard", "à¨¡à©ˆà¨¸à¨¼à¨¬à©‹à¨°à¨¡"),
                    Map.entry("Profile", "à¨ªà©à¨°à©‹à¨«à¨¼à¨¾à¨ˆà¨²"),
                    Map.entry("Triage", "à¨Ÿà¨°à¨¾à¨‡à¨…à¨œ"),
                    Map.entry("Book", "à¨¬à©à©±à¨•"),
                    Map.entry("Appointments", "à¨…à¨ªà¨¾à¨‡à©°à¨Ÿà¨®à©ˆà¨‚à¨Ÿà¨¸"),
                    Map.entry("Prescriptions", "à¨ªà©à¨°à¨¿à¨¸à¨•à©à¨°à¨¿à¨ªà¨¸à¨¼à¨¨"),
                    Map.entry("Reminders", "à¨°à¨¿à¨®à¨¾à¨ˆà¨‚à¨¡à¨°"),
                    Map.entry("Health", "à¨¸à¨¿à¨¹à¨¤"),
                    Map.entry("Messages", "à¨¸à©à¨¨à©‡à¨¹à©‡"),
                    Map.entry("AI Chatbot", "à¨à¨†à¨ˆ à¨šà©ˆà¨Ÿà¨¬à©‹à¨Ÿ"),
                    Map.entry("IVR Booking", "à¨†à¨ˆà¨µà©€à¨†à¨° à¨¬à©à¨•à¨¿à©°à¨—"),
                    Map.entry("Future Care", "à¨­à¨µà¨¿à©±à¨–à©€ à¨¦à©‡à¨–à¨­à¨¾à¨²"),
                    Map.entry("Observations", "à¨¨à¨¿à¨°à©€à¨–à¨£"),
                    Map.entry("Family Network", "à¨ªà¨°à¨¿à¨µà¨¾à¨°à¨• à¨¨à©ˆà©±à¨Ÿà¨µà¨°à¨•"),
                    Map.entry("Voice Assist", "à¨†à¨µà¨¾à¨œà¨¼ à¨¸à¨¹à¨¾à¨‡à¨•"),
                    Map.entry("Timeline", "à¨Ÿà¨¾à¨ˆà¨®à¨²à¨¾à¨ˆà¨¨"),
                    Map.entry("Language", "à¨­à¨¾à¨¸à¨¼à¨¾"),
                    Map.entry("Logout", "à¨²à¨¾à¨—à¨†à¨‰à¨Ÿ"),
                    Map.entry("Total appointments", "à¨•à©à©±à¨² à¨…à¨ªà¨¾à¨‡à©°à¨Ÿà¨®à©ˆà¨‚à¨Ÿ"),
                    Map.entry("Pending reminders", "à¨¬à¨•à¨¾à¨‡à¨† à¨°à¨¿à¨®à¨¾à¨ˆà¨‚à¨¡à¨°"),
                    Map.entry("Adherence %", "à¨…à¨¨à©à¨¸à¨°à¨£ %"),
                    Map.entry("Follow-up due", "à¨«à¨¾à¨²à©‹-à¨…à©±à¨ª à¨¬à¨•à¨¾à¨‡à¨†"),
                    Map.entry("All teleconsult and follow-up history", "à¨¸à¨¾à¨°à©‡ à¨Ÿà©ˆà¨²à©€ à¨•à¨¨à¨¸à¨²à¨Ÿ à¨…à¨¤à©‡ à¨«à¨¾à¨²à©‹-à¨…à©±à¨ª à¨‡à¨¤à¨¿à¨¹à¨¾à¨¸"),
                    Map.entry("Medication tasks still open", "à¨¦à¨µà¨¾à¨ˆ à¨¦à©‡ à¨•à©°à¨® à¨…à¨œà©‡ à¨µà©€ à¨–à©à©±à¨²à©à¨¹à©‡ à¨¹à¨¨"),
                    Map.entry("Upcoming continuity care items", "à¨†à¨‰à¨£ à¨µà¨¾à¨²à©‡ à¨¨à¨¿à¨°à©°à¨¤à¨° à¨¦à©‡à¨–à¨­à¨¾à¨² à¨•à©°à¨®"),
                    Map.entry("Continuity snapshot", "à¨¨à¨¿à¨°à©°à¨¤à¨°à¨¤à¨¾ à¨¸à©°à¨–à©‡à¨ª"),
                    Map.entry("Most recent triage category", "à¨¸à¨­ à¨¤à©‹à¨‚ à¨¨à¨µà©€à¨‚ à¨Ÿà©à¨°à¨¾à¨‡à¨…à¨œ à¨¸à¨¼à©à¨°à©‡à¨£à©€"),
                    Map.entry("Prescription history", "à¨ªà©à¨°à¨¿à¨¸à¨•à©à¨°à¨¿à¨ªà¨¸à¨¼à¨¨ à¨‡à¨¤à¨¿à¨¹à¨¾à¨¸"),
                    Map.entry("Risk profile", "à¨–à¨¤à¨°à¨¾ à¨ªà©à¨°à©‹à¨«à¨¾à¨ˆà¨²"),
                    Map.entry("Active care plans", "à¨¸à¨°à¨—à¨°à¨® à¨•à©‡à¨…à¨° à¨ªà¨²à¨¾à¨¨"),
                    Map.entry("Accessibility", "à¨ªà¨¹à©à©°à¨šà¨¯à©‹à¨—à¨¤à¨¾"),
                    Map.entry("Accessibility tools", "à¨ªà¨¹à©à©°à¨šà¨¯à©‹à¨—à¨¤à¨¾ à¨¸à¨¾à¨§à¨¨"),
                    Map.entry("Screen reader", "à¨¸à¨•à©à¨°à©€à¨¨ à¨°à©€à¨¡à¨°"),
                    Map.entry("Large text", "à¨µà©±à¨¡à¨¾ à¨²à¨¿à¨–à¨¤"),
                    Map.entry("High contrast", "à¨‰à©±à¨š à¨•à¨¾à¨‚à¨Ÿà©à¨°à¨¾à¨¸à¨Ÿ"),
                    Map.entry("Read page", "à¨ªà©°à¨¨à¨¾ à¨ªà©œà©à¨¹à©‹"),
                    Map.entry("Stop", "à¨°à©‹à¨•à©‹"),
                    Map.entry("Voice commands", "à¨†à¨µà¨¾à¨œà¨¼ à¨•à¨®à¨¾à¨‚à¨¡à¨¾à¨‚")
            ),
            "ta", Map.ofEntries(
                    Map.entry("Dashboard", "à®Ÿà®¾à®·à¯à®ªà¯‹à®°à¯à®Ÿà¯"),
                    Map.entry("Profile", "à®šà¯à®¯à®µà®¿à®µà®°à®®à¯"),
                    Map.entry("Triage", "à®®à¯à®©à¯ à®®à®¤à®¿à®ªà¯à®ªà¯€à®Ÿà¯"),
                    Map.entry("Book", "à®ªà®¤à®¿à®µà¯"),
                    Map.entry("Appointments", "à®¨à®¿à®¯à®®à®©à®™à¯à®•à®³à¯"),
                    Map.entry("Prescriptions", "à®®à®°à¯à®¨à¯à®¤à¯à®šà¯ à®šà¯€à®Ÿà¯à®Ÿà¯à®•à®³à¯"),
                    Map.entry("Reminders", "à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®²à¯à®•à®³à¯"),
                    Map.entry("Health", "à®†à®°à¯‹à®•à¯à®•à®¿à®¯à®®à¯"),
                    Map.entry("Messages", "à®šà¯†à®¯à¯à®¤à®¿à®•à®³à¯"),
                    Map.entry("AI Chatbot", "à®à® à®…à®°à®Ÿà¯à®Ÿà¯ˆ à®‰à®¤à®µà®¿"),
                    Map.entry("IVR Booking", "IVR à®ªà®¤à®¿à®µà¯"),
                    Map.entry("Future Care", "à®Žà®¤à®¿à®°à¯à®•à®¾à®² à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯"),
                    Map.entry("Observations", "à®•à®£à¯à®•à®¾à®£à®¿à®ªà¯à®ªà¯à®•à®³à¯"),
                    Map.entry("Family Network", "à®•à¯à®Ÿà¯à®®à¯à®ª à®µà®²à¯ˆà®¯à®®à¯ˆà®ªà¯à®ªà¯"),
                    Map.entry("Voice Assist", "à®•à¯à®°à®²à¯ à®‰à®¤à®µà®¿"),
                    Map.entry("Timeline", "à®¨à¯‡à®°à®µà®°à®¿à®šà¯ˆ"),
                    Map.entry("Language", "à®®à¯Šà®´à®¿"),
                    Map.entry("Logout", "à®µà¯†à®³à®¿à®¯à¯‡à®±à¯"),
                    Map.entry("Total appointments", "à®®à¯Šà®¤à¯à®¤ à®¨à®¿à®¯à®®à®©à®™à¯à®•à®³à¯"),
                    Map.entry("Pending reminders", "à®¨à®¿à®²à¯à®µà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®²à¯à®•à®³à¯"),
                    Map.entry("Adherence %", "à®ªà®¿à®©à¯à®ªà®±à¯à®±à®²à¯ %"),
                    Map.entry("Follow-up due", "à®ªà®¿à®©à¯à®¤à¯Šà®Ÿà®°à¯ à®¨à®¿à®²à¯à®µà¯ˆ"),
                    Map.entry("All teleconsult and follow-up history", "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®¤à¯Šà®²à¯ˆà®†à®²à¯‹à®šà®©à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®ªà®¿à®©à¯à®¤à¯Šà®Ÿà®°à¯ à®µà®°à®²à®¾à®±à¯"),
                    Map.entry("Medication tasks still open", "à®®à®°à¯à®¨à¯à®¤à¯ à®ªà®£à®¿à®•à®³à¯ à®‡à®©à¯à®©à¯à®®à¯ à®¤à®¿à®±à®¨à¯à®¤à¯à®³à¯à®³à®©"),
                    Map.entry("Upcoming continuity care items", "à®µà®°à®µà®¿à®°à¯à®•à¯à®•à¯à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®šà¯à®šà®¿ à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®ªà®£à®¿à®•à®³à¯"),
                    Map.entry("Continuity snapshot", "à®¤à¯Šà®Ÿà®°à¯à®šà¯à®šà®¿ à®šà¯à®°à¯à®•à¯à®•à®®à¯"),
                    Map.entry("Most recent triage category", "à®…à®£à¯à®®à¯ˆà®¯ à®®à¯à®©à¯ à®®à®¤à®¿à®ªà¯à®ªà¯€à®Ÿà¯à®Ÿà¯ à®µà®•à¯ˆ"),
                    Map.entry("Prescription history", "à®®à®°à¯à®¨à¯à®¤à¯à®šà¯ à®šà¯€à®Ÿà¯à®Ÿà¯ à®µà®°à®²à®¾à®±à¯"),
                    Map.entry("Risk profile", "à®†à®ªà®¤à¯à®¤à¯ à®¨à®¿à®²à¯ˆ"),
                    Map.entry("Active care plans", "à®šà¯†à®¯à®²à®¿à®²à¯ à®‰à®³à¯à®³ à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®¤à®¿à®Ÿà¯à®Ÿà®™à¯à®•à®³à¯"),
                    Map.entry("Accessibility", "à®…à®£à¯à®•à®²à¯"),
                    Map.entry("Accessibility tools", "à®…à®£à¯à®•à®²à¯ à®•à®°à¯à®µà®¿à®•à®³à¯"),
                    Map.entry("Screen reader", "à®¤à®¿à®°à¯ˆ à®µà®¾à®šà®¿à®ªà¯à®ªà®¾à®©à¯"),
                    Map.entry("Large text", "à®ªà¯†à®°à®¿à®¯ à®Žà®´à¯à®¤à¯à®¤à¯"),
                    Map.entry("High contrast", "à®‰à®¯à®°à¯ à®®à®¾à®±à¯à®ªà®¾à®Ÿà¯"),
                    Map.entry("Read page", "à®ªà®•à¯à®•à®¤à¯à®¤à¯ˆ à®µà®¾à®šà®¿"),
                    Map.entry("Stop", "à®¨à®¿à®±à¯à®¤à¯à®¤à¯"),
                    Map.entry("Voice commands", "à®•à¯à®°à®²à¯ à®•à®Ÿà¯à®Ÿà®³à¯ˆà®•à®³à¯")
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

        return value.contains("Ãƒ")
                || value.contains("Ã‚")
                || value.contains("Ã¢")
                || value.contains("ï¿½")
                || value.contains("Ã Â¤")
                || value.contains("Ã Â®")
                || value.contains("Ã Â´");
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
        return value.contains("Ã Â¤")
                || value.contains("Ã Â®")
                || value.contains("Ã Â´")
                || value.contains("Ã Â°")
                || value.contains("Ã Â¨");
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
