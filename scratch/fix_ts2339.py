import os
import json

errors = []
with open("scratch/ts_errors.json", "r", encoding="utf-8") as f:
    errors = json.load(f)

for err in errors:
    if err["code"] == "TS2339":
        filepath = os.path.join(os.getcwd(), err["file"])
        if not os.path.exists(filepath):
            continue
        
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        row = int(err["row"]) - 1
        
        if "Property 'ranslateUiText' does not exist" in err["msg"]:
            lines[row] = lines[row].replace("ranslateUiText", "t")
            
        elif "Property '" in err["msg"] and "does not exist on type 'Window & typeof globalThis'" in err["msg"]:
            prop = err["msg"].split("'")[1]
            if f"window.{prop}" in lines[row]:
                lines[row] = lines[row].replace(f"window.{prop}", f"(window as DynamicStateObject).{prop}")
                if "DynamicStateObject" not in "".join(lines):
                    lines.insert(0, "import { DynamicStateObject } from \"../types/DynamicState\";\n")
                    
        elif "Property '" in err["msg"] and "does not exist on type '{}'" in err["msg"]:
             # If it's `options = {}`, change to `options: DynamicStateObject = {}`
             if "options = {}" in lines[row]:
                  lines[row] = lines[row].replace("options = {}", "options: DynamicStateObject = {}")
             if "options=" in lines[row]:
                  lines[row] = lines[row].replace("options={}", "options: DynamicStateObject = {}")
                  
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(lines)

print("Attempted to fix some TS2339 errors.")
