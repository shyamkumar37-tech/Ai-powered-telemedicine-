import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  createAppointment,
  fetchDoctors,
  fetchTriageHistory
} from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { useToast } from "../components/ui/ToastProvider";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import Badge from "../components/ui/Badge";
import DoctorList from "../components/booking/DoctorList";
import BookingSummary from "../components/booking/BookingSummary";
import { TRIAGE_UPDATED_EVENT, TRIAGE_UPDATED_STORAGE_KEY } from "../utils/appEvents";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";

function buildSlots() {
  const hours = [10, 12, 16, 18];
  const labels = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 4; dayOffset += 1) {
    hours.forEach((hour) => {
      const slotDate = new Date(now);
      slotDate.setDate(now.getDate() + dayOffset);
      slotDate.setHours(hour, 30, 0, 0);
      if (slotDate > now) {
        labels.push({
          value: slotDate.toISOString().slice(0, 19),
          label: slotDate.toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          })
        });
      }
    });
  }

  return labels.slice(0, 8);
}

export default function PatientBookingPage() {
  const { auth } = useAuth();
  const { t, translateUiText = (value) => value } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = auth.profileId;
  const copyRef = useRef({
    doctorError: "Unable to load doctors right now.",
    triageError: t("unableLoadTriageHistory")
  });

  const [doctors, setDoctors] = useState([]);
  const [triageHistory, setTriageHistory] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTriage, setLoadingTriage] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [triageError, setTriageError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState("TELECONSULTATION");
  const [concernSummary, setConcernSummary] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [doctorReloadToken, setDoctorReloadToken] = useState(0);
  const [triageReloadToken, setTriageReloadToken] = useState(0);

  const slots = useMemo(() => buildSlots(), []);
  const deferredQuery = useDeferredValue(query);
  const latestTriage = triageHistory[0] || null;

  useEffect(() => {
    copyRef.current = {
      doctorError: translateUiText("Unable to load doctors right now."),
      triageError: t("unableLoadTriageHistory")
    };
  }, [t, translateUiText]);

  const reloadDoctors = useCallback(() => {
    setDoctorReloadToken((current) => current + 1);
  }, []);

  const reloadTriage = useCallback(() => {
    setTriageReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoadingDoctors(true);
    setDoctorError("");

    runWithRequestTimeout(
      (signal) => fetchDoctors({ signal }),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!active) {
          return;
        }
        const items = Array.isArray(data) ? data : [];
        setDoctors(items);
        setSelectedDoctor((current) => {
          if (current && items.some((doctor) => doctor.id === current.id)) {
            return current;
          }
          return items[0] || null;
        });
      })
      .catch((err) => {
        if (!active || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          return;
        }
        setDoctors([]);
        setDoctorError(getApiErrorMessage(err, copyRef.current.doctorError));
        logAsyncFailure("patient-booking:doctors", err, { patientId });
      })
      .finally(() => {
        if (active) {
          setLoadingDoctors(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [doctorReloadToken]);

  useEffect(() => {
    if (!patientId) {
      setTriageHistory([]);
      setLoadingTriage(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoadingTriage(true);
    setTriageError("");

    runWithRequestTimeout(
      (signal) => fetchTriageHistory(patientId, { signal }),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!active) {
          return;
        }
        const items = Array.isArray(data) ? [...data] : [];
        items.sort((left, right) => new Date(right.assessedAt || right.createdAt || 0) - new Date(left.assessedAt || left.createdAt || 0));
        setTriageHistory(items);
      })
      .catch((err) => {
        if (!active || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          return;
        }
        setTriageHistory([]);
        setTriageError(getApiErrorMessage(err, copyRef.current.triageError));
        logAsyncFailure("patient-booking:triage-history", err, { patientId });
      })
      .finally(() => {
        if (active) {
          setLoadingTriage(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patientId, triageReloadToken]);

  useEffect(() => {
    const handleTriageUpdated = () => {
      reloadTriage();
    };

    const handleStorage = (event) => {
      if (event.key === TRIAGE_UPDATED_STORAGE_KEY) {
        reloadTriage();
      }
    };

    const handleFocus = () => {
      if (!latestTriage) {
        reloadTriage();
      }
    };

    window.addEventListener(TRIAGE_UPDATED_EVENT, handleTriageUpdated);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(TRIAGE_UPDATED_EVENT, handleTriageUpdated);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [latestTriage, reloadTriage]);

  useEffect(() => {
    if (location.state?.triageCompleted) {
      reloadTriage();
    }
  }, [location.state, reloadTriage]);

  const openConfirmation = () => {
    if (!latestTriage) {
      setBookingError("You must complete triage before booking.");
      return;
    }
    if (!selectedDoctor) {
      setBookingError("Select a doctor to continue.");
      return;
    }
    if (!selectedSlot) {
      setBookingError("Select a consultation slot to continue.");
      return;
    }
    setBookingError("");
    setConfirmOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !latestTriage) {
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const appointment = await createAppointment({
        patientId,
        doctorId: Number(selectedDoctor.id),
        triageAssessmentId: Number(latestTriage.id),
        appointmentDateTime: selectedSlot.value,
        mode,
        concernSummary
      });

      pushToast({
        type: "success",
        title: "Appointment confirmed",
        message: `Your consultation with ${appointment.doctorName} is scheduled.`
      });
      setConfirmOpen(false);
      navigate("/patient/appointments");
    } catch (err) {
      const message = getApiErrorMessage(err, t("unableBookAppointment"));
      setBookingError(message);
      pushToast({ type: "error", title: t("unableBookAppointment"), message });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <SectionCard
        title={translateUiText("Book your next consultation")}
        action={
          <div className="flex min-w-0 flex-wrap gap-2">
            <Badge tone="info" className="gap-1 normal-case tracking-normal">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Doctors
            </Badge>
            <Badge tone="success" className="gap-1 normal-case tracking-normal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Secure Data
            </Badge>
            <Badge tone="default">HIPAA-like safeguards</Badge>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Step 1</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Choose a trusted specialist</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Step 2</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Pick the earliest suitable slot</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Step 3</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Review once and confirm</p>
          </div>
        </div>
      </SectionCard>

      {!loadingTriage && !latestTriage ? (
        <ErrorStateCard
          title={translateUiText("Complete triage first")}
          body={translateUiText("You must complete triage before booking. This helps us recommend the right doctor and urgency level.")}
          actionLabel={translateUiText("Complete Triage First")}
          onAction={() => navigate("/patient/triage")}
        />
      ) : null}

      {triageError ? (
        <ErrorStateCard
          title={t("unableLoadTriageHistory")}
          body={triageError}
          actionLabel={translateUiText("Retry")}
          onAction={reloadTriage}
        />
      ) : null}

      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,400px)]">
        <SectionCard
          title={translateUiText("Choose a doctor")}
          className="min-w-0"
        >
          {loadingDoctors ? <LoadingSkeleton lines={5} /> : null}
          {!loadingDoctors && doctorError ? (
            <ErrorStateCard
              title={translateUiText("Unable to load doctors")}
              body={doctorError}
              actionLabel={translateUiText("Retry")}
              onAction={reloadDoctors}
            />
          ) : null}
          {!loadingDoctors && !doctorError && !doctors.length ? (
            <EmptyStateCard
              title={translateUiText("No doctors available")}
              body={translateUiText("Doctors will appear here once schedules are available.")}
              illustration="doctors"
            />
          ) : null}
          {!loadingDoctors && !doctorError && doctors.length ? (
            <DoctorList
              doctors={doctors}
              query={query}
              filterQuery={deferredQuery}
              onQueryChange={setQuery}
              selectedDoctorId={selectedDoctor?.id}
              onSelectDoctor={setSelectedDoctor}
            />
          ) : null}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title={translateUiText("Pick your slot")}
            action={<Badge tone="default">{mode === "IN_PERSON" ? "In-person" : mode === "FOLLOW_UP" ? "Follow-up" : "Video consult"}</Badge>}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  className={`rounded-2xl border px-4 py-4 text-left transition ${selectedSlot?.value === slot.value ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="inline-flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4" />
                    {slot.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600">Consultation mode</span>
                <select className="field" value={mode} onChange={(event) => setMode(event.target.value)}>
                  <option value="TELECONSULTATION">Teleconsultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="IN_PERSON">In-person</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600">Reason for visit</span>
                <textarea
                  className="field min-h-28 resize-y"
                  value={concernSummary}
                  placeholder="Briefly describe your symptoms or question"
                  onChange={(event) => setConcernSummary(event.target.value)}
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title={translateUiText("Visit summary")}
            action={
              latestTriage ? (
                <Badge tone="warning" className="gap-1 normal-case tracking-normal">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {latestTriage.level || "Triage linked"}
                </Badge>
              ) : null
            }
          >
            <BookingSummary
              doctor={selectedDoctor}
              slot={selectedSlot}
              mode={mode}
              concernSummary={concernSummary}
            />

            {latestTriage ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  Latest triage linked
                </div>
                <p className="mt-2">{latestTriage.symptoms || "Symptoms summary not available"}</p>
              </div>
            ) : null}

            {bookingError ? <p className="mt-4 text-sm text-red-600" role="alert">{bookingError}</p> : null}

            <div className="mt-5">
              <Button className="w-full" onClick={openConfirmation}>
                Review and confirm
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm consultation"
        description="Review the details once more before we reserve this slot."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <Button loading={booking} onClick={confirmBooking}>
              Confirm Appointment
            </Button>
          </>
        )}
      >
        <BookingSummary
          doctor={selectedDoctor}
          slot={selectedSlot}
          mode={mode}
          concernSummary={concernSummary}
        />
      </Modal>
    </div>
  );
}
