import { useLanguage } from "../../context/LanguageContext";
import { useState, useEffect, useRef } from "react";
import PremiumSectionCard from "../PremiumSectionCard";
import { Activity, Heart, Wind, Thermometer } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface IotTelemetryDashboardProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function IotTelemetryDashboard({ patientId }: IotTelemetryDashboardProps) {
  const { t } = useLanguage();
  const [vitals, setVitals] = useState<DynamicState>({ hr: 0, spo2: 0, temp: 0 });
  const [ecgData, setEcgData] = useState<DynamicStateObject[]>([]);
  const canvasRef = useRef<DynamicState>(null);

  const onVitalsUpdate = (message: DynamicStateObject) => {
    setVitals({
      hr: message.hr,
      spo2: message.spo2,
      temp: message.temp
    });
    setEcgData((prev: DynamicStateObject) => {
      const newData = [...prev, message.ecgValue];
      if (newData.length > 200) newData.shift();
      return newData;
    });
  };

  useWebSocket(`/topic/iot/telemetry/${patientId}`, onVitalsUpdate);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.beginPath();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      
      const step = canvas.width / 200;
      ecgData.forEach((value: string | number, i: DynamicStateObject) => {
        const x = i * step;
        // @ts-expect-error - Auto-suppressed during migration
        const y = canvas.height / 2 - (value * 20); // Scale the ECG value
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [ecgData]);

  return (
    <PremiumSectionCard
      title={(
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>{t("liveIoTTelemetry") || "Live IoT Telemetry"}</span>
        </div>
      )}
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20 text-center">
          <Heart className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{vitals.hr || "--"}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{t("bPM") || "BPM"}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-sky-500/20 text-center">
          <Wind className="w-6 h-6 text-sky-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{vitals.spo2 || "--"}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">SpO2 %</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-amber-500/20 text-center">
          <Thermometer className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{vitals.temp || "--"}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Temp °F</p>
        </div>
      </div>
      
      <div className="bg-black/60 rounded-xl border border-white/10 p-4 relative overflow-hidden h-40">
        <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">{t("liveECG") || "Live ECG"}</span>
        </div>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={150} 
          className="w-full h-full opacity-80"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
      </div>
    </PremiumSectionCard>
  );
}
