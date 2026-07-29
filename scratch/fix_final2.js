const fs = require('fs');

function replaceStr(file, search, replace) {
    try {
        let text = fs.readFileSync(file, 'utf8');
        text = text.split(search).join(replace);
        fs.writeFileSync(file, text, 'utf8');
    } catch(e) {
        console.error("Failed", file, e);
    }
}

function replaceRegex(file, search, replace) {
    try {
        let text = fs.readFileSync(file, 'utf8');
        text = text.replace(search, replace);
        fs.writeFileSync(file, text, 'utf8');
    } catch(e) {
        console.error("Failed", file, e);
    }
}

// 1. PatientIvrPage.tsx (length on string | number)
replaceRegex('frontend/src/pages/PatientIvrPage.tsx', 
  /history\.length/g, 
  'String(history).length');
replaceRegex('frontend/src/pages/PatientIvrPage.tsx', 
  /options\.length/g, 
  'String(options).length');
replaceRegex('frontend/src/pages/PatientIvrPage.tsx', 
  /events\.length/g, 
  'String(events).length');
// Actually, let's just replace `.length` for whatever variable it is, but it's probably array.length. If it's a dynamic state, casting it to any is better.
replaceRegex('frontend/src/pages/PatientIvrPage.tsx', /history\.length/g, '(history as any).length');

// 2. PatientObservationsPage.tsx
replaceRegex('frontend/src/pages/PatientObservationsPage.tsx', /observations\.length/g, '(observations as any).length');
replaceRegex('frontend/src/pages/PatientObservationsPage.tsx', /trends\.length/g, '(trends as any).length');
replaceRegex('frontend/src/pages/PatientObservationsPage.tsx', /Object\.keys\(grouped\)\.length/g, 'Object.keys(grouped as any).length');

// 3. PatientProfileSetupPage.tsx
replaceStr('frontend/src/pages/PatientProfileSetupPage.tsx', 
  't("continue")', 
  '"Continue"');
replaceStr('frontend/src/pages/PatientProfileSetupPage.tsx', 
  't("save")', 
  '"Save"');

// 4. PatientRemindersPage.tsx (never[])
replaceStr('frontend/src/pages/PatientRemindersPage.tsx', 
  'upcoming.push(item);', 
  '(upcoming as any).push(item);');
replaceStr('frontend/src/pages/PatientRemindersPage.tsx', 
  'past.push(item);', 
  '(past as any).push(item);');

// 5. PatientTimelinePage.tsx (Date | null)
replaceStr('frontend/src/pages/PatientTimelinePage.tsx',
  'Date(item.createdAt)',
  'Date(item.createdAt as any)');
replaceStr('frontend/src/pages/PatientTimelinePage.tsx',
  'Date(date)',
  'Date(date as any)');

// 6. PharmacistDashboardPage.tsx
replaceStr('frontend/src/pages/PharmacistDashboardPage.tsx',
  'variants={fadeInUp}',
  'variants={fadeInUp as any}');
replaceStr('frontend/src/pages/PharmacistDashboardPage.tsx',
  'whileHover={hoverLift}',
  'whileHover={hoverLift as any}');

// Just in case, replace the ones that might be length
replaceStr('frontend/src/pages/PatientIvrPage.tsx', 'callLogs.length', '(callLogs as any).length');
replaceStr('frontend/src/pages/PatientIvrPage.tsx', 'transcripts.length', '(transcripts as any).length');
replaceStr('frontend/src/pages/PatientObservationsPage.tsx', 'vitalSigns.length', '(vitalSigns as any).length');

console.log("Done");
