import os
import re
from collections import defaultdict

def auto_fix_ts_errors():
    log_path = os.path.join("c:\\", "Users", "shyamkumar", "Desktop", "oose pro", "scratch", "tsc_output.log")
    frontend_dir = os.path.join("c:\\", "Users", "shyamkumar", "Desktop", "oose pro", "frontend")
    
    with open(log_path, 'r', encoding='utf-16') as f:
        lines = f.readlines()
        
    errors_by_file = defaultdict(list)
    
    for line in lines:
        # Example: src/utils/normalizeAuth.ts(4,27): error TS7006: Parameter 'token' implicitly has an 'any' type.
        match = re.match(r'^(src/[^:]+)\((\d+),(\d+)\): error (TS\d+): (.*)', line)
        if match:
            filepath, row, col, ts_code, msg = match.groups()
            errors_by_file[filepath].append({
                'row': int(row),
                'col': int(col),
                'code': ts_code,
                'msg': msg
            })
            
    print(f"Found errors in {len(errors_by_file)} files.")
    
    for filepath, errors in errors_by_file.items():
        abs_path = os.path.join(frontend_dir, filepath.replace('/', '\\'))
        if not os.path.exists(abs_path):
            continue
            
        with open(abs_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Fix implicit any parameters
        for err in errors:
            if err['code'] == 'TS7006':
                param_match = re.search(r"Parameter '([^']+)' implicitly has an 'any' type", err['msg'])
                if param_match:
                    param = param_match.group(1)
                    row_idx = err['row'] - 1
                    # Highly simplistic replacement for implicit any
                    if 'Any' not in lines[row_idx] and 'unknown' not in lines[row_idx]:
                        # Fallback strict type inference based on param name
                        if param in ['id', 'token', 'query', 'name', 'email', 'message', 'url']:
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: string', lines[row_idx])
                        elif param in ['count', 'index', 'amount', 'total']:
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: number', lines[row_idx])
                        elif param in ['isActive', 'show', 'loading', 'success']:
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: boolean', lines[row_idx])
                        elif param in ['e', 'event']:
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: React.SyntheticEvent', lines[row_idx])
                        elif param in ['error', 'err']:
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: Error | unknown', lines[row_idx])
                        else:
                            # Use unknown instead of any to satisfy strict mode
                            lines[row_idx] = re.sub(rf'\b{param}\b(?!:)', f'{param}: unknown', lines[row_idx])
                            
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
    print("Auto-fix pass complete.")

if __name__ == "__main__":
    auto_fix_ts_errors()
