import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, HeartHandshake, ShieldCheck } from "lucide-react";
import { MentalHealthIllustration } from "../../components/illustrations/CareIllustrations";
import SectionCard from "../../components/SectionCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useLanguage } from "../../context/LanguageContext";
import { runMentalHealthAssessment, sendMentalHealthChat } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

const moodOptions = [
  { label: "Very low", emoji: "Low", value: "very-low", tone: "danger" },
  { label: "Low", emoji: "Soft", value: "low", tone: "warning" },
  { label: "Okay", emoji: "Steady", value: "okay", tone: "info" },
  { label: "Good", emoji: "Bright", value: "good", tone: "success" },
  { label: "Great", emoji: "Calm", value: "great", tone: "success" }
];

const initialForm = {
  mood: "",
  stress: 4,
  anxiety: 4,
  notes: ""
};

export default function MentalHealthCheckinPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = useMemo(() => ([
    {
      key: "mood",
      title: "How are you feeling today?",
      description: "Choose the option that matches your overall mood."
    },
    {
      key: "stress",
      title: "How stressed do you feel right now?",
      description: "0 means calm, 10 means overwhelming."
    },
    {
      key: "anxiety",
      title: "How anxious do you feel right now?",
      description: "0 means relaxed, 10 means intense worry."
    },
    {
      key: "notes",
      title: "Anything you want to share?",
      description: "A few words are enough. This is optional but useful."
    }
  ]), []);

  const currentStep = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const goNext = () => {
    if (currentStep.key === "mood" && !form.mood) {
      setError("Choose a mood to continue.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const submitCheckin = async () => {
    const summary = `Mood: ${form.mood || "not selected"}, Stress: ${form.stress}/10, Anxiety: ${form.anxiety}/10. Notes: ${form.notes || "No additional notes."}`;

    setLoading(true);
    setError("");

    try {
      const [chat, assessment] = await Promise.all([
        sendMentalHealthChat({ message: summary, sessionId: "" }),
        runMentalHealthAssessment({ text: summary })
      ]);

      setMessages([
        { role: "assistant", text: chat.response },
        ...(Array.isArray(chat.suggestions) ? chat.suggestions.map((item) => ({ role: "assistant", text: item })) : []),
        { role: "assistant", text: assessment.guidance }
      ]);
      setStatus(`Risk level: ${assessment.riskLevel}`);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadMentalHealth")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Mental health check-in"
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="success" className="gap-1 normal-case tracking-normal">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private & secure
            </Badge>
            <Badge tone="info" className="gap-1 normal-case tracking-normal">
              <HeartHandshake className="h-3.5 w-3.5" />
              Gentle guided flow
            </Badge>
          </div>
        }
      >
        <div className="rounded-[1.8rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink text-decoration-none">{currentStep.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{currentStep.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="info">{progress}% complete</Badge>
                <Badge tone="success">Calm guided flow</Badge>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[220px]">
              <MentalHealthIllustration />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-8">
            {currentStep.key === "mood" ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-[1.4rem] border bg-white p-5 text-left shadow-sm transition ${form.mood === option.value ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}
                    onClick={() => setForm((current) => ({ ...current, mood: option.value }))}
                  >
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      option.tone === "danger"
                        ? "bg-rose-50 text-rose-600"
                        : option.tone === "warning"
                          ? "bg-amber-50 text-amber-600"
                          : option.tone === "success"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                    }`}>{option.emoji}</div>
                    <p className="mt-4 text-base font-semibold text-ink">{option.label}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {currentStep.key === "stress" || currentStep.key === "anxiety" ? (
              <div className="rounded-[1.6rem] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                  <span>0 - calm</span>
                  <span className="text-xl font-semibold text-ink">{form[currentStep.key]}/10</span>
                  <span>10 - intense</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={form[currentStep.key]}
                  className="mt-6 w-full accent-blue-600"
                  onChange={(event) => setForm((current) => ({ ...current, [currentStep.key]: Number(event.target.value) }))}
                />
              </div>
            ) : null}

            {currentStep.key === "notes" ? (
              <div className="rounded-[1.6rem] bg-white p-6 shadow-sm">
                <textarea
                  className="field min-h-40 resize-y"
                  placeholder="Share anything that may help your care team understand today better."
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={goBack} disabled={step === 0 || loading}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={goNext} disabled={loading}>
                Continue
              </Button>
            ) : (
              <Button loading={loading} leftIcon={<Brain className="h-4 w-4" />} onClick={submitCheckin}>
                Save check-in
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Mood history snapshot">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
          <div className="rounded-[1.6rem] bg-white p-5 shadow-sm">
            <div className="flex h-52 items-end gap-3">
              {[42, 54, 46, 68, 58, 72, 64].map((value, index) => (
                <div key={`mood-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-blue-600 via-sky-500 to-emerald-400"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-[11px] font-medium text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[1.6rem] bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-700">Pattern insight</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Stress tends to rise mid-week. Completing a short check-in earlier in the day can help us spot patterns faster.
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-700">Support prompt</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                If you are feeling overwhelmed or unsafe, contact your doctor or trusted caregiver immediately.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {status || messages.length ? (
        <SectionCard title="AI guidance">
          {status ? <p className="mb-4 text-sm font-medium text-amber-700">{status}</p> : null}
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {message.text}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
