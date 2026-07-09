import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createAppointment, fetchTriageHistory, fetchDoctors } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { runWithRequestTimeout } from "../utils/requestLifecycle";
import { buildLoginRedirect } from "../utils/authSession";
import { getDoctorPortrait } from "../assets/doctorPortraits";
import "./patient-booking-override.css";
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, User, LogOut, CheckCircle2, AlertTriangle,
  Clock3, Star, User2, RefreshCw, Search, FileText, IndianRupee
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DatePicker } from "../components/ui/DatePicker";
import { isSameDay } from "date-fns";

// 1. Realistic Seed Data to replace "Test Doctor" entries.
const SEED_DOCTORS = [
  {
    id: 101,
    fullName: "Dr. Sarah Chen",
    specialization: "General Medicine",
    age: 42,
    gender: "Female",
    consultationFee: 800,
    availabilitySummary: "Available today",
    rating: 4.9,
    reviewCount: 124,
    avatarUrl: null
  },
  {
    id: 102,
    fullName: "Dr. Marcus Thorne",
    specialization: "Cardiology",
    age: 55,
    gender: "Male",
    consultationFee: 1500,
    availabilitySummary: "Available tomorrow",
    rating: 4.8,
    reviewCount: 312,
    avatarUrl: null
  },
  {
    id: 103,
    fullName: "Dr. Priya Sharma",
    specialization: "Dermatology",
    age: 36,
    gender: "Female",
    consultationFee: 1000,
    availabilitySummary: "Available today",
    rating: 4.7,
    reviewCount: 89,
    avatarUrl: null
  },
  {
    id: 104,
    fullName: "Dr. James Wilson",
    specialization: "Neurology",
    age: 48,
    gender: "Male",
    consultationFee: 2000,
    availabilitySummary: "Next available on Friday",
    rating: 4.9,
    reviewCount: 405,
    avatarUrl: null
  },
  {
    id: 105,
    fullName: "Dr. Elena Rodriguez",
    specialization: "Pediatrics",
    age: 39,
    gender: "Female",
    consultationFee: 1200,
    availabilitySummary: "Available today",
    rating: 4.9,
    reviewCount: 256,
    avatarUrl: null
  }
];

function buildSlotsForDate(date) {
  if (!date) return [];
  const hours = [9, 10, 11, 14, 15, 16];
  const now = new Date();
  
  const daySlots = [];
  hours.forEach((hour) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    // Only show future slots if the selected date is today
    if (d > now || !isSameDay(d, now)) {
      daySlots.push({
        value: d.toISOString().slice(0, 19),
        label: d.toLocaleString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()
      });
      // Add a half hour slot
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
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = auth?.profileId;

  const [doctors, setDoctors] = useState([]);
  const [triageHistory, setTriageHistory] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTriage, setLoadingTriage] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState("TELECONSULTATION");
  const [concernSummary, setConcernSummary] = useState("");
  
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const availableSlots = useMemo(() => buildSlotsForDate(selectedDate), [selectedDate]);
  const latestTriage = triageHistory[0] || null;

  // Initial Data Fetch
  useEffect(() => {
    let active = true;
    setLoadingDoctors(true);
    setDoctorError("");

    fetchDoctors()
      .then(data => {
        if (!active) return;
        setDoctors(data);
        setSelectedDoctor(data[0]);
      })
      .catch(err => {
        if (!active) return;
        setDoctorError("Failed to load doctors.");
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!patientId) {
      setLoadingTriage(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoadingTriage(true);

    runWithRequestTimeout((signal) => fetchTriageHistory(patientId, { signal }), { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data) ? [...data] : [];
        items.sort((a, b) => new Date(b.assessedAt || 0) - new Date(a.assessedAt || 0));
        setTriageHistory(items);
      })
      .catch((err) => {
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
      filtered = filtered.filter(d => 
        [d.fullName, d.specialization].filter(Boolean).some(val => String(val).toLowerCase().includes(q))
      );
    }
    
    if (filter === "Available Today") {
      filtered = filtered.filter(d => String(d.availabilitySummary).toLowerCase().includes("today"));
    } else if (filter === "Price: Low to High") {
      filtered = [...filtered].sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    } else if (filter === "Top Rated") {
      filtered = [...filtered].sort((a, b) => b.id - a.id);
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

    } catch (err) {
      setBookingError(getApiErrorMessage(err, "Unable to confirm appointment."));
      setBooking(false);
    }
  };

  return (
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />

        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Book your next consultation</h1>
              <p>Choose a trusted specialist and pick the earliest suitable slot.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Stethoscope />Care
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="booking-layout">
            
            <div className="doctors-panel">
              <div className="doctors-header">
                <div className="step-indicator">Step 1 of 3</div>
                <h2>Choose a doctor</h2>
                
                <div className="search-input-wrapper">
                  <Search />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search doctor or specialty..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                
                <div className="filter-bar">
                  {['All', 'Available Today', 'Price: Low to High', 'Top Rated'].map(f => (
                    <button 
                      key={f} 
                      className={`filter-pill ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="doctors-scroll-area">
                <div className="doctor-count">
                  <User2 size={16}/> {loadingDoctors ? "Loading doctors..." : `${filteredDoctors.length} doctors available`}
                </div>

                {loadingDoctors ? (
                  <div className="doctors-grid">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="doctor-card" style={{ pointerEvents: 'none' }}>
                        <div className="doc-card-top">
                          <div className="doc-avatar-container skeleton-pulse"></div>
                          <div className="doc-info" style={{ gap: '8px' }}>
                            <div className="skeleton-pulse" style={{ height: '16px', width: '70%', borderRadius: '4px' }}></div>
                            <div className="skeleton-pulse" style={{ height: '12px', width: '50%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                        <div className="doc-meta" style={{ gap: '8px', paddingTop: '16px' }}>
                           <div className="skeleton-pulse" style={{ height: '14px', width: '100px', borderRadius: '4px' }}></div>
                           <div className="skeleton-pulse" style={{ height: '14px', width: '80px', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : doctorError ? (
                  <div className="empty-state">
                    <AlertTriangle />
                    <h3>Unable to load doctors</h3>
                    <p>{doctorError}</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}><RefreshCw /> Retry</button>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="empty-state">
                    <Search />
                    <h3>No doctors available</h3>
                    <p>Try adjusting your search query or removing filters to see more results.</p>
                  </div>
                ) : (
                  <div className="doctors-grid">
                    {filteredDoctors.map(doctor => {
                      const isSelected = selectedDoctor?.id === doctor.id;
                      const hasAvatar = !!getDoctorPortrait(doctor);
                      
                      return (
                        <div 
                          key={doctor.id} 
                          className={`doctor-card tct-animate-in ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDoctor(doctor)}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isSelected}
                          onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDoctor(doctor); }}}
                        >
                          <div className="doc-card-top">
                            <div className="doc-avatar-container">
                              {hasAvatar ? (
                                <img src={getDoctorPortrait(doctor)} alt={doctor.fullName} className="doc-avatar" />
                              ) : (
                                <User2 size={32} className="doc-fallback" />
                              )}
                            </div>
                            <div className="doc-info">
                              <h3 className="doc-name">{doctor.fullName}</h3>
                              {/* Fix 2: Render demographics separately */}
                              <p className="doc-specialty" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {doctor.specialization}
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>{doctor.age} yrs</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>{doctor.gender}</span>
                              </p>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                <Star size={12} fill="var(--tct-brass)" color="var(--tct-brass)" />
                                <span style={{ fontSize: '12px', color: 'var(--tct-brass)', fontWeight: '600' }}>{doctor.rating}</span>
                                <span style={{ fontSize: '12px', color: 'var(--tct-text-muted)' }}>({doctor.reviewCount})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="doc-meta">
                            <div className="doc-meta-item">
                              <Clock3 />
                              <span>{doctor.availabilitySummary}</span>
                            </div>
                            <div className="doc-meta-item" style={{ marginLeft: 'auto' }}>
                              <IndianRupee />
                              <span className="doc-meta-val">₹{doctor.consultationFee}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="scheduling-panel">
              <div className="scheduling-scroll-area">
                
                <div className="schedule-header tct-animate-in tct-delay-1">
                  <div className="step-indicator">Step 2 of 3</div>
                  <h2>Pick your slot</h2>
                  {/* Fix 4: Show the selected doctor's fee and appointment duration inside the "Pick your slot" panel */}
                  {selectedDoctor && (
                    <div style={{ display: 'inline-flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: 'var(--tct-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '100px', border: '1px solid var(--tct-panel-line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IndianRupee size={14} /> ₹{selectedDoctor.consultationFee} consultation fee</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock3 size={14} /> 30 min duration</div>
                    </div>
                  )}
                </div>

                <div className="slot-section tct-animate-in tct-delay-1">
                  <div className="mb-4">
                    <label className="form-label">Select Date</label>
                    <DatePicker date={selectedDate} setDate={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null); // Reset slot when date changes
                    }} />
                  </div>
                  
                  {selectedDate && (
                    <div>
                      <div className="slot-date-header">Available Time Slots</div>
                      <div className="slot-grid">
                        {availableSlots.length > 0 ? availableSlots.map(slot => {
                          const isSelected = selectedSlot?.value === slot.value;
                          return (
                            <button
                              key={slot.value}
                              className={`slot-btn ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                              aria-pressed={isSelected}
                            >
                              {isSelected && <CheckCircle2 size={16} style={{ marginRight: '6px' }} />}
                              {slot.label}
                            </button>
                          );
                        }) : (
                          <div className="text-sm text-slate-400 py-4">No slots available on this date.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="tct-animate-in tct-delay-1" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="mode">Consultation mode</label>
                  <select id="mode" className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="TELECONSULTATION">Teleconsultation</option>
                    <option value="IN_PERSON">In-person</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </select>
                </div>

                <div className="tct-animate-in tct-delay-1">
                  <label className="form-label" htmlFor="reason">Reason for visit</label>
                  <textarea
                    id="reason"
                    className="form-input form-textarea"
                    placeholder="Briefly describe your symptoms or question"
                    value={concernSummary}
                    onChange={(e) => setConcernSummary(e.target.value)}
                  />
                </div>

                {selectedDoctor && selectedSlot && (
                  <div className="summary-card tct-animate-in tct-delay-2">
                    <div className="summary-header">
                      <div className="step-indicator" style={{ marginBottom: '0' }}>Step 3 of 3</div>
                      <h3>Visit summary</h3>
                    </div>

                    <div className="summary-item">
                      <User2 />
                      <div className="summary-item-content">
                        <div className="summary-item-label">Doctor</div>
                        <div className="summary-item-val">{selectedDoctor.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--tct-text-muted)' }}>{selectedDoctor.specialization}</div>
                      </div>
                    </div>

                    <div className="summary-item">
                      <CalendarDays />
                      <div className="summary-item-content">
                        <div className="summary-item-label">Date & Time</div>
                        <div className="summary-item-val">{new Date(selectedSlot.value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '12px', color: 'var(--tct-text-muted)' }}>{mode === 'IN_PERSON' ? 'In-person visit' : 'Teleconsultation'}</div>
                      </div>
                    </div>

                    <div className="summary-item">
                      <IndianRupee />
                      <div className="summary-item-content">
                        <div className="summary-item-label">Consultation Fee</div>
                        <div className="summary-item-val">₹{selectedDoctor.consultationFee}</div>
                      </div>
                    </div>

                    {concernSummary.trim() && (
                      <div className="summary-item">
                        <FileText />
                        <div className="summary-item-content">
                          <div className="summary-item-label">Reason for visit</div>
                          <div className="summary-item-readonly-box">
                            {concernSummary}
                          </div>
                        </div>
                      </div>
                    )}

                    {latestTriage && (
                      <div className="summary-item" style={{ marginTop: '16px' }}>
                        <AlertTriangle style={{ color: 'var(--tct-brass)' }}/>
                        <div className="summary-item-content">
                          <div className="summary-item-label" style={{ color: 'var(--tct-brass)' }}>Triage Attached</div>
                          <div style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>
                            {latestTriage.symptoms}
                          </div>
                        </div>
                      </div>
                    )}

                    {bookingError && (
                      <div style={{ padding: '12px', background: 'var(--tct-coral-dim)', color: 'var(--tct-coral)', borderRadius: '8px', fontSize: '13px', marginTop: '16px' }}>
                        {bookingError}
                      </div>
                    )}

                    <button 
                      className="btn-teal"
                      onClick={confirmBooking}
                      disabled={booking || bookingSuccess}
                    >
                      {bookingSuccess ? (
                        <><CheckCircle2 size={18} /> Confirmed!</>
                      ) : booking ? (
                        <><RefreshCw size={18} className="skeleton-pulse" style={{ borderRadius: '50%' }}/> Processing...</>
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
    </div>
  );
}
