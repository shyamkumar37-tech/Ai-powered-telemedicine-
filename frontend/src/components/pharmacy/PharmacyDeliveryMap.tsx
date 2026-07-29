// @ts-ignore
import { useLanguage } from "../../context/LanguageContext";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// @ts-ignore
import L from "leaflet";
import { Truck } from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

// Fix for default marker icons in React Leaflet under Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PharmacyDeliveryMap() {
  const { t } = useLanguage();
  const [driverPos, setDriverPos] = useState<DynamicState>([40.7128, -74.0060]);
  const homePos = [40.7200, -74.0100]; // Target location
  
  useEffect(() => {
    // Simulate driver moving towards home
    const interval = setInterval(() => {
      setDriverPos((prev: DynamicStateObject) => {
        const newLat = (prev as DynamicStateObject)[0] + (homePos[0] - (prev as DynamicStateObject)[0]) * 0.1;
        const newLng = (prev as DynamicStateObject)[1] + (homePos[1] - (prev as DynamicStateObject)[1]) * 0.1;
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
          <p className="text-white text-sm font-semibold m-0 leading-tight">{t("pharmacyDelivery") || "Pharmacy Delivery"}</p>
          <p className="text-teal-400 text-xs font-mono m-0 mt-1">ETA: 15 mins</p>
        </div>
      </div>
      <MapContainer {...{} as DynamicStateObject} {...{} as DynamicStateObject} center={driverPos} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          // @ts-ignore
      attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Marker {...{} as DynamicStateObject} {...{} as DynamicStateObject} position={driverPos}>
          <Popup>{t("driverIsOnTheWay") || "Driver is on the way!"}</Popup>
        </Marker>
        <Marker {...{} as DynamicStateObject} {...{} as DynamicStateObject} position={homePos}>
          <Popup>{t("yourHome") || "Your Home"}</Popup>
        </Marker>
        <Polyline {...{} as DynamicStateObject} {...{} as DynamicStateObject} positions={[driverPos, homePos]} color="#4FB3A0" weight={4} dashArray="5, 10" />
      </MapContainer>
    </div>
  );
}
