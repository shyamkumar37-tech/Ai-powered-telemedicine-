import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Truck } from "lucide-react";

// Fix for default marker icons in React Leaflet under Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PharmacyDeliveryMap() {
  const [driverPos, setDriverPos] = useState([40.7128, -74.0060]);
  const homePos = [40.7200, -74.0100]; // Target location
  
  useEffect(() => {
    // Simulate driver moving towards home
    const interval = setInterval(() => {
      setDriverPos(prev => {
        const newLat = prev[0] + (homePos[0] - prev[0]) * 0.1;
        const newLng = prev[1] + (homePos[1] - prev[1]) * 0.1;
        return [newLat, newLng];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-[1.2rem] overflow-hidden border border-slate-700 bg-slate-900 shadow-xl h-[300px] relative">
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-700 shadow-xl flex items-center gap-3">
        <Truck className="text-teal-400" size={20} />
        <div>
          <p className="text-white text-sm font-semibold m-0 leading-tight">Pharmacy Delivery</p>
          <p className="text-teal-400 text-xs font-mono m-0 mt-1">ETA: 15 mins</p>
        </div>
      </div>
      <MapContainer center={driverPos} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Marker position={driverPos}>
          <Popup>Driver is on the way!</Popup>
        </Marker>
        <Marker position={homePos}>
          <Popup>Your Home</Popup>
        </Marker>
        <Polyline positions={[driverPos, homePos]} color="#4FB3A0" weight={4} dashArray="5, 10" />
      </MapContainer>
    </div>
  );
}
