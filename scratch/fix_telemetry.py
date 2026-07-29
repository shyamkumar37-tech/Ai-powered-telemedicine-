import re

path = 'frontend/src/services/telemetry.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove ts-expect-error
content = re.sub(r'\s*// @ts-expect-error - Auto-suppressed during migration', '', content)

# Remove DynamicStateObject imports and usages
content = content.replace('import { DynamicStateObject } from "./../types/DynamicState";\n', '')
content = content.replace(': DynamicStateObject', ': any')
content = content.replace(' as DynamicStateObject', '')

# Type trackTelemetry
content = content.replace(
    'export function trackTelemetry(type: any, payload = {}, options = {})',
    'export function trackTelemetry(type: string, payload: Record<string, any> = {}, options: Record<string, any> = {})'
)

# Type trackAuthEvent
content = content.replace(
    'export function trackAuthEvent(action: any, payload = {}, options = {})',
    'export function trackAuthEvent(action: string, payload: Record<string, any> = {}, options: Record<string, any> = {})'
)

# Type the rest of the functions
for func in ['trackUnauthorizedRoute', 'trackApiFailure', 'trackRouteTransition', 'trackRuntimeException', 'trackChunkFailure']:
    content = content.replace(
        f'export function {func}(payload = {{}})',
        f'export function {func}(payload: Record<string, any> = {{}})'
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
