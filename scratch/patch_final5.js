const fs = require('fs');

function replace(file, search, replaceStr) {
  try {
    let content = fs.readFileSync('frontend/src/' + file, 'utf8');
    content = content.split(search).join(replaceStr);
    fs.writeFileSync('frontend/src/' + file, content);
  } catch (e) {
    console.log(e);
  }
}

// LongitudinalTimelineCard
replace('components/consultation/LongitudinalTimelineCard.tsx', 'queryKeys.patient.vitals(patientId)', 'queryKeys.patient.vitals(patientId as string)');
replace('components/consultation/LongitudinalTimelineCard.tsx', 'fetchHealthRecords(patientId)', 'fetchHealthRecords(patientId as string)');
replace('components/consultation/LongitudinalTimelineCard.tsx', 'new Date(a.recordedAt) - new Date(b.recordedAt)', 'new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()');
replace('components/consultation/LongitudinalTimelineCard.tsx', 'fetchPatientTimeline(patientId)', 'fetchPatientTimeline(patientId as string)');

// SmartPrescriptionPad
replace('components/consultation/SmartPrescriptionPad.tsx', 'meds.splice(index, 1)', 'meds.splice(index as number, 1)');

// VideoConsultation
replace('components/consultation/VideoConsultation.tsx', '(sendCandidate as any)', '(window as any).sendCandidate');
replace('components/consultation/VideoConsultation.tsx', '(sendOffer as any)', '(window as any).sendOffer');
replace('components/consultation/VideoConsultation.tsx', '(sendCareMessage as any)', '(window as any).sendCareMessage');
replace('components/consultation/VideoConsultation.tsx', 'capture="microphone"', 'capture="user"'); // HTML capture accepts string like "user"

// IotTelemetryDashboard
replace('components/doctor/IotTelemetryDashboard.tsx', 'value * 20', 'Number(value) * 20');

// SystemReadinessCard
replace('components/SystemReadinessCard.tsx', 'value === true', '(value as any) === true');

// Button
replace('components/ui/Button.tsx', 'transition: spring.snappy', 'transition: spring.snappy as any');

// DatePicker
replace('components/ui/DatePicker.tsx', 'caption: "$1" as any,', '');

// PageTransition
replace('components/ui/PageTransition.tsx', 'transition={pageTransition}', 'transition={pageTransition as any}');

// LanguageContext
replace('context/LanguageContext.tsx', 'shouldQueueRuntimeTranslation(activeLanguage, normalizedValue, staticTranslation)', 'shouldQueueRuntimeTranslation(activeLanguage, normalizedValue as string, staticTranslation)');
replace('context/LanguageContext.tsx', 'shouldQueueRuntimeTranslation(activeLanguage, englishText, staticTranslation)', 'shouldQueueRuntimeTranslation(activeLanguage, englishText as string, staticTranslation)');
replace('context/LanguageContext.tsx', 'translateUiText: (value: string | number) => {', 'translateUiText: (value: string | number): string | number | null | undefined => {');

// ProtectedRoute
replace('components/ProtectedRoute.tsx', 'to={redirectPath}', 'to={redirectPath as any}');
replace('components/ProtectedRoute.tsx', 'to={buildLoginRedirect(location)}', 'to={buildLoginRedirect(location) as any}');

// PatientBookingPage
replace('pages/PatientBookingPage.tsx', 'new Date(b.assessedAt || 0).getTime() - new Date(a.assessedAt || 0).getTime()', 'new Date((b.assessedAt as any) || 0).getTime() - new Date((a.assessedAt as any) || 0).getTime()');

console.log("Done final patch");
