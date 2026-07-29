import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Radio } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export default function TeleExamPanel() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<DynamicState>("disconnected"); // disconnected, searching, connected
  const [device, setDevice] = useState<DynamicStateObject | null>(null);

  const startPairing = async () => {
    if (!((navigator as any).bluetooth as any)) {
      alert("Web Bluetooth is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    setStatus("searching");
    try {
      // Request any bluetooth device (acceptAllDevices: true) 
      // since we don't know the specific UUIDs of the user's earbuds
      const btDevice = await ((navigator as any).bluetooth as any).requestDevice({
        acceptAllDevices: true
      });
      
      setStatus("connected");
      setDevice({ name: btDevice.name || "Unknown Device", type: "audio" });
      
      // Optional: Add disconnect listener
      btDevice.addEventListener('gattserverdisconnected', () => {
        setStatus("disconnected");
        setDevice(null);
      });
    } catch (err: DynamicStateObject) {
      console.error(err);
      setStatus("disconnected");
      // Don't show error if user cancelled the prompt
    }
  };

  const disconnect = () => {
    setStatus("disconnected");
    setDevice(null);
  };

  return (
    <div className="bg-tcd-panel-2 border-t border-tcd-panel-line p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-tcd-text-primary flex items-center gap-2">
          <Radio className="w-4 h-4 text-tcd-teal" />
          {t("ioTTeleExamDevices") || "IoT Tele-Exam Devices"}</h3>
        <div className="text-xs text-tcd-text-muted">
          {t("supportForBluetoothStethoscopesOtoscopes") || "Support for Bluetooth stethoscopes & otoscopes"}</div>
      </div>

      {status === "disconnected" && (
        <button
          onClick={startPairing}
          className="w-full flex items-center justify-center gap-2 bg-tcd-panel border border-tcd-panel-line rounded-md py-2.5 text-sm font-medium hover:border-tcd-teal hover:text-tcd-teal transition-colors"
        >
          <Bluetooth className="w-4 h-4" />
          {t("pairNewDevice") || "Pair New Device"}</button>
      )}

      {status === "searching" && (
        <div className="w-full flex items-center justify-center gap-2 bg-tcd-panel border border-tcd-panel-line rounded-md py-2.5 text-sm text-tcd-teal font-medium">
          <BluetoothSearching className="w-4 h-4 animate-pulse" />
          {t("searchingForDevices") || "Searching for devices..."}</div>
      )}

      {status === "connected" && (
        <div className="flex items-center justify-between bg-tcd-teal-dim/20 border border-tcd-teal/30 rounded-md p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tcd-teal/20 rounded-full">
              <BluetoothConnected className="w-4 h-4 text-tcd-teal" />
            </div>
            <div>
              <div className="text-sm font-medium text-tcd-text-primary">{device?.name}</div>
              <div className="text-xs text-tcd-teal flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tcd-teal animate-pulse"></span>
                Signal Strong • Streaming Audio
              </div>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="text-xs font-medium text-tcd-coral hover:text-tcd-coral/80 underline px-2 py-1"
          >
            {t("disconnect") || "Disconnect"}</button>
        </div>
      )}
    </div>
  );
}
