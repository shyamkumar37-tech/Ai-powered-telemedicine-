import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormField from "../components/FormField";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiConsultationSummaryCard from "../ai/components/AiConsultationSummaryCard";
import AiReportSummaryCard from "../ai/components/AiReportSummaryCard";
import AiRiskCard from "../ai/components/AiRiskCard";
import AiTreatmentSuggestionsCard from "../ai/components/AiTreatmentSuggestionsCard";
import AiMedicalScribePanel from "../ai/components/AiMedicalScribePanel";
import VideoConsultation from "../components/consultation/VideoConsultation";
import LongitudinalTimelineCard from "../components/consultation/LongitudinalTimelineCard";
import SmartPrescriptionPad from "../components/consultation/SmartPrescriptionPad";
import { createConsultation, createPrescription, fetchConsultationByAppointment, fetchDoctorAppointments, fetchPrescriptionByConsultation } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

function buildConsultationDraft(appointmentId = "") {
  return {
    appointmentId,
    notes: "",
    outcome: "ROUTINE",
    followUpDate: ""
  };
}

function buildPrescriptionDraft(patientDisplayName = "") {
  return {
    patientDisplayName,
    notes: "",
    followUpDate: "",
    medicineName: "",
    dosage: "",
    frequency: "",
    durationDays: 5
  };
}

export default function DoctorConsultationPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorId = auth.profileId ?? auth.userId;
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsReloadToken, setAppointmentsReloadToken] = useState(0);
  const [consultationId, setConsultationId] = useState(null);
  const [existingPrescriptionLoaded, setExistingPrescriptionLoaded] = useState(false);
  const [webrtcStream, setWebrtcStream] = useState(null);
  const [consultation, setConsultation] = useState(buildConsultationDraft());
  const [prescription, setPrescription] = useState(buildPrescriptionDraft());
  const lastAppointmentIdRef = useRef("");
  const lastFetchedAppointmentIdRef = useRef("");
  const prescriptionDirtyRef = useRef({ patientName: false, notes: false });
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
      .then((data) => {
        const availableAppointments = (Array.isArray(data) ? data : []).filter((item) => item.status !== "COMPLETED");
        setAppointments(availableAppointments);
        setConsultation((current) => ({
          ...current,
          appointmentId: current.appointmentId
            || (initialAppointmentId && availableAppointments.some((item) => String(item.id) === initialAppointmentId)
              ? initialAppointmentId
              : (availableAppointments[0] ? String(availableAppointments[0].id) : ""))
        }));
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadConsultationAppointments"))))
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

    const selectedAppointment = appointments.find((item) => String(item.id) === String(consultation.appointmentId));
    const selectedPatientName = selectedAppointment?.patientName || "";
    const nextAppointmentId = String(consultation.appointmentId);
    const appointmentChanged = lastAppointmentIdRef.current !== nextAppointmentId;
    lastAppointmentIdRef.current = nextAppointmentId;

    if (appointmentChanged) {
      lastFetchedAppointmentIdRef.current = "";
      prescriptionDirtyRef.current = { patientName: false, notes: false };
      setConsultationId(null);
      setExistingPrescriptionLoaded(false);
      setConsultation((current) => buildConsultationDraft(current.appointmentId));
      setPrescription(buildPrescriptionDraft(selectedPatientName));
      setError("");
      setMessage("");
    } else if (selectedPatientName && !prescriptionDirtyRef.current.patientName) {
      setPrescription((current) => ({
        ...current,
        patientDisplayName: current.patientDisplayName || selectedPatientName
      }));
    }

    if (lastFetchedAppointmentIdRef.current === nextAppointmentId) {
      return;
    }
    lastFetchedAppointmentIdRef.current = nextAppointmentId;

    fetchConsultationByAppointment(Number(consultation.appointmentId))
      .then((data) => {
        if (!data || !data.id) {
          setConsultationId(null);
          setExistingPrescriptionLoaded(false);
          if (!appointmentChanged) {
            setError("");
            setMessage(translateUiText("No consultation note exists for this appointment yet. Save a consultation note to continue."));
          }
          return;
        }

        setConsultationId(data.id);
        setExistingPrescriptionLoaded(false);
        setConsultation((current) => ({
          ...current,
          notes: data.notes ?? current.notes,
          outcome: data.outcome ?? current.outcome,
          followUpDate: data.followUpDate ?? current.followUpDate
        }));
        setError("");
        setMessage(t("existingConsultationLoaded"));
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setConsultationId(null);
          setExistingPrescriptionLoaded(false);
          if (!appointmentChanged) {
            setError("");
            setMessage(translateUiText("No consultation note exists for this appointment yet. Save a consultation note to continue."));
          }
          return;
        }

        setConsultationId(null);
        setExistingPrescriptionLoaded(false);
        if (!appointmentChanged) {
          setMessage("");
          setError(getApiErrorMessage(err, translateUiText("Unable to load consultation details.")));
        }
      });
  }, [consultation.appointmentId, appointments, language]);

  useEffect(() => {
    if (!consultationId) {
      setExistingPrescriptionLoaded(false);
      return;
    }

    fetchPrescriptionByConsultation(consultationId)
      .then((data) => {
        const firstMedication = Array.isArray(data.medications) ? data.medications[0] : null;
        setPrescription({
          patientDisplayName: data.patientName ?? "",
          notes: data.notes ?? "",
          followUpDate: data.followUpDate ?? "",
          medicineName: firstMedication?.medicineName ?? "",
          dosage: firstMedication?.dosage ?? "",
          frequency: firstMedication?.frequency ?? "",
          durationDays: firstMedication?.durationDays ?? 5
        });
        setExistingPrescriptionLoaded(true);
        setMessage(t("existingPrescriptionLoaded"));
        setError("");
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setExistingPrescriptionLoaded(false);
          setError("");
          return;
        }

        setExistingPrescriptionLoaded(false);
        setError(getApiErrorMessage(err, translateUiText("Unable to load existing prescription details.")));
      });
  }, [consultationId, language]);

  const selectedAppointment = appointments.find((item) => String(item.id) === String(consultation.appointmentId));
  const selectedPatientId = selectedAppointment?.patientId;

  return (
    <div className="space-y-6">
      <VideoConsultation
        doctorName={auth?.fullName || "Doctor"}
        patientName={selectedAppointment?.patientName || "Patient"}
        appointmentTime={selectedAppointment?.appointmentDateTime ? new Date(selectedAppointment.appointmentDateTime).toLocaleString() : "Awaiting appointment selection"}
        showTeleExam={true}
        currentUserId={auth?.userId}
        recipientId={selectedPatientId}
        onStreamMixed={setWebrtcStream}
      />
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
          <PremiumSectionCard
        title={t("consultationNotes")}
        action={
        <button
          className="doc-btn doc-btn-primary"
          type="button"
          disabled={!consultation.appointmentId || loadingAppointments}
          aria-label={t("saveConsultation")}
          data-voice-label={t("saveConsultation")}
          onClick={async () => {
              if (!consultation.appointmentId) {
                setMessage("");
                setError(t("selectAppointmentBeforeSaving"));
                return;
              }
              try {
                setError("");
                setMessage("");
                const isAiGenerated = consultation.notes.includes("AI GENERATED, PENDING REVIEW") || consultation.notes.includes("[SUBJECTIVE]");
                const data = await createConsultation({
                  appointmentId: Number(consultation.appointmentId),
                  notes: consultation.notes.replace("--- AI GENERATED, PENDING REVIEW ---", "--- AI GENERATED & REVIEWED ---"),
                  outcome: consultation.outcome,
                  followUpDate: consultation.followUpDate || null,
                  aiGenerated: isAiGenerated,
                  reviewedAt: isAiGenerated ? new Date().toISOString() : null,
                  reviewedBy: isAiGenerated ? auth?.fullName : null
                });
                setConsultationId(data.id);
                setMessage(t("consultationSavedFor").replace("{name}", data.patientName));
              } catch (err) {
                const messageText = getApiErrorMessage(err, t("unableSaveConsultation"));
                if (messageText === "Consultation note already exists for appointment") {
                  try {
                    const existing = await fetchConsultationByAppointment(Number(consultation.appointmentId));
                    setConsultationId(existing.id);
                    setConsultation((current) => ({
                      ...current,
                      notes: existing.notes ?? current.notes,
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
            {t("saveConsultation")}
          </button>
        }
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">{t("appointment")}</span>
          <select
            className="doc-input"
            value={consultation.appointmentId}
            aria-label={t("appointment")}
            data-voice-label={t("appointment")}
            onChange={(e) => {
              const nextAppointmentId = e.target.value;
              setConsultation({ ...consultation, appointmentId: nextAppointmentId });
              setSearchParams(nextAppointmentId ? { appointmentId: nextAppointmentId } : {}, { replace: true });
            }}
          >
            <option value="">{t("selectAppointment")}</option>
            {(Array.isArray(appointments) ? appointments : []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.patientName} - {new Date(item.appointmentDateTime).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        {loadingAppointments ? <LoadingSkeleton lines={3} /> : null}
        {!loadingAppointments && error ? (
          <ErrorStateCard
            title={t("unableLoadConsultationAppointments")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setAppointmentsReloadToken((current) => current + 1)}
          />
        ) : null}
        {!loadingAppointments && !appointments.length ? (
          <EmptyStateCard
            title={t("noAppointmentsAssigned")}
            body={translateUiText("No appointments are ready for consultation right now. Confirm an appointment first, then return here.")}
          />
        ) : null}
        <div className="mt-4 grid gap-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("notes")}</span>
            <textarea
              className="doc-input min-h-28 resize-y"
              aria-label={t("notes")}
              data-voice-label={t("notes")}
              value={consultation.notes}
              onChange={(e) => setConsultation({ ...consultation, notes: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("outcome")}</span>
            <select
              className="doc-input"
              value={consultation.outcome}
              aria-label={t("outcome")}
              data-voice-label={t("outcome")}
              onChange={(e) => setConsultation({ ...consultation, outcome: e.target.value })}
            >
              <option value="ROUTINE">{t("routine")}</option>
              <option value="PRIORITY">{t("priority")}</option>
              <option value="IN_PERSON_REQUIRED">{t("inPersonRequired")}</option>
              <option value="EMERGENCY_REFERRAL">{t("emergencyReferral")}</option>
            </select>
          </label>
          <FormField label={t("followUpDate")} type="date" value={consultation.followUpDate} onChange={(e) => setConsultation({ ...consultation, followUpDate: e.target.value })} />
        </div>
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
              medications: [{
                medicineName: prescription.medicineName,
                dosage: prescription.dosage,
                frequency: prescription.frequency,
                durationDays: Number(prescription.durationDays),
                notes: ""
              }]
            });
            setExistingPrescriptionLoaded(true);
            setMessage(t("prescriptionCreatedScheduled").replace("{count}", data.medications.length));
          } catch (err) {
            const messageText = getApiErrorMessage(err, t("unableCreatePrescription"));
            if (messageText === "Prescription already created for consultation") {
              try {
                const existing = await fetchPrescriptionByConsultation(consultationId);
                const firstMedication = Array.isArray(existing.medications) ? existing.medications[0] : null;
                setPrescription({
                  patientDisplayName: existing.patientName ?? "",
                  notes: existing.notes ?? "",
                  followUpDate: existing.followUpDate ?? "",
                  medicineName: firstMedication?.medicineName ?? "",
                  dosage: firstMedication?.dosage ?? "",
                  frequency: firstMedication?.frequency ?? "",
                  durationDays: firstMedication?.durationDays ?? 5
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
        <LongitudinalTimelineCard patientId={selectedPatientId} />
      )}
        </div>
        <div className="xl:col-span-1 space-y-6">
      <AiConsultationSummaryCard
        consultationId={consultationId}
        onApplySummary={(summaryText) => setConsultation((current) => ({ ...current, notes: `${current.notes}\n${summaryText}`.trim() }))}
      />
      <AiMedicalScribePanel
        webrtcStream={webrtcStream}
        onSoapNoteGenerated={(data) => setConsultation((current) => ({
          ...current,
          notes: `${current.notes}\n\n[SUBJECTIVE]\n${data.subjective}\n\n[OBJECTIVE]\n${data.objective}\n\n[ASSESSMENT]\n${data.assessment}\n\n[PLAN]\n${data.plan}\n\n--- AI GENERATED, PENDING REVIEW ---`.trim()
        }))}
      />
      <AiTreatmentSuggestionsCard patientId={selectedPatientId} />
      <AiRiskCard patientId={selectedPatientId} titleKey="aiRiskInsightsDoctor" />
      <AiReportSummaryCard patientId={selectedPatientId} titleKey="aiReportSummaryDoctor" />
        </div>
      </div>
    </div>
  );
}
