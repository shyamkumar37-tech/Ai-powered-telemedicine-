import os

file_path = "backend/pom.xml"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "<groupId>com.redis.testcontainers</groupId>" in line:
        skip = True
        new_lines.pop() # remove dependency open tag
        continue
    
    if skip and "</dependency>" in line:
        skip = False
        continue
        
    if not skip:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
    
print("Removed redis testcontainers from pom.xml")
