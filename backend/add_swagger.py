import os
import re

CONTROLLERS_DIR = r"src\main\java\com\telecareplus\controller"

tag_template = '@Tag(name = "{}", description = "Endpoints for {} management")'
operation_template = '@Operation(summary = "{}", description = "{}")'
api_response = '@ApiResponse(responseCode = "200", description = "Successful operation")'

for filename in os.listdir(CONTROLLERS_DIR):
    if not filename.endswith("Controller.java"):
        continue

    filepath = os.path.join(CONTROLLERS_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already annotated
    if 'io.swagger.v3.oas.annotations.tags.Tag' in content:
        continue

    # Extract controller name
    controller_name = filename.replace('Controller.java', '')
    
    # Add imports
    imports_to_add = (
        "import io.swagger.v3.oas.annotations.Operation;\n"
        "import io.swagger.v3.oas.annotations.responses.ApiResponse;\n"
        "import io.swagger.v3.oas.annotations.tags.Tag;\n"
    )
    
    # Find package declaration
    content = re.sub(r'(package [^;]+;)', r'\1\n\n' + imports_to_add, content, count=1)

    # Add @Tag before @RestController
    tag_annotation = tag_template.format(controller_name, controller_name)
    content = re.sub(r'(@RestController)', tag_annotation + r'\n\1', content, count=1)

    # Add @Operation before mappings
    def replacer(match):
        mapping = match.group(1) # @GetMapping, @PostMapping, etc.
        method_name = match.group(2) # extract simple method name if possible, else generic
        return f'{operation_template.format(f"Execute {mapping}", "Invokes the endpoint")}\n    {api_response}\n    {match.group(0)}'

    # A simple regex to find mapping annotations.
    content = re.sub(r'(@(?:Get|Post|Put|Delete|Patch)Mapping.*?\n\s+public.*? (\w+)\()', replacer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Swagger annotations added to all controllers.")
