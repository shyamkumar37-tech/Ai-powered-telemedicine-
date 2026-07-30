import { useLanguage } from "../context/LanguageContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createAppointment, fetchTriageHistory, fetchDoctors } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { runWithRequestTimeout } from "../utils/requestLifecycle";
import { buildLoginRedirect } from "../utils/authSession";
import { getDoctorPortrait } from "../assets/doctorPortraits";
import {
  Stethoscope, User, LogOut, CheckCircle2, AlertTriangle,
  Clock3, Star, User2, RefreshCw, Search, FileText, IndianRupee,
  CalendarDays
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DatePicker } from "../components/ui/DatePicker";
import { isSameDay } from "date-fns";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function buildSlotsForDate(date: DynamicStateObject) {
  if (!date) return [];
  const hours = [9, 10, 11, 14, 15, 16];
  const now = new Date();
  
  const daySlots: DynamicStateObject = [];
  hours.forEach((hour: DynamicStateObject) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    if (d > now || !isSameDay(d, now)) {
      daySlots.push({
        value: d.toISOString().slice(0, 19),
        label: d.toLocaleString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()
      });
      const dHalf = new Date(date);
      dHalf.setHours(hour, 30, 0, 0);
      if (dHalf > now || !isSameDay(dHalf, now)) {
        daySlots.push({
          value: dHalf.toISOString().slice(0, 19),
          label: dHalf.toLocaleString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()
        });
      }
    }
  });
  return daySlots;
}

export default function PatientBookingPage() {
  const { t } = useLanguage();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const patientId = auth?.profileId;

  const [doctors, setDoctors] = useState<DynamicStateObject[]>([]);
  const [triageHistory, setTriageHistory] = useState<DynamicStateObject[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<DynamicState>(true);
  const [loadingTriage, setLoadingTriage] = useState<DynamicState>(true);
  const [doctorError, setDoctorError] = useState<DynamicState>("");
  
  const [query, setQuery] = useState<DynamicState>("");
  const [filter, setFilter] = useState<DynamicState>("All");
  
  const [selectedDoctor, setSelectedDoctor] = useState<DynamicStateObject | null>(null);
  const [selectedDate, setSelectedDate] = useState<DynamicState>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<DynamicStateObject | null>(null);
  const [mode, setMode] = useState<DynamicState>("TELECONSULTATION");
  const [concernSummary, setConcernSummary] = useState<DynamicState>("");
  
  const [booking, setBooking] = useState<DynamicState>(false);
  const [bookingSuccess, setBookingSuccess] = useState<DynamicState>(false);
  const [bookingError, setBookingError] = useState<DynamicState>("");

  const availableSlots = useMemo(() => buildSlotsForDate(selectedDate), [selectedDate]);
  const latestTriage = triageHistory[0] || null;

  useEffect(() => {
    let active = true;
    setLoadingDoctors(true);
    setDoctorError("");

    fetchDoctors()
      .then((data: DynamicStateObject) => {
        if (!active) return;
        setDoctors(data);
        setSelectedDoctor((data as DynamicStateObject)[0]);
      })
      .catch((err: DynamicStateObject) => {
        if (!active) return;
        setDoctorError("Failed to load doctors.");
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!patientId) {
      setLoadingTriage(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoadingTriage(true);

    runWithRequestTimeout((signal: DynamicStateObject) => fetchTriageHistory(patientId, { signal }), { signal: controller.signal })
      .then((data: DynamicStateObject) => {
        if (!active) return;
        const items = Array.isArray(data) ? [...data] : [];
        items.sort((a: DynamicStateObject, b: DynamicStateObject) => new Date((b.assessedAt as any) || 0).getTime() - new Date((a.assessedAt as any) || 0).getTime());
        setTriageHistory(items);
      })
      .catch((err: DynamicStateObject) => {
        if (active) setTriageHistory([]);
      })
      .finally(() => {
        if (active) setLoadingTriage(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patientId]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const filteredDoctors = useMemo(() => {
    let filtered = doctors;
    const q = query.trim().toLowerCase();
    
    if (q) {
      filtered = filtered.filter((d: DynamicStateObject) => 
        [d.fullName, d.specialization].filter(Boolean).some((val: string | number) => String(val).toLowerCase().includes(q))
      );
    }
    
    if (filter === "Available Today") {
      filtered = filtered.filter((d: DynamicStateObject) => String(d.availabilitySummary).toLowerCase().includes("today"));
    } else if (filter === "Price: Low to High") {
      filtered = [...filtered].sort((a: DynamicStateObject, b: DynamicStateObject) => (a.consultationFee || 0) - (b.consultationFee || 0));
    } else if (filter === "Top Rated") {
      filtered = [...filtered].sort((a: DynamicStateObject, b: DynamicStateObject) => b.id - a.id);
    }
    
    return filtered;
  }, [doctors, query, filter]);

  const confirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    
    setBooking(true);
    setBookingError("");

    try {
      await createAppointment({
        patientId,
        doctorId: Number(selectedDoctor.id),
        triageAssessmentId: latestTriage ? Number(latestTriage.id) : null,
        appointmentDateTime: selectedSlot.value,
        mode,
        concernSummary
      });

      setBookingSuccess(true);
      setTimeout(() => {
        navigate("/patient/appointments");
      }, 1500);

    } catch (err: DynamicStateObject) {
      setBookingError(getApiErrorMessage(err, "Unable to confirm appointment."));
      setBooking(false);
    }
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />

      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("bookYourNextConsultation") || "Book your next consultation"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("chooseATrustedSpecialistAndPickTheEarliestSuitableSlot") || "Choose a trusted specialist and pick the earliest suitable slot."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Stethoscope size={12} className="text-primary" />{t("care") || "Care"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {/* LEFT COLUMN: Doctors */}
          <div className="card-premium flex flex-col h-[calc(100vh-200px)]">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 mb-6">
              <div className="text-[10px] font-bold tracking-widest uppercase text-ink-muted">{t("step1Of3") || "Step 1 of 3"}</div>
              <h2 className="font-display text-xl font-medium">{t("chooseADoctor") || "Choose a doctor"}</h2>
              
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-element py-3 pl-12 pr-4 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-ink-muted"
                  placeholder="Search doctor or specialty..." 
                  value={query}
                  onChange={(e: DynamicStateObject) => setQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['All', 'Available Today', 'Price: Low to High', 'Top Rated'].map((f: DynamicStateObject) => (
                  <button 
                    key={f} 
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border border-white/10 ${filter === f ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted hover:text-ink hover:bg-white/5'}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 pr-2 space-y-4">
              <div className="text-sm text-ink-muted font-medium mb-4 flex items-center gap-2">
                <User2 size={16}/> {loadingDoctors ? "Loading doctors..." : `${filteredDoctors.length} doctors available`}
              </div>

              {loadingDoctors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i: DynamicStateObject) => (
                    <div key={i} className="p-5 border border-white/5 bg-white/5 rounded-xl animate-pulse flex flex-col gap-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full bg-white/10"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-2/3 bg-white/10 rounded"></div>
                          <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                        </div>
                      </div>
                      <div className="h-10 bg-white/10 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : doctorError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
                  <AlertTriangle size={32} className="text-alert mb-4" />
                  <h3 className="font-display text-lg mb-2">{t("unableToLoadDoctors") || "Unable to load doctors"}</h3>
                  <p className="text-sm text-ink-muted mb-6">{doctorError}</p>
                  <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={() => window.location.reload()}>
                    <RefreshCw size={16} /> {t("retry") || "Retry"}</button>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-xl border-dashed">
                  <Search size={32} className="text-ink-muted/50 mb-4" />
                  <h3 className="font-display text-lg mb-2">{t("noDoctorsAvailable") || "No doctors available"}</h3>
                  <p className="text-sm text-ink-muted">{t("tryAdjustingYourSearchQueryOrRemovingFiltersToSeeMoreResults") || "Try adjusting your search query or removing filters to see more results."}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  {filteredDoctors.map((doctor: DynamicStateObject) => {
                    const isSelected = selectedDoctor?.id === doctor.id;
                    const hasAvatar = !!getDoctorPortrait(doctor);
                    
                    return (
                      <div 
                        key={doctor.id} 
                        className={`p-5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                        onClick={() => setSelectedDoctor(doctor)}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        onKeyDown={(e: DynamicStateObject) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDoctor(doctor); }}}
                      >
                        <div className="flex gap-4 items-center mb-4">
                          <div className="w-14 h-14 rounded-full border border-white/20 bg-surface flex items-center justify-center shrink-0">
                            {hasAvatar ? (
                              <img src={getDoctorPortrait(doctor)} alt={doctor.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User2 size={24} className="text-ink-muted" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-base mb-1">{doctor.fullName}</h3>
                            <p className="text-xs text-ink-muted flex items-center gap-1.5 mb-1.5 flex-wrap">
                              {doctor.specialization} <span className="opacity-50">•</span> {doctor.age} yrs <span className="opacity-50">•</span> {doctor.gender}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Star size={12} fill="var(--color-brass)" className="text-[#C9A24B]" />
                              <span className="text-xs font-semibold text-[#C9A24B]">{doctor.rating}</span>
                              <span className="text-xs text-ink-muted">({doctor.reviewCount})</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-black/20 p-2.5 rounded border border-white/5 text-xs text-ink-muted">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <Clock3 size={14} className="shrink-0" />
                            <span className="truncate">{doctor.availabilitySummary}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-ink font-medium">
                            <IndianRupee size={12} />
                            <span>₹{doctor.consultationFee}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Scheduling */}
          <div className="flex flex-col gap-6">
            <div className="card-premium h-[calc(100vh-200px)] pr-2">
              <div className="flex flex-col gap-2 mb-6 border-b border-white/10 pb-6">
                <div className="text-[10px] font-bold tracking-widest uppercase text-ink-muted">{t("step2Of3") || "Step 2 of 3"}</div>
                <h2 className="font-display text-xl font-medium">{t("pickYourSlot") || "Pick your slot"}</h2>
                
                {selectedDoctor && (
                  <div className="inline-flex self-start items-center gap-4 mt-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <div className="flex items-center gap-1.5"><IndianRupee size={12} /> ₹{selectedDoctor.consultationFee} fee</div>
                    <div className="flex items-center gap-1.5"><Clock3 size={12} /> 30 min duration</div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-muted mb-2">{t("selectDate") || "Select Date"}</label>
                <div className="border border-white/10 rounded-element p-2 bg-white/5">
                  <DatePicker date={selectedDate} setDate={(date: DynamicStateObject) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }} />
                </div>
              </div>
              
              {selectedDate && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-ink-muted mb-3">{t("availableTimeSlots") || "Available Time Slots"}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.length > 0 ? availableSlots.map((slot: DynamicStateObject) => {
                      const isSelected = selectedSlot?.value === slot.value;
                      return (
                        <button
                          key={slot.value}
                          className={`py-2 px-3 rounded-element text-sm font-mono border transition-all flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-canvas' : 'bg-transparent border-white/10 text-ink-muted hover:text-ink hover:border-white/30'}`}
                          onClick={() => setSelectedSlot(slot)}
                          aria-pressed={isSelected}
                        >
                          {isSelected && <CheckCircle2 size={14} className="mr-1.5" />}
                          {slot.label}
                        </button>
                      );
                    }) : (
                      <div className="col-span-full text-sm text-ink-muted/50 py-4 text-center italic">{t("noSlotsAvailableOnThisDate") || "No slots available on this date."}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-muted mb-2" htmlFor="mode">{t("consultationMode") || "Consultation mode"}</label>
                <select id="mode" className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" value={mode} onChange={(e: DynamicStateObject) => setMode(e.target.value)}>
                  <option value="TELECONSULTATION" className="bg-surface">{t("teleconsultation") || "Teleconsultation"}</option>
                  <option value="IN_PERSON" className="bg-surface">{t("inPerson") || "In-person"}</option>
                  <option value="FOLLOW_UP" className="bg-surface">{t("followUp") || "Follow-up"}</option>
                </select>
              </div>

              <div className="mb-8 border-b border-white/10 pb-8">
                <label className="block text-sm font-medium text-ink-muted mb-2" htmlFor="reason">{t("reasonForVisit") || "Reason for visit"}</label>
                <textarea
                  id="reason"
                  className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-ink-muted/50"
                  rows={3}
                  placeholder="Briefly describe your symptoms or question"
                  value={concernSummary}
                  onChange={(e: DynamicStateObject) => setConcernSummary(e.target.value)}
                />
              </div>

              {selectedDoctor && selectedSlot && (
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl mt-4">
                  <div className="flex flex-col gap-2 mb-5">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-ink-muted">{t("step3Of3") || "Step 3 of 3"}</div>
                    <h3 className="font-display text-lg font-medium">{t("visitSummary") || "Visit summary"}</h3>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <User2 size={18} className="text-ink-muted shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-ink-muted uppercase tracking-wider mb-1">{t("doctor") || "Doctor"}</div>
                        <div className="text-sm font-medium">{selectedDoctor.fullName}</div>
                        <div className="text-xs text-ink-muted">{selectedDoctor.specialization}</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CalendarDays size={18} className="text-ink-muted shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-ink-muted uppercase tracking-wider mb-1">{t("dateTime") || "Date & Time"}</div>
                        <div className="text-sm font-medium">{new Date(selectedSlot.value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                        <div className="text-xs text-ink-muted">{mode === 'IN_PERSON' ? 'In-person visit' : 'Teleconsultation'}</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <IndianRupee size={18} className="text-ink-muted shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-ink-muted uppercase tracking-wider mb-1">{t("consultationFee") || "Consultation Fee"}</div>
                        <div className="text-sm font-medium">₹{selectedDoctor.consultationFee}</div>
                      </div>
                    </div>

                    {concernSummary.trim() && (
                      <div className="flex gap-4">
                        <FileText size={18} className="text-ink-muted shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-ink-muted uppercase tracking-wider mb-1">{t("reasonForVisit") || "Reason for visit"}</div>
                          <div className="text-sm text-ink-muted italic border-l-2 border-white/10 pl-3 py-1">
                            {concernSummary}
                          </div>
                        </div>
                      </div>
                    )}

                    {latestTriage && (
                      <div className="flex gap-4 mt-2 p-3 bg-[#C9A24B]/5 border border-[#C9A24B]/20 rounded-element">
                        <AlertTriangle size={18} className="text-[#C9A24B] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[#C9A24B] uppercase tracking-wider mb-1">{t("triageAttached") || "Triage Attached"}</div>
                          <div className="text-xs text-[#C9A24B]/80 leading-relaxed">
                            {latestTriage.symptoms}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <div className="mt-5 p-3 bg-alert/10 border border-alert/20 text-alert rounded-element text-sm">
                      {bookingError}
                    </div>
                  )}

                  <button 
                    className="btn-primary w-full mt-6 flex justify-center py-3"
                    onClick={confirmBooking}
                    disabled={booking || bookingSuccess}
                  >
                    {bookingSuccess ? (
                      <><CheckCircle2 size={18} className="mr-2" /> {t("confirmed") || "Confirmed!"}</>
                    ) : booking ? (
                      <><RefreshCw size={18} className="mr-2 animate-spin" /> {t("processing") || "Processing..."}</>
                    ) : (
                      "Confirm appointment"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
