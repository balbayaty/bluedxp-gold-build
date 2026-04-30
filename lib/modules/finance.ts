/**
 * Financial Management Module
 * Comprehensive financial management with General Ledger, AP, AR, Budget, Cost Accounting
 * REUSES existing financial services from Marketplace, Transportation, Facility (NO DUPLICATION)
 */

import { ModuleDefinition } from './registry'

export const financeModule: ModuleDefinition = {
  id: 'finance',
  name: 'Financial Management',
  description: 'Comprehensive financial management with General Ledger, Accounts Payable/Receivable, Budget, and Cost Accounting',
  icon: '💰',
  color: '#10B981',
  category: 'other',
  version: '1.0.0',
  enabled: true,
  // Align to actual module IDs in this repo
  dependencies: ['marketplace', 'tms', 'facility-management'],
  
  routes: [
    {
      path: '/finance/dashboard',
      name: 'Financial Dashboard',
      component: 'app/finance/dashboard/page',
      icon: 'dashboard',
      requiresAuth: true,
      permissions: ['finance.dashboard'],
    },
    {
      path: '/finance/general-ledger',
      name: 'General Ledger',
      component: 'app/finance/general-ledger/page',
      icon: 'book',
      requiresAuth: true,
      permissions: ['finance.general_ledger'],
    },
    {
      path: '/finance/accounts-payable',
      name: 'Accounts Payable',
      component: 'app/finance/accounts-payable/page',
      icon: 'file-invoice-dollar',
      requiresAuth: true,
      permissions: ['finance.accounts_payable'],
    },
    {
      path: '/finance/accounts-receivable',
      name: 'Accounts Receivable',
      component: 'app/finance/accounts-receivable/page',
      icon: 'file-invoice',
      requiresAuth: true,
      permissions: ['finance.accounts_receivable'],
    },
    {
      path: '/finance/budget',
      name: 'Budget Management',
      component: 'app/finance/budget/page',
      icon: 'chart-line',
      requiresAuth: true,
      permissions: ['finance.budget'],
    },
    {
      path: '/finance/reports',
      name: 'Financial Reports',
      component: 'app/finance/reports/page',
      icon: 'file-chart-line',
      requiresAuth: true,
      permissions: ['finance.reports'],
    },
    {
      path: '/finance/cost-accounting',
      name: 'Cost Accounting',
      component: 'app/finance/cost-accounting/page',
      icon: 'calculator',
      requiresAuth: true,
      permissions: ['finance.cost_accounting'],
    },
    {
      path: '/finance/integrations',
      name: 'Financial Integrations',
      component: 'app/finance/integrations/page',
      icon: 'plug',
      requiresAuth: true,
      permissions: ['finance.integrations'],
    },
    {
      path: '/finance/fixed-assets',
      name: 'Fixed Assets',
      component: 'app/finance/fixed-assets/page',
      icon: 'building',
      requiresAuth: true,
      permissions: ['finance.fixed_assets'],
    },
    {
      path: '/finance/tax',
      name: 'Tax Management',
      component: 'app/finance/tax/page',
      icon: 'receipt',
      requiresAuth: true,
      permissions: ['finance.tax'],
    },
    {
      path: '/finance/bank-reconciliation',
      name: 'Bank Reconciliation',
      component: 'app/finance/bank-reconciliation/page',
      icon: 'university',
      requiresAuth: true,
      permissions: ['finance.bank_reconciliation'],
    },
    {
      path: '/finance/consolidation',
      name: 'Consolidation',
      component: 'app/finance/consolidation/page',
      icon: 'sitemap',
      requiresAuth: true,
      permissions: ['finance.consolidation'],
    },
    {
      path: '/finance/period-closing',
      name: 'Period Closing',
      component: 'app/finance/period-closing/page',
      icon: 'lock',
      requiresAuth: true,
      permissions: ['finance.period_closing'],
    },
    {
      path: '/finance/treasury',
      name: 'Treasury Management',
      component: 'app/finance/treasury/page',
      icon: 'wallet',
      requiresAuth: true,
      permissions: ['finance.treasury'],
    },
    {
      path: '/finance/multi-currency',
      name: 'Multi-Currency',
      component: 'app/finance/multi-currency/page',
      icon: 'coins',
      requiresAuth: true,
      permissions: ['finance.multi_currency'],
    },
    {
      path: '/finance/audit-trail',
      name: 'Audit Trail',
      component: 'app/finance/audit-trail/page',
      icon: 'history',
      requiresAuth: true,
      permissions: ['finance.audit_trail'],
    },
    {
      path: '/finance/fpa',
      name: 'Financial Planning & Analysis',
      component: 'app/finance/fpa/page',
      icon: 'chart-bar',
      requiresAuth: true,
      permissions: ['finance.fpa'],
    },
  ],

  services: [
    {
      name: 'General Ledger Service',
      path: 'lib/services/finance/generalLedgerService',
      description: 'Core GL functionality with journal entries and account balances',
    },
    {
      name: 'Accounts Payable Service',
      path: 'lib/services/finance/accountsPayableService',
      description: 'AP management reusing invoices from Marketplace, Transportation, Facility',
    },
    {
      name: 'Accounts Receivable Service',
      path: 'lib/services/finance/accountsReceivableService',
      description: 'AR management reusing invoices from Marketplace and WMS sales orders',
    },
    {
      name: 'Financial Reporting Service',
      path: 'lib/services/finance/financialReportingService',
      description: 'P&L, Balance Sheet, Cash Flow, and custom reports',
    },
    {
      name: 'Budget Service',
      path: 'lib/services/finance/budgetService',
      description: 'Budget planning and variance analysis',
    },
    {
      name: 'Cost Accounting Service',
      path: 'lib/services/finance/costAccountingService',
      description: 'Cost centers, cost allocation, and product costing',
    },
    {
      name: 'Unified Finance Integration Service',
      path: 'lib/services/finance/integration/unifiedFinanceService',
      description: 'Central hub aggregating financial data from all modules',
    },
  ],

  features: [
    {
      id: 'finance.general_ledger',
      name: 'General Ledger',
      description: 'Journal entries, account balances, trial balance',
      enabled: true,
    },
    {
      id: 'finance.accounts_payable',
      name: 'Accounts Payable',
      description: 'Vendor invoice management and payment tracking',
      enabled: true,
    },
    {
      id: 'finance.accounts_receivable',
      name: 'Accounts Receivable',
      description: 'Customer invoice management and collection tracking',
      enabled: true,
    },
    {
      id: 'finance.budget',
      name: 'Budget Management',
      description: 'Budget planning, tracking, and variance analysis',
      enabled: true,
    },
    {
      id: 'finance.reports',
      name: 'Financial Reports',
      description: 'P&L, Balance Sheet, Cash Flow, and custom reports',
      enabled: true,
    },
    {
      id: 'finance.cost_accounting',
      name: 'Cost Accounting',
      description: 'Cost centers, cost allocation, and product costing',
      enabled: true,
    },
    {
      id: 'finance.integrations',
      name: 'Financial Integrations',
      description: 'Integration with Marketplace, Transportation, Facility, HR, WMS, TMS',
      enabled: true,
    },
    {
      id: 'finance.fixed_assets',
      name: 'Fixed Assets Accounting',
      description: 'Asset register, depreciation, disposal, asset lifecycle',
      enabled: true,
    },
    {
      id: 'finance.tax',
      name: 'Tax Management',
      description: 'VAT, Income Tax, ZATCA compliance, tax calculations, tax returns',
      enabled: true,
    },
    {
      id: 'finance.bank_reconciliation',
      name: 'Bank Reconciliation',
      description: 'Bank statement import, transaction matching, reconciliation',
      enabled: true,
    },
    {
      id: 'finance.consolidation',
      name: 'Financial Consolidation',
      description: 'Multi-entity consolidation, intercompany eliminations',
      enabled: true,
    },
    {
      id: 'finance.period_closing',
      name: 'Period End Closing',
      description: 'Closing procedures, period locks, closing entries',
      enabled: true,
    },
    {
      id: 'finance.treasury',
      name: 'Treasury Management',
      description: 'Cash management, bank accounts, cash forecasting, liquidity analysis',
      enabled: true,
    },
    {
      id: 'finance.multi_currency',
      name: 'Multi-Currency Accounting',
      description: 'Multi-currency GL, FX revaluation, currency translation',
      enabled: true,
    },
    {
      id: 'finance.audit_trail',
      name: 'Audit Trail',
      description: 'Detailed audit logs, change tracking, compliance reporting',
      enabled: true,
    },
    {
      id: 'finance.fpa',
      name: 'Financial Planning & Analysis',
      description: 'Forecasting, planning, scenario analysis, variance analysis',
      enabled: true,
    },
  ],

  integrations: [
    {
      module: 'marketplace',
      type: 'financial',
      description: 'Reuses Marketplace payment and invoice services',
      enabled: true,
    },
    {
      module: 'transportation',
      type: 'financial',
      description: 'Reuses Transportation financial management service',
      enabled: true,
    },
    {
      module: 'facility',
      type: 'financial',
      description: 'Reuses Facility utility bill service',
      enabled: true,
    },
    {
      module: 'hr',
      type: 'financial',
      description: 'Integrates with HR payroll for GL entries',
      enabled: true,
    },
    {
      module: 'wms',
      type: 'financial',
      description: 'Integrates with WMS for inventory costs and sales orders',
      enabled: true,
    },
    {
      module: 'tms',
      type: 'financial',
      description: 'Integrates with TMS for freight costs',
      enabled: true,
    },
  ],

  config: {
    autoPostToGL: true,
    defaultCurrency: 'SAR',
    fiscalYearStart: { month: 1, day: 1 },
    enableBudgetTracking: true,
    enableCostAccounting: true,
  },
}






