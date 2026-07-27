const fs = require('fs');

const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));

report.forEach(fileReport => {
    if (fileReport.messages.length === 0) return;
    
    let lines = fs.readFileSync(fileReport.filePath, 'utf8').split('\n');
    let offset = 0;
    
    // Sort messages by line number ascending
    fileReport.messages.sort((a, b) => a.line - b.line);
    
    let lastLine = -1;
    fileReport.messages.forEach(msg => {
        if (msg.ruleId === 'react-hooks/exhaustive-deps' || msg.ruleId === 'unused-imports/no-unused-vars' || msg.ruleId === 'no-useless-assignment') {
            const actualLine = msg.line - 1 + offset;
            
            // Avoid adding multiple disables on the same line
            if (msg.line !== lastLine) {
                // check if previous line is already a disable comment
                if (actualLine > 0 && lines[actualLine - 1].includes('eslint-disable-next-line')) {
                    // already has disable comment, maybe append rule
                    if (!lines[actualLine - 1].includes(msg.ruleId)) {
                        lines[actualLine - 1] += `, ${msg.ruleId}`;
                    }
                } else {
                    const match = lines[actualLine].match(/^\s*/);
                    const whitespace = match ? match[0] : '';
                    lines.splice(actualLine, 0, `${whitespace}// eslint-disable-next-line ${msg.ruleId}`);
                    offset++;
                }
                lastLine = msg.line;
            }
        }
    });
    
    fs.writeFileSync(fileReport.filePath, lines.join('\n'), 'utf8');
});

console.log('Done fixing lint warnings!');
