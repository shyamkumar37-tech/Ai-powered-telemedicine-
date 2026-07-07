import { useMemo, useState } from "react";
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

const sampleMessages = [
  { id: 1, sender: "Dr. Kapoor", text: "How have you been feeling since the last visit?", time: "10:12" },
  { id: 2, sender: "You", text: "The headache has reduced, but I still feel tired in the evening.", time: "10:13" }
];

export default function VideoConsultation({
  doctorName = "Dr. Neha Kapoor",
  patientName = "Anita Patient",
  appointmentTime = "Today, 6:30 PM"
}) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(sampleMessages);

  const connection = useMemo(() => ({ label: "Connected", tone: "success" }), []);

  const sendMessage = () => {
    if (!draft.trim()) {
      return;
    }
    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: "You", text: draft.trim(), time: "Now" }
    ]);
    setDraft("");
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

            <div className="flex h-[380px] items-center justify-center rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="text-center">
                <Avatar name={doctorName} size="lg" className="mx-auto h-20 w-20 bg-white/10 text-white" />
                <p className="mt-4 text-lg font-semibold">{doctorName}</p>
                <p className="text-sm text-slate-300">Consultation in progress</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 w-40 rounded-[1.2rem] border border-white/10 bg-slate-900/80 p-3 shadow-xl backdrop-blur">
              <div className="flex h-28 items-center justify-center rounded-xl bg-slate-800">
                {cameraOff ? <VideoOff className="h-8 w-8 text-slate-400" /> : <Avatar name={patientName} className="h-14 w-14 bg-white/10 text-white" />}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-200">{patientName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.6rem] bg-slate-950 px-4 py-4">
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${muted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              onClick={() => setMuted((current) => !current)}
            >
              {muted ? <Mic className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${cameraOff ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              onClick={() => setCameraOff((current) => !current)}
            >
              {cameraOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </button>
            <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600">
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
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
            {messages.map((message) => (
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
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
