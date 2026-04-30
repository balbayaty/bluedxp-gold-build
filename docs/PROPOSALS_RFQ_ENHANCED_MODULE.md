# Enhanced Proposals & RFQ Module

## Overview

The Enhanced Proposals & RFQ Module is a fully integrated, intelligent system for creating, managing, and tracking proposals and RFQs. It features RAG-powered content generation, automated approval workflows, benchmarking, self-learning capabilities, and world-class document exports.

## Key Features

### 1. RAG-Powered Proposal Generation
- **Intelligent Content Suggestions**: Uses Knowledge Base semantic search to enhance proposals with relevant insights
- **Context-Aware**: Automatically pulls best practices, success patterns, and industry knowledge
- **Self-Improving**: Learns from successful proposals and stores patterns in Knowledge Base

### 2. Approval Workflow Integration
- **Multi-Level Approvals**: Configurable approval workflows with role-based approvers
- **Auto-Approval**: Smart auto-approval based on configurable conditions (e.g., amount thresholds)
- **Escalation**: Automatic escalation for timeouts
- **Notifications**: Integrated with notification service for approver alerts

### 3. Auto-Send Capabilities
- **Automated Sending**: Send proposals automatically after approval
- **Email Integration**: Full email integration with tracking
- **Recipient Management**: Multiple recipients with role-based access
- **Tracking**: Open/click tracking for sent proposals

### 4. Enhanced Export Service
- **Multiple Formats**: PDF, DOCX, XLSX, HTML exports
- **Advanced PDF Features**:
  - Professional cover pages with branding
  - Table of contents
  - Charts and visualizations (placeholders for chart libraries)
  - Watermarks and password protection
  - Interactive elements
  - Custom sections
- **Branding**: Full customization of colors, logos, footers
- **Professional Layout**: Industry-standard document formatting

### 5. Benchmarking & Analytics
- **Performance Metrics**: Track response time, win rate, conversion rate, pricing competitiveness
- **Industry Comparisons**: Compare against industry benchmarks
- **Historical Analysis**: Compare against historical performance
- **Recommendations**: AI-powered recommendations for improvement
- **Analytics Dashboard**: Comprehensive analytics for proposal performance

### 6. Self-Learning System
- **Pattern Recognition**: Learns from proposal outcomes (won/lost)
- **Knowledge Storage**: Stores successful patterns in Knowledge Base for future RAG
- **Feedback Integration**: Incorporates customer feedback into learning
- **Continuous Improvement**: Automatically improves proposal quality over time

### 7. Full Ecosystem Integration
- **Event Bus**: Publishes/subscribes to events for cross-module communication
- **Knowledge Base**: RAG integration for intelligent content
- **Notifications**: Email/SMS notifications for all key events
- **Compliance**: Integrated with governance/approval system
- **CRM**: Can integrate with CRM for customer data
- **WMS/TMS**: Can pull data from warehouse/transportation modules

## Architecture

### Services

1. **EnhancedProposalService** (`lib/services/proposals/enhancedProposalService.ts`)
   - Main service for proposal operations
   - RAG integration
   - Approval workflow management
   - Auto-send functionality
   - Self-learning

2. **EnhancedExportService** (`lib/services/proposals/enhancedExportService.ts`)
   - Advanced document generation
   - Multiple format support
   - Branding customization
   - Professional layouts

3. **ProposalApprovalService** (`lib/services/proposals/proposalApprovalService.ts`)
   - Approval workflow management
   - Multi-level approvals
   - Auto-approval logic
   - Escalation handling

4. **ProposalBenchmarkingService** (`lib/services/proposals/proposalBenchmarkingService.ts`)
   - Performance tracking
   - Benchmark generation
   - Analytics calculation
   - Recommendations

### API Endpoints

1. **POST /api/proposals/enhanced**
   - Create proposal with RAG
   - Submit for approval
   - Auto-send options

2. **GET /api/proposals/enhanced**
   - List proposals with filters

3. **PUT /api/proposals/enhanced**
   - Update proposal

4. **DELETE /api/proposals/enhanced**
   - Delete proposal (draft only)

5. **POST /api/proposals/[id]/export**
   - Export proposal in various formats
   - Enhanced formatting options

6. **GET /api/proposals/[id]/benchmark**
   - Get benchmark analysis
   - Performance metrics

7. **POST /api/proposals/[id]/learn**
   - Learn from proposal outcome
   - Store patterns in Knowledge Base

## Usage Examples

### Create Proposal with RAG

```typescript
const proposal = await enhancedProposalService.generateProposalWithRAG({
  proposalType: 'QUOTE_PROPOSAL',
  sourceData: {
    quote: quoteData,
    shipment: shipmentData,
  },
  templateId: 'standard-template',
  branding: {
    companyName: 'BlueDXP',
    primaryColor: '#3B82F6',
  },
}, {
  useRAG: true,
  ragContext: 'Logistics proposal for GCC region',
  tenantId: 'tenant-123',
})
```

### Submit for Approval

```typescript
const approvalId = await enhancedProposalService.submitForApproval(
  proposalId,
  {
    workflowId: 'standard-proposal-approval',
    autoApprove: false,
    autoApproveConditions: {
      totalAmount: { $lt: 10000 },
    },
  }
)
```

### Auto-Send Proposal

```typescript
const result = await enhancedProposalService.sendProposal(proposalId, {
  recipients: [
    { email: 'customer@example.com', name: 'John Doe', role: 'Decision Maker' },
  ],
  subject: 'Proposal: Logistics Services',
  attachments: true,
  trackOpens: true,
  trackClicks: true,
})
```

### Export with Enhanced Formatting

```typescript
const exportResult = await enhancedExportService.export({
  proposal: proposalData,
  format: 'PDF',
  options: {
    includeCharts: true,
    tableOfContents: true,
    branding: {
      logo: 'https://example.com/logo.png',
      primaryColor: '#3B82F6',
      companyName: 'BlueDXP',
    },
    watermark: 'CONFIDENTIAL',
  },
})
```

### Generate Benchmark

```typescript
const benchmark = await proposalBenchmarkingService.generateBenchmark(proposalId)
// Returns: pricing competitiveness, win rate, recommendations, etc.
```

### Learn from Outcome

```typescript
await enhancedProposalService.learnFromOutcome(
  proposalId,
  'WON', // or 'LOST'
  'Customer appreciated the comprehensive pricing breakdown and quick response time'
)
```

## Integration Points

### Event Bus Events

**Published Events:**
- `proposals.proposal.created`
- `proposals.proposal.updated`
- `proposals.proposal.submitted-for-approval`
- `proposals.proposal.auto-approved`
- `proposals.proposal.approval.approved`
- `proposals.proposal.approval.rejected`
- `proposals.proposal.sent`
- `proposals.proposal.learned`

**Subscribed Events:**
- `proposals-rfq.rfq.created`
- `proposals-rfq.rfq.submitted`
- `compliance.approval.approved`
- `compliance.approval.rejected`
- `knowledge-base.entry.created`

### Knowledge Base Integration

- **RAG Queries**: Semantic search for proposal content enhancement
- **Pattern Storage**: Stores successful/failed proposal patterns
- **Best Practices**: Retrieves industry best practices
- **Historical Data**: Accesses historical proposal performance data

### Notification Integration

- **Approval Notifications**: Alerts approvers of pending approvals
- **Send Confirmations**: Confirms proposal sending
- **Status Updates**: Notifies stakeholders of proposal status changes

## Configuration

### Approval Workflows

Default workflows are defined in `ProposalApprovalService`:
- `standard-proposal-approval`: Standard workflow for most proposals
- `high-value-proposal-approval`: Multi-level approval for high-value proposals
- `rfq-approval`: Workflow for RFQ approvals

Custom workflows can be registered:

```typescript
proposalApprovalService.registerWorkflow({
  id: 'custom-workflow',
  name: 'Custom Workflow',
  description: 'Custom approval workflow',
  entityType: 'PROPOSAL',
  steps: [...],
  autoApproveConditions: {...},
})
```

## Future Enhancements

1. **UI Components**: Modern, sexy UI components for proposal builder
2. **Chart Integration**: Real chart libraries (Chart.js, D3.js) for visualizations
3. **Digital Signatures**: DocuSign/Adobe Sign integration
4. **Advanced Analytics**: ML-powered predictions and recommendations
5. **Template Marketplace**: Shareable proposal templates
6. **Collaborative Editing**: Real-time collaborative proposal editing
7. **Version Control**: Full version history and comparison
8. **A/B Testing**: Test different proposal variations

## Best Practices

1. **Use RAG**: Always enable RAG for better proposal quality
2. **Track Outcomes**: Learn from every proposal outcome
3. **Benchmark Regularly**: Generate benchmarks to identify improvement areas
4. **Customize Branding**: Use consistent branding across all proposals
5. **Monitor Metrics**: Track key metrics (win rate, response time, etc.)
6. **Optimize Workflows**: Adjust approval workflows based on business needs
7. **Leverage Knowledge Base**: Continuously feed successful patterns into Knowledge Base

## Security

- **Approval Required**: Proposals require approval before sending (configurable)
- **Access Control**: Role-based access control for proposal operations
- **Audit Trail**: All proposal operations are logged via Event Store
- **Data Encryption**: Sensitive proposal data is encrypted
- **Watermarking**: Optional watermarks for confidential proposals

## Performance

- **Caching**: Proposal data is cached for fast retrieval
- **Async Processing**: Heavy operations (RAG, exports) are async
- **Batch Operations**: Support for batch proposal operations
- **Optimized Exports**: PDF generation is optimized for performance

## Support

For issues or questions, refer to:
- Module documentation: `docs/PROPOSALS_RFQ_ENHANCED_MODULE.md`
- API documentation: API routes in `app/api/proposals/`
- Service documentation: Service files in `lib/services/proposals/`



