/**
 * 🌐 COMPLETE MODULE REGISTRY
 * 
 * The world's most comprehensive module registry for permission management.
 * Contains ALL 35+ modules with their features, tabs, fields, and sensitive markers.
 * 
 * This enables:
 * - Per-module licensing and monetization
 * - Feature-based pricing tiers
 * - Tab-level access control
 * - Action-based permissions
 * - Field-level security (hide sensitive data)
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FieldDefinition {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "json" | "currency" | "file" | "email" | "phone";
  sensitive?: boolean;
  pii?: boolean; // Personally Identifiable Information
  financial?: boolean; // Financial data
  description?: string;
}

export interface TabDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  premium?: boolean; // Premium feature
  fields?: FieldDefinition[];
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  premium?: boolean;
  tabs: TabDefinition[];
}

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  description?: string;
  category: "core" | "operations" | "finance" | "compliance" | "intelligence" | "integration" | "hr" | "system";
  premium?: boolean;
  features: FeatureDefinition[];
}

// ============================================================================
// COMPLETE MODULE REGISTRY (35+ Modules)
// ============================================================================

export const COMPLETE_MODULE_REGISTRY: ModuleDefinition[] = [
  // ==========================================================================
  // CORE OPERATIONS MODULES
  // ==========================================================================
  {
    id: "wms",
    name: "Warehouse Management System",
    icon: "ri-building-4-line",
    description: "Complete warehouse operations management",
    category: "operations",
    features: [
      {
        id: "inventory",
        name: "Inventory Management",
        icon: "ri-stack-line",
        tabs: [
          { 
            id: "stock", 
            name: "Stock Overview",
            icon: "ri-bar-chart-box-line",
            fields: [
              { id: "sku", name: "SKU", type: "text" },
              { id: "product_name", name: "Product Name", type: "text" },
              { id: "quantity", name: "Quantity", type: "number" },
              { id: "location", name: "Location", type: "text" },
              { id: "unit_cost", name: "Unit Cost", type: "currency", sensitive: true, financial: true },
              { id: "total_value", name: "Total Value", type: "currency", sensitive: true, financial: true },
              { id: "reorder_point", name: "Reorder Point", type: "number" },
              { id: "lead_time", name: "Lead Time", type: "number" },
            ]
          },
          { id: "locations", name: "Storage Locations", icon: "ri-map-pin-line" },
          { 
            id: "adjustments", 
            name: "Adjustments",
            icon: "ri-edit-line",
            fields: [
              { id: "adjustment_reason", name: "Reason", type: "select" },
              { id: "quantity_change", name: "Quantity Change", type: "number" },
              { id: "cost_impact", name: "Cost Impact", type: "currency", sensitive: true, financial: true },
            ]
          },
          { 
            id: "valuation", 
            name: "Valuation",
            icon: "ri-money-dollar-box-line",
            premium: true,
            fields: [
              { id: "total_inventory_value", name: "Total Value", type: "currency", sensitive: true, financial: true },
              { id: "valuation_method", name: "Valuation Method", type: "select" },
              { id: "landed_cost", name: "Landed Cost", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "abc_analysis", name: "ABC Analysis", icon: "ri-pie-chart-line", premium: true },
          { id: "cycle_counting", name: "Cycle Counting", icon: "ri-refresh-line" },
        ],
      },
      {
        id: "inbound",
        name: "Inbound Operations",
        icon: "ri-login-box-line",
        tabs: [
          { 
            id: "asn", 
            name: "ASN Management", 
            icon: "ri-file-list-line",
            fields: [
              { id: "asn_number", name: "ASN Number", type: "text" },
              { id: "vendor", name: "Vendor", type: "text" },
              { id: "expected_date", name: "Expected Date", type: "date" },
              { id: "po_number", name: "PO Number", type: "text" },
              { id: "total_quantity", name: "Total Quantity", type: "number" },
              { id: "status", name: "Status", type: "select" },
            ]
          },
          { 
            id: "receiving", 
            name: "Receiving", 
            icon: "ri-inbox-archive-line",
            fields: [
              { id: "receipt_number", name: "Receipt Number", type: "text" },
              { id: "received_quantity", name: "Received Qty", type: "number" },
              { id: "discrepancy", name: "Discrepancy", type: "number" },
              { id: "receiver", name: "Received By", type: "text" },
              { id: "receipt_date", name: "Receipt Date", type: "date" },
            ]
          },
          { 
            id: "putaway", 
            name: "Putaway", 
            icon: "ri-archive-line",
            fields: [
              { id: "putaway_id", name: "Putaway ID", type: "text" },
              { id: "from_location", name: "From Location", type: "text" },
              { id: "to_location", name: "To Location", type: "text" },
              { id: "quantity", name: "Quantity", type: "number" },
              { id: "operator", name: "Operator", type: "text" },
            ]
          },
          { 
            id: "quality_check", 
            name: "Quality Check", 
            icon: "ri-shield-check-line",
            fields: [
              { id: "qc_id", name: "QC ID", type: "text" },
              { id: "inspection_result", name: "Result", type: "select" },
              { id: "defect_count", name: "Defect Count", type: "number" },
              { id: "inspector", name: "Inspector", type: "text" },
              { id: "qc_date", name: "QC Date", type: "date" },
            ]
          },
          { 
            id: "returns", 
            name: "Returns Processing", 
            icon: "ri-arrow-go-back-line",
            fields: [
              { id: "rma_number", name: "RMA Number", type: "text" },
              { id: "return_reason", name: "Return Reason", type: "select" },
              { id: "refund_amount", name: "Refund Amount", type: "currency", sensitive: true, financial: true },
              { id: "disposition", name: "Disposition", type: "select" },
            ]
          },
          { id: "cross_docking", name: "Cross Docking", icon: "ri-exchange-line", premium: true },
        ],
      },
      {
        id: "outbound",
        name: "Outbound Operations",
        icon: "ri-logout-box-line",
        tabs: [
          { 
            id: "orders", 
            name: "Sales Orders", 
            icon: "ri-shopping-cart-line",
            fields: [
              { id: "order_number", name: "Order Number", type: "text" },
              { id: "customer", name: "Customer", type: "text" },
              { id: "order_date", name: "Order Date", type: "date" },
              { id: "ship_date", name: "Ship Date", type: "date" },
              { id: "order_total", name: "Order Total", type: "currency", sensitive: true, financial: true },
              { id: "status", name: "Status", type: "select" },
              { id: "priority", name: "Priority", type: "select" },
            ]
          },
          { 
            id: "picking", 
            name: "Picking", 
            icon: "ri-hand-heart-line",
            fields: [
              { id: "pick_id", name: "Pick ID", type: "text" },
              { id: "pick_location", name: "Location", type: "text" },
              { id: "quantity_picked", name: "Qty Picked", type: "number" },
              { id: "picker", name: "Picker", type: "text" },
              { id: "pick_time", name: "Pick Time", type: "date" },
            ]
          },
          { 
            id: "packing", 
            name: "Packing", 
            icon: "ri-box-3-line",
            fields: [
              { id: "pack_id", name: "Pack ID", type: "text" },
              { id: "box_count", name: "Box Count", type: "number" },
              { id: "total_weight", name: "Total Weight", type: "number" },
              { id: "packer", name: "Packer", type: "text" },
              { id: "pack_date", name: "Pack Date", type: "date" },
            ]
          },
          { 
            id: "shipping", 
            name: "Shipping", 
            icon: "ri-truck-line",
            fields: [
              { id: "shipment_id", name: "Shipment ID", type: "text" },
              { id: "carrier", name: "Carrier", type: "text" },
              { id: "tracking_number", name: "Tracking Number", type: "text" },
              { id: "ship_date", name: "Ship Date", type: "date" },
              { id: "shipping_cost", name: "Shipping Cost", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "wave_planning", name: "Wave Planning", icon: "ri-bar-chart-grouped-line", premium: true },
          { id: "load_planning", name: "Load Planning", icon: "ri-truck-fill", premium: true },
        ],
      },
      {
        id: "customers",
        name: "WMS Customers",
        icon: "ri-user-star-line",
        tabs: [
          { id: "list", name: "Customer List", icon: "ri-list-check" },
          { 
            id: "contracts", 
            name: "Storage Contracts",
            icon: "ri-file-paper-line",
            fields: [
              { id: "contract_value", name: "Contract Value", type: "currency", sensitive: true, financial: true },
              { id: "payment_terms", name: "Payment Terms", type: "text" },
              { id: "billing_frequency", name: "Billing Frequency", type: "select" },
            ]
          },
          { 
            id: "pricing", 
            name: "Pricing",
            icon: "ri-price-tag-3-line",
            premium: true,
            fields: [
              { id: "storage_rate", name: "Storage Rate", type: "currency", sensitive: true, financial: true },
              { id: "handling_rate", name: "Handling Rate", type: "currency", sensitive: true, financial: true },
              { id: "picking_fee", name: "Picking Fee", type: "currency", sensitive: true, financial: true },
              { id: "special_handling_fee", name: "Special Handling", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "sla", name: "SLA Management", icon: "ri-timer-line" },
        ],
      },
      {
        id: "materials",
        name: "Materials",
        icon: "ri-archive-drawer-line",
        tabs: [
          { id: "catalog", name: "Material Catalog", icon: "ri-book-line" },
          { id: "attributes", name: "Attributes", icon: "ri-list-settings-line" },
          { id: "hazmat", name: "Hazmat Classification", icon: "ri-error-warning-line" },
          { id: "batches", name: "Batch Management", icon: "ri-stack-overflow-line" },
          { id: "serials", name: "Serial Tracking", icon: "ri-barcode-line" },
        ],
      },
      {
        id: "resources",
        name: "Resources",
        icon: "ri-group-line",
        tabs: [
          { id: "equipment", name: "Equipment", icon: "ri-truck-line" },
          { id: "labor", name: "Labor Management", icon: "ri-user-3-line" },
          { id: "work_centers", name: "Work Centers", icon: "ri-building-2-line" },
          { id: "scheduling", name: "Scheduling", icon: "ri-calendar-line" },
        ],
      },
    ],
  },

  {
    id: "tms",
    name: "Transportation Management System",
    icon: "ri-truck-line",
    description: "End-to-end transportation operations",
    category: "operations",
    features: [
      {
        id: "shipments",
        name: "Shipments",
        icon: "ri-ship-line",
        tabs: [
          { 
            id: "list", 
            name: "Shipment List", 
            icon: "ri-list-check",
            fields: [
              { id: "shipment_id", name: "Shipment ID", type: "text" },
              { id: "origin", name: "Origin", type: "text" },
              { id: "destination", name: "Destination", type: "text" },
              { id: "shipper", name: "Shipper", type: "text" },
              { id: "consignee", name: "Consignee", type: "text" },
              { id: "weight", name: "Weight (kg)", type: "number" },
              { id: "freight_cost", name: "Freight Cost", type: "currency", sensitive: true, financial: true },
              { id: "status", name: "Status", type: "select" },
              { id: "eta", name: "ETA", type: "date" },
            ]
          },
          { 
            id: "tracking", 
            name: "Real-time Tracking", 
            icon: "ri-gps-line",
            fields: [
              { id: "current_location", name: "Current Location", type: "text" },
              { id: "lat", name: "Latitude", type: "number" },
              { id: "lng", name: "Longitude", type: "number" },
              { id: "speed", name: "Speed (km/h)", type: "number" },
              { id: "last_update", name: "Last Update", type: "date" },
            ]
          },
          { 
            id: "pod", 
            name: "Proof of Delivery", 
            icon: "ri-checkbox-circle-line",
            fields: [
              { id: "delivered_date", name: "Delivered Date", type: "date" },
              { id: "receiver_name", name: "Receiver Name", type: "text" },
              { id: "signature", name: "Signature", type: "file" },
              { id: "delivery_notes", name: "Notes", type: "text" },
            ]
          },
          { id: "documents", name: "Shipping Documents", icon: "ri-file-copy-line" },
          { id: "exceptions", name: "Exceptions", icon: "ri-error-warning-line" },
          { id: "history", name: "Shipment History", icon: "ri-history-line" },
        ],
      },
      {
        id: "carriers",
        name: "Carrier Management",
        icon: "ri-truck-fill",
        tabs: [
          { id: "list", name: "Carrier List", icon: "ri-list-check" },
          { 
            id: "rates", 
            name: "Rate Cards",
            icon: "ri-price-tag-3-line",
            premium: true,
            fields: [
              { id: "base_rate", name: "Base Rate", type: "currency", sensitive: true, financial: true },
              { id: "fuel_surcharge", name: "Fuel Surcharge", type: "currency", sensitive: true, financial: true },
              { id: "accessorial_fees", name: "Accessorial Fees", type: "currency", sensitive: true, financial: true },
              { id: "minimum_charge", name: "Minimum Charge", type: "currency", sensitive: true, financial: true },
            ]
          },
          { 
            id: "contracts", 
            name: "Carrier Contracts",
            icon: "ri-file-paper-line",
            premium: true,
            fields: [
              { id: "contract_value", name: "Contract Value", type: "currency", sensitive: true, financial: true },
              { id: "volume_commitment", name: "Volume Commitment", type: "number" },
            ]
          },
          { id: "performance", name: "Performance KPIs", icon: "ri-bar-chart-line" },
          { id: "compliance", name: "Carrier Compliance", icon: "ri-shield-check-line" },
        ],
      },
      {
        id: "routes",
        name: "Route Planning",
        icon: "ri-route-line",
        tabs: [
          { id: "planning", name: "Route Planner", icon: "ri-map-2-line" },
          { id: "optimization", name: "Route Optimization", icon: "ri-magic-line", premium: true },
          { id: "zones", name: "Delivery Zones", icon: "ri-map-pin-range-line" },
          { id: "milestones", name: "Milestones", icon: "ri-flag-line" },
        ],
      },
      {
        id: "freight",
        name: "Freight Management",
        icon: "ri-box-1-line",
        tabs: [
          { 
            id: "quotes", 
            name: "Freight Quotes",
            icon: "ri-calculator-line",
            fields: [
              { id: "quote_amount", name: "Quote Amount", type: "currency", sensitive: true, financial: true },
              { id: "margin", name: "Margin", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "bookings", name: "Bookings", icon: "ri-calendar-check-line" },
          { 
            id: "invoices", 
            name: "Freight Invoices",
            icon: "ri-file-list-3-line",
            premium: true,
            fields: [
              { id: "invoice_amount", name: "Invoice Amount", type: "currency", sensitive: true, financial: true },
              { id: "profit", name: "Profit", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "claims", name: "Claims", icon: "ri-error-warning-line" },
        ],
      },
      {
        id: "multimodal",
        name: "Multimodal Transport",
        icon: "ri-flight-takeoff-line",
        premium: true,
        tabs: [
          { id: "sea", name: "Sea Freight", icon: "ri-ship-2-line" },
          { id: "air", name: "Air Freight", icon: "ri-plane-line" },
          { id: "rail", name: "Rail Freight", icon: "ri-train-line" },
          { id: "intermodal", name: "Intermodal", icon: "ri-exchange-box-line" },
        ],
      },
      {
        id: "fleet",
        name: "Fleet Management",
        icon: "ri-car-line",
        tabs: [
          { id: "vehicles", name: "Vehicle Registry", icon: "ri-truck-line" },
          { id: "drivers", name: "Driver Management", icon: "ri-user-4-line" },
          { id: "maintenance", name: "Maintenance", icon: "ri-tools-line" },
          { id: "fuel", name: "Fuel Management", icon: "ri-gas-station-line" },
          { id: "telematics", name: "Telematics", icon: "ri-gps-line", premium: true },
        ],
      },
    ],
  },

  // ==========================================================================
  // FINANCE MODULES
  // ==========================================================================
  {
    id: "finance",
    name: "Finance & Accounting",
    icon: "ri-money-dollar-circle-line",
    description: "Comprehensive financial management",
    category: "finance",
    features: [
      {
        id: "accounts_receivable",
        name: "Accounts Receivable",
        icon: "ri-hand-coin-line",
        tabs: [
          { 
            id: "invoices", 
            name: "Customer Invoices",
            icon: "ri-file-list-3-line",
            fields: [
              { id: "invoice_number", name: "Invoice Number", type: "text" },
              { id: "customer", name: "Customer", type: "text" },
              { id: "amount", name: "Amount", type: "currency", sensitive: true, financial: true },
              { id: "tax", name: "Tax", type: "currency", sensitive: true, financial: true },
              { id: "total", name: "Total", type: "currency", sensitive: true, financial: true },
              { id: "due_date", name: "Due Date", type: "date" },
              { id: "status", name: "Status", type: "select" },
            ]
          },
          { 
            id: "payments", 
            name: "Payments Received",
            icon: "ri-bank-card-line",
            fields: [
              { id: "payment_amount", name: "Amount", type: "currency", sensitive: true, financial: true },
              { id: "payment_method", name: "Method", type: "select" },
              { id: "reference", name: "Reference", type: "text" },
              { id: "bank_account", name: "Bank Account", type: "text", sensitive: true },
            ]
          },
          { 
            id: "aging", 
            name: "Aging Report",
            icon: "ri-time-line",
            premium: true,
            fields: [
              { id: "total_outstanding", name: "Total Outstanding", type: "currency", sensitive: true, financial: true },
              { id: "overdue_30", name: "30+ Days", type: "currency", sensitive: true, financial: true },
              { id: "overdue_60", name: "60+ Days", type: "currency", sensitive: true, financial: true },
              { id: "overdue_90", name: "90+ Days", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "credit_notes", name: "Credit Notes", icon: "ri-subtract-line" },
          { id: "statements", name: "Customer Statements", icon: "ri-file-text-line" },
        ],
      },
      {
        id: "accounts_payable",
        name: "Accounts Payable",
        icon: "ri-wallet-3-line",
        tabs: [
          { 
            id: "bills", 
            name: "Vendor Bills",
            icon: "ri-file-list-2-line",
            fields: [
              { id: "bill_number", name: "Bill Number", type: "text" },
              { id: "vendor", name: "Vendor", type: "text" },
              { id: "amount", name: "Amount", type: "currency", sensitive: true, financial: true },
              { id: "due_date", name: "Due Date", type: "date" },
            ]
          },
          { 
            id: "payments", 
            name: "Payments Made",
            icon: "ri-bank-card-line",
            fields: [
              { id: "payment_amount", name: "Amount", type: "currency", sensitive: true, financial: true },
              { id: "vendor_bank", name: "Vendor Bank", type: "text", sensitive: true },
            ]
          },
          { id: "aging", name: "AP Aging", icon: "ri-time-line", premium: true },
          { id: "approval", name: "Payment Approval", icon: "ri-check-double-line" },
        ],
      },
      {
        id: "general_ledger",
        name: "General Ledger",
        icon: "ri-book-2-line",
        premium: true,
        tabs: [
          { id: "chart_of_accounts", name: "Chart of Accounts", icon: "ri-list-ordered" },
          { 
            id: "journal_entries", 
            name: "Journal Entries",
            icon: "ri-edit-box-line",
            fields: [
              { id: "debit", name: "Debit", type: "currency", sensitive: true, financial: true },
              { id: "credit", name: "Credit", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "trial_balance", name: "Trial Balance", icon: "ri-scales-3-line" },
          { id: "financial_statements", name: "Financial Statements", icon: "ri-file-chart-line" },
        ],
      },
      {
        id: "billing",
        name: "Billing & Subscriptions",
        icon: "ri-bill-line",
        tabs: [
          { id: "invoicing", name: "Invoice Generation", icon: "ri-file-add-line" },
          { id: "subscriptions", name: "Subscriptions", icon: "ri-repeat-line" },
          { id: "usage_billing", name: "Usage Billing", icon: "ri-bar-chart-box-line", premium: true },
          { id: "payment_methods", name: "Payment Methods", icon: "ri-bank-card-2-line" },
          { id: "revenue_recognition", name: "Revenue Recognition", icon: "ri-line-chart-line", premium: true },
        ],
      },
      {
        id: "budgeting",
        name: "Budgeting & Forecasting",
        icon: "ri-funds-line",
        premium: true,
        tabs: [
          { 
            id: "budgets", 
            name: "Budgets",
            icon: "ri-calculator-line",
            fields: [
              { id: "budget_amount", name: "Budget Amount", type: "currency", sensitive: true, financial: true },
              { id: "actual_spend", name: "Actual Spend", type: "currency", sensitive: true, financial: true },
              { id: "variance", name: "Variance", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "forecasting", name: "Forecasting", icon: "ri-line-chart-line" },
          { id: "scenarios", name: "Scenario Planning", icon: "ri-git-branch-line" },
        ],
      },
    ],
  },

  {
    id: "procurement",
    name: "Procurement",
    icon: "ri-shopping-cart-2-line",
    description: "Strategic sourcing and purchasing",
    category: "finance",
    features: [
      {
        id: "purchase_orders",
        name: "Purchase Orders",
        icon: "ri-file-list-line",
        tabs: [
          { 
            id: "list", 
            name: "PO List",
            icon: "ri-list-check",
            fields: [
              { id: "po_number", name: "PO Number", type: "text" },
              { id: "vendor", name: "Vendor", type: "text" },
              { id: "total_amount", name: "Total Amount", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "create", name: "Create PO", icon: "ri-add-line" },
          { id: "approval", name: "Approval Workflow", icon: "ri-check-double-line" },
          { id: "receipts", name: "Goods Receipts", icon: "ri-inbox-archive-line" },
        ],
      },
      {
        id: "vendors",
        name: "Vendor Management",
        icon: "ri-store-2-line",
        tabs: [
          { id: "list", name: "Vendor List", icon: "ri-list-check" },
          { id: "onboarding", name: "Onboarding", icon: "ri-user-add-line" },
          { id: "performance", name: "Performance", icon: "ri-bar-chart-line" },
          { 
            id: "contracts", 
            name: "Vendor Contracts",
            icon: "ri-file-paper-line",
            fields: [
              { id: "contract_value", name: "Contract Value", type: "currency", sensitive: true, financial: true },
              { id: "payment_terms", name: "Payment Terms", type: "text" },
            ]
          },
        ],
      },
      {
        id: "sourcing",
        name: "Strategic Sourcing",
        icon: "ri-search-2-line",
        premium: true,
        tabs: [
          { id: "rfq", name: "RFQ Management", icon: "ri-question-line" },
          { id: "rfp", name: "RFP Management", icon: "ri-file-paper-2-line" },
          { id: "auctions", name: "Reverse Auctions", icon: "ri-hammer-line" },
          { id: "comparison", name: "Bid Comparison", icon: "ri-bar-chart-grouped-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // CRM & SALES
  // ==========================================================================
  {
    id: "crm",
    name: "Customer Relationship Management",
    icon: "ri-customer-service-2-line",
    description: "Complete customer management",
    category: "core",
    features: [
      {
        id: "accounts",
        name: "Accounts",
        icon: "ri-building-line",
        tabs: [
          { id: "list", name: "Account List", icon: "ri-list-check" },
          { id: "details", name: "Account Details", icon: "ri-information-line" },
          { id: "hierarchy", name: "Account Hierarchy", icon: "ri-organization-chart" },
          { 
            id: "revenue", 
            name: "Revenue History",
            icon: "ri-money-dollar-box-line",
            premium: true,
            fields: [
              { id: "total_revenue", name: "Total Revenue", type: "currency", sensitive: true, financial: true },
              { id: "ytd_revenue", name: "YTD Revenue", type: "currency", sensitive: true, financial: true },
            ]
          },
        ],
      },
      {
        id: "contacts",
        name: "Contacts",
        icon: "ri-contacts-line",
        tabs: [
          { 
            id: "list", 
            name: "Contact List",
            icon: "ri-list-check",
            fields: [
              { id: "name", name: "Name", type: "text" },
              { id: "email", name: "Email", type: "email", pii: true },
              { id: "phone", name: "Phone", type: "phone", pii: true },
              { id: "mobile", name: "Mobile", type: "phone", pii: true },
            ]
          },
          { id: "communications", name: "Communications", icon: "ri-chat-3-line" },
          { id: "activities", name: "Activities", icon: "ri-time-line" },
        ],
      },
      {
        id: "opportunities",
        name: "Opportunities",
        icon: "ri-lightbulb-line",
        tabs: [
          { 
            id: "pipeline", 
            name: "Pipeline",
            icon: "ri-bar-chart-horizontal-line",
            fields: [
              { id: "deal_value", name: "Deal Value", type: "currency", sensitive: true, financial: true },
              { id: "probability", name: "Probability", type: "number" },
              { id: "weighted_value", name: "Weighted Value", type: "currency", sensitive: true, financial: true },
            ]
          },
          { 
            id: "forecasting", 
            name: "Sales Forecasting",
            icon: "ri-line-chart-line",
            premium: true,
            fields: [
              { id: "forecast_amount", name: "Forecast Amount", type: "currency", sensitive: true, financial: true },
              { id: "quota", name: "Quota", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "won_lost", name: "Won/Lost Analysis", icon: "ri-trophy-line" },
        ],
      },
      {
        id: "leads",
        name: "Leads",
        icon: "ri-user-follow-line",
        tabs: [
          { id: "list", name: "Lead List", icon: "ri-list-check" },
          { id: "scoring", name: "Lead Scoring", icon: "ri-star-line", premium: true },
          { id: "conversion", name: "Conversion", icon: "ri-exchange-funds-line" },
          { id: "campaigns", name: "Campaign Tracking", icon: "ri-mail-send-line" },
        ],
      },
    ],
  },

  {
    id: "proposals-rfq",
    name: "Proposals & RFQ",
    icon: "ri-file-list-3-line",
    description: "Proposal and quotation management",
    category: "core",
    features: [
      {
        id: "proposals",
        name: "Proposals",
        icon: "ri-file-paper-line",
        tabs: [
          { 
            id: "list", 
            name: "Proposal List",
            icon: "ri-list-check",
            fields: [
              { id: "proposal_value", name: "Proposal Value", type: "currency", sensitive: true, financial: true },
              { id: "margin", name: "Margin %", type: "number", sensitive: true, financial: true },
            ]
          },
          { id: "create", name: "Create Proposal", icon: "ri-add-line" },
          { id: "templates", name: "Templates", icon: "ri-file-copy-line" },
          { id: "approval", name: "Approval Workflow", icon: "ri-check-double-line" },
        ],
      },
      {
        id: "rfq",
        name: "Request for Quotation",
        icon: "ri-questionnaire-line",
        tabs: [
          { id: "inbox", name: "RFQ Inbox", icon: "ri-inbox-line" },
          { id: "responses", name: "RFQ Responses", icon: "ri-reply-line" },
          { id: "comparison", name: "Comparison", icon: "ri-bar-chart-grouped-line" },
        ],
      },
      {
        id: "rate_cards",
        name: "Rate Cards",
        icon: "ri-price-tag-3-line",
        premium: true,
        tabs: [
          { 
            id: "management", 
            name: "Rate Card Management",
            icon: "ri-settings-line",
            fields: [
              { id: "base_rate", name: "Base Rate", type: "currency", sensitive: true, financial: true },
              { id: "volume_discount", name: "Volume Discount", type: "number", sensitive: true },
            ]
          },
          { id: "versioning", name: "Version History", icon: "ri-history-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // COMPLIANCE & QUALITY
  // ==========================================================================
  {
    id: "qhse",
    name: "Quality, Health, Safety & Environment",
    icon: "ri-shield-check-line",
    description: "Complete QHSE management",
    category: "compliance",
    features: [
      {
        id: "incidents",
        name: "Incident Management",
        icon: "ri-error-warning-line",
        tabs: [
          { id: "list", name: "Incident List", icon: "ri-list-check" },
          { id: "reporting", name: "Incident Reporting", icon: "ri-file-warning-line" },
          { id: "investigation", name: "Investigation", icon: "ri-search-eye-line" },
          { id: "corrective_actions", name: "Corrective Actions", icon: "ri-tools-line" },
          { id: "analytics", name: "Incident Analytics", icon: "ri-bar-chart-line", premium: true },
        ],
      },
      {
        id: "audits",
        name: "Audits",
        icon: "ri-file-search-line",
        tabs: [
          { id: "schedule", name: "Audit Schedule", icon: "ri-calendar-line" },
          { id: "execution", name: "Audit Execution", icon: "ri-checkbox-multiple-line" },
          { id: "findings", name: "Findings", icon: "ri-file-list-2-line" },
          { id: "reports", name: "Audit Reports", icon: "ri-file-chart-line" },
        ],
      },
      {
        id: "risk",
        name: "Risk Management",
        icon: "ri-alert-line",
        premium: true,
        tabs: [
          { id: "assessment", name: "Risk Assessment", icon: "ri-scales-3-line" },
          { id: "register", name: "Risk Register", icon: "ri-book-line" },
          { id: "mitigation", name: "Mitigation Plans", icon: "ri-shield-line" },
        ],
      },
      {
        id: "training",
        name: "Safety Training",
        icon: "ri-graduation-cap-line",
        tabs: [
          { id: "courses", name: "Training Courses", icon: "ri-book-open-line" },
          { id: "records", name: "Training Records", icon: "ri-file-user-line" },
          { id: "certifications", name: "Certifications", icon: "ri-award-line" },
        ],
      },
    ],
  },

  {
    id: "iso-ims",
    name: "ISO Integrated Management System",
    icon: "ri-file-shield-2-line",
    description: "ISO standards compliance",
    category: "compliance",
    features: [
      {
        id: "document_control",
        name: "Document Control",
        icon: "ri-folder-settings-line",
        tabs: [
          { id: "documents", name: "Document Library", icon: "ri-folder-open-line" },
          { id: "versions", name: "Version Control", icon: "ri-git-branch-line" },
          { id: "approval", name: "Document Approval", icon: "ri-check-double-line" },
          { id: "distribution", name: "Distribution", icon: "ri-share-line" },
        ],
      },
      {
        id: "capa",
        name: "CAPA Management",
        icon: "ri-bug-line",
        tabs: [
          { id: "list", name: "CAPA List", icon: "ri-list-check" },
          { id: "root_cause", name: "Root Cause Analysis", icon: "ri-search-eye-line" },
          { id: "actions", name: "Action Items", icon: "ri-task-line" },
          { id: "verification", name: "Verification", icon: "ri-checkbox-circle-line" },
        ],
      },
      {
        id: "management_review",
        name: "Management Review",
        icon: "ri-team-line",
        premium: true,
        tabs: [
          { id: "meetings", name: "Review Meetings", icon: "ri-calendar-event-line" },
          { id: "inputs", name: "Review Inputs", icon: "ri-arrow-right-circle-line" },
          { id: "outputs", name: "Review Outputs", icon: "ri-arrow-left-circle-line" },
        ],
      },
    ],
  },

  {
    id: "gcc-compliance",
    name: "GCC Compliance",
    icon: "ri-shield-star-line",
    description: "Saudi Arabia & GCC regulatory compliance",
    category: "compliance",
    premium: true,
    features: [
      {
        id: "regulations",
        name: "Regulations",
        icon: "ri-government-line",
        tabs: [
          { id: "saudi", name: "Saudi Arabia", icon: "ri-flag-line" },
          { id: "uae", name: "UAE", icon: "ri-flag-line" },
          { id: "qatar", name: "Qatar", icon: "ri-flag-line" },
          { id: "kuwait", name: "Kuwait", icon: "ri-flag-line" },
          { id: "bahrain", name: "Bahrain", icon: "ri-flag-line" },
          { id: "oman", name: "Oman", icon: "ri-flag-line" },
        ],
      },
      {
        id: "transport_permits",
        name: "Transport Permits",
        icon: "ri-file-paper-2-line",
        tabs: [
          { id: "tga", name: "TGA Permits", icon: "ri-file-shield-line" },
          { id: "etw", name: "e-Waybill", icon: "ri-file-code-line" },
          { id: "hazmat", name: "Hazmat Permits", icon: "ri-error-warning-line" },
          { id: "oversize", name: "Oversize/Overweight", icon: "ri-truck-fill" },
        ],
      },
      {
        id: "driver_compliance",
        name: "Driver Compliance",
        icon: "ri-user-4-line",
        tabs: [
          { id: "licenses", name: "License Verification", icon: "ri-id-card-line" },
          { id: "medicals", name: "Medical Records", icon: "ri-heart-pulse-line" },
          { id: "training", name: "Training", icon: "ri-graduation-cap-line" },
        ],
      },
    ],
  },

  {
    id: "trade-compliance",
    name: "Trade Compliance",
    icon: "ri-global-line",
    description: "International trade compliance",
    category: "compliance",
    features: [
      {
        id: "screening",
        name: "Party Screening",
        icon: "ri-user-search-line",
        tabs: [
          { id: "sanctions", name: "Sanctions Screening", icon: "ri-shield-cross-line" },
          { id: "denied_parties", name: "Denied Parties", icon: "ri-close-circle-line" },
          { id: "pep", name: "PEP Screening", icon: "ri-spy-line" },
        ],
      },
      {
        id: "export_controls",
        name: "Export Controls",
        icon: "ri-logout-box-r-line",
        tabs: [
          { id: "classification", name: "Export Classification", icon: "ri-file-search-line" },
          { id: "licensing", name: "Export Licensing", icon: "ri-file-shield-2-line" },
          { id: "end_use", name: "End Use Checks", icon: "ri-checkbox-circle-line" },
        ],
      },
      {
        id: "customs",
        name: "Customs Compliance",
        icon: "ri-building-4-line",
        tabs: [
          { id: "declarations", name: "Customs Declarations", icon: "ri-file-list-line" },
          { id: "classification", name: "HS Classification", icon: "ri-barcode-box-line" },
          { id: "valuation", name: "Customs Valuation", icon: "ri-money-dollar-box-line" },
          { id: "origin", name: "Rules of Origin", icon: "ri-map-pin-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // INTELLIGENCE & AI
  // ==========================================================================
  {
    id: "ai",
    name: "AI & Intelligent Orchestration",
    icon: "ri-brain-line",
    description: "AI-powered intelligence",
    category: "intelligence",
    premium: true,
    features: [
      {
        id: "copilot",
        name: "AI Copilot",
        icon: "ri-robot-line",
        tabs: [
          { id: "chat", name: "AI Chat", icon: "ri-chat-3-line" },
          { id: "suggestions", name: "Smart Suggestions", icon: "ri-lightbulb-flash-line" },
          { id: "automation", name: "Automation Rules", icon: "ri-settings-4-line" },
        ],
      },
      {
        id: "analytics",
        name: "Predictive Analytics",
        icon: "ri-line-chart-line",
        tabs: [
          { id: "forecasting", name: "Demand Forecasting", icon: "ri-funds-line" },
          { id: "anomaly", name: "Anomaly Detection", icon: "ri-error-warning-line" },
          { id: "recommendations", name: "Recommendations", icon: "ri-sparkling-line" },
        ],
      },
      {
        id: "process_mining",
        name: "Process Mining",
        icon: "ri-flow-chart",
        tabs: [
          { id: "discovery", name: "Process Discovery", icon: "ri-search-eye-line" },
          { id: "conformance", name: "Conformance Check", icon: "ri-checkbox-circle-line" },
          { id: "optimization", name: "Process Optimization", icon: "ri-magic-line" },
        ],
      },
    ],
  },

  {
    id: "business-intelligence",
    name: "Business Intelligence",
    icon: "ri-dashboard-line",
    description: "BI and reporting",
    category: "intelligence",
    features: [
      {
        id: "dashboards",
        name: "Dashboards",
        icon: "ri-layout-grid-line",
        tabs: [
          { id: "builder", name: "Dashboard Builder", icon: "ri-tools-line" },
          { id: "library", name: "Dashboard Library", icon: "ri-folder-open-line" },
          { id: "sharing", name: "Sharing", icon: "ri-share-line" },
        ],
      },
      {
        id: "reports",
        name: "Reports",
        icon: "ri-file-chart-line",
        tabs: [
          { id: "templates", name: "Report Templates", icon: "ri-file-copy-line" },
          { id: "scheduler", name: "Report Scheduler", icon: "ri-calendar-schedule-line" },
          { id: "distribution", name: "Distribution", icon: "ri-mail-send-line" },
        ],
      },
      {
        id: "data_explorer",
        name: "Data Explorer",
        icon: "ri-database-2-line",
        premium: true,
        tabs: [
          { id: "query", name: "Query Builder", icon: "ri-code-line" },
          { id: "visualization", name: "Visualization", icon: "ri-pie-chart-line" },
          { id: "export", name: "Data Export", icon: "ri-download-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // HR & ADMIN
  // ==========================================================================
  {
    id: "hr",
    name: "Human Resources",
    icon: "ri-team-line",
    description: "HR management",
    category: "hr",
    features: [
      {
        id: "employees",
        name: "Employee Management",
        icon: "ri-user-3-line",
        tabs: [
          { id: "directory", name: "Employee Directory", icon: "ri-contacts-book-line" },
          { 
            id: "personal", 
            name: "Personal Information",
            icon: "ri-user-settings-line",
            fields: [
              { id: "ssn", name: "SSN/National ID", type: "text", sensitive: true, pii: true },
              { id: "date_of_birth", name: "Date of Birth", type: "date", pii: true },
              { id: "address", name: "Home Address", type: "text", pii: true },
              { id: "emergency_contact", name: "Emergency Contact", type: "text", pii: true },
              { id: "bank_account", name: "Bank Account", type: "text", sensitive: true, pii: true },
            ]
          },
          { id: "documents", name: "Documents", icon: "ri-file-text-line" },
          { id: "contracts", name: "Employment Contracts", icon: "ri-file-paper-line" },
        ],
      },
      {
        id: "payroll",
        name: "Payroll",
        icon: "ri-money-dollar-box-line",
        premium: true,
        tabs: [
          { 
            id: "processing", 
            name: "Payroll Processing",
            icon: "ri-calculator-line",
            fields: [
              { id: "basic_salary", name: "Basic Salary", type: "currency", sensitive: true, financial: true, pii: true },
              { id: "allowances", name: "Allowances", type: "currency", sensitive: true, financial: true },
              { id: "deductions", name: "Deductions", type: "currency", sensitive: true, financial: true },
              { id: "gross_pay", name: "Gross Pay", type: "currency", sensitive: true, financial: true, pii: true },
              { id: "net_pay", name: "Net Pay", type: "currency", sensitive: true, financial: true, pii: true },
            ]
          },
          { id: "history", name: "Pay History", icon: "ri-history-line" },
          { id: "tax", name: "Tax Information", icon: "ri-government-line" },
        ],
      },
      {
        id: "leave",
        name: "Leave Management",
        icon: "ri-calendar-check-line",
        tabs: [
          { id: "requests", name: "Leave Requests", icon: "ri-calendar-2-line" },
          { id: "balances", name: "Leave Balances", icon: "ri-bar-chart-horizontal-line" },
          { id: "calendar", name: "Team Calendar", icon: "ri-calendar-line" },
        ],
      },
      {
        id: "recruitment",
        name: "Recruitment",
        icon: "ri-user-add-line",
        tabs: [
          { id: "jobs", name: "Job Postings", icon: "ri-briefcase-line" },
          { id: "applicants", name: "Applicants", icon: "ri-user-received-line" },
          { id: "interviews", name: "Interviews", icon: "ri-calendar-event-line" },
          { id: "offers", name: "Offer Management", icon: "ri-mail-send-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // SYSTEM & SETTINGS
  // ==========================================================================
  {
    id: "settings",
    name: "System Settings",
    icon: "ri-settings-3-line",
    description: "Platform configuration",
    category: "system",
    features: [
      {
        id: "users",
        name: "User Management",
        icon: "ri-user-settings-line",
        tabs: [
          { id: "list", name: "User List", icon: "ri-list-check" },
          { id: "roles", name: "Roles & Permissions", icon: "ri-shield-keyhole-line" },
          { id: "security", name: "Security Settings", icon: "ri-lock-line" },
          { id: "mfa", name: "MFA Configuration", icon: "ri-key-2-line" },
          { id: "sso", name: "SSO Configuration", icon: "ri-external-link-line" },
          { id: "api_keys", name: "API Key Management", icon: "ri-key-line" },
        ],
      },
      {
        id: "organization",
        name: "Organization",
        icon: "ri-building-line",
        tabs: [
          { id: "profile", name: "Organization Profile", icon: "ri-building-2-line" },
          { id: "branding", name: "Branding", icon: "ri-palette-line" },
          { id: "billing", name: "Billing Settings", icon: "ri-bank-card-line" },
          { id: "subscription", name: "Subscription", icon: "ri-vip-crown-line" },
        ],
      },
      {
        id: "integrations",
        name: "Integrations",
        icon: "ri-plug-line",
        tabs: [
          { id: "connectors", name: "Connectors", icon: "ri-link-m" },
          { id: "webhooks", name: "Webhooks", icon: "ri-webhook-line" },
          { id: "api", name: "API Configuration", icon: "ri-code-line" },
          { id: "erp", name: "ERP Integration", icon: "ri-building-4-line" },
        ],
      },
      {
        id: "audit",
        name: "Audit & Logs",
        icon: "ri-file-search-line",
        tabs: [
          { id: "activity", name: "Activity Logs", icon: "ri-history-line" },
          { id: "security", name: "Security Logs", icon: "ri-shield-line" },
          { id: "export", name: "Log Export", icon: "ri-download-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // ADDITIONAL MODULES
  // ==========================================================================
  {
    id: "maas",
    name: "Manufacturing as a Service",
    icon: "ri-settings-4-line",
    description: "Manufacturing operations",
    category: "operations",
    features: [
      {
        id: "production",
        name: "Production",
        icon: "ri-tools-line",
        tabs: [
          { id: "orders", name: "Production Orders", icon: "ri-file-list-line" },
          { id: "bom", name: "Bill of Materials", icon: "ri-list-ordered" },
          { id: "routing", name: "Routing", icon: "ri-route-line" },
          { id: "scheduling", name: "Scheduling", icon: "ri-calendar-schedule-line" },
        ],
      },
      {
        id: "shop_floor",
        name: "Shop Floor",
        icon: "ri-building-2-line",
        tabs: [
          { id: "work_centers", name: "Work Centers", icon: "ri-home-gear-line" },
          { id: "operators", name: "Operators", icon: "ri-user-3-line" },
          { id: "tracking", name: "WIP Tracking", icon: "ri-time-line" },
        ],
      },
      {
        id: "quality",
        name: "Quality Control",
        icon: "ri-checkbox-circle-line",
        tabs: [
          { id: "inspection", name: "Inspections", icon: "ri-search-eye-line" },
          { id: "defects", name: "Defect Tracking", icon: "ri-bug-line" },
          { id: "spc", name: "SPC Charts", icon: "ri-line-chart-line", premium: true },
        ],
      },
    ],
  },

  {
    id: "marketplace",
    name: "Marketplace",
    icon: "ri-store-3-line",
    description: "Service marketplace",
    category: "core",
    features: [
      {
        id: "listings",
        name: "Service Listings",
        icon: "ri-list-check-2",
        tabs: [
          { id: "browse", name: "Browse Services", icon: "ri-search-line" },
          { id: "my_listings", name: "My Listings", icon: "ri-bookmark-line" },
          { id: "create", name: "Create Listing", icon: "ri-add-line" },
        ],
      },
      {
        id: "bookings",
        name: "Bookings",
        icon: "ri-calendar-check-line",
        tabs: [
          { id: "list", name: "My Bookings", icon: "ri-list-check" },
          { id: "calendar", name: "Calendar View", icon: "ri-calendar-line" },
        ],
      },
      {
        id: "payments",
        name: "Payments",
        icon: "ri-bank-card-2-line",
        tabs: [
          { 
            id: "transactions", 
            name: "Transactions",
            icon: "ri-exchange-funds-line",
            fields: [
              { id: "amount", name: "Amount", type: "currency", sensitive: true, financial: true },
              { id: "fee", name: "Platform Fee", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "payouts", name: "Payouts", icon: "ri-money-dollar-box-line" },
        ],
      },
    ],
  },

  {
    id: "pulse",
    name: "Pulse",
    icon: "ri-pulse-line",
    description: "Real-time monitoring & gamification",
    category: "intelligence",
    features: [
      {
        id: "monitoring",
        name: "Real-time Monitoring",
        icon: "ri-dashboard-line",
        tabs: [
          { id: "dashboard", name: "Live Dashboard", icon: "ri-tv-2-line" },
          { id: "alerts", name: "Alerts", icon: "ri-notification-3-line" },
          { id: "health", name: "System Health", icon: "ri-heart-pulse-line" },
        ],
      },
      {
        id: "gamification",
        name: "Gamification",
        icon: "ri-game-line",
        tabs: [
          { id: "leaderboard", name: "Leaderboard", icon: "ri-trophy-line" },
          { id: "achievements", name: "Achievements", icon: "ri-award-line" },
          { id: "challenges", name: "Challenges", icon: "ri-fire-line" },
        ],
      },
    ],
  },

  {
    id: "msds",
    name: "Chemical & MSDS",
    icon: "ri-flask-line",
    description: "Chemical safety management",
    category: "compliance",
    features: [
      {
        id: "database",
        name: "MSDS Database",
        icon: "ri-database-line",
        tabs: [
          { id: "sheets", name: "Safety Data Sheets", icon: "ri-file-paper-2-line" },
          { id: "chemicals", name: "Chemical Registry", icon: "ri-flask-fill" },
          { id: "hazards", name: "Hazard Classification", icon: "ri-error-warning-line" },
        ],
      },
      {
        id: "safety",
        name: "Chemical Safety",
        icon: "ri-shield-check-line",
        tabs: [
          { id: "compatibility", name: "Compatibility Check", icon: "ri-contrast-line" },
          { id: "storage", name: "Storage Requirements", icon: "ri-archive-line" },
          { id: "handling", name: "Handling Guidelines", icon: "ri-hand-heart-line" },
        ],
      },
    ],
  },

  {
    id: "etw",
    name: "e-Waybill (ETW)",
    icon: "ri-file-paper-2-line",
    description: "Electronic waybill management",
    category: "compliance",
    features: [
      {
        id: "waybills",
        name: "e-Waybill Management",
        icon: "ri-file-list-line",
        tabs: [
          { id: "create", name: "Create e-Waybill", icon: "ri-add-line" },
          { id: "list", name: "Waybill List", icon: "ri-list-check" },
          { id: "tracking", name: "Tracking", icon: "ri-gps-line" },
          { id: "archive", name: "Archive", icon: "ri-archive-line" },
        ],
      },
    ],
  },

  {
    id: "facility-management",
    name: "Facility Management",
    icon: "ri-home-gear-line",
    description: "Facility & asset management",
    category: "operations",
    features: [
      {
        id: "facilities",
        name: "Facilities",
        icon: "ri-building-line",
        tabs: [
          { id: "list", name: "Facility List", icon: "ri-list-check" },
          { id: "floor_plans", name: "Floor Plans", icon: "ri-layout-grid-line" },
        ],
      },
      {
        id: "maintenance",
        name: "Maintenance",
        icon: "ri-tools-line",
        tabs: [
          { id: "work_orders", name: "Work Orders", icon: "ri-file-list-line" },
          { id: "preventive", name: "Preventive Maintenance", icon: "ri-calendar-schedule-line" },
          { id: "assets", name: "Asset Registry", icon: "ri-cpu-line" },
        ],
      },
      {
        id: "leases",
        name: "Leases & Contracts",
        icon: "ri-file-paper-line",
        tabs: [
          { 
            id: "leases", 
            name: "Lease Management",
            icon: "ri-home-5-line",
            fields: [
              { id: "monthly_rent", name: "Monthly Rent", type: "currency", sensitive: true, financial: true },
              { id: "security_deposit", name: "Security Deposit", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "contracts", name: "Service Contracts", icon: "ri-file-paper-2-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // INTELLIGENCE & ANALYTICS MODULES
  // ==========================================================================
  {
    id: "intelligence-analytics",
    name: "Intelligence & Analytics",
    icon: "ri-brain-2-line",
    description: "Root Cause Analysis, Data Mining & Process Mining",
    category: "intelligence",
    premium: true,
    features: [
      {
        id: "dashboard",
        name: "Intelligence Dashboard",
        icon: "ri-dashboard-3-line",
        tabs: [
          { id: "overview", name: "Overview", icon: "ri-dashboard-line" },
          { id: "kpis", name: "KPI Dashboard", icon: "ri-bar-chart-box-line" },
          { id: "alerts", name: "Intelligent Alerts", icon: "ri-notification-3-line" },
        ],
      },
      {
        id: "root_cause",
        name: "Root Cause Analysis",
        icon: "ri-search-line",
        tabs: [
          { id: "analysis", name: "RCA Engine", icon: "ri-search-eye-line" },
          { id: "patterns", name: "Pattern Detection", icon: "ri-flashlight-line" },
          { id: "recommendations", name: "Recommendations", icon: "ri-lightbulb-line" },
        ],
      },
      {
        id: "data_mining",
        name: "Data Mining",
        icon: "ri-database-2-line",
        tabs: [
          { id: "feature_engineering", name: "Feature Engineering", icon: "ri-tools-line" },
          { id: "clustering", name: "Clustering", icon: "ri-bubble-chart-line" },
          { id: "associations", name: "Association Rules", icon: "ri-link-m" },
        ],
      },
      {
        id: "process_mining",
        name: "Process Mining",
        icon: "ri-flow-chart-line",
        tabs: [
          { id: "discovery", name: "Process Discovery", icon: "ri-search-eye-line" },
          { id: "conformance", name: "Conformance Check", icon: "ri-checkbox-circle-line" },
          { id: "enhancement", name: "Process Enhancement", icon: "ri-magic-line" },
        ],
      },
    ],
  },

  {
    id: "truth-engine",
    name: "Truth Engine",
    icon: "ri-shield-check-line",
    description: "Evidence-backed truth verification & knowledge graph",
    category: "intelligence",
    premium: true,
    features: [
      {
        id: "dashboard",
        name: "Truth Dashboard",
        icon: "ri-dashboard-3-line",
        tabs: [
          { id: "overview", name: "Overview", icon: "ri-dashboard-line" },
          { id: "verification_queue", name: "Verification Queue", icon: "ri-list-check" },
          { id: "truth_score", name: "Truth Scores", icon: "ri-scales-3-line" },
        ],
      },
      {
        id: "knowledge_graph",
        name: "Knowledge Graph",
        icon: "ri-node-tree",
        tabs: [
          { id: "entities", name: "Entities", icon: "ri-database-2-line" },
          { id: "relationships", name: "Relationships", icon: "ri-links-line" },
          { id: "visualization", name: "Graph Visualization", icon: "ri-bubble-chart-line" },
        ],
      },
      {
        id: "claims",
        name: "Claims Management",
        icon: "ri-file-shield-line",
        tabs: [
          { id: "pending", name: "Pending Claims", icon: "ri-time-line" },
          { id: "verified", name: "Verified Claims", icon: "ri-check-double-line" },
          { id: "disputed", name: "Disputed Claims", icon: "ri-error-warning-line" },
        ],
      },
    ],
  },

  {
    id: "liability",
    name: "Liability Management",
    icon: "ri-shield-cross-line",
    description: "Risk assessment & liability management",
    category: "compliance",
    premium: true,
    features: [
      {
        id: "dashboard",
        name: "Liability Dashboard",
        icon: "ri-dashboard-3-line",
        tabs: [
          { id: "overview", name: "Overview", icon: "ri-dashboard-line" },
          { id: "risk_summary", name: "Risk Summary", icon: "ri-alert-line" },
          { 
            id: "exposure", 
            name: "Exposure Analysis",
            icon: "ri-money-dollar-box-line",
            fields: [
              { id: "total_exposure", name: "Total Exposure", type: "currency", sensitive: true, financial: true },
              { id: "covered_amount", name: "Covered Amount", type: "currency", sensitive: true, financial: true },
              { id: "uncovered_risk", name: "Uncovered Risk", type: "currency", sensitive: true, financial: true },
            ]
          },
        ],
      },
      {
        id: "assessments",
        name: "Risk Assessments",
        icon: "ri-file-warning-line",
        tabs: [
          { id: "list", name: "Assessment List", icon: "ri-list-check" },
          { id: "create", name: "New Assessment", icon: "ri-add-line" },
          { id: "templates", name: "Assessment Templates", icon: "ri-file-copy-line" },
        ],
      },
      {
        id: "claims",
        name: "Liability Claims",
        icon: "ri-file-list-3-line",
        tabs: [
          { id: "list", name: "Claims List", icon: "ri-list-check" },
          { 
            id: "details", 
            name: "Claim Details",
            icon: "ri-file-text-line",
            fields: [
              { id: "claim_amount", name: "Claim Amount", type: "currency", sensitive: true, financial: true },
              { id: "settlement_amount", name: "Settlement", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "history", name: "Claim History", icon: "ri-history-line" },
        ],
      },
      {
        id: "calculator",
        name: "Liability Calculator",
        icon: "ri-calculator-line",
        tabs: [
          { id: "calculator", name: "Calculate Liability", icon: "ri-calculator-line" },
          { id: "scenarios", name: "Scenario Analysis", icon: "ri-git-branch-line" },
        ],
      },
      {
        id: "rules",
        name: "Liability Rules",
        icon: "ri-file-list-line",
        tabs: [
          { id: "list", name: "Rules List", icon: "ri-list-check" },
          { id: "create", name: "Create Rule", icon: "ri-add-line" },
          { id: "conditions", name: "Rule Conditions", icon: "ri-git-branch-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // WORKSPACE & PRODUCTIVITY MODULES
  // ==========================================================================
  {
    id: "workspace",
    name: "Workspace",
    icon: "ri-layout-line",
    description: "Intelligent User Workspace",
    category: "system",
    features: [
      {
        id: "dashboard",
        name: "Personal Workspace",
        icon: "ri-layout-line",
        tabs: [
          { id: "overview", name: "Dashboard", icon: "ri-dashboard-line" },
          { id: "widgets", name: "Widgets", icon: "ri-apps-line" },
          { id: "shortcuts", name: "Shortcuts", icon: "ri-speed-line" },
        ],
      },
      {
        id: "settings",
        name: "Workspace Settings",
        icon: "ri-settings-3-line",
        tabs: [
          { id: "layout", name: "Layout", icon: "ri-layout-grid-line" },
          { id: "themes", name: "Themes", icon: "ri-palette-line" },
          { id: "preferences", name: "Preferences", icon: "ri-user-settings-line" },
        ],
      },
      {
        id: "categories",
        name: "Categories",
        icon: "ri-folder-line",
        tabs: [
          { id: "manage", name: "Manage Categories", icon: "ri-folder-settings-line" },
          { id: "organize", name: "Organize Content", icon: "ri-layout-2-line" },
        ],
      },
    ],
  },

  {
    id: "project-management",
    name: "Project Management",
    icon: "ri-task-line",
    description: "Project Planning & Tracking",
    category: "operations",
    features: [
      {
        id: "projects",
        name: "Projects",
        icon: "ri-folder-2-line",
        tabs: [
          { id: "list", name: "Project List", icon: "ri-list-check" },
          { id: "kanban", name: "Kanban Board", icon: "ri-kanban-view" },
          { id: "gantt", name: "Gantt Chart", icon: "ri-bar-chart-horizontal-line" },
          { id: "timeline", name: "Timeline", icon: "ri-time-line" },
        ],
      },
      {
        id: "tasks",
        name: "Tasks",
        icon: "ri-checkbox-circle-line",
        tabs: [
          { id: "list", name: "Task List", icon: "ri-list-check" },
          { id: "my_tasks", name: "My Tasks", icon: "ri-user-line" },
          { id: "calendar", name: "Calendar View", icon: "ri-calendar-line" },
        ],
      },
      {
        id: "resources",
        name: "Resource Management",
        icon: "ri-team-line",
        tabs: [
          { id: "allocation", name: "Resource Allocation", icon: "ri-bar-chart-grouped-line" },
          { id: "capacity", name: "Capacity Planning", icon: "ri-line-chart-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // COMPLIANCE & REGULATORY MODULES
  // ==========================================================================
  {
    id: "customs",
    name: "Customs Management",
    icon: "ri-building-4-line",
    description: "Customs, TIR, ETIR & Regulatory Integration",
    category: "compliance",
    features: [
      {
        id: "declarations",
        name: "Customs Declarations",
        icon: "ri-file-list-line",
        tabs: [
          { id: "import", name: "Import Declarations", icon: "ri-login-box-line" },
          { id: "export", name: "Export Declarations", icon: "ri-logout-box-line" },
          { id: "transit", name: "Transit Declarations", icon: "ri-exchange-line" },
        ],
      },
      {
        id: "tir",
        name: "TIR/eTIR",
        icon: "ri-truck-line",
        tabs: [
          { id: "carnets", name: "TIR Carnets", icon: "ri-file-paper-line" },
          { id: "etir", name: "eTIR Operations", icon: "ri-file-code-line" },
          { id: "guarantees", name: "Guarantees", icon: "ri-shield-check-line" },
        ],
      },
      {
        id: "tariffs",
        name: "Tariff Management",
        icon: "ri-price-tag-3-line",
        tabs: [
          { id: "lookup", name: "HS Code Lookup", icon: "ri-search-line" },
          { id: "classification", name: "Classification", icon: "ri-list-ordered" },
          { 
            id: "duties", 
            name: "Duties & Taxes",
            icon: "ri-money-dollar-box-line",
            fields: [
              { id: "duty_amount", name: "Duty Amount", type: "currency", sensitive: true, financial: true },
              { id: "vat_amount", name: "VAT Amount", type: "currency", sensitive: true, financial: true },
              { id: "total_taxes", name: "Total Taxes", type: "currency", sensitive: true, financial: true },
            ]
          },
        ],
      },
    ],
  },

  {
    id: "compliance",
    name: "Regulatory Compliance",
    icon: "ri-shield-star-line",
    description: "Multi-jurisdiction regulatory compliance",
    category: "compliance",
    features: [
      {
        id: "regulations",
        name: "Regulations",
        icon: "ri-government-line",
        tabs: [
          { id: "library", name: "Regulation Library", icon: "ri-book-line" },
          { id: "updates", name: "Regulatory Updates", icon: "ri-notification-3-line" },
          { id: "impact", name: "Impact Analysis", icon: "ri-bar-chart-line" },
        ],
      },
      {
        id: "requirements",
        name: "Requirements",
        icon: "ri-list-check-2",
        tabs: [
          { id: "checklist", name: "Compliance Checklist", icon: "ri-checkbox-multiple-line" },
          { id: "status", name: "Compliance Status", icon: "ri-donut-chart-line" },
          { id: "gaps", name: "Gap Analysis", icon: "ri-error-warning-line" },
        ],
      },
      {
        id: "certifications",
        name: "Certifications",
        icon: "ri-award-line",
        tabs: [
          { id: "list", name: "Certification List", icon: "ri-list-check" },
          { id: "renewals", name: "Renewals", icon: "ri-refresh-line" },
          { id: "documents", name: "Documents", icon: "ri-file-copy-line" },
        ],
      },
    ],
  },

  {
    id: "export-house",
    name: "Export House License",
    icon: "ri-global-line",
    description: "SEDA Export Houses License Management",
    category: "compliance",
    premium: true,
    features: [
      {
        id: "license",
        name: "License Management",
        icon: "ri-file-shield-2-line",
        tabs: [
          { id: "dashboard", name: "License Dashboard", icon: "ri-dashboard-line" },
          { id: "application", name: "License Application", icon: "ri-file-add-line" },
          { id: "status", name: "Application Status", icon: "ri-time-line" },
        ],
      },
      {
        id: "compliance",
        name: "Compliance Tracking",
        icon: "ri-shield-check-line",
        tabs: [
          { id: "requirements", name: "Requirements", icon: "ri-list-check" },
          { id: "documents", name: "Documents", icon: "ri-file-copy-line" },
          { id: "audits", name: "Audit History", icon: "ri-history-line" },
        ],
      },
      {
        id: "business_plan",
        name: "Business Plan",
        icon: "ri-file-chart-line",
        tabs: [
          { id: "plan", name: "3-Year Business Plan", icon: "ri-file-paper-line" },
          { id: "projections", name: "Financial Projections", icon: "ri-line-chart-line" },
          { id: "milestones", name: "Milestones", icon: "ri-flag-line" },
        ],
      },
    ],
  },

  // ==========================================================================
  // IT & TECHNOLOGY MODULES
  // ==========================================================================
  {
    id: "digital-signature",
    name: "Digital Signature",
    icon: "ri-quill-pen-line",
    description: "Court-admissible digital signatures with PKI & Saudi QES",
    category: "integration",
    premium: true,
    features: [
      {
        id: "signing",
        name: "Document Signing",
        icon: "ri-edit-line",
        tabs: [
          { id: "sign", name: "Sign Document", icon: "ri-quill-pen-line" },
          { id: "pending", name: "Pending Signatures", icon: "ri-time-line" },
          { id: "completed", name: "Completed", icon: "ri-checkbox-circle-line" },
        ],
      },
      {
        id: "certificates",
        name: "Certificates",
        icon: "ri-key-2-line",
        tabs: [
          { id: "my_certs", name: "My Certificates", icon: "ri-shield-keyhole-line" },
          { id: "request", name: "Request Certificate", icon: "ri-add-line" },
          { id: "validation", name: "Validation", icon: "ri-checkbox-circle-line" },
        ],
      },
      {
        id: "verification",
        name: "Verification",
        icon: "ri-shield-check-line",
        tabs: [
          { id: "verify", name: "Verify Signature", icon: "ri-search-line" },
          { id: "chain", name: "Chain of Custody", icon: "ri-link-m" },
          { id: "audit_trail", name: "Audit Trail", icon: "ri-history-line" },
        ],
      },
    ],
  },

  {
    id: "ict-hardware-ecosystem",
    name: "ICT Hardware Ecosystem",
    icon: "ri-cpu-line",
    description: "Saudi Arabia's First Localized Digital Manufacturing Node",
    category: "operations",
    premium: true,
    features: [
      {
        id: "products",
        name: "ICT Products",
        icon: "ri-device-line",
        tabs: [
          { id: "catalog", name: "Product Catalog", icon: "ri-list-check" },
          { id: "specifications", name: "Specifications", icon: "ri-file-list-line" },
          { id: "certifications", name: "Certifications", icon: "ri-award-line" },
        ],
      },
      {
        id: "manufacturing",
        name: "Manufacturing Pipeline",
        icon: "ri-factory-line",
        tabs: [
          { id: "orders", name: "Production Orders", icon: "ri-file-list-line" },
          { id: "tracking", name: "Progress Tracking", icon: "ri-bar-chart-horizontal-line" },
          { id: "quality", name: "Quality Control", icon: "ri-checkbox-circle-line" },
        ],
      },
      {
        id: "partnerships",
        name: "Strategic Partnerships",
        icon: "ri-handshake-line",
        tabs: [
          { id: "partners", name: "Partner Directory", icon: "ri-building-line" },
          { 
            id: "agreements", 
            name: "Agreements",
            icon: "ri-file-paper-line",
            fields: [
              { id: "agreement_value", name: "Agreement Value", type: "currency", sensitive: true, financial: true },
            ]
          },
          { id: "performance", name: "Partner Performance", icon: "ri-bar-chart-line" },
        ],
      },
    ],
  },

  {
    id: "dmarc-monitoring",
    name: "DMARC Monitoring",
    icon: "ri-mail-check-line",
    description: "Email Deliverability & Domain Reputation",
    category: "system",
    features: [
      {
        id: "dashboard",
        name: "DMARC Dashboard",
        icon: "ri-dashboard-3-line",
        tabs: [
          { id: "overview", name: "Overview", icon: "ri-dashboard-line" },
          { id: "metrics", name: "Email Metrics", icon: "ri-bar-chart-box-line" },
          { id: "alerts", name: "Alerts", icon: "ri-notification-3-line" },
        ],
      },
      {
        id: "reports",
        name: "DMARC Reports",
        icon: "ri-file-chart-line",
        tabs: [
          { id: "aggregate", name: "Aggregate Reports", icon: "ri-file-list-line" },
          { id: "forensic", name: "Forensic Reports", icon: "ri-search-eye-line" },
          { id: "analysis", name: "Report Analysis", icon: "ri-bar-chart-line" },
        ],
      },
      {
        id: "reputation",
        name: "Domain Reputation",
        icon: "ri-shield-star-line",
        tabs: [
          { id: "score", name: "Reputation Score", icon: "ri-star-line" },
          { id: "blacklists", name: "Blacklist Status", icon: "ri-spam-line" },
          { id: "improvement", name: "Improvement Tips", icon: "ri-lightbulb-line" },
        ],
      },
    ],
  },

  {
    id: "external-integrations",
    name: "External Integrations",
    icon: "ri-plug-2-line",
    description: "LinkedIn, Telegram, WhatsApp, News Sites & More",
    category: "integration",
    features: [
      {
        id: "social",
        name: "Social Integrations",
        icon: "ri-share-line",
        tabs: [
          { id: "linkedin", name: "LinkedIn", icon: "ri-linkedin-box-line" },
          { id: "whatsapp", name: "WhatsApp", icon: "ri-whatsapp-line" },
          { id: "telegram", name: "Telegram", icon: "ri-telegram-line" },
        ],
      },
      {
        id: "news",
        name: "News & Media",
        icon: "ri-newspaper-line",
        tabs: [
          { id: "feeds", name: "News Feeds", icon: "ri-rss-line" },
          { id: "monitoring", name: "Media Monitoring", icon: "ri-search-line" },
          { id: "alerts", name: "News Alerts", icon: "ri-notification-3-line" },
        ],
      },
      {
        id: "erp",
        name: "ERP Connectors",
        icon: "ri-building-4-line",
        tabs: [
          { id: "sap", name: "SAP Integration", icon: "ri-database-2-line" },
          { id: "oracle", name: "Oracle Integration", icon: "ri-database-2-line" },
          { id: "erpnext", name: "ERPNext", icon: "ri-database-2-line" },
        ],
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all modules as a flat structure for permission selection
 */
export function getAllModules(): ModuleDefinition[] {
  return COMPLETE_MODULE_REGISTRY;
}

/**
 * Get module by ID
 */
export function getModuleById(moduleId: string): ModuleDefinition | undefined {
  return COMPLETE_MODULE_REGISTRY.find(m => m.id === moduleId);
}

/**
 * Get all premium modules
 */
export function getPremiumModules(): ModuleDefinition[] {
  return COMPLETE_MODULE_REGISTRY.filter(m => m.premium);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: ModuleDefinition["category"]): ModuleDefinition[] {
  return COMPLETE_MODULE_REGISTRY.filter(m => m.category === category);
}

/**
 * Count total tabs across all modules
 */
export function getTotalTabCount(): number {
  return COMPLETE_MODULE_REGISTRY.reduce((total, module) => 
    total + module.features.reduce((ftotal, feature) => 
      ftotal + feature.tabs.length, 0), 0);
}

/**
 * Get all sensitive fields
 */
export function getAllSensitiveFields(): { module: string; feature: string; tab: string; field: FieldDefinition }[] {
  const sensitiveFields: { module: string; feature: string; tab: string; field: FieldDefinition }[] = [];
  
  COMPLETE_MODULE_REGISTRY.forEach(module => {
    module.features.forEach(feature => {
      feature.tabs.forEach(tab => {
        if (tab.fields) {
          tab.fields.filter(f => f.sensitive || f.pii || f.financial).forEach(field => {
            sensitiveFields.push({ module: module.id, feature: feature.id, tab: tab.id, field });
          });
        }
      });
    });
  });
  
  return sensitiveFields;
}

export default COMPLETE_MODULE_REGISTRY;
