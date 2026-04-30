# How to Use Cursor Shared Knowledge Rules

## 📋 Quick Setup Guide

### Step 1: Copy Rules to Cursor Shared Knowledge

**IMPORTANT**: You have TWO rule files - use BOTH for best results:

#### Option A: Combined Rule (Recommended)
1. **Open Cursor Settings**
   - Go to Cursor → Settings → Shared Knowledge (or Team Settings → Shared Knowledge)

2. **Create a New Rule**
   - Click "Create Rule" button
   - Name it: "BlueDXP Platform - Complete Rules"

3. **Copy BOTH Files**
   - First, copy from `docs/CURSOR_PERSONALIZED_RULES.md` (your interaction style)
   - Then, copy from `docs/CURSOR_SHARED_KNOWLEDGE_RULES.md` (technical patterns)
   - Paste both into the rule editor (personalized rules first, then technical)

#### Option B: Separate Rules (Better Organization)
1. **Rule 1: "BlueDXP - User Interaction Style"**
   - Copy from `docs/CURSOR_PERSONALIZED_RULES.md`
   - This teaches AI how YOU communicate and what YOU need

2. **Rule 2: "BlueDXP - Technical Architecture"**
   - Copy from `docs/CURSOR_SHARED_KNOWLEDGE_RULES.md`
   - This teaches AI your codebase patterns

**Why Both?**
- Personalized rules = How to communicate with YOU
- Technical rules = What code patterns to follow
- Together = AI that understands both your needs AND your codebase

### Step 2: Create Additional Focused Rules (Optional)

You can break down the rules into smaller, focused rules for better organization:

#### Rule 1: "BlueDXP - Architecture Patterns"
Copy sections:
- 🏗️ Architectural Patterns
- 📁 File Organization
- ✅ Pre-Implementation Checklist

#### Rule 2: "BlueDXP - Security & Permissions"
Copy sections:
- 🔒 Security Patterns
- Authentication & Authorization

#### Rule 3: "BlueDXP - UI/UX Standards"
Copy sections:
- 🎨 UI/UX Patterns
- Component Structure
- Error Handling in UI

#### Rule 4: "BlueDXP - Integration & 4IR/5IR"
Copy sections:
- 🔌 Integration Patterns
- 🚀 4IR & 5IR Alignment

#### Rule 5: "BlueDXP - TypeScript & Code Quality"
Copy sections:
- 📝 TypeScript Patterns
- 💡 Best Practices
- 🚨 Common Mistakes to Avoid

---

## 🔄 Self-Updating Strategy

### How Rules Should Evolve

1. **After Each Significant Feature**
   - Review what patterns were used
   - Add new patterns discovered
   - Update examples with actual file paths
   - Document any exceptions or special cases

2. **When Finding Better Patterns**
   - Don't delete old patterns (they might still be valid)
   - Add new patterns as alternatives
   - Document when to use each approach

3. **When Discovering Common Mistakes**
   - Add to "Common Mistakes to Avoid" section
   - Include examples of what NOT to do
   - Reference fixes from actual code

### Example: Adding a New Pattern

```markdown
### New Pattern: [Pattern Name]
**When to Use**: [Description of when this pattern applies]

**Implementation**:
```typescript
// Example code
```

**Reference Examples**:
- `lib/services/[module]/[example].ts` - Real implementation
- `components/[module]/[example].tsx` - UI example

**Key Points**:
- Point 1
- Point 2
```

---

## 📊 Monitoring Rule Effectiveness

### Track These Metrics

1. **Code Consistency**
   - Are new features following the patterns?
   - Are services being created correctly?
   - Are adapters being used for integrations?

2. **Common Issues**
   - What mistakes keep happening?
   - What patterns are being ignored?
   - What needs better documentation?

3. **Pattern Evolution**
   - Are new patterns emerging?
   - Are old patterns becoming obsolete?
   - Are there better ways to do things?

### Update Frequency

- **Weekly**: Review recent code changes
- **Monthly**: Update rules with new patterns
- **Quarterly**: Major review and cleanup

---

## 🎯 Best Practices for Rule Management

### Rule Organization

1. **Keep Rules Focused**
   - One rule per major topic
   - Don't mix unrelated patterns
   - Use clear section headers

2. **Reference Actual Code**
   - Always include file paths to examples
   - Point to real implementations
   - Keep examples up-to-date

3. **Make Rules Actionable**
   - Clear "DO" and "DON'T" examples
   - Step-by-step guidance
   - Checklists for verification

4. **Keep Rules Current**
   - Remove obsolete patterns (but document why)
   - Update examples when code changes
   - Add new patterns as they emerge

### Rule Formatting

- Use clear headings (## for major sections)
- Use code blocks for examples
- Use checklists for verification
- Use emojis for visual scanning (optional)
- Keep line length reasonable (80-100 chars)

---

## 🔍 How Cursor Uses These Rules

### When You Ask for Help

Cursor will:
1. Reference these rules for consistency
2. Check against actual codebase patterns
3. Suggest improvements based on rules
4. Warn about common mistakes

### When Generating Code

Cursor will:
1. Follow architectural patterns
2. Use correct service layer structure
3. Apply security best practices
4. Follow UI/UX standards
5. Include proper error handling

### When Reviewing Code

Cursor will:
1. Check against rules
2. Suggest improvements
3. Identify violations
4. Recommend better patterns

---

## 📝 Example: Adding a New Pattern

Let's say you discover a new pattern for handling async operations:

### Step 1: Identify the Pattern
You notice that all async operations use a consistent error handling pattern.

### Step 2: Document It
Add to the rules:

```markdown
### Async Operation Pattern
**When to Use**: All async operations in services

**Implementation**:
```typescript
export const featureService: FeatureService = {
  async performAsyncOperation(data: Input): Promise<Output> {
    try {
      // Validate input
      if (!data) throw new Error('Invalid input')
      
      // Perform operation
      const result = await someAsyncCall(data)
      
      // Emit event
      await eventBus.publish('feature.operation.completed', {
        entityId: result.id,
        data: result
      })
      
      return result
    } catch (error) {
      // Log error
      logger.error('Operation failed', error, { module: 'feature' })
      
      // Re-throw with context
      throw new Error(`Operation failed: ${error.message}`)
    }
  }
}
```

**Reference Examples**:
- `lib/services/wms/skuService.ts` - Lines 45-67
- `lib/services/transportation/shipmentService.ts` - Lines 89-112

**Key Points**:
- Always validate input first
- Emit events after successful operations
- Log errors with context
- Re-throw errors with meaningful messages
```

### Step 3: Update Checklist
Add to Pre-Implementation Checklist:
- [ ] Async operations follow async operation pattern
- [ ] Events emitted after successful operations
- [ ] Errors logged with context

---

## 🚀 Quick Start Checklist

- [ ] Created main rule in Cursor Shared Knowledge
- [ ] Copied all sections from `CURSOR_SHARED_KNOWLEDGE_RULES.md`
- [ ] (Optional) Created focused sub-rules
- [ ] Reviewed rules for accuracy
- [ ] Tested rules with a simple code generation request
- [ ] Set reminder to review rules monthly

---

## 💡 Tips for Maximum Effectiveness

1. **Be Specific**: Include actual file paths and line numbers
2. **Show Examples**: Code examples are better than descriptions
3. **Keep Updated**: Review and update rules regularly
4. **Document Exceptions**: When to break rules and why
5. **Reference Standards**: Point to official docs (SECURITY.md, etc.)

---

**Remember**: These rules are living documents. They should evolve with your codebase and improve based on actual usage patterns.

