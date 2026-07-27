import os

directory = "frontend/src"
fixed = 0

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "(...args: never[]) =>" in content:
                new_content = content.replace("(...args: never[]) =>", "(...args: DynamicStateObject[]) =>")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                fixed += 1

print(f"Replaced (...args: never[]) in {fixed} files.")
