import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { memo, useMemo } from "react";
import { Search } from "lucide-react";
import DoctorCard from "./DoctorCard";

export interface DoctorListProps {
  doctors?: DynamicState;
  query?: DynamicState;
  filterQuery?: DynamicState;
  onQueryChange?: (...args: DynamicStateObject[]) => void;
  selectedDoctorId?: string | number;
  onSelectDoctor?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function DoctorList({
  doctors = [],
  query = "",
  filterQuery = query,
  onQueryChange,
  selectedDoctorId,
  onSelectDoctor
}: DoctorListProps) {
  const normalizedQuery = filterQuery.trim().toLowerCase();
  const filteredDoctors = useMemo(() => doctors.filter((doctor: DynamicStateObject) => {
    if (!normalizedQuery) {
      return true;
    }
    return [doctor?.fullName, doctor?.specialization, doctor?.availabilitySummary]
      .filter(Boolean)
      .some((value: string | number) => String(value).toLowerCase().includes(normalizedQuery));
  }), [doctors, normalizedQuery]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="field pl-11"
          value={query}
          onChange={(event: DynamicStateObject) => onQueryChange?.(event.target.value)}
          placeholder="Search doctor, specialty, or slot"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredDoctors.map((doctor: DynamicStateObject) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            selected={selectedDoctorId === doctor.id}
            onSelect={() => onSelectDoctor?.(doctor)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(DoctorList);
