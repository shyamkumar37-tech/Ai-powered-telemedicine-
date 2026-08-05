import { useState, useEffect } from "react";
import { AlertTriangle, X, Bell, MapPin, Heart, Activity, PhoneCall, ShieldCheck } from "lucide-react";
import { addClinicalBreadcrumb, captureClinicalException } from "../../utils/sentryObservability";

export interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  heartRate?: number;
  spO2?: number;
}

export default function EmergencySosModal({
  isOpen,
  onClose,
  patientName = "Anita Patient",
  heartRate = 74,
  spO2 = 97
}: EmergencySosModalProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [locationText, setLocationText] = useState<string>("12.9756°N, 77.6050°E — MG Road, Bengaluru 560001");
  const [ambulanceCalling, setAmbulanceCalling] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsActivated(false);
      setAmbulanceCalling(false);
      return;
    }

    addClinicalBreadcrumb("sos", "Emergency SOS modal opened", { patientName });

    // Attempt to acquire real browser GPS geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          setLocationText(`${lat}°N, ${lng}°E — Current GPS Coordinates`);
        },
        () => {
          // Fallback to default location
        },
        { timeout: 4000 }
      );
    }

    let timer: any = null;
    if (!isActivated && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsActivated(true);
            addClinicalBreadcrumb("sos", "Emergency SOS auto-activated after countdown");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isActivated, countdown, patientName]);

  if (!isOpen) return null;

  const handleCancelCountdown = () => {
    addClinicalBreadcrumb("sos", "Emergency SOS cancelled during countdown");
    onClose();
  };

  const handleCancelEmergency = () => {
    addClinicalBreadcrumb("sos", "Emergency SOS reset to safe state by user");
    onClose();
  };

  const handleCallAmbulance = () => {
    setAmbulanceCalling(true);
    addClinicalBreadcrumb("sos", "Ambulance call dispatched by user");
    try {
      window.location.href = "tel:108";
    } catch (err: unknown) {
      captureClinicalException(err, { action: "ambulance-call" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-dialog-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-rose-950/60 text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-500">
              <AlertTriangle size={22} className="animate-pulse" />
            </div>
            <h2 id="sos-dialog-title" className="text-xl font-bold text-white tracking-tight">
              Emergency SOS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close SOS modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* State 1: Countdown Mode */}
        {!isActivated ? (
          <div className="text-center py-4 space-y-6">
            {/* Big Countdown Circle */}
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-rose-950/40 border border-rose-500/30 shadow-inner">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-600/30 border border-rose-500/60 text-4xl font-extrabold text-rose-500 animate-pulse">
                {countdown}
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-white">Alerting in {countdown} seconds</p>
              <p className="text-sm text-slate-400 mt-1">Tap cancel to stop the alert</p>
            </div>

            <button
              type="button"
              onClick={handleCancelCountdown}
              className="mt-4 px-8 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* State 2: Activated SOS Dispatch View */
          <div className="space-y-4 py-1 animate-in fade-in duration-300">
            {/* Activated Header */}
            <div className="text-center py-2 space-y-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
                <Bell size={26} className="animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-emerald-400">SOS Activated</h3>
              <p className="text-xs text-slate-400">Your location and vitals have been shared</p>
            </div>

            {/* Notified Contacts List */}
            <div className="space-y-2">
              {[
                { name: "Priya Mehta (Spouse)", role: "Emergency Contact" },
                { name: "Apollo Emergency", role: "Hospital Services" },
                { name: "Dr. Ananya Sharma", role: "Primary Physician" }
              ].map((contact, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <PhoneCall size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-200">{contact.name}</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                    Notified
                  </span>
                </div>
              ))}
            </div>

            {/* Location Card */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <MapPin size={14} className="text-rose-500" />
                <span>Your Location</span>
              </div>
              <p className="text-xs text-slate-300 font-mono pl-5">{locationText}</p>
            </div>

            {/* Vitals Snapshot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex items-center gap-3">
                <Heart size={20} className="text-rose-500 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Heart Rate</div>
                  <div className="text-base font-bold text-white">{heartRate} bpm</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex items-center gap-3">
                <Activity size={20} className="text-teal-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">SpO2</div>
                  <div className="text-base font-bold text-white">{spO2}%</div>
                </div>
              </div>
            </div>

            {/* Call Ambulance Action */}
            <button
              type="button"
              onClick={handleCallAmbulance}
              className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40 active:scale-98 transition-all"
            >
              <PhoneCall size={18} />
              {ambulanceCalling ? "Connecting Ambulance..." : "Call Ambulance Now"}
            </button>

            {/* Reset / Safe Link */}
            <button
              type="button"
              onClick={handleCancelEmergency}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 py-1"
            >
              <ShieldCheck size={14} />
              <span>I'm safe — cancel emergency</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
