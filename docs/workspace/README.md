# Workspace Module - BlueDXP Platform

**Intelligent, Dynamic User Workspace System**

The Workspace module provides users with a fully customizable, intelligent workspace featuring dynamic widgets, flexible layouts, and seamless integrations with Google Workspace and email providers.

## 🚀 Quick Start

```bash
# Run migration and seed data
npm run migrate:workspace

# Start development server
npm run dev

# Navigate to /workspace
```

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[User Guide](./USER_GUIDE.md)** - How to use the workspace
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - How to extend the workspace
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Database migration instructions
- **[Verification Checklist](./VERIFICATION_CHECKLIST.md)** - Verify your setup
- **[Completion Summary](./COMPLETION_SUMMARY.md)** - Full implementation details
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Technical details

## ✨ Features

### 🎯 Dynamic Widget System
- 14 default categories (Metrics, Analytics, Operations, Compliance, etc.)
- 10+ pre-built widgets ready to use
- Fully configurable and customizable
- Permission-based visibility
- Real-time data refresh

### 📐 Flexible Layouts
- Multiple layouts per user
- Drag & drop widget positioning
- Resizable widgets
- Save/load layouts
- Template support
- Default layout per user

### 🔗 External Integrations
- **Google Workspace**: Calendar, Drive, Gmail, Tasks, Contacts
- **Email**: IMAP, POP3, OAuth providers (Gmail, Outlook)
- OAuth 2.0 authentication
- Automatic token refresh
- Secure credential storage

### 🤖 AI-Powered Personalization
- Widget recommendations based on usage
- Layout suggestions
- Usage analytics
- Learning from user behavior
- Context-aware insights

### 🏢 Enterprise-Ready
- Multi-tenant support
- RBAC integration (11 roles)
- Permission scopes (ALL, ASSIGNED_CUSTOMERS, etc.)
- Audit logging
- Analytics tracking
- Subscription tier support

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Prisma CLI

### Steps

1. **Run Migration**
   ```bash
   npm run migrate:workspace
   ```

2. **Configure Environment** (Optional)
   ```env
   # For Google Workspace Integration
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3002/workspace/integrations/google/callback"
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Access Workspace**
   Navigate to: `http://localhost:3002/workspace`

## 🏗️ Architecture

### Database Models
- `WidgetCategory` - Widget categories
- `WidgetDefinition` - Widget definitions
- `WorkspaceLayout` - User layouts
- `UserWidget` - Widget instances
- `GoogleWorkspaceIntegration` - Google OAuth
- `EmailIntegration` - Email accounts
- `WorkspaceAnalytics` - Usage analytics

### Service Layer
- `workspaceService` - Core orchestration
- `widgetService` - Widget management
- `categoryService` - Category management
- `layoutService` - Layout operations
- `personalizationService` - AI features
- `googleWorkspaceService` - Google integration
- `emailService` - Email integration

### API Routes
- `/api/v1/workspace/config` - Configuration
- `/api/v1/workspace/layouts` - Layout management
- `/api/v1/workspace/widgets` - Widget data
- `/api/v1/workspace/categories` - Categories
- `/api/v1/workspace/integrations/*` - Integrations
- `/api/v1/workspace/analytics` - Analytics

## 🎨 UI Components

- `WorkspaceContainer` - Main container
- `WorkspaceGrid` - Responsive grid (react-rnd)
- `WorkspaceToolbar` - Toolbar actions
- `WidgetLibrary` - Widget browser
- `WorkspaceWidget` - Base widget
- `WidgetRenderer` - Type renderer
- `WorkspaceSettings` - Settings panel

## 🔒 Security

- Authentication required for all routes
- RBAC permission checks
- Tenant isolation enforced
- Input validation & sanitization
- Encrypted token storage
- Audit logging

## 📊 Widget Types

- `METRIC_CARD` - Key metrics
- `PROGRESS_CARD` - Progress indicators
- `LINE_CHART` - Line charts
- `PIE_CHART` - Pie charts
- `BAR_CHART` - Bar charts
- `ACTIVITY_FEED` - Activity streams
- `CALENDAR_WIDGET` - Calendar events
- `EMAIL_LIST` - Email inbox
- `TABLE` - Data tables
- `CUSTOM` - Custom widgets

## 🔧 Configuration

### Widget Categories
- System categories (14): Cannot be deleted
- Custom categories: Tenant-specific

### Widget Definitions
- Multiple data sources (API, integration, calculation)
- Configurable refresh intervals
- Permission requirements
- Module associations

### Layouts
- User-specific layouts
- Default layout per user
- Template layouts
- Category-based organization

## 🧪 Testing

```bash
# Run tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration
```

## 📝 Scripts

```bash
# Migration
npm run migrate:workspace          # Windows
npm run migrate:workspace:unix      # Linux/Mac

# Seeding
npm run seed:workspace             # Seed categories & widgets

# Prisma
npm run prisma:generate             # Generate Prisma client
npm run prisma:migrate              # Run migrations
npm run prisma:studio               # Open Prisma Studio
```

## 🐛 Troubleshooting

See [Verification Checklist](./VERIFICATION_CHECKLIST.md) for common issues and solutions.

## 📞 Support

- Check documentation in `docs/workspace/`
- Review [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- Check test files for usage examples

## 🎉 Status

**✅ COMPLETE & READY FOR PRODUCTION**

All implementation phases completed:
- ✅ Database schema
- ✅ Service layer
- ✅ API routes
- ✅ UI components
- ✅ Module registration
- ✅ Testing
- ✅ Documentation
- ✅ Performance optimization
- ✅ Security & compliance

---

**Module Version**: 1.0.0  
**Platform**: BlueDXP (Hazalyze Module)  
**Last Updated**: January 2025
