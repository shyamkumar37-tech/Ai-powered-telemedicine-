import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientPrescriptions, placePharmacyOrder } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Pill, AlertTriangle, RefreshCw, FileText, CalendarDays, ShieldCheck, MapPin, Truck } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  
  const [activeDelivery, setActiveDelivery] = useState(null);

  useEffect(() => {
    if (!activeDelivery?.orderId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws-telecare"),
      onConnect: () => {
        client.subscribe(`/topic/delivery/${activeDelivery.orderId}`, (message) => {
          const body = JSON.parse(message.body);
          setActiveDelivery(prev => ({
            ...prev,
            lat: body.lat,
            lng: body.lng,
            status: body.status
          }));
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [activeDelivery?.orderId]);
  
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
  const error = queryError ? getApiErrorMessage(queryError, "Unable to load prescriptions.") : "";

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Prescriptions</h1>
              <p>View your medical prescriptions and doctor's notes.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Pill />Medications
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
            <div style={{ flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.5px' }}>Prescription History</h2>
              </div>

              {loading ? (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {[1, 2].map(i => (
                    <div key={i} className="doctor-card" style={{ pointerEvents: 'none', height: '100px' }}>
                      <div className="skeleton-pulse" style={{ height: '24px', width: '30%', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '100%', borderRadius: '4px' }}></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">
                  <AlertTriangle />
                  <h3>Unable to load prescriptions</h3>
                  <p>{error}</p>
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                </div>
              ) : !loading && !error && !prescriptions.length ? (
                <div className="empty-state">
                  <ShieldCheck />
                  <h3>No Prescriptions Available</h3>
                  <p>Prescriptions will appear here after a consultation is completed.</p>
                  {/* Replaced 'Retry' with 'Check again' or no button, but since they might be waiting, 'Check again' is appropriate if they expect one, otherwise no button needed. Let's just have a subtle Check again button */}
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw size={14}/> Check again</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="doctor-card" style={{ cursor: 'default', display: 'block', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--tct-panel-line-strong)', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '600', marginBottom: '6px' }}>{prescription.doctorName}</h3>
                          <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CalendarDays size={14} /> Follow-up: {prescription.followUpDate || "Not scheduled"}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            className="btn-teal" 
                            style={{ fontSize: '14px' }}
                            disabled={activeDelivery?.prescriptionId === prescription.id}
                            onClick={async () => {
                              try {
                                const data = await placePharmacyOrder({ prescriptionId: prescription.id });
                                setActiveDelivery({ 
                                  orderId: data.orderId, 
                                  prescriptionId: prescription.id,
                                  lat: data.driverLocation.lat,
                                  lng: data.driverLocation.lng,
                                  status: data.status
                                });
                              } catch(e) {
                                alert("Failed to place pharmacy order.");
                              }
                            }}
                          >
                            <span style={{marginRight: '6px'}}>💊</span> {activeDelivery?.prescriptionId === prescription.id ? "Tracking..." : "One-Click Delivery"}
                          </button>
                          <Link to={`/patient/prescriptions/${prescription.id}/print`} className="btn-ghost" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '14px' }}>
                            <FileText size={16} /> Print
                          </Link>
                        </div>
                      </div>
                      
                      {prescription.notes && (
                        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '3px solid var(--tct-teal)' }}>
                          <p style={{ fontSize: '14px', color: '#E2E8F0', fontStyle: 'italic', lineHeight: '1.5' }}>"{prescription.notes}"</p>
                        </div>
                      )}

                      <h4 style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600', marginBottom: '12px' }}>Medications</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {(Array.isArray(prescription.medications) ? prescription.medications : []).map((medicine) => (
                          <div key={medicine.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', padding: '16px' }}>
                            <p style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600', marginBottom: '8px' }}>{medicine.medicineName}</p>
                            <p style={{ fontSize: '13px', color: '#E2E8F0' }}>{medicine.dosage} | {medicine.frequency}</p>
                            <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>Duration: {medicine.durationDays} days</p>
                          </div>
                        ))}
                      </div>

                      {activeDelivery?.prescriptionId === prescription.id && (
                        <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--tct-teal)' }}>
                          <h4 style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Truck size={18} color="var(--tct-teal)" />
                            Live Delivery Tracking
                            <span style={{ fontSize: '12px', background: 'var(--tct-teal)', color: '#000', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto' }}>
                              {activeDelivery.status.replace(/_/g, ' ')}
                            </span>
                          </h4>
                          
                          <div style={{ position: 'relative', width: '100%', height: '300px', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                            <MapContainer center={[activeDelivery.lat, activeDelivery.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[activeDelivery.lat, activeDelivery.lng]}>
                                <Popup>
                                  🚚 Out for Delivery
                                </Popup>
                              </Marker>
                              <Marker position={[40.7128, -74.0060]}>
                                <Popup>
                                  🏠 Destination
                                </Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '12px', textAlign: 'center' }}>
                            Driver Coordinates: {activeDelivery.lat?.toFixed(5)}, {activeDelivery.lng?.toFixed(5)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
