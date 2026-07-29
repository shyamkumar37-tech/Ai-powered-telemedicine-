import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useLanguage } from "../../context/LanguageContext";
import { useState, useEffect } from "react";
import { Truck, MapPin, PackageCheck, AlertCircle } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";

export interface PharmacistDeliveryTrackerProps {
  recordId?: string | number;
  patientName?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PharmacistDeliveryTracker({ recordId, patientName }: PharmacistDeliveryTrackerProps) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<DynamicState>(0);
  const [eta, setEta] = useState<DynamicState>(15);
  const [statusText, setStatusText] = useState<DynamicState>("Courier is picking up the medication...");

  const onDeliveryUpdate = (message: DynamicStateObject) => {
    if (message.progress) setProgress(message.progress);
    if (message.eta !== undefined) setEta(message.eta);
    if (message.statusText) setStatusText(message.statusText);
  };

  useWebSocket(`/topic/delivery/${recordId}`, onDeliveryUpdate);

  // If backend hasn't sent data yet, it stays at 0. When it hits 100, we can hardcode DELIVERED if needed.
  useEffect(() => {
    if (progress >= 100) {
      setStatusText(`Delivered to ${patientName}`);
      setEta(0);
    }
  }, [progress, patientName]);

  return (
    <div className="mt-4 bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">{t("liveGPSTracking") || "Live GPS Tracking"}</h5>
              <p className="text-xs text-emerald-300 flex items-center gap-1">
                {progress < 100 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ETA: {eta} min
                  </>
                ) : (
                  <span className="text-emerald-400 font-bold">{t("dELIVERED") || "DELIVERED"}</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t("orderID") || "Order ID"}</div>
            <div className="text-sm font-mono text-white">#{(recordId as any)?.toString().padStart(6, '0')}</div>
          </div>
        </div>

        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <div className="flex flex-col items-start gap-1">
            <MapPin className={`w-4 h-4 ${progress > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
            {t("pharmacy") || "Pharmacy"}</div>
          <div className="flex flex-col items-center gap-1 text-center">
            <AlertCircle className={`w-4 h-4 ${progress >= 50 && progress < 100 ? 'text-amber-400' : 'text-slate-600'}`} />
            {t("inTransit") || "In Transit"}</div>
          <div className="flex flex-col items-end gap-1">
            <PackageCheck className={`w-4 h-4 ${progress >= 100 ? 'text-emerald-400' : 'text-slate-600'}`} />
            {t("patient") || "Patient"}</div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-sm font-medium text-white">{statusText}</p>
        </div>
      </div>
    </div>
  );
}
