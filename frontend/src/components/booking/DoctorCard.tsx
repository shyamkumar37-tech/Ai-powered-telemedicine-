import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useLanguage } from "../../context/LanguageContext";
import { memo } from "react";
import { Clock3, IndianRupee, Languages, ShieldCheck, Star, Stethoscope } from "lucide-react";
import { getDoctorPortrait } from "../../assets/doctorPortraits";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

export interface DoctorCardProps {
  doctor?: DynamicState;
  selected?: DynamicState;
  onSelect?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function DoctorCard({ doctor, selected = false, onSelect }: DoctorCardProps) {
  const { t } = useLanguage();
  const rating = doctor?.rating ?? 4.8;
  const consults = doctor?.consultCount ?? "2.3k+";
  const doctorImage = getDoctorPortrait(doctor);
  const consultationFee = doctor?.consultationFee ?? doctor?.fee ?? doctor?.consultation_fee ?? null;

  return (
    <Card
      elevated={false}
      className={`h-full overflow-hidden border transition ${selected ? "border-blue-300 shadow-[0_20px_40px_rgba(37,99,235,0.14)]" : "border-slate-200"}`}
    >
      <div className="mb-5 rounded-[1.35rem] bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">TeleCare+ specialist</p>
            <p className="mt-1 text-sm text-slate-600">Trusted digital consultation and follow-up care</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Avatar src={doctorImage} name={doctor?.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink">{doctor?.fullName}</h3>
            <Badge tone="info" className="gap-1 normal-case tracking-normal">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-blue-700">{doctor?.specialization || "General Medicine"}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-400" />
              {rating}
            </span>
            <span>{doctor?.experienceYears ?? 0} yrs exp</span>
            <span>{consults} consults</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-emerald-500" />
              {doctor?.availabilitySummary || "Today 6:30 PM onwards"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-slate-400" />
              English, Hindi
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Consultation fee</p>
          <p className="mt-1 inline-flex items-center text-base font-semibold text-ink">
            <IndianRupee className="h-4 w-4" />
            {consultationFee || consultationFee === 0 ? consultationFee : "500"}
          </p>
        </div>
        <Button variant={selected ? "secondary" : "primary"} onClick={onSelect}>
          {selected ? "Selected" : "Book Now"}
        </Button>
      </div>
    </Card>
  );
}

export default memo(DoctorCard);
