# Copilot Workflow Packs (Missions)

BlueDXP Copilot now supports **Workflow Packs**: step-by-step “missions” that run real platform tools in sequence with safety controls.

## Where to find them

- Open Copilot
- Go to **Create**
- Use **Workflow Packs (Missions)** selector

Each step runs a real tool via `/api/copilot/tools/execute` and the platform produces:
- **Evidence records**
- **Domain events**
- **Self-learning signals** (where available)

## Workflows available now (DB-integrated modules)

### 1) Customs Clearance (V1)
ID: `wf.customs.clearance.v1`

Steps:
- Create draft declaration (`tms.customs.declaration.create`)
- Check required docs (`tms.customs.declaration.required_documents`)
- Attach a doc (optional) (`tms.customs.document.attach`)
- Submit declaration (integration queue) (`tms.customs.declaration.submit`)
- Generate evidence packet (`tms.customs.declaration.evidence_packet`)

Notes:
- “Submit” is **integration-first**: it emits `transportation.customs.declaration.submission_requested`.
- External portals/APIs are handled by adapters/subscribers, not hardcoded UI actions.

### 2) MSDS Intake (V1)
ID: `wf.msds.intake.v1`

Steps:
- Ingest MSDS from text (`msds.ingest_from_text`)
- Optional evidence packet (`evidence.generate_packet`)

### 3) Evidence Packet (V1)
ID: `wf.evidence.packet.v1`

Steps:
- Generate evidence packet (`evidence.generate_packet`)

### 4) Proposal Draft (V1)
ID: `wf.proposals.draft.v1`

Steps:
- Create proposal draft (`proposals-rfq.proposal.create_draft`)
- List proposals (optional) (`proposals-rfq.proposal.list`)
- Evidence packet (optional) (`evidence.generate_packet`)

## Benchmarking (quick start)

For each workflow measure:
- Completion rate (success/attempts)
- Time-to-complete
- Number of clicks (user effort)
- Evidence coverage (does every step generate auditable artifacts?)
- Failure recovery (can you resume without losing state?)

See also: `docs/COPILOT_VNEXT_BENCHMARK.md`


