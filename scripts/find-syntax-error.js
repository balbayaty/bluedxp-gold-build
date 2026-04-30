const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/msds/page.tsx');
const code = fs.readFileSync(filePath, 'utf8');

// Find the component function
const funcStart = code.indexOf('export default function MSDSPage() {');
if (funcStart === -1) {
  console.error('Could not find MSDSPage function');
  process.exit(1);
}

// Find the return statement
const returnIdx = code.indexOf('\n  return (', funcStart);
if (returnIdx === -1) {
  console.error('Could not find return statement');
  process.exit(1);
}

// Get the code before the return
const beforeReturn = code.substring(funcStart + 'export default function MSDSPage() {'.length, returnIdx);

// Calculate starting line number (count newlines before function start)
const linesBeforeFunc = code.substring(0, funcStart).split('\n').length;

// Parse and count braces, parens, brackets
let line = linesBeforeFunc + 1; // Start from the line after function declaration
let col = 0;
let state = 'code'; // code, string, template, comment
let esc = false;
const stack = [];

function push(ch, type) {
  stack.push({ ch, type, line, col });
}

function pop(expected) {
  if (stack.length === 0) {
    console.error(`Unexpected closing ${expected} at line ${line}, col ${col}`);
    return false;
  }
  const top = stack[stack.length - 1];
  if (top.ch !== expected) {
    console.error(`Mismatch: expected ${top.ch} but found ${expected} at line ${line}, col ${col}`);
    console.error(`  Opening ${top.ch} was at line ${top.line}, col ${top.col}`);
    return false;
  }
  stack.pop();
  return true;
}

for (let i = 0; i < beforeReturn.length; i++) {
  const ch = beforeReturn[i];
  const next = beforeReturn[i + 1];
  
  if (ch === '\n') {
    line++;
    col = 0;
  } else {
    col++;
  }

  if (state === 'comment') {
    if (ch === '\n') state = 'code';
    continue;
  }

  if (state === 'blockcomment') {
    if (ch === '*' && next === '/') {
      state = 'code';
      i++;
      col++;
    }
    continue;
  }

  if (state === 'string') {
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (ch === '"') {
      state = 'code';
      continue;
    }
    continue;
  }

  if (state === 'template') {
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (ch === '`') {
      state = 'code';
      continue;
    }
    // Handle ${ ... } in templates
    if (ch === '$' && next === '{') {
      push('{', 'template-interp');
      i++;
      col++;
      continue;
    }
    continue;
  }

  // state === 'code'
  if (ch === '/' && next === '/') {
    state = 'comment';
    i++;
    col++;
    continue;
  }
  if (ch === '/' && next === '*') {
    state = 'blockcomment';
    i++;
    col++;
    continue;
  }
  if (ch === '"') {
    state = 'string';
    continue;
  }
  if (ch === '`') {
    state = 'template';
    continue;
  }

  if (ch === '(') push('(', 'paren');
  else if (ch === ')') {
    if (!pop('(')) {
      console.error(`Error at line ${line}, col ${col}`);
      process.exit(1);
    }
  }
  else if (ch === '[') push('[', 'bracket');
  else if (ch === ']') {
    if (!pop('[')) {
      console.error(`Error at line ${line}, col ${col}`);
      process.exit(1);
    }
  }
  else if (ch === '{') push('{', 'brace');
  else if (ch === '}') {
    if (!pop('{')) {
      console.error(`Error at line ${line}, col ${col}`);
      process.exit(1);
    }
  }
}

console.log(`\nUnclosed tokens before return statement:`);
console.log(`Total unclosed: ${stack.length}`);
if (stack.length > 0) {
  console.log('\nUnclosed openings:');
  stack.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.ch} (${item.type}) at line ${item.line}, col ${item.col}`);
  });
  
  // Show the last few unclosed items with context
  const last = stack[stack.length - 1];
  const lines = beforeReturn.split('\n');
  if (last.line <= lines.length) {
    console.log(`\nContext around line ${last.line}:`);
    const start = Math.max(0, last.line - 3);
    const end = Math.min(lines.length, last.line + 2);
    for (let i = start; i < end; i++) {
      const marker = i === last.line - 1 ? '>>> ' : '    ';
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
  }
} else {
  console.log('No unclosed tokens found - the issue might be elsewhere');
}

process.exit(stack.length > 0 ? 1 : 0);

