import os

file_path = "frontend/src/context/AuthContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("localStorage.setItem(AUTH_STORAGE_KEY, nextJson);", "localStorage.setItem(AUTH_STORAGE_KEY, nextJson as string);")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed AuthContext.tsx setItem")
