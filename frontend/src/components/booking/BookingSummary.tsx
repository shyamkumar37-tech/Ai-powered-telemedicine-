import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useLanguage } from "../../context/LanguageContext";
import { memo } from "react";
import { CalendarDays, Clock3, FileText, IndianRupee, Stethoscope } from "lucide-react";
import { getDoctorPortrait } from "../../assets/doctorPortraits";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

export interface BookingSummaryProps {
  doctor?: DynamicState;
  slot?: DynamicState;
  mode?: DynamicState;
  concernSummary?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function BookingSummary({ doctor, slot, mode, concernSummary }: BookingSummaryProps) {
  const { t } = useLanguage();
  if (!doctor) {
    return (
      <Card elevated={false} className="border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500">Select a doctor to preview your consultation summary.</p>
      </Card>
    );
  }

  const doctorImage = getDoctorPortrait(doctor);

  return (
    <Card elevated={false} className="border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={doctorImage} name={doctor.fullName} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Booking summary</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">{doctor.fullName}</h3>
            <p className="text-sm text-blue-700">{doctor.specialization}</p>
          </div>
        </div>
        <Badge tone="success">Ready to confirm</Badge>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <span>{slot?.label || "Pick a time slot"}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-600" />
          <span>{mode === "IN_PERSON" ? "In-person visit" : mode === "FOLLOW_UP" ? "Follow-up consultation" : "Teleconsultation"}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-slate-500" />
          <span>{doctor.consultationFee || doctor.consultationFee === 0 ? doctor.consultationFee : "Contact for details"}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-slate-500" />
          <span>{doctor.availabilitySummary || "Slot confirmed by clinic"}</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText className="h-4 w-4 text-slate-500" />
          Reason for visit
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {concernSummary?.trim() || "Add a short note so the doctor can prepare before the consultation."}
        </p>
      </div>
    </Card>
  );
}

export default memo(BookingSummary);
