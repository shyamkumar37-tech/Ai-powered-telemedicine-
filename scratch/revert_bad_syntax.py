import os
import re

def fix():
    utils_dir = os.path.join("c:\\", "Users", "shyamkumar", "Desktop", "oose pro", "frontend", "src", "utils")
    for filename in os.listdir(utils_dir):
        if filename.endswith(".ts"):
            filepath = os.path.join(utils_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Revert bad replacements that happened outside function parameters
            # e.g., String(value: string | number) -> String(value)
            content = content.replace("String(value: string | number)", "String(value)")
            content = content.replace("Number(amount: number)", "Number(amount)")
            content = content.replace("new Date(dateString: string)", "new Date(dateString)")
            content = content.replace("new Date(date: string | Date)", "new Date(date)")
            content = content.replace("Number(value: string | number)", "Number(value)")
            content = content.replace("console.error(error: Error | unknown)", "console.error(error)")
            content = content.replace("typeof value: string | number", "typeof value")
            content = content.replace("value: string | number.replace", "value.replace")
            content = content.replace("value: string | number ===", "value ===")
            content = content.replace("error: Error | any", "error")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

if __name__ == "__main__":
    fix()
