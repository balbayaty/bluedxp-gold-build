# BlueDXP Master Prompt - Quick Reference Guide

**For:** Developers using Cursor AI  
**Source:** `docs/BLUEDXP_MASTER_PROMPT.md`  
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")

---

## 🚀 Quick Start

1. **Before ANY code change**: Read `docs/BLUEDXP_MASTER_PROMPT.md` Section 0 (Mandatory Safeguards)
2. **Check existing infrastructure**: See Section 0.3 - DO NOT REBUILD what already exists
3. **Follow the checklist**: Section 0.2 has 46 mandatory items before coding
4. **Reference specifications**: Use Sections 2-13 for detailed specs

---

## 📋 Essential Rules (Non-Negotiable)

### Golden Rules
- ✅ Integration-first mindset
- ✅ Deep layer architecture (not surface-level)
- ✅ Security is mandatory
- ✅ Multi-tenant isolation enforced
- ✅ RBAC with 11 roles
- ✅ 4IR & 5IR alignment
- ✅ Use Remix Icons (NOT Feather Icons) for Hazalyze
- ✅ Never use 'any' type
- ✅ Always define TypeScript interfaces first

### What NOT to Rebuild
- ❌ Module Registry (`lib/modules/registry.ts`)
- ❌ Event Bus (`lib/services/event-bus/`)
- ❌ Event Store (`lib/services/event-store/`)
- ❌ Agent Orchestrator (`lib/services/agents/agentOrchestrator.ts`)
- ❌ Knowledge Base (`lib/services/knowledge-base/`)
- ❌ Evidence Service (`lib/services/evidence/`)
- ❌ Integration Adapters (`lib/adapters/`)

---

## 🔍 Where to Find Specifications

| Need | Section | Location in Master Prompt |
|------|---------|-------------------------|
| **TypeScript Types** | Section 2 | 283 interfaces defined |
| **Database Schemas** | Section 3 | 17 complete SQL schemas |
| **API Endpoints** | Section 4 | 1,798 endpoint references |
| **Formulas/Algorithms** | Section 5 | 1,500+ formulas |
| **Hazalyze Module** | Section 6 | 2,918 references |
| **Quantum Logistics** | Section 7 | 435 references |
| **Corridor Intelligence** | Section 8 | Border/route logic |
| **Evidence System** | Section 9 | Audit trails |
| **Saudi Compliance** | Section 10 | ZATCA, MISA, TGA, SFDA |
| **Integrations** | Section 11 | ERP, IoT, EDI, Webhooks |
| **AI/ML Specs** | Section 12 | RAG, Agents, LLM providers |
| **Dashboards** | Section 13 | UI specifications |

---

## ✅ Pre-Implementation Checklist (Top 10)

Before writing ANY code, verify:

1. ✅ Searched codebase for similar implementations
2. ✅ Identified correct module placement (`lib/modules/`)
3. ✅ Designed service layer (`lib/services/`)
4. ✅ Defined TypeScript interfaces (`types/`)
5. ✅ Considered security implications
6. ✅ Planned multi-tenant isolation
7. ✅ Planned RBAC integration (11 roles)
8. ✅ Designed for integration (API-first)
9. ✅ Considered 4IR & 5IR alignment
10. ✅ Verified no duplicate API endpoints

**Full checklist**: See Section 0.2 (46 items)

---

## 🏗️ Architecture Patterns to Use

1. **Module Registry Pattern** → `lib/modules/registry.ts`
2. **Adapter Pattern** → `lib/adapters/`
3. **Service Layer Pattern** → `lib/services/`
4. **Event-Driven Pattern** → `lib/services/event-bus/`
5. **Agent Orchestration** → `lib/services/agents/`
6. **Evidence & Lineage** → `lib/services/evidence/`

---

## 🎯 Critical Missing Items (Priority Order)

### P0 - Must Create Now
1. **Feature Registry** → `/lib/feature-registry/`
2. **Repo Reality Map** → `/docs/AUDIT/REPO_REALITY_MAP.md`
3. **Duplication Scanner** → `/scripts/duplication-scanner.ts`
4. **Product Genome** → `/docs/PRODUCT_GENOME.md`

### P1 - Should Create Soon
1. **Complete RAG System** → Verify `/lib/services/knowledge-base/`
2. **Multi-LLM Provider** → Create `/lib/services/ai/` abstraction
3. **Truth Engine** → Verify `/lib/services/truth-engine/`
4. **Decision Infrastructure** → Verify decision ontology

---

## 📚 Key Documents

- **Master Prompt**: `docs/BLUEDXP_MASTER_PROMPT.md` (27,000+ lines)
- **Summary**: `docs/BLUEDXP_MASTER_PROMPT_SUMMARY.md`
- **Architecture Vision**: `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md`
- **This Quick Reference**: `docs/BLUEDXP_MASTER_PROMPT_QUICK_REFERENCE.md`

---

## 💡 Common Questions

**Q: Where do I find the TypeScript interface for X?**  
A: Check Section 2 of master prompt, then verify in `types/` directory

**Q: How do I add a new API endpoint?**  
A: 1) Check Section 4 for patterns, 2) Verify no duplicate exists, 3) Register in Feature Registry

**Q: What database schema should I use?**  
A: Check Section 3 for schemas, verify in `prisma/schema.prisma`

**Q: How do I integrate with external systems?**  
A: Use Adapter Pattern (`lib/adapters/`), see Section 11 for specs

**Q: What about security?**  
A: Security is mandatory - see Section 0.1, check `SECURITY.md`

---

## 🚨 Red Flags (Stop and Check)

If you see any of these, STOP and check the master prompt:

- ❌ Creating a new module without checking registry
- ❌ Duplicating existing service logic
- ❌ Hardcoding business rules
- ❌ Skipping TypeScript interfaces
- ❌ Ignoring multi-tenant isolation
- ❌ Missing RBAC checks
- ❌ Surface-level implementation only
- ❌ No integration considerations

---

## 📞 Need Help?

1. **Read the master prompt**: `docs/BLUEDXP_MASTER_PROMPT.md`
2. **Check the summary**: `docs/BLUEDXP_MASTER_PROMPT_SUMMARY.md`
3. **Review architecture docs**: `docs/ARCHITECTURE/`
4. **Check existing code**: Look for similar patterns in codebase

---

**Remember**: The master prompt is the **single source of truth**. When in doubt, check the master prompt first!













