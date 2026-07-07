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

function downloadBase64File(data, filename, mimeType) {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${data}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AiHubPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const defaultId = auth.profileId ?? auth.userId;
  const role = auth.role || "PATIENT";

  const [patientId, setPatientId] = useState(defaultId || "");
  const [doctorId, setDoctorId] = useState(defaultId || "");
  const [caregiverId, setCaregiverId] = useState(defaultId || "");
  const [pharmacistId, setPharmacistId] = useState(defaultId || "");

  const [symptomInput, setSymptomInput] = useState("");
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [symptomResponse, setSymptomResponse] = useState(null);
  const [symptomError, setSymptomError] = useState("");

  const [riskSnapshot, setRiskSnapshot] = useState(null);
  const [riskError, setRiskError] = useState("");

  const [prepData, setPrepData] = useState(null);
  const [prepError, setPrepError] = useState("");

  const [followPlan, setFollowPlan] = useState(null);
  const [followError, setFollowError] = useState("");

  const [translationText, setTranslationText] = useState("");
  const [translationTarget, setTranslationTarget] = useState("hi");
  const [translationResult, setTranslationResult] = useState(null);
  const [translationError, setTranslationError] = useState("");

  const [reportOutline, setReportOutline] = useState(null);
  const [reportError, setReportError] = useState("");

  const [icdNotes, setIcdNotes] = useState("");
  const [icdResult, setIcdResult] = useState(null);
  const [icdError, setIcdError] = useState("");

  const [carePlan, setCarePlan] = useState(null);
  const [carePlanError, setCarePlanError] = useState("");

  const [dispenseAnomaly, setDispenseAnomaly] = useState(null);
  const [dispenseError, setDispenseError] = useState("");

  const [automationPlans, setAutomationPlans] = useState(null);
  const [automationError, setAutomationError] = useState("");

  const [escalationRules, setEscalationRules] = useState(null);
  const [escalationError, setEscalationError] = useState("");

  const [compliance, setCompliance] = useState(null);
  const [complianceError, setComplianceError] = useState("");

  const [predictiveRisk, setPredictiveRisk] = useState(null);
  const [predictiveError, setPredictiveError] = useState("");

  const [videoObservations, setVideoObservations] = useState("");
  const [videoResult, setVideoResult] = useState(null);
  const [videoError, setVideoError] = useState("");

  const [anomalyReport, setAnomalyReport] = useState(null);
  const [anomalyError, setAnomalyError] = useState("");

  const [recommendations, setRecommendations] = useState(null);
  const [recommendationError, setRecommendationError] = useState("");

  const [n8nResult, setN8nResult] = useState(null);
  const [n8nError, setN8nError] = useState("");

  const languageOptions = useMemo(() => ([
    { value: "en", label: translateUiText("English") },
    { value: "hi", label: translateUiText("Hindi") },
    { value: "ta", label: translateUiText("Tamil") },
    { value: "te", label: translateUiText("Telugu") },
    { value: "ml", label: translateUiText("Malayalam") },
    { value: "pa", label: translateUiText("Punjabi") }
  ]), [translateUiText]);

  const roleLabel = useMemo(() => translateUiText("AI Innovation Hub"), [translateUiText]);

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
    } catch (err) {
      setSymptomError(getApiErrorMessage(err, translateUiText("Unable to generate symptom guidance.")));
    }
  };

  const loadRiskSnapshot = async () => {
    if (!patientId) return;
    setRiskError("");
    try {
      setRiskSnapshot(await fetchRiskSnapshot(patientId));
    } catch (err) {
      setRiskError(getApiErrorMessage(err, translateUiText("Unable to load risk snapshot.")));
    }
  };

  const loadPrepChecklist = async () => {
    if (!patientId) return;
    setPrepError("");
    try {
      setPrepData(await fetchAppointmentPrep(patientId));
    } catch (err) {
      setPrepError(getApiErrorMessage(err, translateUiText("Unable to generate appointment prep checklist.")));
    }
  };

  const loadFollowPlan = async () => {
    if (!patientId) return;
    setFollowError("");
    try {
      setFollowPlan(await fetchFollowUpPlan(patientId));
    } catch (err) {
      setFollowError(getApiErrorMessage(err, translateUiText("Unable to generate follow-up plan.")));
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
    } catch (err) {
      setTranslationError(getApiErrorMessage(err, translateUiText("Unable to translate the note.")));
    }
  };

  const loadReportOutline = async () => {
    if (!patientId) return;
    setReportError("");
    try {
      setReportOutline(await fetchReportGenerator(patientId));
    } catch (err) {
      setReportError(getApiErrorMessage(err, translateUiText("Unable to build report outline.")));
    }
  };

  const downloadReport = async () => {
    if (!patientId) return;
    try {
      const response = await exportAiReportSummary(patientId);
      downloadBase64File(response.contentBase64, response.filename, response.contentType);
    } catch (err) {
      setReportError(getApiErrorMessage(err, translateUiText("Unable to download report.")));
    }
  };

  const runIcdSuggestions = async () => {
    if (!icdNotes.trim()) return;
    setIcdError("");
    try {
      setIcdResult(await fetchIcdSuggestions({ notes: icdNotes.trim() }));
    } catch (err) {
      setIcdError(getApiErrorMessage(err, translateUiText("Unable to generate ICD suggestions.")));
    }
  };

  const loadCarePlan = async () => {
    if (!patientId) return;
    setCarePlanError("");
    try {
      setCarePlan(await fetchCarePlanAdherence(patientId));
    } catch (err) {
      setCarePlanError(getApiErrorMessage(err, translateUiText("Unable to load care plan adherence.")));
    }
  };

  const loadDispenseAnomaly = async () => {
    if (!pharmacistId) return;
    setDispenseError("");
    try {
      setDispenseAnomaly(await fetchDispenseAnomaly(pharmacistId));
    } catch (err) {
      setDispenseError(getApiErrorMessage(err, translateUiText("Unable to analyze dispense activity.")));
    }
  };

  const loadAutomationPlans = async () => {
    setAutomationError("");
    try {
      setAutomationPlans(await fetchAutomationPlans());
    } catch (err) {
      setAutomationError(getApiErrorMessage(err, translateUiText("Unable to load automation plans.")));
    }
  };

  const loadEscalationRules = async () => {
    if (!patientId) return;
    setEscalationError("");
    try {
      setEscalationRules(await fetchEscalationRules(patientId));
    } catch (err) {
      setEscalationError(getApiErrorMessage(err, translateUiText("Unable to load escalation rules.")));
    }
  };

  const loadCompliance = async () => {
    setComplianceError("");
    try {
      setCompliance(await fetchComplianceDashboard());
    } catch (err) {
      setComplianceError(getApiErrorMessage(err, translateUiText("Unable to load compliance dashboard.")));
    }
  };

  const loadPredictiveRisk = async () => {
    if (!patientId) return;
    setPredictiveError("");
    try {
      setPredictiveRisk(await fetchPredictiveRisk(patientId));
    } catch (err) {
      setPredictiveError(getApiErrorMessage(err, translateUiText("Unable to load predictive risk model.")));
    }
  };

  const runVideoAnalysis = async () => {
    if (!videoObservations.trim()) return;
    setVideoError("");
    try {
      setVideoResult(await analyzeVideoObservations({ observations: videoObservations.trim() }));
    } catch (err) {
      setVideoError(getApiErrorMessage(err, translateUiText("Unable to analyze consultation observations.")));
    }
  };

  const loadAnomalyReport = async () => {
    if (!patientId) return;
    setAnomalyError("");
    try {
      setAnomalyReport(await fetchAnomalyReport(patientId));
    } catch (err) {
      setAnomalyError(getApiErrorMessage(err, translateUiText("Unable to load anomaly detection report.")));
    }
  };

  const loadRecommendations = async () => {
    if (!patientId) return;
    setRecommendationError("");
    try {
      setRecommendations(await fetchRecommendations(patientId));
    } catch (err) {
      setRecommendationError(getApiErrorMessage(err, translateUiText("Unable to load recommendations.")));
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
    } catch (err) {
      setN8nError(getApiErrorMessage(err, translateUiText("Unable to trigger automation workflow.")));
    }
  };

  return (
    <div className="space-y-8">
      <SectionCard title={roleLabel}>
        <p className="text-sm text-slate-600">
          <LocalizedText value={translateUiText("Premium AI feature lab for TeleCare+. Use this space to explore advanced, explainable AI insights by role.")} />
        </p>
      </SectionCard>

      <SectionCard title={translateUiText("Identity context")}>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm text-slate-600">
            {translateUiText("Patient ID")}
            <input className="field mt-2" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {translateUiText("Doctor ID")}
            <input className="field mt-2" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {translateUiText("Caregiver ID")}
            <input className="field mt-2" value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            {translateUiText("Pharmacist ID")}
            <input className="field mt-2" value={pharmacistId} onChange={(e) => setPharmacistId(e.target.value)} />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {translateUiText("Role detected")}: {role}
        </p>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={translateUiText("AI Symptom Navigator")}>
          <textarea
            className="field min-h-24 resize-y"
            placeholder={translateUiText("Describe symptoms in your own words")}
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
          />
          <button className="btn-primary mt-3" type="button" onClick={submitSymptomChat}>
            {translateUiText("Analyze symptoms")}
          </button>
          {symptomError ? <p className="mt-2 text-sm text-red-600">{symptomError}</p> : null}
          {symptomResponse ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="font-semibold">{symptomResponse.reply}</p>
              <AiInsightBlock
                  title={translateUiText("Triage level")}
                subtitle={`${symptomResponse.triageLevel} • ${translateUiText("Confidence")}: ${symptomResponse.confidence}`}
                items={symptomResponse.keyFindings}
                rationale={symptomResponse.rationale}
                disclaimer={symptomResponse.disclaimer}
              />
              <AiInsightBlock title={translateUiText("Next questions")} items={symptomResponse.nextQuestions} />
              <AiInsightBlock title={translateUiText("Safety checklist")} items={symptomResponse.safetyChecklist} />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title={translateUiText("Risk snapshot")}>
          <button className="btn-secondary" type="button" onClick={loadRiskSnapshot}>
            {translateUiText("Load snapshot")}
          </button>
          {riskError ? <p className="mt-2 text-sm text-red-600">{riskError}</p> : null}
          {riskSnapshot ? (
            <AiInsightBlock
              title={`${riskSnapshot.category} (${riskSnapshot.score}/100)`}
              subtitle={`${translateUiText("Confidence")}: ${riskSnapshot.confidence}`}
              items={riskSnapshot.drivers}
              disclaimer={riskSnapshot.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={translateUiText("Appointment prep checklist")}>
          <button className="btn-secondary" type="button" onClick={loadPrepChecklist}>
            {translateUiText("Generate prep checklist")}
          </button>
          {prepError ? <p className="mt-2 text-sm text-red-600">{prepError}</p> : null}
          {prepData ? (
            <AiInsightBlock
              title={translateUiText("Checklist")}
              items={prepData.checklist}
              rationale={prepData.rationale}
              disclaimer={prepData.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={translateUiText("Smart follow-up plan")}>
          <button className="btn-secondary" type="button" onClick={loadFollowPlan}>
            {translateUiText("Generate follow-up plan")}
          </button>
          {followError ? <p className="mt-2 text-sm text-red-600">{followError}</p> : null}
          {followPlan ? (
            <AiInsightBlock
              title={`${translateUiText("Recommended date")}: ${followPlan.recommendedDate}`}
              items={followPlan.planItems}
              rationale={followPlan.rationale}
              disclaimer={followPlan.disclaimer}
            />
          ) : null}
        </SectionCard>

        <SectionCard title={translateUiText("Multilingual translation for notes/chat")}>
          <textarea
            className="field min-h-24 resize-y"
            placeholder={translateUiText("Paste a note to translate")}
            value={translationText}
            onChange={(e) => setTranslationText(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="field" value={translationTarget} onChange={(e) => setTranslationTarget(e.target.value)}>
              {languageOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button className="btn-primary" type="button" onClick={runTranslation}>
              {translateUiText("Translate")}
            </button>
          </div>
          {translationError ? <p className="mt-2 text-sm text-red-600">{translationError}</p> : null}
          {translationResult ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="font-semibold">{translateUiText("Translated output")}</p>
              <div className="rounded-2xl bg-mist p-4">{translationResult.text}</div>
              <p className="text-xs text-slate-500">{translateUiText("Provider")}: {translationResult.provider}</p>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title={translateUiText("Patient AI panels (live data)")}>
        <AiPatientInsightsPanel patientId={patientId || defaultId} />
      </SectionCard>

      <SectionCard title={translateUiText("Mental health check-in")}>
        <AiMoodInsightsPanel patientId={patientId || defaultId} />
      </SectionCard>

      <SectionCard title={translateUiText("Doctor AI panels (live data)")}>
        <AiDoctorInsightsPanel doctorId={doctorId || defaultId} />
      </SectionCard>

      <SectionCard title={translateUiText("ICD coding suggestions")}>
        <textarea
          className="field min-h-24 resize-y"
          placeholder={translateUiText("Paste consultation notes")}
          value={icdNotes}
          onChange={(e) => setIcdNotes(e.target.value)}
        />
        <button className="btn-primary mt-3" type="button" onClick={runIcdSuggestions}>
          {translateUiText("Generate ICD suggestions")}
        </button>
        {icdError ? <p className="mt-2 text-sm text-red-600">{icdError}</p> : null}
        {icdResult ? (
          <AiInsightBlock
            title={translateUiText("Suggested codes")}
            items={icdResult.codes}
            rationale={icdResult.rationale}
            disclaimer={icdResult.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Caregiver AI panels (live data)")}>
        <AiCaregiverInsightsPanel caregiverId={caregiverId || defaultId} />
      </SectionCard>

      <SectionCard title={translateUiText("Care plan adherence summary")}>
        <button className="btn-secondary" type="button" onClick={loadCarePlan}>
          {translateUiText("Generate adherence summary")}
        </button>
        {carePlanError ? <p className="mt-2 text-sm text-red-600">{carePlanError}</p> : null}
        {carePlan ? (
          <AiInsightBlock
            title={`${translateUiText("Adherence rate")}: ${carePlan.adherenceRate}%`}
            items={carePlan.gaps}
            rationale={carePlan.rationale}
            disclaimer={carePlan.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Pharmacist AI panels (live data)")}>
        <AiPharmacistInsightsPanel pharmacistId={pharmacistId || defaultId} />
      </SectionCard>

      <SectionCard title={translateUiText("Dispense anomaly detection")}>
        <button className="btn-secondary" type="button" onClick={loadDispenseAnomaly}>
          {translateUiText("Analyze dispensing activity")}
        </button>
        {dispenseError ? <p className="mt-2 text-sm text-red-600">{dispenseError}</p> : null}
        {dispenseAnomaly ? (
          <AiInsightBlock
            title={translateUiText("Dispense monitoring")}
            items={dispenseAnomaly.alerts}
            rationale={dispenseAnomaly.rationale}
            disclaimer={dispenseAnomaly.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("AI medical report generator")}>
        <button className="btn-secondary" type="button" onClick={loadReportOutline}>
          {translateUiText("Build report outline")}
        </button>
        {reportOutline ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="font-semibold">{reportOutline.title}</p>
            {reportOutline.sections.map((section) => (
              <AiInsightBlock
                key={section.title}
                title={section.title}
                items={section.content}
                disclaimer={reportOutline.disclaimer}
              />
            ))}
            {reportOutline.exportAvailable ? (
              <button className="btn-primary" type="button" onClick={downloadReport}>
                {translateUiText("Download report file")}
              </button>
            ) : null}
          </div>
        ) : null}
        {reportError ? <p className="mt-2 text-sm text-red-600">{reportError}</p> : null}
      </SectionCard>

      <SectionCard title={translateUiText("Predictive disease risk model")}>
        <button className="btn-secondary" type="button" onClick={loadPredictiveRisk}>
          {translateUiText("Generate predictive risk")}
        </button>
        {predictiveError ? <p className="mt-2 text-sm text-red-600">{predictiveError}</p> : null}
        {predictiveRisk ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {predictiveRisk.forecasts.map((item) => (
              <AiInsightBlock
                key={item.condition}
                title={`${item.condition} • ${item.probability}%`}
                subtitle={`${translateUiText("Horizon")}: ${item.horizonDays} ${translateUiText("days")}`}
                items={[item.rationale]}
                disclaimer={predictiveRisk.disclaimer}
              />
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Health anomaly detection")}>
        <button className="btn-secondary" type="button" onClick={loadAnomalyReport}>
          {translateUiText("Analyze anomalies")}
        </button>
        {anomalyError ? <p className="mt-2 text-sm text-red-600">{anomalyError}</p> : null}
        {anomalyReport ? (
          <AiInsightBlock
            title={`${translateUiText("Severity")}: ${anomalyReport.severity}`}
            items={anomalyReport.anomalies}
            rationale={anomalyReport.rationale}
            disclaimer={anomalyReport.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Personalized recommendations")}>
        <button className="btn-secondary" type="button" onClick={loadRecommendations}>
          {translateUiText("Generate recommendations")}
        </button>
        {recommendationError ? <p className="mt-2 text-sm text-red-600">{recommendationError}</p> : null}
        {recommendations ? (
          <AiInsightBlock
            title={translateUiText("Recommendations")}
            items={recommendations.recommendations}
            rationale={recommendations.rationale}
            disclaimer={recommendations.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Video consultation analysis (notes-based)")}>
        <textarea
          className="field min-h-24 resize-y"
          placeholder={translateUiText("Enter observations from the video consultation")}
          value={videoObservations}
          onChange={(e) => setVideoObservations(e.target.value)}
        />
        <button className="btn-primary mt-3" type="button" onClick={runVideoAnalysis}>
          {translateUiText("Analyze observations")}
        </button>
        {videoError ? <p className="mt-2 text-sm text-red-600">{videoError}</p> : null}
        {videoResult ? (
          <AiInsightBlock
            title={`${translateUiText("Risk level")}: ${videoResult.riskLevel}`}
            items={[videoResult.summary, ...videoResult.signals]}
            rationale={videoResult.rationale}
            disclaimer={videoResult.disclaimer}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("n8n workflow integration (optional)")}>
        <button className="btn-secondary" type="button" onClick={triggerAutomation}>
          {translateUiText("Trigger follow-up workflow")}
        </button>
        {n8nError ? <p className="mt-2 text-sm text-red-600">{n8nError}</p> : null}
        {n8nResult ? (
          <AiInsightBlock
            title={`${translateUiText("Status")}: ${n8nResult.status}`}
            items={[n8nResult.message]}
            rationale={n8nResult.rationale}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Automation & escalation workflow engine")}>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" type="button" onClick={loadAutomationPlans}>
            {translateUiText("Load automation plans")}
          </button>
          <button className="btn-secondary" type="button" onClick={loadEscalationRules}>
            {translateUiText("Load escalation rules")}
          </button>
        </div>
        {automationError ? <p className="mt-2 text-sm text-red-600">{automationError}</p> : null}
        {automationPlans ? (
          <div className="mt-4 grid gap-3">
            {automationPlans.flows.map((flow) => (
              <AiInsightBlock
                key={flow.name}
                title={flow.name}
                subtitle={`${translateUiText("Owner")}: ${flow.ownerRole}`}
                items={[`${translateUiText("Trigger")}: ${flow.trigger}`, ...flow.actions]}
                disclaimer={automationPlans.disclaimer}
              />
            ))}
          </div>
        ) : null}
        {escalationError ? <p className="mt-2 text-sm text-red-600">{escalationError}</p> : null}
        {escalationRules ? (
          <div className="mt-4 grid gap-3">
            {escalationRules.rules.map((rule) => (
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

      <SectionCard title={translateUiText("AI audit & compliance dashboard")}>
        <button className="btn-secondary" type="button" onClick={loadCompliance}>
          {translateUiText("Load compliance view")}
        </button>
        {complianceError ? <p className="mt-2 text-sm text-red-600">{complianceError}</p> : null}
        {compliance ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {compliance.metrics.map((metric) => (
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
