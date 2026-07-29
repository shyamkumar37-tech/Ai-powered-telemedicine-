const fs = require('fs');

const path = 'frontend/src/services/telemetry.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\s*\/\/\s*@ts-expect-error\s*-\s*Auto-suppressed during migration/g, '');
content = content.replace(/import \{ DynamicStateObject \} from "\.\.\/types\/DynamicState";\n/g, '');
content = content.replace(/import \{ DynamicStateObject \} from "\.\.\/types\/DynamicState";/g, '');

content = content.replace(/value: string \| number/g, 'value: any');
content = content.replace(/value: any, key = ""/g, 'value: any, key: string = ""');

content = content.replace(
  'export function trackTelemetry(type: DynamicStateObject, payload = {}, options = {})',
  'export function trackTelemetry(type: string, payload: Record<string, any> = {}, options: Record<string, any> = {})'
);

content = content.replace(
  'export function trackAuthEvent(action: DynamicStateObject, payload = {}, options = {})',
  'export function trackAuthEvent(action: string, payload: Record<string, any> = {}, options: Record<string, any> = {})'
);

const simpleFuncs = ['trackUnauthorizedRoute', 'trackApiFailure', 'trackRouteTransition', 'trackRuntimeException', 'trackChunkFailure'];
for (const func of simpleFuncs) {
  content = content.replace(
    `export function ${func}(payload = {})`,
    `export function ${func}(payload: Record<string, any> = {})`
  );
}

content = content.replace(/error: DynamicStateObject/g, 'error: any');
content = content.replace(/event: DynamicStateObject/g, 'event: any');
content = content.replace(/listener: DynamicStateObject/g, 'listener: any');
content = content.replace(/fingerprint: DynamicStateObject/g, 'fingerprint: string');
content = content.replace(/accumulator: DynamicStateObject/g, 'accumulator: any');
content = content.replace(/item: DynamicStateObject/g, 'item: any');
content = content.replace(/\[entryKey, entryValue\]: DynamicStateObject/g, '[entryKey, entryValue]');
content = content.replace(/\.\.\.args: DynamicStateObject/g, '...args: any[]');
content = content.replace(/args\.map\(\(item: DynamicStateObject\)/g, 'args.map((item: any)');

content = content.replace(/\(accumulator as DynamicStateObject\)/g, 'accumulator');
content = content.replace(/\(window as DynamicStateObject\)/g, '(window as any)');

fs.writeFileSync(path, content, 'utf8');
