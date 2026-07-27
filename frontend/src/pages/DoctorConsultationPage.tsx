import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiConsultationSummaryCard from "../ai/components/AiConsultationSummaryCard";
import AiReportSummaryCard from "../ai/components/AiReportSummaryCard";
import AiRiskCard from "../ai/components/AiRiskCard";
import AiTreatmentSuggestionsCard from "../ai/components/AiTreatmentSuggestionsCard";
import AiMedicalScribePanel from "../ai/components/AiMedicalScribePanel";
import AiImagingAnalyzer from "../ai/components/AiImagingAnalyzer";
import IotTelemetryDashboard from "../components/doctor/IotTelemetryDashboard";
import PriorAuthorizationPanel from "../components/doctor/PriorAuthorizationPanel";
import VideoConsultation from "../components/consultation/VideoConsultation";
import LongitudinalTimelineCard from "../components/consultation/LongitudinalTimelineCard";
import SmartPrescriptionPad from "../components/consultation/SmartPrescriptionPad";
import { createConsultation, createPrescription, fetchConsultationByAppointment, fetchDoctorAppointments, fetchPrescriptionByConsultation } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Stethoscope, Activity, Save, FlaskConical, Plus, TestTube } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function serializeSoap(soap: DynamicStateObject) {
  return `[SUBJECTIVE]\n${soap.subjective}\n\n[OBJECTIVE]\n${soap.objective}\n\n[ASSESSMENT]\n${soap.assessment}\n\n[PLAN]\n${soap.plan}\n\n[LABS]\n${soap.labs.join(", ")}`;
}

function deserializeSoap(text: DynamicStateObject) {
  const soap = { subjective: "", objective: "", assessment: "", plan: "", labs: [] };
  if (!text) return soap;
  
  const extract = (tag: DynamicStateObject, nextTag: DynamicStateObject) => {
    const idx = text.indexOf(`[${tag}]`);
    if (idx === -1) return "";
    const start = idx + `[${tag}]`.length;
    let end = text.length;
    if (nextTag) {
      const nextIdx = text.indexOf(`[${nextTag}]`);
      if (nextIdx !== -1) end = nextIdx;
    }
    return text.substring(start, end).trim();
  };
  
  soap.subjective = extract("SUBJECTIVE", "OBJECTIVE");
  soap.objective = extract("OBJECTIVE", "ASSESSMENT");
  soap.assessment = extract("ASSESSMENT", "PLAN");
  
  const planRaw = extract("PLAN", "LABS");
  if (!planRaw && text.indexOf("[PLAN]") !== -1) {
      soap.plan = extract("PLAN", null); 
  } else {
      soap.plan = planRaw;
  }
  
  const labsRaw = extract("LABS", null);
  soap.labs = labsRaw ? labsRaw.split(",").map((l: DynamicStateObject) => l.trim()).filter(Boolean) : [];
  
  if (!soap.subjective && !soap.objective && !soap.assessment && !soap.plan) {
    soap.subjective = text;
  }
  
  return soap;
}

function buildConsultationDraft(appointmentId = "") {
  return {
    appointmentId,
    soap: { subjective: "", objective: "", assessment: "", plan: "", labs: [] },
    outcome: "ROUTINE",
    followUpDate: ""
  };
}

function buildPrescriptionDraft(patientDisplayName = "") {
  return {
    patientDisplayName,
    notes: "",
    followUpDate: "",
    medications: []
  };
}

export default function DoctorConsultationPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorId = auth.profileId ?? auth.userId;
  const [appointments, setAppointments] = useState<DynamicStateObject[]>([]);
  const [message, setMessage] = useState<DynamicState>("");
  const [error, setError] = useState<DynamicState>("");
  const [loadingAppointments, setLoadingAppointments] = useState<DynamicState>(true);
  const [appointmentsReloadToken, setAppointmentsReloadToken] = useState<DynamicState>(0);
  const [consultationId, setConsultationId] = useState<DynamicStateObject | null>(null);
  const [existingPrescriptionLoaded, setExistingPrescriptionLoaded] = useState<DynamicState>(false);
  const [webrtcStream, setWebrtcStream] = useState<DynamicStateObject | null>(null);
  
  const [consultation, setConsultation] = useState<DynamicState>(buildConsultationDraft());
  const [prescription, setPrescription] = useState<DynamicState>(buildPrescriptionDraft());
  const [activeSoapTab, setActiveSoapTab] = useState<DynamicState>('subjective');
  const [newLabTest, setNewLabTest] = useState<DynamicState>('');
  
  const lastAppointmentIdRef = useRef<DynamicState>("");
  const lastFetchedAppointmentIdRef = useRef<DynamicState>("");
  const prescriptionDirtyRef = useRef<DynamicState>({ patientName: false, notes: false });
  const requestedAppointmentId = searchParams.get("appointmentId") || "";
  const initialAppointmentId = useMemo(() => requestedAppointmentId.trim(), [requestedAppointmentId]);

  useEffect(() => {
    if (!doctorId || auth?.role !== "DOCTOR") {
      setAppointments([]);
      setError("");
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);
    fetchDoctorAppointments(doctorId)
      .then((data: DynamicStateObject) => {
        const availableAppointments = (Array.isArray(data) ? data : []).filter((item: DynamicStateObject) => item.status !== "COMPLETED");
        setAppointments(availableAppointments);
        setConsultation((current: DynamicStateObject) => ({
          ...current,
          appointmentId: current.appointmentId
            || (initialAppointmentId && availableAppointments.some((item: DynamicStateObject) => String(item.id) === initialAppointmentId)
              ? initialAppointmentId
              : (availableAppointments[0] ? String(availableAppointments[0].id) : ""))
        }));
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadConsultationAppointments"))))
      .finally(() => setLoadingAppointments(false));
  }, [auth?.role, doctorId, initialAppointmentId, language, appointmentsReloadToken]);

  useEffect(() => {
    if (!consultation.appointmentId) {
      lastAppointmentIdRef.current = "";
      lastFetchedAppointmentIdRef.current = "";
      prescriptionDirtyRef.current = { patientName: false, notes: false };
      setConsultationId(null);
      setExistingPrescriptionLoaded(false);
      setConsultation(buildConsultationDraft(""));
      setPrescription(buildPrescriptionDraft(""));
      setMessage("");
      setError("");
      return;
    }

    const selectedAppointment = appointments.find((item: DynamicStateObject) => String(item.id) === String(consultation.appointmentId));
    const selectedPatientName = selectedAppointment?.patientName || "";
    const nextAppointmentId = String(consultation.appointmentId);
    const appointmentChanged = lastAppointmentIdRef.current !== nextAppointmentId;
    lastAppointmentIdRef.current = nextAppointmentId;

    if (appointmentChanged) {
      lastFetchedAppointmentIdRef.current = "";
      prescriptionDirtyRef.current = { patientName: false, notes: false };
      setConsultationId(null);
      setExistingPrescriptionLoaded(false);
      setConsultation((current: DynamicStateObject) => buildConsultationDraft(current.appointmentId));
      setPrescription(buildPrescriptionDraft(selectedPatientName));
      setError("");
      setMessage("");
    } else if (selectedPatientName && !prescriptionDirtyRef.current.patientName) {
      setPrescription((current: DynamicStateObject) => ({
        ...current,
        patientDisplayName: current.patientDisplayName || selectedPatientName
      }));
    }

    if (lastFetchedAppointmentIdRef.current === nextAppointmentId) {
      return;
    }
    lastFetchedAppointmentIdRef.current = nextAppointmentId;

    fetchConsultationByAppointment(Number(consultation.appointmentId))
      .then((data: DynamicStateObject) => {
        if (!data || !data.id) {
          setConsultationId(null);
          setExistingPrescriptionLoaded(false);
          if (!appointmentChanged) {
            setError("");
            setMessage((t("noConsultationNoteExistsForThisAppointmentYetSaveAConsultationNoteToContinue") || "No consultation note exists for this appointment yet. Save a consultation note to continue."));
          }
          return;
        }

        setConsultationId(data.id);
        setExistingPrescriptionLoaded(false);
        setConsultation((current: DynamicStateObject) => ({
          ...current,
          soap: deserializeSoap(data.notes),
          outcome: data.outcome ?? current.outcome,
          followUpDate: data.followUpDate ?? current.followUpDate
        }));
        setError("");
        setMessage(t("existingConsultationLoaded"));
      })
      .catch((err: DynamicStateObject) => {
        if (err?.response?.status === 404) {
          setConsultationId(null);
          setExistingPrescriptionLoaded(false);
          if (!appointmentChanged) {
            setError("");
            setMessage((t("noConsultationNoteExistsForThisAppointmentYetSaveAConsultationNoteToContinue") || "No consultation note exists for this appointment yet. Save a consultation note to continue."));
          }
          return;
        }

        setConsultationId(null);
        setExistingPrescriptionLoaded(false);
        if (!appointmentChanged) {
          setMessage("");
          setError(getApiErrorMessage(err, (t("unableToLoadConsultationDetails") || "Unable to load consultation details.")));
        }
      });
  }, [consultation.appointmentId, appointments, language]);

  useEffect(() => {
    if (!consultationId) {
      setExistingPrescriptionLoaded(false);
      return;
    }

    fetchPrescriptionByConsultation(consultationId)
      .then((data: DynamicStateObject) => {
        setPrescription({
          patientDisplayName: data.patientName ?? "",
          notes: data.notes ?? "",
          followUpDate: data.followUpDate ?? "",
          medications: Array.isArray(data.medications) ? data.medications : []
        });
        setExistingPrescriptionLoaded(true);
        setMessage(t("existingPrescriptionLoaded"));
        setError("");
      })
      .catch((err: DynamicStateObject) => {
        if (err?.response?.status === 404) {
          setExistingPrescriptionLoaded(false);
          setError("");
          return;
        }
        setExistingPrescriptionLoaded(false);
        setError(getApiErrorMessage(err, (t("unableToLoadExistingPrescriptionDetails") || "Unable to load existing prescription details.")));
      });
  }, [consultationId, language]);

  const selectedAppointment = appointments.find((item: DynamicStateObject) => String(item.id) === String(consultation.appointmentId));
  const selectedPatientId = selectedAppointment?.patientId;

  return (
    <div className="space-y-6 doc-premium-workspace">
      <VideoConsultation
        doctorName={auth?.fullName || "Doctor"}
        patientName={selectedAppointment?.patientName || "Patient"}
        appointmentTime={selectedAppointment?.appointmentDateTime ? new Date(selectedAppointment.appointmentDateTime).toLocaleString() : "Awaiting appointment selection"}
        showTeleExam={true}
        currentUserId={auth?.userId}
        recipientId={selectedPatientId}
        onStreamMixed={setWebrtcStream}
      />
      
      {/* Patient Summary Header */}
      {selectedAppointment && (
        <div className="glass-card p-6 flex flex-wrap lg:flex-nowrap items-center justify-between gap-6 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border border-primary/30">
              {selectedAppointment.patientName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedAppointment.patientName}</h2>
              <div className="flex gap-4 text-sm text-slate-400 mt-1">
                <span>Age: 42</span>
                <span>Gender: M</span>
                <span>ID: #{selectedPatientId}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-6 divide-x divide-white/10">
            <div className="px-4">
              <p className="doc-subheading mb-1 text-alert">{t("allergies") || "Allergies"}</p>
              <p className="font-semibold text-white">{t("penicillinPeanuts") || "Penicillin, Peanuts"}</p>
            </div>
            <div className="px-4">
              <p className="doc-subheading mb-1 text-primary">{t("latestVitals") || "Latest Vitals"}</p>
              <p className="font-semibold text-white">BP: 120/80, HR: 72 bpm</p>
            </div>
            <div className="px-4">
              <p className="doc-subheading mb-1 text-warn">{t("triageLevel") || "Triage Level"}</p>
              <p className="font-semibold text-white">{selectedAppointment.triageLevel || 'Standard'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <PremiumSectionCard
            title={(
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <span>{t("clinicalConsultation") || "Clinical Consultation"}</span>
              </div>
            )}
            action={
              <button
                className="btn-primary btn-primary"
                type="button"
                disabled={!consultation.appointmentId || loadingAppointments}
                onClick={async () => {
                  if (!consultation.appointmentId) {
                    setMessage("");
                    setError(t("selectAppointmentBeforeSaving"));
                    return;
                  }
                  try {
                    setError("");
                    setMessage("");
                    const serializedNotes = serializeSoap(consultation.soap);
                    const isAiGenerated = serializedNotes.includes("AI GENERATED, PENDING REVIEW") || serializedNotes.includes("[SUBJECTIVE]");
                    const data = await createConsultation({
                      appointmentId: Number(consultation.appointmentId),
                      notes: serializedNotes.replace("--- AI GENERATED, PENDING REVIEW ---", "--- AI GENERATED & REVIEWED ---"),
                      outcome: consultation.outcome,
                      followUpDate: consultation.followUpDate || null,
                      aiGenerated: isAiGenerated,
                      reviewedAt: isAiGenerated ? new Date().toISOString() : null,
                      reviewedBy: isAiGenerated ? auth?.fullName : null
                    });
                    setConsultationId(data.id);
                    setMessage(t("consultationSavedFor").replace("{name}", data.patientName));
                  } catch (err: DynamicStateObject) {
                    const messageText = getApiErrorMessage(err, t("unableSaveConsultation"));
                    if (messageText === "Consultation note already exists for appointment") {
                      try {
                        const existing = await fetchConsultationByAppointment(Number(consultation.appointmentId));
                        setConsultationId(existing.id);
                        setConsultation((current: DynamicStateObject) => ({
                          ...current,
                          soap: deserializeSoap(existing.notes),
                          outcome: existing.outcome ?? current.outcome,
                          followUpDate: existing.followUpDate ?? current.followUpDate
                        }));
                        setError("");
                        setMessage(t("existingConsultationLoaded"));
                      } catch {
                        setError(messageText);
                      }
                    } else {
                      setError(messageText);
                    }
                  }
                }}
              >
                <Save className="w-4 h-4" /> {t("saveConsultation")}
              </button>
            }
          >
            <div className="mb-6">
              <label className="block space-y-2">
                <span className="doc-subheading">{t("appointment")}</span>
                <select
                  className="field bg-slate-900/50"
                  value={consultation.appointmentId}
                  onChange={(e: DynamicStateObject) => {
                    const nextAppointmentId = e.target.value;
                    setConsultation({ ...consultation, appointmentId: nextAppointmentId });
                    setSearchParams(nextAppointmentId ? { appointmentId: nextAppointmentId } : {}, { replace: true });
                  }}
                >
                  <option value="">{t("selectAppointment")}</option>
                  {(Array.isArray(appointments) ? appointments : []).map((item: DynamicStateObject) => (
                    <option key={item.id} value={item.id}>
                      {item.patientName} - {new Date(item.appointmentDateTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loadingAppointments ? <LoadingSkeleton lines={3} /> : null}
            {!loadingAppointments && error ? (
              <ErrorStateCard
                title={t("unableLoadConsultationAppointments")}
                body={error}
                actionLabel={t("retry")}
                onAction={() => setAppointmentsReloadToken((current: DynamicStateObject) => current + 1)}
              />
            ) : null}

            <div className="mt-6 border border-slate-700/50 rounded-xl bg-slate-900/30">
              <div className="flex border-b border-slate-700/50 bg-slate-800/50">
                {['subjective', 'objective', 'assessment', 'plan'].map((tab: DynamicStateObject) => (
                  <div 
                    key={tab} 
                    className={`doc-soap-tab flex-1 text-center capitalize ${activeSoapTab === tab ? 'active bg-slate-900/50' : ''}`}
                    onClick={() => setActiveSoapTab(tab)}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <div className="p-4">
                <textarea
                  className="field min-h-[200px] resize-y bg-transparent border-none p-2 focus:box-shadow-none"
                  placeholder={`Enter ${activeSoapTab} notes...`}
                  value={(consultation.soap as DynamicStateObject)[activeSoapTab]}
                  onChange={(e: DynamicStateObject) => setConsultation({ 
                    ...consultation, 
                    soap: { ...consultation.soap, [activeSoapTab]: e.target.value } 
                  })}
                />
              </div>
            </div>

            {/* Lab Test Ordering */}
            <div className="mt-6 border border-slate-700/50 rounded-xl p-5 bg-slate-900/30">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 doc-subheading text-white">
                  <FlaskConical className="w-4 h-4 text-purple-400" /> {t("labTestOrders") || "Lab Test Orders"}</span>
              </div>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="e.g. Complete Blood Count (CBC)" 
                  className="field flex-1"
                  value={newLabTest}
                  onChange={(e: DynamicStateObject) => setNewLabTest(e.target.value)}
                  onKeyDown={(e: DynamicStateObject) => {
                    if (e.key === 'Enter' && newLabTest.trim()) {
                      e.preventDefault();
                      setConsultation({
                        ...consultation,
                        soap: { ...consultation.soap, labs: [...consultation.soap.labs, newLabTest.trim()] }
                      });
                      setNewLabTest('');
                    }
                  }}
                />
                <button 
                  type="button"
                  className="btn-primary btn-secondary"
                  onClick={() => {
                    if (newLabTest.trim()) {
                      setConsultation({
                        ...consultation,
                        soap: { ...consultation.soap, labs: [...consultation.soap.labs, newLabTest.trim()] }
                      });
                      setNewLabTest('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" /> {t("add") || "Add"}</button>
              </div>
              {consultation.soap.labs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {consultation.soap.labs.map((lab: DynamicStateObject, i: DynamicStateObject) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-sm">
                      <TestTube className="w-3 h-3" /> {lab}
                      <button 
                        type="button" 
                        onClick={() => {
                          const newLabs = [...consultation.soap.labs];
                          newLabs.splice(i, 1);
                          setConsultation({ ...consultation, soap: { ...consultation.soap, labs: newLabs } });
                        }}
                        className="ml-1 text-purple-400 hover:text-white"
                      >&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <label className="block space-y-2">
                <span className="doc-subheading">{t("outcome")}</span>
                <select
                  className="field"
                  value={consultation.outcome}
                  onChange={(e: DynamicStateObject) => setConsultation({ ...consultation, outcome: e.target.value })}
                >
                  <option value="ROUTINE">{t("routine")}</option>
                  <option value="PRIORITY">{t("priority")}</option>
                  <option value="IN_PERSON_REQUIRED">{t("inPersonRequired")}</option>
                  <option value="EMERGENCY_REFERRAL">{t("emergencyReferral")}</option>
                </select>
              </label>
              
              <label className="block space-y-2">
                <span className="doc-subheading">{t("followUpDate")}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    className="field"
                    value={consultation.followUpDate} 
                    onChange={(e: DynamicStateObject) => setConsultation({ ...consultation, followUpDate: e.target.value })} 
                  />
                  <button
                    type="button"
                    className="btn-primary btn-secondary px-3"
                    onClick={() => {
                      const now = new Date();
                      if (consultation.outcome === "PRIORITY" || consultation.outcome === "IN_PERSON_REQUIRED") now.setDate(now.getDate() + 3);
                      else if (consultation.outcome === "EMERGENCY_REFERRAL") now.setDate(now.getDate() + 1);
                      else now.setDate(now.getDate() + 30);
                      setConsultation({ ...consultation, followUpDate: now.toISOString().split("T")[0] });
                    }}
                    title="Smart Schedule based on outcome"
                  >
                    ✨ Auto
                  </button>
                </div>
              </label>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">{message}</p> : null}
          </PremiumSectionCard>
          
          <SmartPrescriptionPad
            prescription={prescription}
            setPrescription={setPrescription}
            patientId={selectedPatientId}
            loading={false}
            disabled={!consultationId || existingPrescriptionLoaded}
            message={message}
            error={error}
            onSave={async () => {
              if (!consultationId) {
                setError("");
                setMessage(t("saveConsultationFirst"));
                return;
              }
              try {
                setError("");
                setMessage("");
                const data = await createPrescription({
                  consultationNoteId: consultationId,
                  patientDisplayName: prescription.patientDisplayName,
                  notes: prescription.notes,
                  followUpDate: prescription.followUpDate || null,
                  medications: prescription.medications
                });
                setExistingPrescriptionLoaded(true);
                setMessage(t("prescriptionCreatedScheduled").replace("{count}", data.medications.length));
              } catch (err: DynamicStateObject) {
                const messageText = getApiErrorMessage(err, t("unableCreatePrescription"));
                if (messageText === "Prescription already created for consultation") {
                  try {
                    const existing = await fetchPrescriptionByConsultation(consultationId);
                    setPrescription({
                      patientDisplayName: existing.patientName ?? "",
                      notes: existing.notes ?? "",
                      followUpDate: existing.followUpDate ?? "",
                      medications: Array.isArray(existing.medications) ? existing.medications : []
                    });
                    setExistingPrescriptionLoaded(true);
                    setError("");
                    setMessage(t("prescriptionAlreadyLoaded"));
                  } catch {
                    setError(messageText);
                  }
                } else {
                  setError(messageText);
                }
              }
            }}
          />

          {selectedPatientId && (
            <>
              <LongitudinalTimelineCard patientId={selectedPatientId} />
              <IotTelemetryDashboard patientId={selectedPatientId} />
              <AiImagingAnalyzer patientId={selectedPatientId} />
            </>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <h3 className="doc-heading flex items-center gap-2 text-primary bg-slate-800/50 p-4 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <Activity className="w-6 h-6 animate-pulse" /> {t("aIClinicalAssistant") || "AI Clinical Assistant"}</h3>
            
            <AiMedicalScribePanel
              webrtcStream={webrtcStream}
              onSoapNoteGenerated={(data: DynamicStateObject) => setConsultation((current: DynamicStateObject) => ({
                ...current,
                soap: {
                  ...current.soap,
                  subjective: data.subjective || current.soap.subjective,
                  objective: data.objective || current.soap.objective,
                  assessment: data.assessment || current.soap.assessment,
                  plan: data.plan || current.soap.plan
                }
              }))}
            />
            
            <AiConsultationSummaryCard
              consultationId={consultationId}
              patientId={selectedPatientId}
              onApplySummary={(summaryText: DynamicStateObject) => setConsultation((current: DynamicStateObject) => ({ 
                ...current, 
                soap: { ...current.soap, assessment: `${current.soap.assessment}\n${summaryText}`.trim() } 
              }))}
            />
            
            {selectedPatientId && (
              <PriorAuthorizationPanel patientId={selectedPatientId} consultationId={consultationId} />
            )}
            
            <AiTreatmentSuggestionsCard patientId={selectedPatientId} />
            <AiRiskCard patientId={selectedPatientId} titleKey="aiRiskInsightsDoctor" />
            <AiReportSummaryCard patientId={selectedPatientId} titleKey="aiReportSummaryDoctor" />
          </div>
        </div>
      </div>
    </div>
  );
}

