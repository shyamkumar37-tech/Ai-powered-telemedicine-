import os

file_path = "backend/pom.xml"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if i == 33 and "</dependencies>" in line:
        new_lines.append("            <dependency>\n")
        new_lines.append("                <groupId>org.testcontainers</groupId>\n")
        new_lines.append("                <artifactId>testcontainers-bom</artifactId>\n")
        new_lines.append("                <version>1.19.7</version>\n")
        new_lines.append("                <type>pom</type>\n")
        new_lines.append("                <scope>import</scope>\n")
        new_lines.append("            </dependency>\n")
        new_lines.append(line)
    elif i >= 258 and i <= 269:
        # Delete second dependencyManagement
        continue
    else:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
    
print("Fixed pom.xml")
