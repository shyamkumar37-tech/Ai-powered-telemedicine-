import { useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import LocalizedText from "../../components/LocalizedText";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { exportAiReportSummary } from "../services/aiService";
import {
  analyzeVideoObservations,
  fetchAppointmentPrep,
  fetchAutomationPlans,
  fetchCarePlanAdherence,
  fetchComplianceDashboard,
  fetchDispenseAnomaly,
  fetchEscalationRules,
  fetchFollowUpPlan,
  fetchIcdSuggestions,
  fetchPredictiveRisk,
  fetchReportGenerator,
  fetchRiskSnapshot,
  runTranslationPreview,
  sendSymptomChat
} from "../services/aiPremiumService";
import {
  fetchAnomalyReport,
  fetchRecommendations,
  triggerN8nWorkflow
} from "../services/aiExtensionService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import AiInsightBlock from "../components/AiInsightBlock";
import AiPatientInsightsPanel from "../components/AiPatientInsightsPanel";
import AiDoctorInsightsPanel from "../components/AiDoctorInsightsPanel";
import AiCaregiverInsightsPanel from "../components/AiCaregiverInsightsPanel";
import AiPharmacistInsightsPanel from "../components/AiPharmacistInsightsPanel";
import AiMoodInsightsPanel from "../components/AiMoodInsightsPanel";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

function downloadBase64File(data: DynamicStateObject, filename: DynamicStateObject, mimeType: DynamicStateObject) {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${data}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AiHubPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const defaultId = auth.profileId ?? auth.userId;
  const role = auth.role || "PATIENT";

  const [patientId, setPatientId] = useState<DynamicState>(defaultId || "");
  const [doctorId, setDoctorId] = useState<DynamicState>(defaultId || "");
  const [caregiverId, setCaregiverId] = useState<DynamicState>(defaultId || "");
  const [pharmacistId, setPharmacistId] = useState<DynamicState>(defaultId || "");

  const [symptomInput, setSymptomInput] = useState<DynamicState>("");
  const [symptomHistory, setSymptomHistory] = useState<DynamicStateObject[]>([]);
  const [symptomResponse, setSymptomResponse] = useState<DynamicStateObject | null>(null);
  const [symptomError, setSymptomError] = useState<DynamicState>("");

  const [riskSnapshot, setRiskSnapshot] = useState<DynamicStateObject | null>(null);
  const [riskError, setRiskError] = useState<DynamicState>("");

  const [prepData, setPrepData] = useState<DynamicStateObject | null>(null);
  const [prepError, setPrepError] = useState<DynamicState>("");

  const [followPlan, setFollowPlan] = useState<DynamicStateObject | null>(null);
  const [followError, setFollowError] = useState<DynamicState>("");

  const [translationText, setTranslationText] = useState<DynamicState>("");
  const [translationTarget, setTranslationTarget] = useState<DynamicState>("hi");
  const [translationResult, setTranslationResult] = useState<DynamicStateObject | null>(null);
  const [translationError, setTranslationError] = useState<DynamicState>("");

  const [reportOutline, setReportOutline] = useState<DynamicStateObject | null>(null);
  const [reportError, setReportError] = useState<DynamicState>("");

  const [icdNotes, setIcdNotes] = useState<DynamicState>("");
  const [icdResult, setIcdResult] = useState<DynamicStateObject | null>(null);
  const [icdError, setIcdError] = useState<DynamicState>("");

  const [carePlan, setCarePlan] = useState<DynamicStateObject | null>(null);
  const [carePlanError, setCarePlanError] = useState<DynamicState>("");

  const [dispenseAnomaly, setDispenseAnomaly] = useState<DynamicStateObject | null>(null);
  const [dispenseError, setDispenseError] = useState<DynamicState>("");

  const [automationPlans, setAutomationPlans] = useState<DynamicStateObject | null>(null);
  const [automationError, setAutomationError] = useState<DynamicState>("");

  const [escalationRules, setEscalationRules] = useState<DynamicStateObject | null>(null);
  const [escalationError, setEscalationError] = useState<DynamicState>("");

  const [compliance, setCompliance] = useState<DynamicStateObject | null>(null);
  const [complianceError, setComplianceError] = useState<DynamicState>("");

  const [predictiveRisk, setPredictiveRisk] = useState<DynamicStateObject | null>(null);
  const [predictiveError, setPredictiveError] = useState<DynamicState>("");

  const [videoObservations, setVideoObservations] = useState<DynamicState>("");
  const [videoResult, setVideoResult] = useState<DynamicStateObject | null>(null);
  const [videoError, setVideoError] = useState<DynamicState>("");

  const [anomalyReport, setAnomalyReport] = useState<DynamicStateObject | null>(null);
  const [anomalyError, setAnomalyError] = useState<DynamicState>("");

  const [recommendations, setRecommendations] = useState<DynamicStateObject | null>(null);
  const [recommendationError, setRecommendationError] = useState<DynamicState>("");

  const [n8nResult, setN8nResult] = useState<DynamicStateObject | null>(null);
  const [n8nError, setN8nError] = useState<DynamicState>("");

  const languageOptions = useMemo(() => ([
    { value: "en", label: (t("english") || "English") },
    { value: "hi", label: (t("hindi") || "Hindi") },
    { value: "ta", label: (t("tamil") || "Tamil") },
    { value: "te", label: (t("telugu") || "Telugu") },
    { value: "ml", label: (t("malayalam") || "Malayalam") },
    { value: "pa", label: (t("punjabi") || "Punjabi") }
  ]), [translateUiText]);

  const roleLabel = useMemo(() => (t("aIInnovationHub") || "AI Innovation Hub"), [translateUiText]);

  const submitSymptomChat = async () => {
    if (!symptomInput.trim()) return;
    setSymptomError("");
    const nextHistory = [...symptomHistory, symptomInput.trim()].slice(-5);
    setSymptomHistory(nextHistory);
    try {
      const response = await sendSymptomChat({
        patientId: patientId ? Number(patientId) : null,
        message: symptomInput.trim(),
        history: nextHistory,
        locale: language
      });
      setSymptomResponse(response);
      setSymptomInput("");
    } catch (err: DynamicStateObject) {
      setSymptomError(getApiErrorMessage(err, (t("unableToGenerateSymptomGuidance") || "Unable to generate symptom guidance.")));
    }
  };

  const loadRiskSnapshot = async () => {
    if (!patientId) return;
    setRiskError("");
    try {
      setRiskSnapshot(await fetchRiskSnapshot(patientId));
    } catch (err: DynamicStateObject) {
      setRiskError(getApiErrorMessage(err, (t("unableToLoadRiskSnapshot") || "Unable to load risk snapshot.")));
    }
  };

  const loadPrepChecklist = async () => {
    if (!patientId) return;
    setPrepError("");
    try {
      setPrepData(await fetchAppointmentPrep(patientId));
    } catch (err: DynamicStateObject) {
      setPrepError(getApiErrorMessage(err, (t("unableToGenerateAppointmentPrepChecklist") || "Unable to generate appointment prep checklist.")));
    }
  };

  const loadFollowPlan = async () => {
    if (!patientId) return;
    setFollowError("");
    try {
      setFollowPlan(await fetchFollowUpPlan(patientId));
    } catch (err: DynamicStateObject) {
      setFollowError(getApiErrorMessage(err, (t("unableToGenerateFollowUpPlan") || "Unable to generate follow-up plan.")));
    }
  };

  const runTranslation = async () => {
    if (!translationText.trim()) return;
    setTranslationError("");
    try {
      setTranslationResult(await runTranslationPreview({
        text: translationText.trim(),
        sourceLanguage: "auto",
        targetLanguage: translationTarget
      }));
    } catch (err: DynamicStateObject) {
      setTranslationError(getApiErrorMessage(err, (t("unableToTranslateTheNote") || "Unable to translate the note.")));
    }
  };

  const loadReportOutline = async () => {
    if (!patientId) return;
    setReportError("");
    try {
      setReportOutline(await fetchReportGenerator(patientId));
    } catch (err: DynamicStateObject) {
      setReportError(getApiErrorMessage(err, (t("unableToBuildReportOutline") || "Unable to build report outline.")));
    }
  };

  const downloadReport = async () => {
    if (!patientId) return;
    try {
      const response = await exportAiReportSummary(patientId);
      downloadBase64File(response.contentBase64, response.filename, response.contentType);
    } catch (err: DynamicStateObject) {
      setReportError(getApiErrorMessage(err, (t("unableToDownloadReport") || "Unable to download report.")));
    }
  };

  const runIcdSuggestions = async () => {
    if (!icdNotes.trim()) return;
    setIcdError("");
    try {
      setIcdResult(await fetchIcdSuggestions({ notes: icdNotes.trim() }));
    } catch (err: DynamicStateObject) {
      setIcdError(getApiErrorMessage(err, (t("unableToGenerateICDSuggestions") || "Unable to generate ICD suggestions.")));
    }
  };

  const loadCarePlan = async () => {
    if (!patientId) return;
    setCarePlanError("");
    try {
      setCarePlan(await fetchCarePlanAdherence(patientId));
    } catch (err: DynamicStateObject) {
      setCarePlanError(getApiErrorMessage(err, (t("unableToLoadCarePlanAdherence") || "Unable to load care plan adherence.")));
    }
  };

  const loadDispenseAnomaly = async () => {
    if (!pharmacistId) return;
    setDispenseError("");
    try {
      setDispenseAnomaly(await fetchDispenseAnomaly(pharmacistId));
    } catch (err: DynamicStateObject) {
      setDispenseError(getApiErrorMessage(err, (t("unableToAnalyzeDispenseActivity") || "Unable to analyze dispense activity.")));
    }
  };

  const loadAutomationPlans = async () => {
    setAutomationError("");
    try {
      setAutomationPlans(await fetchAutomationPlans());
    } catch (err: DynamicStateObject) {
      setAutomationError(getApiErrorMessage(err, (t("unableToLoadAutomationPlans") || "Unable to load automation plans.")));
    }
  };

  const loadEscalationRules = async () => {
    if (!patientId) return;
    setEscalationError("");
    try {
      setEscalationRules(await fetchEscalationRules(patientId));
    } catch (err: DynamicStateObject) {
      setEscalationError(getApiErrorMessage(err, (t("unableToLoadEscalationRules") || "Unable to load escalation rules.")));
    }
  };

  const loadCompliance = async () => {
    setComplianceError("");
    try {
      setCompliance(await fetchComplianceDashboard());
    } catch (err: DynamicStateObject) {
      setComplianceError(getApiErrorMessage(err, (t("unableToLoadComplianceDashboard") || "Unable to load compliance dashboard.")));
    }
  };

  const loadPredictiveRisk = async () => {
    if (!patientId) return;
    setPredictiveError("");
    try {
      setPredictiveRisk(await fetchPredictiveRisk(patientId));
    } catch (err: DynamicStateObject) {
      setPredictiveError(getApiErrorMessage(err, (t("unableToLoadPredictiveRiskModel") || "Unable to load predictive risk model.")));
    }
  };

  const runVideoAnalysis = async () => {
    if (!videoObservations.trim()) return;
    setVideoError("");
    try {
      setVideoResult(await analyzeVideoObservations({ observations: videoObservations.trim() }));
    } catch (err: DynamicStateObject) {
      setVideoError(getApiErrorMessage(err, (t("unableToAnalyzeConsultationObservations") || "Unable to analyze consultation observations.")));
    }
  };

  const loadAnomalyReport = async () => {
    if (!patientId) return;
    setAnomalyError("");
    try {
      setAnomalyReport(await fetchAnomalyReport(patientId));
    } catch (err: DynamicStateObject) {
      setAnomalyError(getApiErrorMessage(err, (t("unableToLoadAnomalyDetectionReport") || "Unable to load anomaly detection report.")));
    }
  };

  const loadRecommendations = async () => {
    if (!patientId) return;
    setRecommendationError("");
    try {
      setRecommendations(await fetchRecommendations(patientId));
    } catch (err: DynamicStateObject) {
      setRecommendationError(getApiErrorMessage(err, (t("unableToLoadRecommendations") || "Unable to load recommendations.")));
    }
  };

  const triggerAutomation = async () => {
    setN8nError("");
    try {
      setN8nResult(await triggerN8nWorkflow({
        workflowName: "telecare-followup-demo",
        patientId: patientId ? Number(patientId) : null,
        payload: { role, source: "ai-hub" }
      }));
    } catch (err: DynamicStateObject) {
      setN8nError(getApiErrorMessage(err, (t("unableToTriggerAutomationWorkflow") || "Unable to trigger automation workflow.")));
    }
  };

  return (
    <div className="space-y-8">
      <SectionCard title={roleLabel}>
        <p className="text-sm text-slate-600">
          <LocalizedText value={(t("premiumAIFeatureLabForTeleCareUseThisSpaceToExploreAdvancedExplainableAIInsightsByRole") || "Premium AI feature lab for TeleCare+. Use this space to explore advanced, explainable AI insights by role.")} />
        </p>
      </SectionCard>

      <SectionCard title={(t("identityContext") || "Identity context")}>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm text-slate-600">
            {(t("patientID") || "Patient ID")}
            <input className="field mt-2" value={patientId} onChange={(e: DynamicStateObject) => setPatientId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {(t("doctorID") || "Doctor ID")}
            <input className="field mt-2" value={doctorId} onChange={(e: DynamicStateObject) => setDoctorId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {(t("caregiverID") || "Caregiver ID")}
            <input className="field mt-2" value={caregiverId} onChange={(e: DynamicStateObject) => setCaregiverId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {(t("pharmacistID") || "Pharmacist ID")}
            <input className="field mt-2" value={pharmacistId} onChange={(e: DynamicStateObject) => setPharmacistId(e.target.value)} />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {(t("roleDetected") || "Role detected")}: {role}
        </p>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={(t("aISymptomNavigator") || "AI Symptom Navigator")}>
          <textarea
            className="field min-h-24 resize-y"
            placeholder={(t("describeSymptomsInYourOwnWords") || "Describe symptoms in your own words")}
            value={symptomInput}
            onChange={(e: DynamicStateObject) => setSymptomInput(e.target.value)}
          />
          <button className="btn-primary mt-3" type="button" onClick={submitSymptomChat}>
            {(t("analyzeSymptoms") || "Analyze symptoms")}
          </button>
          {symptomError ? <p className="mt-2 text-sm text-red-600">{symptomError}</p> : null}
          {symptomResponse ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="font-semibold">{symptomResponse.reply}</p>
              <AiInsightBlock
                  title={(t("triageLevel") || "Triage level")}
                subtitle={`${symptomResponse.triageLevel} • ${(t("confidence") || "Confidence")}: ${symptomResponse.confidence}`}
                items={symptomResponse.keyFindings}
                rationale={symptomResponse.rationale}
                disclaimer={symptomResponse.disclaimer}
              />
              <AiInsightBlock title={(t("nextQuestions") || "Next questions")} items={symptomResponse.nextQuestions} />
              <AiInsightBlock title={(t("safetyChecklist") || "Safety checklist")} items={symptomResponse.safetyChecklist} />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title={(t("riskSnapshot") || "Risk snapshot")}>
          <button className="btn-secondary" type="button" onClick={loadRiskSnapshot}>
            {(t("loadSnapshot") || "Load snapshot")}
          </button>
          {riskError ? <p className="mt-2 text-sm text-red-600">{riskError}</p> : null}
          {riskSnapshot ? (
            <AiInsightBlock
              title={`${riskSnapshot.category} (${riskSnapshot.score}/100)`}
              subtitle={`${(t("confidence") || "Confidence")}: ${riskSnapshot.confidence}`}
              items={riskSnapshot.drivers}
              disclaimer={riskSnapshot.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={(t("appointmentPrepChecklist") || "Appointment prep checklist")}>
          <button className="btn-secondary" type="button" onClick={loadPrepChecklist}>
            {(t("generatePrepChecklist") || "Generate prep checklist")}
          </button>
          {prepError ? <p className="mt-2 text-sm text-red-600">{prepError}</p> : null}
          {prepData ? (
            <AiInsightBlock
              title={(t("checklist") || "Checklist")}
              items={prepData.checklist}
              rationale={prepData.rationale}
              disclaimer={prepData.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={(t("smartFollowUpPlan") || "Smart follow-up plan")}>
          <button className="btn-secondary" type="button" onClick={loadFollowPlan}>
            {(t("generateFollowUpPlan") || "Generate follow-up plan")}
          </button>
          {followError ? <p className="mt-2 text-sm text-red-600">{followError}</p> : null}
          {followPlan ? (
            <AiInsightBlock
              title={`${(t("recommendedDate") || "Recommended date")}: ${followPlan.recommendedDate}`}
              items={followPlan.planItems}
              rationale={followPlan.rationale}
              disclaimer={followPlan.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={(t("multilingualTranslationForNotesChat") || "Multilingual translation for notes/chat")}>
          <textarea
            className="field min-h-24 resize-y"
            placeholder={(t("pasteANoteToTranslate") || "Paste a note to translate")}
            value={translationText}
            onChange={(e: DynamicStateObject) => setTranslationText(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="field" value={translationTarget} onChange={(e: DynamicStateObject) => setTranslationTarget(e.target.value)}>
              {languageOptions.map((opt: DynamicStateObject) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button className="btn-primary" type="button" onClick={runTranslation}>
              {(t("translate") || "Translate")}
            </button>
          </div>
          {translationError ? <p className="mt-2 text-sm text-red-600">{translationError}</p> : null}
          {translationResult ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="font-semibold">{(t("translatedOutput") || "Translated output")}</p>
              <div className="rounded-2xl bg-mist p-4">{translationResult.text}</div>
              <p className="text-xs text-slate-500">{(t("provider") || "Provider")}: {translationResult.provider}</p>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title={(t("patientAIPanelsLiveData") || "Patient AI panels (live data)")}>
        <AiPatientInsightsPanel patientId={patientId || defaultId} />
      </SectionCard>

      <SectionCard title={(t("mentalHealthCheckIn") || "Mental health check-in")}>
        <AiMoodInsightsPanel patientId={patientId || defaultId} />
      </SectionCard>

      <SectionCard title={(t("doctorAIPanelsLiveData") || "Doctor AI panels (live data)")}>
        <AiDoctorInsightsPanel doctorId={doctorId || defaultId} />
      </SectionCard>

      <SectionCard title={(t("iCDCodingSuggestions") || "ICD coding suggestions")}>
        <textarea
          className="field min-h-24 resize-y"
          placeholder={(t("pasteConsultationNotes") || "Paste consultation notes")}
          value={icdNotes}
          onChange={(e: DynamicStateObject) => setIcdNotes(e.target.value)}
        />
        <button className="btn-primary mt-3" type="button" onClick={runIcdSuggestions}>
          {(t("generateICDSuggestions") || "Generate ICD suggestions")}
        </button>
        {icdError ? <p className="mt-2 text-sm text-red-600">{icdError}</p> : null}
        {icdResult ? (
          <AiInsightBlock
            title={(t("suggestedCodes") || "Suggested codes")}
            items={icdResult.codes}
            rationale={icdResult.rationale}
            disclaimer={icdResult.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("caregiverAIPanelsLiveData") || "Caregiver AI panels (live data)")}>
        <AiCaregiverInsightsPanel caregiverId={caregiverId || defaultId} />
      </SectionCard>

      <SectionCard title={(t("carePlanAdherenceSummary") || "Care plan adherence summary")}>
        <button className="btn-secondary" type="button" onClick={loadCarePlan}>
          {(t("generateAdherenceSummary") || "Generate adherence summary")}
        </button>
        {carePlanError ? <p className="mt-2 text-sm text-red-600">{carePlanError}</p> : null}
        {carePlan ? (
          <AiInsightBlock
            title={`${(t("adherenceRate") || "Adherence rate")}: ${carePlan.adherenceRate}%`}
            items={carePlan.gaps}
            rationale={carePlan.rationale}
            disclaimer={carePlan.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("pharmacistAIPanelsLiveData") || "Pharmacist AI panels (live data)")}>
        <AiPharmacistInsightsPanel pharmacistId={pharmacistId || defaultId} />
      </SectionCard>

      <SectionCard title={(t("dispenseAnomalyDetection") || "Dispense anomaly detection")}>
        <button className="btn-secondary" type="button" onClick={loadDispenseAnomaly}>
          {(t("analyzeDispensingActivity") || "Analyze dispensing activity")}
        </button>
        {dispenseError ? <p className="mt-2 text-sm text-red-600">{dispenseError}</p> : null}
        {dispenseAnomaly ? (
          <AiInsightBlock
            title={(t("dispenseMonitoring") || "Dispense monitoring")}
            items={dispenseAnomaly.alerts}
            rationale={dispenseAnomaly.rationale}
            disclaimer={dispenseAnomaly.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("aIMedicalReportGenerator") || "AI medical report generator")}>
        <button className="btn-secondary" type="button" onClick={loadReportOutline}>
          {(t("buildReportOutline") || "Build report outline")}
        </button>
        {reportOutline ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="font-semibold">{reportOutline.title}</p>
            {reportOutline.sections.map((section: DynamicStateObject) => (
              <AiInsightBlock
                key={section.title}
                title={section.title}
                items={section.content}
                disclaimer={reportOutline.disclaimer}
              />
            ))}
            {reportOutline.exportAvailable ? (
              <button className="btn-primary" type="button" onClick={downloadReport}>
                {(t("downloadReportFile") || "Download report file")}
              </button>
            ) : null}
          </div>
        ) : null}
        {reportError ? <p className="mt-2 text-sm text-red-600">{reportError}</p> : null}
      </SectionCard>

      <SectionCard title={(t("predictiveDiseaseRiskModel") || "Predictive disease risk model")}>
        <button className="btn-secondary" type="button" onClick={loadPredictiveRisk}>
          {(t("generatePredictiveRisk") || "Generate predictive risk")}
        </button>
        {predictiveError ? <p className="mt-2 text-sm text-red-600">{predictiveError}</p> : null}
        {predictiveRisk ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {predictiveRisk.forecasts.map((item: DynamicStateObject) => (
              <AiInsightBlock
                key={item.condition}
                title={`${item.condition} • ${item.probability}%`}
                subtitle={`${(t("horizon") || "Horizon")}: ${item.horizonDays} ${(t("days") || "days")}`}
                items={[item.rationale]}
                disclaimer={predictiveRisk.disclaimer}
              />
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={(t("healthAnomalyDetection") || "Health anomaly detection")}>
        <button className="btn-secondary" type="button" onClick={loadAnomalyReport}>
          {(t("analyzeAnomalies") || "Analyze anomalies")}
        </button>
        {anomalyError ? <p className="mt-2 text-sm text-red-600">{anomalyError}</p> : null}
        {anomalyReport ? (
          <AiInsightBlock
            title={`${(t("severity") || "Severity")}: ${anomalyReport.severity}`}
            items={anomalyReport.anomalies}
            rationale={anomalyReport.rationale}
            disclaimer={anomalyReport.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("personalizedRecommendations") || "Personalized recommendations")}>
        <button className="btn-secondary" type="button" onClick={loadRecommendations}>
          {(t("generateRecommendations") || "Generate recommendations")}
        </button>
        {recommendationError ? <p className="mt-2 text-sm text-red-600">{recommendationError}</p> : null}
        {recommendations ? (
          <AiInsightBlock
            title={(t("recommendations") || "Recommendations")}
            items={recommendations.recommendations}
            rationale={recommendations.rationale}
            disclaimer={recommendations.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("videoConsultationAnalysisNotesBased") || "Video consultation analysis (notes-based)")}>
        <textarea
          className="field min-h-24 resize-y"
          placeholder={(t("enterObservationsFromTheVideoConsultation") || "Enter observations from the video consultation")}
          value={videoObservations}
          onChange={(e: DynamicStateObject) => setVideoObservations(e.target.value)}
        />
        <button className="btn-primary mt-3" type="button" onClick={runVideoAnalysis}>
          {(t("analyzeObservations") || "Analyze observations")}
        </button>
        {videoError ? <p className="mt-2 text-sm text-red-600">{videoError}</p> : null}
        {videoResult ? (
          <AiInsightBlock
            title={`${(t("riskLevel") || "Risk level")}: ${videoResult.riskLevel}`}
            items={[videoResult.summary, ...videoResult.signals]}
            rationale={videoResult.rationale}
            disclaimer={videoResult.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("n8nWorkflowIntegrationOptional") || "n8n workflow integration (optional)")}>
        <button className="btn-secondary" type="button" onClick={triggerAutomation}>
          {(t("triggerFollowUpWorkflow") || "Trigger follow-up workflow")}
        </button>
        {n8nError ? <p className="mt-2 text-sm text-red-600">{n8nError}</p> : null}
        {n8nResult ? (
          <AiInsightBlock
            title={`${(t("status") || "Status")}: ${n8nResult.status}`}
            items={[n8nResult.message]}
            rationale={n8nResult.rationale}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={(t("automationEscalationWorkflowEngine") || "Automation & escalation workflow engine")}>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" type="button" onClick={loadAutomationPlans}>
            {(t("loadAutomationPlans") || "Load automation plans")}
          </button>
          <button className="btn-secondary" type="button" onClick={loadEscalationRules}>
            {(t("loadEscalationRules") || "Load escalation rules")}
          </button>
        </div>
        {automationError ? <p className="mt-2 text-sm text-red-600">{automationError}</p> : null}
        {automationPlans ? (
          <div className="mt-4 grid gap-3">
            {automationPlans.flows.map((flow: DynamicStateObject) => (
              <AiInsightBlock
                key={flow.name}
                title={flow.name}
                subtitle={`${(t("owner") || "Owner")}: ${flow.ownerRole}`}
                items={[`${(t("trigger") || "Trigger")}: ${flow.trigger}`, ...flow.actions]}
                disclaimer={automationPlans.disclaimer}
              />
            ))}
          </div>
        ) : null}
        {escalationError ? <p className="mt-2 text-sm text-red-600">{escalationError}</p> : null}
        {escalationRules ? (
          <div className="mt-4 grid gap-3">
            {escalationRules.rules.map((rule: DynamicStateObject) => (
              <AiInsightBlock
                key={rule.condition}
                title={`${rule.condition} (${rule.severity})`}
                items={[rule.action]}
                rationale={[rule.rationale]}
                disclaimer={escalationRules.disclaimer}
              />
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={(t("aIAuditComplianceDashboard") || "AI audit & compliance dashboard")}>
        <button className="btn-secondary" type="button" onClick={loadCompliance}>
          {(t("loadComplianceView") || "Load compliance view")}
        </button>
        {complianceError ? <p className="mt-2 text-sm text-red-600">{complianceError}</p> : null}
        {compliance ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {compliance.metrics.map((metric: DynamicStateObject) => (
              <AiInsightBlock
                key={metric.name}
                title={metric.name}
                subtitle={metric.status}
                items={[metric.detail]}
              />
            ))}
            <AiInsightBlock items={compliance.highlights} disclaimer={compliance.disclaimer} />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
