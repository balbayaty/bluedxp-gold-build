const fs = require('fs')

/**
 * Finds unmatched opening tokens in MSDSPage BEFORE the main JSX return.
 * This is a lightweight scanner (not a full parser) but it handles:
 * - // and /* *\/ comments
 * - single/double quoted strings with escapes
 * - template strings with ${ ... } interpolations (nested)
 */

const FILE = process.argv[2] || 'app/msds/page.tsx'
const code = fs.readFileSync(FILE, 'utf8')

const funcMarker = 'export default function MSDSPage() {'
const funcStart = code.indexOf(funcMarker)
if (funcStart < 0) {
  console.error(`Could not find MSDSPage in ${FILE}`)
  process.exit(1)
}

const returnMarker = '\n  return ('
const returnIdx = code.indexOf(returnMarker, funcStart)
if (returnIdx < 0) {
  console.error(`Could not find main return() in ${FILE}`)
  process.exit(1)
}

const src = code.slice(funcStart, returnIdx)

let line = 1
let col = 0

/** @type {'code'|'linecomment'|'blockcomment'|'squote'|'dquote'|'template'|'template_expr'} */
let state = 'code'
let esc = false

// When inside template literal expression (${ ... }), we treat it like code but need to return to template on matching '}'
let templateExprDepth = 0

/** @type {{ch:'('|'['|'{', line:number, col:number}[]} */
const stack = []

function push(ch) {
  stack.push({ ch, line, col })
}
function pop(expected) {
  const top = stack[stack.length - 1]
  if (!top || top.ch !== expected) return
  stack.pop()
}

for (let i = 0; i < src.length; i++) {
  const ch = src[i]
  const next = src[i + 1]

  if (ch === '\n') {
    line++
    col = 0
  } else {
    col++
  }

  if (state === 'linecomment') {
    if (ch === '\n') state = 'code'
    continue
  }

  if (state === 'blockcomment') {
    if (ch === '*' && next === '/') {
      state = 'code'
      i++
      col++
    }
    continue
  }

  if (state === 'squote') {
    if (esc) {
      esc = false
      continue
    }
    if (ch === '\\') {
      esc = true
      continue
    }
    if (ch === "'") state = 'code'
    continue
  }

  if (state === 'dquote') {
    if (esc) {
      esc = false
      continue
    }
    if (ch === '\\') {
      esc = true
      continue
    }
    if (ch === '"') state = 'code'
    continue
  }

  if (state === 'template') {
    if (esc) {
      esc = false
      continue
    }
    if (ch === '\\') {
      esc = true
      continue
    }
    if (ch === '`') {
      state = 'code'
      continue
    }
    if (ch === '$' && next === '{') {
      // enter template expression
      templateExprDepth++
      push('{')
      state = 'template_expr'
      i++
      col++
      continue
    }
    continue
  }

  // code OR template_expr
  if (ch === '/' && next === '/') {
    state = 'linecomment'
    i++
    col++
    continue
  }
  if (ch === '/' && next === '*') {
    state = 'blockcomment'
    i++
    col++
    continue
  }

  if (state === 'code' || state === 'template_expr') {
    if (ch === "'") {
      state = 'squote'
      continue
    }
    if (ch === '"') {
      state = 'dquote'
      continue
    }
    if (ch === '`') {
      state = 'template'
      continue
    }

    if (ch === '(') push('(')
    else if (ch === ')') pop('(')
    else if (ch === '[') push('[')
    else if (ch === ']') pop('[')
    else if (ch === '{') push('{')
    else if (ch === '}') {
      pop('{')
      if (state === 'template_expr') {
        templateExprDepth = Math.max(0, templateExprDepth - 1)
        if (templateExprDepth === 0) {
          state = 'template'
        }
      }
    }
  }
}

console.log(`File: ${FILE}`)
console.log(`Unclosed opens before return: ${stack.length}`)
for (const item of stack.slice(-20)) {
  console.log(`- ${item.ch} at line ${item.line}, col ${item.col}`)
}












