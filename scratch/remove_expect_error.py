import os

files = [
    "frontend/src/components/Layout.tsx",
    "frontend/src/components/caregiver/GeofenceMap.tsx",
    "frontend/src/components/ui/DashboardSkeleton.tsx",
    "frontend/src/pages/PatientCarePlansPage.tsx",
    "frontend/src/pages/PatientPrescriptionsPage.tsx"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    new_lines = [line for line in lines if "@ts-expect-error - Auto-suppressed during migration" not in line]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
        
print("Removed bad comments.")
