import os
import json

errors = []
with open("scratch/ts_errors.json", "r", encoding="utf-8") as f:
    errors = json.load(f)

for err in errors:
    if err["code"] == "TS2322":
        filepath = os.path.join(os.getcwd(), err["file"])
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        row = int(err["row"]) - 1
        
        if "ProtectedRoute.tsx" in err["file"] and "to type 'To'" in err["msg"]:
            lines[row] = lines[row].replace("to={redirectTo}", "to={redirectTo as string}")
            
        elif "VideoConsultation.tsx" in err["file"] and "microphone" in err["msg"]:
            # `facingMode: "microphone"` is invalid HTML5 facingMode. 
            lines[row] = lines[row].replace('facingMode: "microphone"', 'facingMode: "user"')
            
        elif "Button.tsx" in err["file"] and "VariantLabels" in err["msg"]:
            lines[row] = lines[row].replace("whileTap={tapScale}", "whileTap={tapScale as DynamicStateObject}")
            if "DynamicStateObject" not in "".join(lines):
                 lines.insert(0, "import { DynamicStateObject } from \"../types/DynamicState\";\n")
                 
        elif "LeafletMap" in err["msg"] or "LeafletTileLayer" in err["msg"] or "LeafletCircle" in err["msg"] or "LeafletPolyline" in err["msg"]:
             if "MapContainer" in lines[row] and "{" in lines[row] and not "DynamicStateObject" in lines[row]:
                  # Try to find a place to insert `as DynamicStateObject`
                  pass

        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(lines)

print("Fixed some TS2322 errors.")
