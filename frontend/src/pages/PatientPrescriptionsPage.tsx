// @ts-nocheck
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientPrescriptions } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Pill, AlertTriangle, RefreshCw, FileText, CalendarDays, ShieldCheck, Truck } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
// @ts-expect-error
import SockJS from "sockjs-client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function PatientPrescriptionsPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [activeDelivery, setActiveDelivery] = useState<DynamicStateObject | null>(null);

  const {
    data: prescriptionsData,
    isLoading: loading,
    error: queryError,
    refetch: load
  } = useQuery({
    queryKey: ["prescriptions", patientId],
    queryFn: () => fetchPatientPrescriptions(patientId),
    enabled: !!patientId,
  });

  const prescriptions = Array.isArray(prescriptionsData) ? prescriptionsData : [];

  useEffect(() => {
    if (!prescriptions.length) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.protocol}//${window.location.host}/ws-telecare`),
      onConnect: () => {
        prescriptions.forEach((p: DynamicStateObject) => {
          client.subscribe(`/topic/delivery/${p.id}`, (message: DynamicStateObject) => {
            const body = JSON.parse(message.body);
            setActiveDelivery((prev: DynamicStateObject) => ({
              ...prev,
              orderId: body.orderId,
              prescriptionId: p.id,
              lat: body.lat,
              lng: body.lng,
              status: body.status
            }));
          });
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [prescriptions]);
  const error = queryError ? getApiErrorMessage(queryError, "Unable to load prescriptions.") : "";

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("prescriptions") || "Prescriptions"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("viewYourMedicalPrescriptionsAndDoctorSNotes") || "View your medical prescriptions and doctor's notes."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Pill size={12} className="text-primary" />{t("medications") || "Medications"}</span>
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

        <div className="max-w-4xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl font-medium">{t("prescriptionHistory") || "Prescription History"}</h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map((i: DynamicStateObject) => (
                <div key={i} className="card-premium h-32 animate-pulse flex flex-col justify-center">
                  <div className="h-6 w-1/3 bg-white/10 rounded mb-4"></div>
                  <div className="h-4 w-full bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadPrescriptions") || "Unable to load prescriptions"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}>
                <RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : !prescriptions.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <ShieldCheck size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noPrescriptionsAvailable") || "No Prescriptions Available"}</h3>
              <p className="text-sm text-ink-muted mb-6">{t("prescriptionsWillAppearHereAfterAConsultationIsCompleted") || "Prescriptions will appear here after a consultation is completed."}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors inline-flex items-center gap-2" onClick={load}>
                <RefreshCw size={14}/> {t("checkAgain") || "Check again"}</button>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((prescription: DynamicStateObject) => (
                <div key={prescription.id} className="card-premium">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
                    <div>
                      <h3 className="font-medium text-lg mb-1">{prescription.doctorName}</h3>
                      <p className="text-sm text-ink-muted flex items-center gap-1.5 font-mono">
                        <CalendarDays size={14} /> Follow-up: {prescription.followUpDate || "Not scheduled"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {activeDelivery?.prescriptionId === prescription.id && (
                        <span className="text-sm text-primary flex items-center gap-1.5 font-semibold bg-primary/10 px-3 py-1.5 rounded-full">
                          <Truck size={16} /> {t("deliveryInProgress") || "Delivery in Progress"}</span>
                      )}
                      <Link to={`/patient/prescriptions/${prescription.id}/print`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-ink-muted hover:text-ink hover:bg-white/10 border border-white/10 rounded-element text-sm font-medium transition-colors">
                        <FileText size={16} /> {t("print") || "Print"}</Link>
                    </div>
                  </div>
                  
                  {prescription.notes && (
                    <div className="mb-6 p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                      <p className="text-sm text-ink italic leading-relaxed">"{prescription.notes}"</p>
                    </div>
                  )}

                  <h4 className="text-sm font-semibold text-ink-muted uppercase tracking-widest mb-4">{t("medications") || "Medications"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Array.isArray(prescription.medications) ? prescription.medications : []).map((medicine: DynamicStateObject) => (
                      <div key={medicine.id} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-colors hover:bg-white/10">
                        <p className="font-medium text-ink mb-2">{medicine.medicineName}</p>
                        <p className="text-sm text-ink-muted mb-1 font-mono">{medicine.dosage} <span className="opacity-50">|</span> {medicine.frequency}</p>
                        <p className="text-xs text-ink-muted uppercase tracking-wider mt-2 pt-2 border-t border-white/10">Duration: {medicine.durationDays} days</p>
                      </div>
                    ))}
                  </div>

                  {activeDelivery?.prescriptionId === prescription.id && (
                    <div className="mt-6 p-5 bg-white/5 rounded-xl border border-primary/50 relative">
                      <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                      <h4 className="text-base font-semibold text-ink flex items-center gap-2 mb-4 relative z-10">
                        <Truck size={18} className="text-primary" />
                        {t("liveDeliveryTracking") || "Live Delivery Tracking"}<span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 ml-2">
                          (Simulated / Estimated)
                        </span>
                        <span className="text-[10px] bg-primary text-canvas px-2.5 py-1 rounded-full ml-auto uppercase tracking-wider font-bold">
                          {activeDelivery.status.replace(/_/g, ' ')}
                        </span>
                      </h4>
                      
                      <div className="relative w-full h-[300px] bg-surface rounded-xl border border-white/10 z-10">
                        <MapContainer {...{} as DynamicStateObject} center={[activeDelivery.lat, activeDelivery.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                          <TileLayer {...{} as DynamicStateObject}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">{t("openStreetMap") || "OpenStreetMap"}</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker {...{} as DynamicStateObject} position={[activeDelivery.lat, activeDelivery.lng]}>
                            <Popup>
                              🚚 Out for Delivery
                            </Popup>
                          </Marker>
                          <Marker {...{} as DynamicStateObject} position={[40.7128, -74.0060]}>
                            <Popup>
                              🏠 Destination
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                      <p className="text-xs text-ink-muted mt-3 text-center font-mono relative z-10">
                        Driver Coordinates: {activeDelivery.lat?.toFixed(5)}, {activeDelivery.lng?.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
