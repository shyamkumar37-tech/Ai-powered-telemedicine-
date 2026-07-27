import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// @ts-expect-error
import L from "leaflet";
import { ShieldAlert, MapPin } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

// Fix for leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface GeofenceMapProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function GeofenceMap({ patientId }: GeofenceMapProps) {
  const { t } = useLanguage();
  const [patientLocation, setPatientLocation] = useState<DynamicState>([37.7749, -122.4194]);
  const [geofenceCenter, setGeofenceCenter] = useState<DynamicState>([37.7749, -122.4194]);
  const [geofenceRadius, setGeofenceRadius] = useState<DynamicState>(500); // meters
  const [alert, setAlert] = useState<DynamicStateObject | null>(null);

  const onLocationUpdate = (message: DynamicStateObject) => {
    if (message.lat && message.lng) {
      setPatientLocation([message.lat, message.lng]);
    }
    if (message.alertType === "GEOFENCE_BREACH") {
      setAlert("Patient has left the safe zone!");
    } else if (message.alertType === "FALL_DETECTED") {
      setAlert("URGENT: Fall detected at current location!");
    }
  };

  useWebSocket(`/topic/location/${patientId}`, onLocationUpdate);

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-white/10">
      {alert && (
        <div className="absolute top-4 left-0 right-0 z-[1000] flex justify-center">
          <div className="bg-rose-500 text-white px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-5 h-5" />
            {alert}
            <button onClick={() => setAlert(null)} className="ml-4 text-rose-200 hover:text-white text-sm underline">{t("dismiss") || "Dismiss"}</button>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 p-3 rounded-xl border border-white/10 shadow-xl backdrop-blur-sm">
        <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" /> {t("safeZoneSettings") || "Safe Zone Settings"}</h4>
        <label className="text-xs text-slate-400 block mb-1">Radius (meters)</label>
        <input 
          type="range" 
          min="100" 
          max="2000" 
          step="100"
          value={geofenceRadius}
          onChange={(e: DynamicStateObject) => setGeofenceRadius(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="text-right text-xs text-indigo-300 font-mono mt-1">{geofenceRadius}m</div>
      </div>

      <MapContainer {...{} as DynamicStateObject} {...{} as DynamicStateObject} 
        center={geofenceCenter} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        <TileLayer {...{} as DynamicStateObject}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">{t("openStreetMap") || "OpenStreetMap"}</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Circle {...{} as DynamicStateObject} {...{} as DynamicStateObject} 
          center={geofenceCenter} 
          pathOptions={{ fillColor: '#4f46e5', fillOpacity: 0.2, color: '#4f46e5', weight: 2, dashArray: "5, 10" }} 
          radius={geofenceRadius} 
        />
        <Marker {...{} as DynamicStateObject} {...{} as DynamicStateObject} position={patientLocation}>
          <Popup>
            <div className="font-semibold text-slate-900">{t("patientLiveLocation") || "Patient Live Location"}</div>
            <div className="text-xs text-slate-500">{t("updatedJustNow") || "Updated just now"}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
