import { useLanguage } from "../../context/LanguageContext";
import { useState, useEffect } from "react";
import { Pill, ScanLine, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface SmartEMarScannerProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SmartEMarScanner({ patientId }: SmartEMarScannerProps) {
  const { t } = useLanguage();
  const [medications, setMedications] = useState<DynamicStateObject[]>([]);
  const [scanning, setScanning] = useState<DynamicState>(false);
  const [scannedMed, setScannedMed] = useState<DynamicStateObject | null>(null);

  // In a real scenario, this would fetch from the backend via an API
  useEffect(() => {
    // Mocking active schedule
    setMedications([
      { id: 1, name: "Lisinopril 10mg", time: "08:00 AM", status: "PENDING", isLate: false },
      { id: 2, name: "Metformin 500mg", time: "12:00 PM", status: "PENDING", isLate: true },
      { id: 3, name: "Atorvastatin 20mg", time: "08:00 PM", status: "ADMINISTERED", isLate: false }
    ]);
  }, [patientId]);

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const pendingMeds = medications.filter((m: DynamicStateObject) => m.status === "PENDING");
      if (pendingMeds.length > 0) {
        setScannedMed(pendingMeds[0]); // Simulate scanning the first pending med
      }
    }, 1500);
  };

  const logAdministration = () => {
    if (scannedMed) {
      setMedications((prev: DynamicStateObject) => 
        prev.map((m: DynamicStateObject) => m.id === scannedMed.id ? { ...m, status: "ADMINISTERED", isLate: false } : m)
      );
      setScannedMed(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Pill className="w-5 h-5 text-indigo-400" />
          Smart eMAR (Medication Admin)
        </h3>
        <button 
          onClick={simulateScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <ScanLine className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
          {scanning ? 'Scanning Barcode...' : 'Scan Med'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {scannedMed && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between mb-4 animate-in fade-in zoom-in duration-300">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">{t("barcodeMatchFound") || "Barcode Match Found"}</p>
              <p className="text-lg font-bold text-white">{scannedMed.name}</p>
              <p className="text-sm text-slate-400">Scheduled for {scannedMed.time}</p>
            </div>
            <button 
              onClick={logAdministration}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {t("logAdmin") || "Log Admin"}</button>
          </div>
        )}

        {medications.map((med: DynamicStateObject) => (
          <div key={med.id} className={`p-3 rounded-lg border flex items-center justify-between ${med.status === 'ADMINISTERED' ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : med.isLate ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800 border-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${med.status === 'ADMINISTERED' ? 'bg-emerald-500/20 text-emerald-400' : med.isLate ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                {med.status === 'ADMINISTERED' ? <CheckCircle2 className="w-5 h-5" /> : med.isLate ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className={`font-semibold ${med.status === 'ADMINISTERED' ? 'text-emerald-400 line-through' : 'text-white'}`}>{med.name}</p>
                <p className="text-xs text-slate-400">Scheduled: {med.time}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${med.status === 'ADMINISTERED' ? 'bg-emerald-500/20 text-emerald-400' : med.isLate ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
                {med.isLate && med.status !== 'ADMINISTERED' ? 'OVERDUE' : med.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
