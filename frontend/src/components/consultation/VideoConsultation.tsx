import { useMemo, useState, useEffect, useRef } from "react";
import {
  Camera,
  MessageSquareText,
  Mic,
  PhoneOff,
  Signal,
  VideoOff
} from "lucide-react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import TeleExamPanel from "./TeleExamPanel";
import { transcribeAudioToSoapNote } from "../../ai/services/aiService";
import { CryptoService } from "../../services/cryptoService";
import { translateText } from "../../services/telecareService";
import { useWebSocket } from "../../hooks/useWebSocket";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

const sampleMessages = [
  { id: 1, sender: "Dr. Kapoor", text: "How have you been feeling since the last visit?", time: "10:12" },
  { id: 2, sender: "You", text: "The headache has reduced, but I still feel tired in the evening.", time: "10:13" }
];

export interface VideoConsultationProps {
  doctorName?: DynamicState;
  patientName?: DynamicState;
  appointmentTime?: DynamicState;
  showTeleExam?: DynamicState;
  currentUserId?: string | number;
  recipientId?: string | number;
  onStreamMixed?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function VideoConsultation({
  doctorName = "Dr. Neha Kapoor",
  patientName = "Anita Patient",
  appointmentTime = "Today, 6:30 PM",
  showTeleExam = false,
  currentUserId,
  recipientId,
  onStreamMixed
}: VideoConsultationProps) {
  const [muted, setMuted] = useState<DynamicState>(false);
  const [cameraOff, setCameraOff] = useState<DynamicState>(false);
  const [draft, setDraft] = useState<DynamicState>("");
  const [messages, setMessages] = useState<DynamicState>(sampleMessages);
  const [isTranscribing, setIsTranscribing] = useState<DynamicState>(false);
  const [e2eKey, setE2eKey] = useState<DynamicStateObject | null>(null);
  const [translationLang, setTranslationLang] = useState<DynamicState>("none");
  const [liveSubtitle, setLiveSubtitle] = useState<DynamicState>("");

  useEffect(() => {
    CryptoService.generateKey().then(setE2eKey);
  }, []);

  const localVideoRef = useRef<DynamicState>(null);
  const remoteVideoRef = useRef<DynamicState>(null);
  const peerConnectionRef = useRef<DynamicState>(null);
  const [webrtcConnected, setWebrtcConnected] = useState<DynamicState>(false);

  // WebRTC Signaling
  const { sendMessage: sendSignal } = useWebSocket('/user/queue/webrtc', async (signal: DynamicStateObject) => {
    if (!peerConnectionRef.current) return;
    try {
      if (signal.type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        sendSignal('/app/signal', { type: 'answer', recipientId, data: answer });
      } else if (signal.type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
      } else if (signal.type === 'candidate') {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.data));
      }
    } catch (err: DynamicStateObject) {
      console.error("WebRTC Error:", err);
    }
  });

  // Chat Messages
  useWebSocket('/user/queue/messages', (msg: DynamicStateObject) => {
    setMessages((current: DynamicStateObject) => [...current, { id: msg.id, sender: patientName, text: msg.body, time: "Now" }]);
  });

  const mixAudioStreams = (localStream: DynamicStateObject, remoteStream: DynamicStateObject) => {
    try {
      const audioContext = new (window.AudioContext || ((window as any).webkitAudioContext as any))();
      const dest = audioContext.createMediaStreamDestination();
      
      if (localStream.getAudioTracks().length > 0) {
        audioContext.createMediaStreamSource(localStream).connect(dest);
      }
      if (remoteStream.getAudioTracks().length > 0) {
        audioContext.createMediaStreamSource(remoteStream).connect(dest);
      }
      return dest.stream;
    } catch (e: DynamicStateObject) {
      console.error("Audio mixing failed", e);
      return null;
    }
  };

  const startWebRTC = async () => {
    if (!recipientId) return alert("No recipient available to call.");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track: DynamicStateObject) => pc.addTrack(track, stream));

      pc.ontrack = (event: DynamicStateObject) => {
        const remoteStream = (event.streams as DynamicStateObject)[0];
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        setWebrtcConnected(true);
        if (onStreamMixed) {
          const mixed = mixAudioStreams(stream, remoteStream);
          if (mixed) onStreamMixed(mixed);
        }
      };

      pc.onicecandidate = (event: DynamicStateObject) => {
        if (event.candidate) {
          (window as any).sendCandidate('/app/peer/ice-candidate', { type: 'candidate', targetId: recipientId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      (window as any).sendOffer('/app/peer/offer', { type: 'offer', targetId: recipientId, sdp: offer });
    } catch (err: DynamicStateObject) {
      console.error("Could not start WebRTC", err);
    }
  };

  const connection = useMemo(() => ({ label: webrtcConnected ? "Connected" : "Waiting", tone: webrtcConnected ? "success" : "info" }), [webrtcConnected]);

  const sendMessage = async () => {
    if (!draft.trim() || !recipientId || !currentUserId) return;
    
    const sentText = draft.trim();
    let displayMsg = sentText;
    
    if (e2eKey) {
       const ciphertext = await CryptoService.encryptMessage(e2eKey, sentText);
       if (import.meta.env.DEV) {
         console.log("Transmitting ciphertext:", ciphertext);
       }
       displayMsg = await CryptoService.decryptMessage(e2eKey, ciphertext);
    }

    try {
      await (window as any).sendCareMessage({
        patientId: recipientId, // Assuming recipient is patient for simplicity here
        senderUserId: currentUserId,
        recipientUserId: recipientId,
        subject: "Consultation Chat",
        body: displayMsg
      });
      
      setMessages((current: DynamicStateObject) => [
        ...current,
        { id: Date.now(), sender: "You", text: displayMsg, time: "Now" }
      ]);
      setDraft("");
    } catch (e: DynamicStateObject) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <Card elevated={false} className="border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live consultation</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">{doctorName}</h3>
          <p className="text-sm text-slate-500">{appointmentTime}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">Mock Mode (Daily.co SDK Stub)</Badge>
          <Badge tone="info">Verified doctor</Badge>
          <Badge tone={connection.tone}>{connection.label}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.8rem] bg-slate-950 p-4 text-white shadow-lg">
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <Badge tone="success" className="gap-1 normal-case tracking-normal">
                <Signal className="h-3.5 w-3.5" />
                Strong connection
              </Badge>
              <Badge tone="default">12:41</Badge>
            </div>

            <div className="flex h-[380px] items-center justify-center rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              <video 
                ref={remoteVideoRef}
                autoPlay 
                playsInline 
                className="w-full h-full object-cover absolute inset-0"
              />
              {!webrtcConnected && (
                <div className="text-center relative z-10">
                  <Avatar name={patientName} size="lg" className="mx-auto h-20 w-20 bg-white/10 text-white" />
                  <p className="mt-4 text-lg font-semibold">{patientName}</p>
                  <p className="text-sm text-slate-300">Awaiting video connection...</p>
                  <Button className="mt-4" onClick={startWebRTC}>Start Call</Button>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 right-4 w-40 rounded-[1.2rem] border border-white/10 bg-slate-900/80 p-3 shadow-xl backdrop-blur">
              <div className="flex h-28 items-center justify-center rounded-xl bg-slate-800 overflow-hidden relative">
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  playsInline
                  muted
                  className="w-full h-full object-cover absolute inset-0"
                />
                {cameraOff && <div className="absolute inset-0 bg-slate-800 flex items-center justify-center"><VideoOff className="h-8 w-8 text-slate-400" /></div>}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-200">You</p>
            </div>

            {liveSubtitle && (
              <div className="absolute bottom-4 left-4 right-48 flex justify-center">
                <div className="bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg text-sm max-w-full text-center">
                  {liveSubtitle}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.6rem] bg-slate-950 px-4 py-4 relative">
            <select 
              className="absolute left-4 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 outline-none"
              value={translationLang}
              onChange={(e: DynamicStateObject) => setTranslationLang(e.target.value)}
            >
              <option value="none">Translation: Off</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="hi">Hindi</option>
            </select>
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${muted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              onClick={() => setMuted((current: DynamicStateObject) => !current)}
            >
              {muted ? <Mic className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${cameraOff ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              onClick={() => setCameraOff((current: DynamicStateObject) => !current)}
            >
              {cameraOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </button>
            <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600">
              <PhoneOff className="h-5 w-5" />
            </button>
            <label className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition cursor-pointer ${isTranscribing ? "bg-amber-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`} title="AI Voice Scribe">
              <Mic className="h-5 w-5" />
              <input type="file" accept="audio/*" capture="user" className="hidden" onChange={async (e: DynamicStateObject) => {
                const file = (e.target.files as DynamicStateObject)[0];
                if (!file) return;
                setIsTranscribing(true);
                setLiveSubtitle(translationLang !== "none" ? "Translating audio..." : "Transcribing audio...");
                try {
                  const formData = new FormData();
                  formData.append("audio", file);
                  const res = await transcribeAudioToSoapNote(formData);
                  
                  let translatedText = res.fullNotes;
                  if (translationLang !== "none") {
                    try {
                      const translationRes = await translateText({
                        text: res.fullNotes,
                        targetLanguage: translationLang,
                        sourceLanguage: "en"
                      });
                      translatedText = translationRes.text;
                    } catch (translateErr: DynamicStateObject) {
                      console.error("Translation failed:", translateErr);
                      translatedText = res.fullNotes + " (Translation failed)";
                    }
                  }

                  setLiveSubtitle(translatedText);
                  setTimeout(() => setLiveSubtitle(""), 5000);

                  setMessages((current: DynamicStateObject) => [
                    ...current,
                    { id: Date.now(), sender: "AI Scribe", text: "SOAP Note: " + res.fullNotes, time: "Now" }
                  ]);
                } catch (err: DynamicStateObject) {
                  console.error(err);
                  setLiveSubtitle("Error during transcription.");
                  setTimeout(() => setLiveSubtitle(""), 3000);
                } finally {
                  setIsTranscribing(false);
                  e.target.value = null;
                }
              }} />
            </label>
          </div>
          {showTeleExam && (
            <div className="rounded-[1.6rem] overflow-hidden">
              <TeleExamPanel />
            </div>
          )}
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <MessageSquareText className="h-4 w-4 text-blue-600" />
              Consultation chat
            </div>
            <Badge tone="default">Live notes</Badge>
          </div>

          <div className="mt-4 h-[320px] space-y-3 overflow-y-auto rounded-[1.2rem] bg-white p-3 shadow-inner">
            {messages.map((message: DynamicStateObject) => (
              <div key={message.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{message.sender}</p>
                  <span className="text-[11px] text-slate-400">{message.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{message.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="field flex-1"
              value={draft}
              placeholder="Type a quick note"
              onChange={(event: DynamicStateObject) => setDraft(event.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
