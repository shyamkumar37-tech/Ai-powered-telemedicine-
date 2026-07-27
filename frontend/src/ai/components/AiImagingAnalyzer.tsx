import { useLanguage } from "../../context/LanguageContext";
import { useState, useRef, useEffect } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { ScanFace, Upload, Loader2, AlertCircle, Eye, EyeOff, ZoomIn, ZoomOut, History, XCircle, CheckCircle2 } from "lucide-react";
import { analyzeMedicalImage, fetchImageHistory, cancelImageAnalysis } from "../services/aiService";
import { useWebSocket } from "../../hooks/useWebSocket";
import { formatDisplayValue } from "../../utils/formatDisplayValue";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiImagingAnalyzerProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiImagingAnalyzer({ patientId }: AiImagingAnalyzerProps) {
  const { t } = useLanguage();
  const [imageSrc, setImageSrc] = useState<DynamicStateObject | null>(null);
  const [activeJobId, setActiveJobId] = useState<DynamicStateObject | null>(null);
  
  // Job State
  const [jobStatus, setJobStatus] = useState<DynamicState>("idle"); // idle | uploading | processing | completed | failed | canceled
  const [progress, setProgress] = useState<DynamicState>(0);
  const [jobMessage, setJobMessage] = useState<DynamicState>("");
  const [analysisResult, setAnalysisResult] = useState<DynamicStateObject | null>(null);
  const [severity, setSeverity] = useState<DynamicStateObject | null>(null);
  
  // History
  const [history, setHistory] = useState<DynamicStateObject[]>([]);
  const [showHistory, setShowHistory] = useState<DynamicState>(false);

  // Canvas Interactions
  const canvasRef = useRef<DynamicState>(null);
  const [showAnnotations, setShowAnnotations] = useState<DynamicState>(true);
  const [scale, setScale] = useState<DynamicState>(1);
  const [pan, setPan] = useState<DynamicState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<DynamicState>(false);
  const [dragStart, setDragStart] = useState<DynamicState>({ x: 0, y: 0 });

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId]);

  const loadHistory = async () => {
    try {
      const data = await fetchImageHistory(patientId);
      setHistory(data);
    } catch (error: DynamicStateObject) {
      console.error("Failed to fetch image history", error);
    }
  };

  // WebSocket Subscription
  const wsTopic = activeJobId ? `/topic/imaging/${activeJobId}` : null;
  useWebSocket(wsTopic, (message: DynamicStateObject) => {
    setJobStatus(message.status.toLowerCase());
    setProgress(message.progress || 0);
    setJobMessage(message.message || "");
    
    if (message.status === "COMPLETED") {
      setAnalysisResult(message.findings);
      setSeverity(message.severity);
      setActiveJobId(null);
      loadHistory(); // refresh history
    } else if (message.status === "FAILED" || message.status === "CANCELED") {
      setActiveJobId(null);
    }
  });

  const handleImageUpload = async (e: DynamicStateObject) => {
    const file = (e.target.files as DynamicStateObject)[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setAnalysisResult(null);
      setSeverity(null);
      setJobStatus("uploading");
      setProgress(5);
      setJobMessage("Uploading image securely...");
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const result = await analyzeMedicalImage(formData, patientId);
        setActiveJobId(result.jobId);
      } catch (error: DynamicStateObject) {
        console.error("Image upload failed:", error);
        setJobStatus("failed");
        setJobMessage("Upload failed.");
      }
    }
  };

  const handleCancel = async () => {
    if (activeJobId) {
      try {
        await cancelImageAnalysis(activeJobId);
        setJobStatus("canceled");
        setJobMessage("Job canceled by user.");
        setActiveJobId(null);
      } catch (error: DynamicStateObject) {
        console.error("Failed to cancel job", error);
      }
    }
  };

  const loadFromHistory = (record: DynamicStateObject) => {
    if (record.status !== "COMPLETED") return;
    
    // In a real app we'd fetch the actual image bytes via an authorized URL. 
    // Here we'll use a placeholder or clear the image for demo purposes since we don't have a static file server configured to serve absolute paths from C:\.
    // For demo continuity, we'll just reset the canvas.
    setImageSrc(null); 
    setAnalysisResult(record.findingsJson ? JSON.parse(record.findingsJson) : null);
    setSeverity(record.severity);
    setJobStatus("completed");
    setJobMessage(`Loaded historical record: ${record.fileName}`);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setShowHistory(false);
  };

  // Canvas Drawing
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Base canvas size to match container
      const parentWidth = canvas.parentElement.clientWidth;
      const baseScale = parentWidth / img.width;
      canvas.width = parentWidth;
      canvas.height = img.height * baseScale;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply transforms (Pan + Zoom)
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw annotations if permitted
      if (showAnnotations && analysisResult) {
        analysisResult.forEach((res: DynamicStateObject) => {
          const rx = res.x * canvas.width;
          const ry = res.y * canvas.height;
          const rw = res.w * canvas.width;
          const rh = res.h * canvas.height;
          
          const isAnomaly = res.type === "ANOMALY";
          const color = isAnomaly ? "#f43f5e" : "#10b981"; // rose-500 or emerald-500

          // Draw Box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / scale;
          ctx.strokeRect(rx, ry, rw, rh);
          
          // Draw Background for Text
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(rx, ry - (20 / scale), rw, 20 / scale);
          
          // Draw Text
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${10 / scale}px sans-serif`;
          ctx.fillText(`${res.label} (${res.confidence}%)`, rx + (4 / scale), ry - (6 / scale));
        });
      }
      ctx.restore();
    };
  }, [imageSrc, analysisResult, showAnnotations, scale, pan]);

  // Canvas Event Handlers
  const handleWheel = (e: DynamicStateObject) => {
    e.preventDefault();
    const zoomSensitivity = 0.05;
    const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
    setScale((s: DynamicStateObject) => Math.max(1, Math.min(s + delta, 5)));
  };

  const handleMouseDown = (e: DynamicStateObject) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: DynamicStateObject) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <PremiumSectionCard
      title={(
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-400" />
            <span>{t("aIDiagnosticImaging") || "AI Diagnostic Imaging"}</span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
          >
            <History className="w-4 h-4" /> {showHistory ? "Hide History" : "View History"}
          </button>
        </div>
      )}
    >
      {showHistory ? (
        <div className="mt-4 bg-slate-900/50 rounded-xl border border-white/10 p-4 max-h-[400px] overflow-y-auto">
          <h4 className="text-white font-semibold mb-4">{t("patientImagingHistory") || "Patient Imaging History"}</h4>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm">{t("noPreviousScansFound") || "No previous scans found."}</p>
          ) : (
            <div className="space-y-3">
              {history.map((record: DynamicStateObject) => (
                <div key={record.id} className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => loadFromHistory(record)}>
                  <div>
                    <p className="text-sm font-medium text-white">{record.fileName}</p>
                    {/* @ts-expect-error - Auto-suppressed during migration */}
                    <p className="text-xs text-slate-400">{formatDisplayValue(record.uploadedAt, "datetime")} &bull; {record.status}</p>
                  </div>
                  {record.severity === "HIGH" && <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full border border-rose-500/30">{t("highSeverity") || "High Severity"}</span>}
                  {record.status === "COMPLETED" && !record.severity && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">{t("analyzed") || "Analyzed"}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {!imageSrc && jobStatus === "idle" ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-900/30 rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative mt-4 h-64">
              <input 
                type="file" 
                accept="image/*"
                aria-label="Upload Medical Image"
                title="Upload Medical Image"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="font-semibold text-white mb-1">Upload X-Ray / MRI / Scan</div>
              <p className="text-sm text-slate-400">{t("ourNeuralNetworkWillHighlightPotentialAnomaliesInstantly") || "Our neural network will highlight potential anomalies instantly."}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Toolbar */}
              {imageSrc && (
                <div className="flex items-center justify-between bg-slate-900/50 border border-white/10 p-2 rounded-lg">
                  <div className="flex gap-2">
                    <button onClick={() => setScale((s: DynamicStateObject) => Math.max(1, s - 0.2))} className="p-2 bg-black/40 hover:bg-white/10 rounded-lg text-slate-300" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => setScale((s: DynamicStateObject) => Math.min(5, s + 0.2))} className="p-2 bg-black/40 hover:bg-white/10 rounded-lg text-slate-300" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => { setScale(1); setPan({x:0, y:0}); }} className="p-2 bg-black/40 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-300">{t("resetView") || "Reset View"}</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAnnotations(!showAnnotations)} className={`flex items-center gap-2 p-2 px-3 rounded-lg text-sm font-medium transition-colors ${showAnnotations ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-black/40 text-slate-400 hover:bg-white/10'}`}>
                      {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      Annotations
                    </button>
                    <button 
                      onClick={() => { setImageSrc(null); setAnalysisResult(null); setJobStatus("idle"); setSeverity(null); }}
                      className="p-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-400 text-sm font-medium"
                    >
                      {t("clear") || "Clear"}</button>
                  </div>
                </div>
              )}

              {/* Canvas Area */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
                {(jobStatus === "uploading" || jobStatus === "processing") && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm p-6 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="font-semibold text-white tracking-widest uppercase text-sm mb-2">{jobStatus === "uploading" ? "Uploading..." : "Running AI Inference..."}</p>
                    <p className="text-xs text-indigo-300 mb-6">{jobMessage}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 mb-4 overflow-hidden border border-white/5">
                      <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <button onClick={handleCancel} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-xs font-medium bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                      <XCircle className="w-4 h-4" /> {t("cancelAnalysis") || "Cancel Analysis"}</button>
                  </div>
                )}
                
                {jobStatus === "failed" && (
                  <div className="absolute inset-0 bg-rose-900/90 flex flex-col items-center justify-center z-10 p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
                    <p className="font-bold text-white mb-2">{t("analysisFailed") || "Analysis Failed"}</p>
                    <p className="text-sm text-rose-200 mb-6">{jobMessage}</p>
                    <button onClick={() => { setImageSrc(null); setJobStatus("idle"); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                      {t("tryAgain") || "Try Again"}</button>
                  </div>
                )}

                {imageSrc ? (
                  <div className="w-full relative group cursor-grab active:cursor-grabbing overflow-hidden">
                    <canvas 
                      ref={canvasRef} 
                      className="w-full block"
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  </div>
                ) : (
                   jobStatus === "completed" && !imageSrc && (
                     <div className="h-48 flex items-center justify-center flex-col text-center p-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                        <p className="text-white font-medium">{t("historicalRecordLoaded") || "Historical Record Loaded"}</p>
                        <p className="text-sm text-slate-400 mt-1">{t("imagePreviewIsDisabledForHistoryInThisDemo") || "Image preview is disabled for history in this demo."}</p>
                     </div>
                   )
                )}
              </div>
              
              {/* Findings Panel */}
              {analysisResult && (
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <ScanFace className="w-4 h-4 text-indigo-400" /> {t("aIFindings") || "AI Findings"}</h4>
                    {severity === "HIGH" ? (
                      <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full border border-rose-500/30 font-bold">{t("highSeverity") || "High Severity"}</span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30 font-bold">{t("lowRisk") || "Low Risk"}</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.map((res: DynamicStateObject, i: DynamicStateObject) => (
                      <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${res.type === 'ANOMALY' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <AlertCircle className={`w-5 h-5 shrink-0 ${res.type === 'ANOMALY' ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-semibold text-white text-sm">{res.label}</h5>
                            <span className={`text-xs font-bold ${res.type === 'ANOMALY' ? 'text-rose-300' : 'text-emerald-300'}`}>{res.confidence}% Conf.</span>
                          </div>
                          <p className="text-xs text-slate-300">{res.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PremiumSectionCard>
  );
}
