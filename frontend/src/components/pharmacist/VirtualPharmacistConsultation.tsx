import VideoConsultation from "../consultation/VideoConsultation";

export interface VirtualPharmacistConsultationProps {
  currentUserId?: string | number;
  recipientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function VirtualPharmacistConsultation({ currentUserId, recipientId }: VirtualPharmacistConsultationProps) {
  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-white/10 bg-emerald-900/40 flex items-center justify-between">
        <h3 className="font-semibold text-emerald-300 flex items-center gap-2">
          Virtual Pharmacist Consultation (WebRTC)
        </h3>
      </div>
      <div className="p-4">
        <VideoConsultation 
          currentUserId={currentUserId} 
          recipientId={recipientId} 
          doctorName="Virtual Pharmacist" 
          patientName="Patient"
          appointmentTime="Live Connection"
        />
      </div>
    </div>
  );
}
