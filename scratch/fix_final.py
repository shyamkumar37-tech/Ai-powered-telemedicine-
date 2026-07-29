import re
import os

def fix_file(path, fixes):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for search, replace in fixes:
        content = content.replace(search, replace)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. PharmacistDashboardPage.tsx
fix_file('frontend/src/pages/PharmacistDashboardPage.tsx', [
    ('transition={{ type: "spring"', 'transition={{ type: "spring" as any')
])

# 2. PharmacistDispensingPage.tsx
fix_file('frontend/src/pages/PharmacistDispensingPage.tsx', [
    ('const totalCost = (medicine.quantity * medicine.unitPrice).toFixed(2);', 'const totalCost = (Number(medicine.quantity) * Number(medicine.unitPrice)).toFixed(2);')
])

# 3. PharmacistInventoryPage.tsx
fix_file('frontend/src/pages/PharmacistInventoryPage.tsx', [
    ("queryClient.invalidateQueries(['inventory'])", "queryClient.invalidateQueries({ queryKey: ['inventory'] })"),
    ("queryClient.invalidateQueries(['inventory', 'alerts'])", "queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] })"),
    ("medicineName", "medicineName"), # If this is item.medicineName, we need to cast item to any. Let's cast item to any in the render loop.
    ("item.medicineName", "(item as any).medicineName"),
    ("item.quantityAvailable", "(item as any).quantityAvailable"),
    ("item.reorderLevel", "(item as any).reorderLevel"),
    ("item.unitLabel", "(item as any).unitLabel")
])

# 4. PrescriptionPrintPage.tsx
fix_file('frontend/src/pages/PrescriptionPrintPage.tsx', [
    ("prescriptionId={id}", "prescriptionId={id as string}")
])

# 5. TriagePage.tsx
fix_file('frontend/src/pages/TriagePage.tsx', [
    ("signal: abortController.current.signal", "signal: abortController.current.signal as any"),
    ("const newProgress = Math.min((elapsed / estimatedTime) * 100, 95);", "const newProgress = Math.min((Number(elapsed) / Number(estimatedTime)) * 100, 95);"),
    ("setLoadingProgress('100');", "setLoadingProgress(100);")
])

# 6. api.ts
fix_file('frontend/src/services/api.ts', [
    ("error.offlineQueued", "(error as any).offlineQueued"),
    ("error.pendingLocalSave", "(error as any).pendingLocalSave"),
    ("error.queuedRequestId", "(error as any).queuedRequestId"),
    ("error.response", "(error as any).response"),
    ("for (const request: any of pending)", "for (const request of pending)"),
    ("{ skipOfflineQueue: true }", "{ skipOfflineQueue: true } as any")
])

# 7. authService.ts
fix_file('frontend/src/services/authService.ts', [
    ("metadata: { bypassAuth: true }", "metadata: { bypassAuth: true } as any")
])

# 8. websocketService.ts
fix_file('frontend/src/services/websocketService.ts', [
    ("listeners: Map<string, Set<Function>> = new Set();", "listeners: Map<string, Set<Function>> = new Map();"),
    ("this.listeners.add(", "this.listeners.set(")
])

# 9. apiError.ts
fix_file('frontend/src/utils/apiError.ts', [
    ("translateUiText(fallbackMessage)", "String(translateUiText(fallbackMessage))"),
    ("translateUiText(baseMessage)", "String(translateUiText(baseMessage))"),
    ("translateUiText('Access denied')", "String(translateUiText('Access denied'))"),
    ("translateUiText('Resource not found')", "String(translateUiText('Resource not found'))"),
    ("translateUiText('Server timeout')", "String(translateUiText('Server timeout'))"),
    ("translateUiText('Network error')", "String(translateUiText('Network error'))")
])

# 10. exportUtils.ts
fix_file('frontend/src/utils/exportUtils.ts', [
    ("doc.autoTable(", "(doc as any).autoTable(")
])

# 11. i18n.ts
fix_file('frontend/src/utils/i18n.ts', [
    ("(part: string, index: number) =>", "(part: any, index: number) =>")
])

# 12. requestLifecycle.ts
fix_file('frontend/src/utils/requestLifecycle.ts', [
    ("config.timeoutMs", "(config as any).timeoutMs"),
    ("config.signal", "(config as any).signal"),
    ("config.timeoutMessage", "(config as any).timeoutMessage")
])
