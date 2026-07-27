import os

directory = "frontend/src"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            if "<MapContainer" in content or "<TileLayer" in content or "<Circle" in content or "<Polyline" in content:
                content = content.replace("<MapContainer ", "<MapContainer {...{} as DynamicStateObject} ")
                content = content.replace("<TileLayer ", "<TileLayer {...{} as DynamicStateObject} ")
                content = content.replace("<Circle ", "<Circle {...{} as DynamicStateObject} ")
                content = content.replace("<Polyline ", "<Polyline {...{} as DynamicStateObject} ")
                content = content.replace("<Marker ", "<Marker {...{} as DynamicStateObject} ")
                
                if "DynamicStateObject" not in content:
                    content = "import { DynamicStateObject } from \"../types/DynamicState\";\n" + content
                    
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

print("Fixed Leaflet types")
