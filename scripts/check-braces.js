
const fs = require('fs');
const filePath = 'components/InboundDetail.tsx';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    let openBraces = 0;
    let openParens = 0;
    let openFrag = 0;

    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Basic regex to find match, ignoring strings/comments is hard without full parser
        // But let's try a simple count
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '{') openBraces++;
            if (char === '}') openBraces--;
            if (char === '(') openParens++;
            if (char === ')') openParens--;
        }
        if (openBraces < 0) console.log(`Step Id: 554 Negative braces at line ${index + 1}: ${line}`);
        if (openParens < 0) console.log(`Step Id: 554 Negative parens at line ${index + 1}: ${line}`);
    });

    console.log(`Final Braces: ${openBraces}`);
    console.log(`Final Parens: ${openParens}`);

} catch (e) {
    console.error(e);
}
