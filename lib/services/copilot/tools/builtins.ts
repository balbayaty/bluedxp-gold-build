import type { CopilotToolDefinition } from "@/types/copilotTools";

export const BUILTIN_COPILOT_TOOLS: CopilotToolDefinition[] = [
  {
    id: "kb.search",
    name: "Knowledge Base Search",
    description:
      "Semantic search across domain knowledge bases (RAG building block).",
    moduleId: "ai",
    featureId: "ai.insights",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      query: "Search query text",
      domainKBs: "Optional list of domain KB IDs (e.g., KB_WMS, KB_MSDS)",
      limit: "Max results (default 10)",
    },
  },
  {
    id: "ocr.extract_pdf_text",
    name: "OCR: Extract Text from PDF (base64)",
    description:
      "Extract text from a PDF (base64-encoded). Uses pdf-parse or OCR fallback.",
    moduleId: "msds",
    featureId: "msds.msds_intelligence",
    action: "execute",
    risk: "sensitive",
    requiresConfirmation: false,
    inputHint: {
      base64Pdf: "Base64 PDF data (no data URI prefix)",
      language: "OCR language (default eng)",
      maxPages: "Max pages to OCR (default 2, max 3)",
    },
  },
  {
    id: "msds.ingest_from_text",
    name: "MSDS: Ingest SDS Text (Extract + Store + Emit Events)",
    description:
      "Extract MSDS fields from raw SDS text, store it for cross-module access, and create evidence + msds.* domain events.",
    moduleId: "msds",
    featureId: "msds.msds_intelligence",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      text: "Raw SDS text",
      chemicalName: "Optional override; otherwise inferred",
      manufacturer: "Optional override; otherwise inferred",
      language: "Optional language hint (default en)",
      fileUrl: "Optional file URL if already uploaded to storage",
      fileType: "pdf|word|excel|csv (default pdf)",
    },
  },
  {
    id: "tms.customs.declaration.create",
    name: "Customs: Create Declaration (Draft)",
    description:
      "Create a tenant-scoped customs declaration record (draft) and emit events/evidence.",
    moduleId: "tms",
    featureId: "tms.customs_declarations",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      shipmentId: "Optional shipment ID",
      countryOfOrigin: "Country name (string)",
      countryOfDestination: "Country name (string)",
      customsValue: "Declared customs value (number)",
      currency: "Currency (default SAR)",
      hsCode: "Optional HS code",
      brokerId: "Optional broker ID",
      brokerName: "Optional broker name",
      brokerLicense: "Optional broker license",
    },
  },
  {
    id: "tms.customs.declaration.required_documents",
    name: "Customs: Required Documents Checklist",
    description:
      "Compute required documents for a declaration and detect what is missing.",
    moduleId: "tms",
    featureId: "tms.customs_declarations",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      declarationId: "Customs declaration id",
      transportMode: "Optional: AIR|SEA|LAND|RAIL|MULTIMODAL",
      isImport: "Optional boolean hint (otherwise inferred)",
      isExport: "Optional boolean hint (otherwise inferred)",
      includeMSDS: "Optional boolean to require MSDS document",
    },
  },
  {
    id: "tms.customs.document.attach",
    name: "Customs: Attach Document to Declaration",
    description:
      "Create a ShipmentDocument and link it to a customs declaration document entry.",
    moduleId: "tms",
    featureId: "tms.documents",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      declarationId: "Customs declaration id",
      shipmentId: "Shipment id",
      docType: "CustomsDocument type (e.g., COMMERCIAL_INVOICE)",
      name: "Document name",
      fileUrl: "Document file URL",
    },
  },
  {
    id: "tms.customs.declaration.submit",
    name: "Customs: Submit Declaration (Integration Queue)",
    description:
      "Mark declaration as DOCUMENTS_SUBMITTED and emit a submission-request event for integration adapters to process.",
    moduleId: "tms",
    featureId: "tms.customs_declarations",
    action: "execute",
    risk: "destructive",
    requiresConfirmation: true,
    inputHint: {
      declarationId: "Customs declaration id",
      system: "Optional target system (e.g., fasah, nafeza)",
      countryCode: "Optional ISO2 (e.g., SA, EG)",
    },
  },
  {
    id: "tms.customs.declaration.evidence_packet",
    name: "Customs: Generate Evidence Packet",
    description:
      "Generate a court-ready evidence packet for a customs declaration.",
    moduleId: "reports",
    featureId: "reports.operational",
    action: "execute",
    risk: "read_only",
    inputHint: {
      declarationId: "Customs declaration id",
    },
  },
  {
    id: "proposals-rfq.proposal.create_draft",
    name: "Proposals: Create Draft Proposal",
    description:
      "Create a proposal draft (DB-backed via Prisma) and emit evidence + proposals.* events.",
    moduleId: "proposals-rfq",
    featureId: "proposals-rfq.proposals",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      title: "Proposal title",
      description: "Optional description",
      proposalType:
        "Optional: QUOTE_PROPOSAL|SERVICE_PROPOSAL|COMPLETE_SOLUTION",
      customerName: "Optional customer name",
      customerEmail: "Optional customer email",
      currency: "SAR (default)",
    },
  },
  {
    id: "proposals-rfq.proposal.get",
    name: "Proposals: Get Proposal",
    description: "Fetch a proposal by ID (tenant-scoped).",
    moduleId: "proposals-rfq",
    featureId: "proposals-rfq.proposals",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      proposalId: "Proposal id",
    },
  },
  {
    id: "proposals-rfq.proposal.list",
    name: "Proposals: List Proposals",
    description: "List proposals for this tenant (optionally filtered).",
    moduleId: "proposals-rfq",
    featureId: "proposals-rfq.proposals",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status: "Optional: DRAFT|SENT|ACCEPTED|REJECTED|EXPIRED|…",
      limit: "Optional: max rows (default 20, max 50)",
    },
  },
  {
    id: "evidence.generate_packet",
    name: "Evidence: Generate Packet",
    description:
      "Generate a tamper-evident evidence packet (Merkle tree + chain of custody).",
    moduleId: "reports",
    featureId: "reports.operational",
    action: "execute",
    risk: "read_only",
    inputHint: {
      entityType: "Aggregate type (e.g., Shipment, MSDS)",
      entityId: "Aggregate id",
      claimType: "Claim type (e.g., delivery_proof)",
    },
  },
  {
    id: "wms.order.create",
    name: "WMS: Create Order",
    description: "Create a new inbound or outbound order in the WMS system.",
    moduleId: "wms",
    featureId: "wms.orders",
    action: "write",
    risk: "destructive",
    requiresConfirmation: true,
    inputHint: {
      type: "INBOUND|OUTBOUND",
      customer: "Customer name or ID",
      items: "List of items to order",
      priority: "Optional: HIGH|NORMAL|LOW",
    },
  },
  {
    id: "wms.asn.create",
    name: "WMS: Create ASN (Advanced Shipping Notice)",
    description:
      "Create a new Advanced Shipping Notice (ASN) for inbound operations. Use this when users ask to create an ASN, shipping notice, or inbound delivery.",
    moduleId: "wms",
    featureId: "wms.inbound",
    action: "write",
    risk: "destructive",
    requiresConfirmation: false, // Allow quick test data creation
    inputHint: {
      vendorName: "Vendor/Supplier name (use test data if not provided)",
      vendorNumber: "Optional vendor number (default: VND-TEST-001)",
      documentNumber:
        "Optional document number (auto-generated if not provided)",
      expectedDeliveryDate: "Optional delivery date (default: tomorrow)",
      destination:
        "Optional destination warehouse (default: DEFAULT_WAREHOUSE)",
      purchaseOrderNumber: "Optional PO number",
      carrier: "Optional carrier name",
      trackingNumber: "Optional tracking number",
      totalQuantity: "Optional total quantity",
      totalItems: "Optional number of items",
      priority: "Optional: HIGH|MEDIUM|LOW (default: MEDIUM)",
    },
  },
  {
    id: "ui.navigate",
    name: "Navigate to Page",
    description:
      "Navigate to a specific page or route in the application. Use this when the user asks to go to a page, open a feature, or navigate somewhere.",
    moduleId: "ui",
    featureId: "ui.navigation",
    action: "execute",
    risk: "read_only",
    requiresConfirmation: false,
    inputHint: {
      path: "The path to navigate to (e.g., /proposals/rfq/new, /warehouse/orders/create, /dashboard)",
      description: "Optional description of where you are navigating",
    },
  },
  {
    id: "ui.click",
    name: "Click Button or Link",
    description:
      "Click a button or link on the current page. Use this when the user asks to click something, open a modal, or trigger an action.",
    moduleId: "ui",
    featureId: "ui.interaction",
    action: "execute",
    risk: "read_only",
    requiresConfirmation: false,
    inputHint: {
      selector:
        'CSS selector or text content to find the element (e.g., "Create Proposal", "button.create-order")',
      description: "Optional description of what you are clicking",
    },
  },
  {
    id: "iso-ims.capa.create",
    name: "CAPA: Create Corrective/Preventive Action",
    description:
      "Create a new CAPA (Corrective and Preventive Action) record. Use this when users ask to create a CAPA, corrective action, or preventive action. Generate test data if not provided.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa_management",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: false, // Allow quick test data creation
    inputHint: {
      subject: "CAPA subject/title (required)",
      description: "CAPA description (required)",
      actionPlan: "Detailed action plan (required)",
      priority: "Optional: LOW|MEDIUM|HIGH|CRITICAL (default: MEDIUM)",
      capaType:
        "Optional: CORRECTIVE_ACTION|PREVENTIVE_ACTION (default: CORRECTIVE_ACTION)",
      capaSource:
        "Optional: NCR|AUDIT|RISK_ASSESSMENT|CUSTOMER_COMPLAINT|MANAGEMENT_REVIEW|INCIDENT|INTERNAL_REVIEW|OTHER (default: AUDIT)",
      assignedTo:
        "Optional: User email or ID to assign CAPA to (default: current user)",
      department: "Optional: Department name (default: Quality)",
      targetDate:
        "Optional: Target completion date (ISO string, default: 30 days from now)",
      rootCause: "Optional: Root cause analysis",
      resourcesRequired: "Optional: Resources required description",
      linkedNCR: "Optional: Linked NCR ID",
      linkedCustomer: "Optional: Linked customer ID",
      linkedSupplier: "Optional: Linked supplier ID",
      linkedMaterial: "Optional: Linked material ID",
    },
  },
  {
    id: "iso-ims.capa.get",
    name: "CAPA: Get CAPA by ID",
    description:
      "Fetch a CAPA record by its ID. Use this when users ask to view, show, or get details about a specific CAPA.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa_management",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      capaId: "CAPA ID to retrieve",
    },
  },
  {
    id: "iso-ims.capa.list",
    name: "CAPA: List CAPAs",
    description:
      "List CAPA records with optional filtering. Use this when users ask to list, show all, or view CAPAs.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa_management",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status:
        "Optional: Filter by status (DRAFT|OPEN|IN_PROGRESS|UNDER_REVIEW|COMPLETED|CLOSED|CANCELLED)",
      priority: "Optional: Filter by priority (LOW|MEDIUM|HIGH|CRITICAL)",
      limit: "Optional: Max results (default 20, max 100)",
      page: "Optional: Page number (default 1)",
    },
  },
  // ============================================================================
  // ANALYTICS & INSIGHTS TOOLS
  // ============================================================================
  {
    id: "analytics.dashboard.summary",
    name: "Dashboard: Get Summary",
    description:
      "Get a summary of key metrics and KPIs from the dashboard. Use this when users ask about overall performance, metrics, or want a quick overview.",
    moduleId: "analytics",
    featureId: "analytics.dashboard",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      timeRange: "Optional: TODAY|WEEK|MONTH|QUARTER|YEAR (default: WEEK)",
      moduleFilter: "Optional: Filter by module (wms|tms|iso-ims|proposals)",
    },
  },
  {
    id: "analytics.insights.generate",
    name: "Analytics: Generate Insights",
    description:
      "Generate AI-powered insights and recommendations based on current data. Use this when users ask for insights, recommendations, or analysis.",
    moduleId: "analytics",
    featureId: "analytics.insights",
    action: "execute",
    risk: "read_only",
    inputHint: {
      focusArea: "Optional: inventory|orders|shipments|compliance|quality|costs",
      depth: "Optional: quick|detailed|comprehensive (default: detailed)",
    },
  },
  {
    id: "analytics.report.generate",
    name: "Reports: Generate Report",
    description:
      "Generate a report on demand. Use this when users ask for reports, summaries, or data exports.",
    moduleId: "reports",
    featureId: "reports.operational",
    action: "execute",
    risk: "read_only",
    inputHint: {
      reportType: "inventory|orders|shipments|compliance|performance|custom",
      format: "Optional: pdf|excel|json (default: json)",
      timeRange: "Optional: TODAY|WEEK|MONTH|QUARTER|YEAR",
      filters: "Optional: JSON object with filter criteria",
    },
  },
  // ============================================================================
  // INVENTORY MANAGEMENT TOOLS
  // ============================================================================
  {
    id: "wms.inventory.summary",
    name: "WMS: Inventory Summary",
    description:
      "Get current inventory summary with stock levels, alerts, and recommendations. Use this when users ask about inventory, stock levels, or warehouse capacity.",
    moduleId: "wms",
    featureId: "wms.stock_overview",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      warehouseId: "Optional: Specific warehouse ID",
      category: "Optional: Filter by category",
      includeAlerts: "Optional: Include low stock alerts (default: true)",
    },
  },
  {
    id: "wms.inventory.optimize",
    name: "WMS: Optimize Inventory",
    description:
      "Get AI recommendations for inventory optimization including reorder points, safety stock, and ABC analysis.",
    moduleId: "wms",
    featureId: "wms.abc_analysis",
    action: "execute",
    risk: "read_only",
    inputHint: {
      warehouseId: "Optional: Specific warehouse ID",
      optimizationType: "Optional: reorder|safety_stock|abc|slotting (default: all)",
    },
  },
  {
    id: "wms.picking.optimize",
    name: "WMS: Optimize Picking Routes",
    description:
      "Generate optimized picking routes for current orders. Use this when users ask about picking efficiency or route optimization.",
    moduleId: "wms",
    featureId: "wms.picking",
    action: "execute",
    risk: "read_only",
    inputHint: {
      orderIds: "Optional: Specific order IDs to optimize (comma-separated)",
      algorithm: "Optional: nearest|zone|wave (default: nearest)",
    },
  },
  // ============================================================================
  // TRANSPORTATION TOOLS
  // ============================================================================
  {
    id: "tms.shipment.track",
    name: "TMS: Track Shipment",
    description:
      "Track a shipment and get real-time status updates. Use this when users ask to track, find, or check status of shipments.",
    moduleId: "tms",
    featureId: "tms.shipment_tracking",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      shipmentId: "Optional: Specific shipment ID",
      trackingNumber: "Optional: Carrier tracking number",
      status: "Optional: Filter by status (in_transit|delivered|pending)",
    },
  },
  {
    id: "tms.routes.optimize",
    name: "TMS: Optimize Routes",
    description:
      "Generate optimized delivery routes considering traffic, distance, and time windows. Use this when users ask about route optimization or delivery planning.",
    moduleId: "tms",
    featureId: "tms.route_optimization",
    action: "execute",
    risk: "read_only",
    inputHint: {
      date: "Optional: Delivery date (default: today)",
      vehicleIds: "Optional: Specific vehicle IDs",
      optimizeFor: "Optional: distance|time|cost (default: time)",
    },
  },
  {
    id: "tms.costs.analyze",
    name: "TMS: Analyze Shipping Costs",
    description:
      "Analyze shipping costs and identify savings opportunities. Use this when users ask about shipping costs, expenses, or cost reduction.",
    moduleId: "tms",
    featureId: "tms.cost_analysis",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      timeRange: "Optional: WEEK|MONTH|QUARTER|YEAR (default: MONTH)",
      carrier: "Optional: Filter by carrier",
      lane: "Optional: Filter by origin-destination lane",
    },
  },
  // ============================================================================
  // COMPLIANCE & QUALITY TOOLS
  // ============================================================================
  {
    id: "compliance.check",
    name: "Compliance: Run Check",
    description:
      "Run a compliance check against regulations and standards. Use this when users ask about compliance status, audits, or regulatory requirements.",
    moduleId: "compliance",
    featureId: "compliance.checker",
    action: "execute",
    risk: "read_only",
    inputHint: {
      checkType: "Optional: regulatory|quality|safety|environmental (default: all)",
      scope: "Optional: full|quick (default: quick)",
    },
  },
  {
    id: "qhse.incidents.summary",
    name: "QHSE: Incidents Summary",
    description:
      "Get summary of quality, health, safety, and environmental incidents. Use this when users ask about safety, incidents, or QHSE metrics.",
    moduleId: "qhse",
    featureId: "qhse.incidents",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      timeRange: "Optional: WEEK|MONTH|QUARTER|YEAR (default: MONTH)",
      severity: "Optional: Filter by severity (low|medium|high|critical)",
      type: "Optional: safety|quality|environmental|health",
    },
  },
  // ============================================================================
  // AUTOMATION & WORKFLOW TOOLS
  // ============================================================================
  {
    id: "automation.workflow.trigger",
    name: "Automation: Trigger Workflow",
    description:
      "Trigger an automated workflow or process. Use this when users ask to automate, run a workflow, or execute a process.",
    moduleId: "automation",
    featureId: "automation.workflows",
    action: "execute",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      workflowId: "Workflow ID to trigger",
      input: "Optional: JSON input parameters for the workflow",
    },
  },
  {
    id: "automation.schedule.create",
    name: "Automation: Schedule Task",
    description:
      "Schedule a task or process to run at a specific time. Use this when users ask to schedule, automate recurring tasks, or set reminders.",
    moduleId: "automation",
    featureId: "automation.scheduler",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      taskType: "Task type (report|notification|workflow|backup)",
      schedule: "Cron expression or simple format (daily|weekly|monthly)",
      config: "Optional: JSON configuration for the task",
    },
  },
  // ============================================================================
  // PLATFORM TOOLS
  // ============================================================================
  {
    id: "platform.search",
    name: "Platform: Global Search",
    description:
      "Search across all platform data including orders, shipments, products, customers, etc. Use this when users ask to find or search for anything.",
    moduleId: "platform",
    featureId: "platform.search",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      query: "Search query text",
      entityTypes: "Optional: Comma-separated list of entity types to search (orders|shipments|products|customers|asn)",
      limit: "Optional: Max results (default: 10)",
    },
  },
  {
    id: "platform.notifications.send",
    name: "Platform: Send Notification",
    description:
      "Send a notification to users or teams. Use this when users ask to notify, alert, or message someone.",
    moduleId: "platform",
    featureId: "platform.notifications",
    action: "execute",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      recipients: "User IDs or team names (comma-separated)",
      title: "Notification title",
      message: "Notification message",
      priority: "Optional: low|normal|high|urgent (default: normal)",
      channel: "Optional: in_app|email|sms|all (default: in_app)",
    },
  },
  {
    id: "feedback.submit",
    name: "Feedback: Submit User Feedback",
    description:
      "Submit feedback about the copilot response. Use this to track user satisfaction and improve AI responses over time.",
    moduleId: "ai",
    featureId: "ai.copilot",
    action: "write",
    risk: "read_only",
    inputHint: {
      type: "positive|negative|neutral",
      rating: "Optional: 1-5 star rating",
      reason: "Optional: helpful|accurate|fast|unhelpful|inaccurate|confusing",
      comment: "Optional: User comment",
    },
  },

  // ========================================================================
  // ISO-IMS (Integrated Management System) Tools
  // ========================================================================

  // CAPA Management
  {
    id: "iso-ims.capa.create",
    name: "ISO-IMS: Create CAPA",
    description:
      "Create a Corrective/Preventive Action record. Use when user reports quality issues, non-conformances, or wants to track improvements.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      title: "CAPA title describing the issue",
      type: "corrective|preventive",
      priority: "low|medium|high|critical",
      rootCause: "Description of the root cause",
      correctiveAction: "Description of corrective action to take",
      preventiveAction: "Optional: Preventive action to avoid recurrence",
      dueDate: "Due date (YYYY-MM-DD)",
      ownerId: "Owner/responsible person ID",
    },
  },
  {
    id: "iso-ims.capa.list",
    name: "ISO-IMS: List CAPAs",
    description:
      "Get list of CAPAs with filtering. Use to show open CAPAs, overdue items, or status overview.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status: "Optional: open|in_progress|pending_verification|closed",
      priority: "Optional: low|medium|high|critical",
      ownerId: "Optional: Filter by owner",
      overdue: "Optional: true to show only overdue CAPAs",
    },
  },
  {
    id: "iso-ims.capa.update",
    name: "ISO-IMS: Update CAPA",
    description:
      "Update a CAPA record status, add notes, or modify details.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      capaId: "CAPA ID to update",
      status: "Optional: New status",
      progressNotes: "Optional: Progress update notes",
      dueDate: "Optional: New due date",
    },
  },
  {
    id: "iso-ims.capa.close",
    name: "ISO-IMS: Close CAPA",
    description:
      "Close a CAPA with effectiveness verification. Requires verification of corrective action effectiveness.",
    moduleId: "iso-ims",
    featureId: "iso-ims.capa",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      capaId: "CAPA ID to close",
      effectivenessNotes: "Notes on effectiveness verification",
      isEffective: "true|false - Was the corrective action effective?",
    },
  },

  // Non-Conformance Management
  {
    id: "iso-ims.ncr.create",
    name: "ISO-IMS: Log Non-Conformance",
    description:
      "Log a non-conformance (NCR) record. Use for quality deviations, defects, or customer complaints.",
    moduleId: "iso-ims",
    featureId: "iso-ims.ncr",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      title: "NCR title",
      description: "Detailed description of the non-conformance",
      severity: "minor|major|critical",
      source: "internal|supplier|customer|audit",
      containmentAction: "Optional: Immediate containment action taken",
      affectedItems: "Optional: List of affected items/lots",
    },
  },
  {
    id: "iso-ims.ncr.list",
    name: "ISO-IMS: List Non-Conformances",
    description:
      "Get list of NCRs with filtering options.",
    moduleId: "iso-ims",
    featureId: "iso-ims.ncr",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status: "Optional: open|investigation|disposition|closed",
      severity: "Optional: minor|major|critical",
      source: "Optional: internal|supplier|customer|audit",
    },
  },
  {
    id: "iso-ims.ncr.disposition",
    name: "ISO-IMS: Set NCR Disposition",
    description:
      "Set the disposition for a non-conformance (rework, scrap, accept-as-is, return).",
    moduleId: "iso-ims",
    featureId: "iso-ims.ncr",
    action: "write",
    risk: "destructive",
    requiresConfirmation: true,
    inputHint: {
      ncrId: "NCR ID",
      disposition: "rework|scrap|accept-as-is|return",
      notes: "Justification for disposition decision",
      approverId: "Optional: Approver ID for disposition",
    },
  },

  // Audit Management
  {
    id: "iso-ims.audit.create",
    name: "ISO-IMS: Schedule Audit",
    description:
      "Schedule and create an audit plan for internal or external audits.",
    moduleId: "iso-ims",
    featureId: "iso-ims.audit",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      type: "internal|external|supplier",
      scope: "Audit scope description",
      standard: "Optional: ISO 9001|ISO 14001|ISO 45001|ISO 22000",
      scheduledDate: "Scheduled date (YYYY-MM-DD)",
      leadAuditorId: "Lead auditor ID",
      departments: "Departments to audit (comma-separated)",
    },
  },
  {
    id: "iso-ims.audit.checklist",
    name: "ISO-IMS: Generate Audit Checklist",
    description:
      "Generate an audit checklist based on standard and scope.",
    moduleId: "iso-ims",
    featureId: "iso-ims.audit",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      auditId: "Optional: Audit ID to generate checklist for",
      standard: "ISO 9001|ISO 14001|ISO 45001|ISO 22000",
      clauses: "Optional: Specific clauses to include",
    },
  },
  {
    id: "iso-ims.audit.finding",
    name: "ISO-IMS: Log Audit Finding",
    description:
      "Record a finding during an audit (observation, minor NC, major NC).",
    moduleId: "iso-ims",
    featureId: "iso-ims.audit",
    action: "write",
    risk: "sensitive",
    inputHint: {
      auditId: "Audit ID",
      type: "observation|minor-nc|major-nc|opportunity",
      description: "Finding description",
      clause: "Optional: Standard clause reference",
      evidence: "Optional: Evidence supporting the finding",
    },
  },

  // Document Control
  {
    id: "iso-ims.document.search",
    name: "ISO-IMS: Search Documents",
    description:
      "Search controlled documents (SOPs, work instructions, forms, policies).",
    moduleId: "iso-ims",
    featureId: "iso-ims.documents",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      query: "Search keywords",
      type: "Optional: sop|work-instruction|form|policy",
      department: "Optional: Filter by department",
      status: "Optional: current|draft|obsolete",
    },
  },
  {
    id: "iso-ims.document.create",
    name: "ISO-IMS: Create Controlled Document",
    description:
      "Create a new controlled document (requires review/approval workflow).",
    moduleId: "iso-ims",
    featureId: "iso-ims.documents",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      type: "sop|work-instruction|form|policy",
      title: "Document title",
      content: "Document content or description",
      department: "Owning department",
      ownerId: "Document owner ID",
    },
  },

  // Training Management
  {
    id: "iso-ims.training.list",
    name: "ISO-IMS: List Training Records",
    description:
      "Get training records and compliance status for employees.",
    moduleId: "iso-ims",
    featureId: "iso-ims.training",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      employeeId: "Optional: Filter by employee",
      department: "Optional: Filter by department",
      overdue: "Optional: true to show only overdue training",
    },
  },
  {
    id: "iso-ims.training.assign",
    name: "ISO-IMS: Assign Training",
    description:
      "Assign training to employees with due date.",
    moduleId: "iso-ims",
    featureId: "iso-ims.training",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      trainingId: "Training/course ID",
      employeeIds: "Employee IDs (comma-separated)",
      dueDate: "Due date (YYYY-MM-DD)",
    },
  },
  {
    id: "iso-ims.training.matrix",
    name: "ISO-IMS: Generate Training Matrix",
    description:
      "Generate a training matrix report for a department or role.",
    moduleId: "iso-ims",
    featureId: "iso-ims.training",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      department: "Optional: Department name",
      roleId: "Optional: Role/position ID",
    },
  },

  // Management Review
  {
    id: "iso-ims.management_review.prepare",
    name: "ISO-IMS: Prepare Management Review",
    description:
      "Prepare inputs for management review meeting (KPIs, CAPA status, audit results, etc.).",
    moduleId: "iso-ims",
    featureId: "iso-ims.management_review",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      period: "Review period (Q1 2026, H1 2026, 2025)",
      includeKPIs: "Optional: true to include KPI data",
      includeCAPAs: "Optional: true to include CAPA summary",
      includeAudits: "Optional: true to include audit summary",
    },
  },

  // ========================================================================
  // QHSE (Quality, Health, Safety, Environment) Tools
  // ========================================================================

  // Incident Management
  {
    id: "qhse.incident.create",
    name: "QHSE: Report Incident",
    description:
      "Create a safety or environmental incident report. Use for accidents, near-misses, injuries, or environmental events.",
    moduleId: "qhse",
    featureId: "qhse.incidents",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      type: "near-miss|first-aid|medical|lost-time|fatality|environmental|property-damage",
      severity: "low|medium|high|critical",
      description: "Detailed incident description",
      location: "Location where incident occurred",
      dateTime: "Date and time (YYYY-MM-DDTHH:mm)",
      involvedPersons: "Optional: Names of involved persons",
      witnesses: "Optional: Names of witnesses",
      immediateActions: "Optional: Immediate actions taken",
    },
  },
  {
    id: "qhse.incident.list",
    name: "QHSE: List Incidents",
    description:
      "Get list of incidents with filtering options.",
    moduleId: "qhse",
    featureId: "qhse.incidents",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      type: "Optional: Filter by incident type",
      severity: "Optional: Filter by severity",
      status: "Optional: open|investigating|closed",
      period: "Optional: this-week|this-month|this-quarter|this-year",
    },
  },
  {
    id: "qhse.incident.investigate",
    name: "QHSE: Start Investigation",
    description:
      "Initiate an investigation for an incident with assigned investigator.",
    moduleId: "qhse",
    featureId: "qhse.incidents",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      incidentId: "Incident ID to investigate",
      investigatorId: "Lead investigator ID",
      methodology: "Optional: 5-why|fishbone|taproot",
    },
  },

  // Risk Assessment
  {
    id: "qhse.risk.create",
    name: "QHSE: Create Risk Assessment",
    description:
      "Create a new risk assessment for an activity, process, or equipment.",
    moduleId: "qhse",
    featureId: "qhse.risk",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      title: "Risk assessment title",
      activity: "Activity/process being assessed",
      hazards: "List of identified hazards",
      assessorId: "Assessor ID",
      department: "Optional: Department",
    },
  },
  {
    id: "qhse.risk.list",
    name: "QHSE: List Risks",
    description:
      "Get list of risks from the risk register.",
    moduleId: "qhse",
    featureId: "qhse.risk",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      riskLevel: "Optional: low|medium|high|extreme",
      department: "Optional: Filter by department",
      status: "Optional: active|mitigated|closed",
    },
  },
  {
    id: "qhse.risk.matrix",
    name: "QHSE: Generate Risk Matrix",
    description:
      "Generate a visual risk matrix for reporting.",
    moduleId: "qhse",
    featureId: "qhse.risk",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      department: "Optional: Filter by department",
      category: "Optional: operational|safety|environmental|financial",
    },
  },

  // Inspections
  {
    id: "qhse.inspection.schedule",
    name: "QHSE: Schedule Inspection",
    description:
      "Schedule a safety, quality, or environmental inspection.",
    moduleId: "qhse",
    featureId: "qhse.inspections",
    action: "write",
    risk: "sensitive",
    requiresConfirmation: true,
    inputHint: {
      type: "safety|fire|equipment|housekeeping|environmental|quality",
      area: "Area/location to inspect",
      scheduledDate: "Date (YYYY-MM-DD)",
      inspectorId: "Inspector ID",
      frequency: "Optional: daily|weekly|monthly|quarterly",
    },
  },
  {
    id: "qhse.inspection.list",
    name: "QHSE: List Inspections",
    description:
      "Get list of scheduled or completed inspections.",
    moduleId: "qhse",
    featureId: "qhse.inspections",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status: "Optional: scheduled|in_progress|completed|overdue",
      type: "Optional: Filter by inspection type",
      period: "Optional: this-week|this-month",
    },
  },
  {
    id: "qhse.inspection.checklist",
    name: "QHSE: Generate Inspection Checklist",
    description:
      "Generate an inspection checklist based on type.",
    moduleId: "qhse",
    featureId: "qhse.inspections",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      type: "safety|fire|equipment|housekeeping|environmental",
      area: "Optional: Specific area for custom items",
    },
  },

  // Permit to Work
  {
    id: "qhse.permit.create",
    name: "QHSE: Create Work Permit",
    description:
      "Create a permit to work for hazardous activities (hot work, confined space, etc.).",
    moduleId: "qhse",
    featureId: "qhse.permits",
    action: "write",
    risk: "destructive",
    requiresConfirmation: true,
    inputHint: {
      type: "hot-work|confined-space|electrical|excavation|height|general",
      description: "Work description",
      location: "Work location",
      startTime: "Start time (YYYY-MM-DDTHH:mm)",
      endTime: "End time (YYYY-MM-DDTHH:mm)",
      requestorId: "Requestor ID",
      precautions: "Required precautions",
    },
  },
  {
    id: "qhse.permit.list",
    name: "QHSE: List Work Permits",
    description:
      "Get list of work permits with filtering.",
    moduleId: "qhse",
    featureId: "qhse.permits",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      status: "Optional: pending|approved|active|closed|expired",
      type: "Optional: Filter by permit type",
      today: "Optional: true to show today's permits only",
    },
  },  // Environmental
  {
    id: "qhse.environmental.waste",
    name: "QHSE: Log Waste Disposal",
    description:
      "Record waste disposal for environmental tracking.",
    moduleId: "qhse",
    featureId: "qhse.environmental",
    action: "write",
    risk: "sensitive",
    inputHint: {
      wasteType: "hazardous|non-hazardous|recyclable|e-waste|medical",
      quantity: "Quantity disposed",
      unit: "kg|liters|items",
      disposalMethod: "Method of disposal",
      manifestNumber: "Optional: Waste manifest number",
    },
  },
  {
    id: "qhse.environmental.report",
    name: "QHSE: Generate Environmental Report",
    description:
      "Generate environmental compliance and metrics report.",
    moduleId: "qhse",
    featureId: "qhse.environmental",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      reportType: "monthly|quarterly|annual",
      period: "Period to report on (2026-Q1, 2025)",
      includeWaste: "Optional: true to include waste data",
      includeEmissions: "Optional: true to include emissions data",
    },
  },  // MSDS/SDS
  {
    id: "qhse.msds.search",
    name: "QHSE: Search MSDS",
    description:
      "Search for Material Safety Data Sheets by chemical name or CAS number.",
    moduleId: "qhse",
    featureId: "qhse.msds",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      chemicalName: "Optional: Chemical name to search",
      casNumber: "Optional: CAS registry number",
      manufacturer: "Optional: Filter by manufacturer",
    },
  },  // Compliance
  {
    id: "qhse.compliance.check",
    name: "QHSE: Run Compliance Check",
    description:
      "Check compliance against regulations (OSHA, EPA, ISO standards).",
    moduleId: "qhse",
    featureId: "qhse.compliance",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      regulations: "Comma-separated: OSHA|EPA|ISO 14001|ISO 45001|local",
      scope: "Optional: Specific area or department to check",
    },
  },
  {
    id: "qhse.compliance.gap_analysis",
    name: "QHSE: Compliance Gap Analysis",
    description:
      "Perform gap analysis against a standard or regulation.",
    moduleId: "qhse",
    featureId: "qhse.compliance",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      standard: "ISO 45001|ISO 14001|OSHA|custom",
      includeRecommendations: "Optional: true to include improvement recommendations",
    },
  },  // KPIs and Metrics
  {
    id: "qhse.kpi.safety",
    name: "QHSE: Safety KPIs",
    description:
      "Get safety KPIs (incident rates, near-miss ratio, days without LTI, etc.).",
    moduleId: "qhse",
    featureId: "qhse.analytics",
    action: "read_only",
    risk: "read_only",
    inputHint: {
      period: "this-month|this-quarter|this-year|last-year",
      department: "Optional: Filter by department",
      metrics: "Optional: Comma-separated list of specific metrics",
    },
  },
];