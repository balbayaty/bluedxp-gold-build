# BlueDXP Platform

<div align="center">

**World's Most Intelligent Chemical Safety & Warehouse Management Platform**

> هازالايز - منصة إدارة المخازن والسلامة الكيميائية الأكثر ذكاءً في العالم

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Enterprise-Grade • AI-Powered • Multi-Tenant • Saudi Arabia Compliant**

</div>

---

## ⚡ Quick Start

**New to this?** → [README_FIRST.md](./README_FIRST.md) or [FIRST_STEPS.md](./FIRST_STEPS.md) ⭐  
**Have experience?** → [START_HERE.md](./START_HERE.md)  
**Just want commands?** → [README_QUICK_START.md](./README_QUICK_START.md)

**Status**: ✅ **100% COMPLETE** - Everything is ready to use!

---

---

## 🎯 Overview

BlueDXP is a comprehensive, AI-powered warehouse management system (WMS) designed for 3PL/4PL providers. Built with enterprise-grade architecture, it features intelligent automation, real-time analytics, and full compliance with Saudi Arabia regulations.

### ⚡ Quick Start

**New to this?** → [README_FIRST.md](./README_FIRST.md) or [FIRST_STEPS.md](./FIRST_STEPS.md) ⭐  
**Have experience?** → [START_HERE.md](./START_HERE.md)  
**Just want commands?** → [README_QUICK_START.md](./README_QUICK_START.md)

### Key Highlights

- **97+ Pages** of comprehensive warehouse management functionality
- **AI Copilot** built-in for intelligent assistance and automation
- **Multi-tenant** architecture supporting multiple customers
- **Real-time** tracking, analytics, and reporting
- **Saudi Arabia** compliance and full Arabic localization
- **Enterprise-ready** security and scalability

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript 5.2 |
| **UI Framework** | React 18.2 |
| **Styling** | Tailwind CSS 3.3 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **AI/ML** | OpenAI GPT-4, Anthropic Claude |
| **State Management** | React Context + Custom Hooks |
| **Icons** | Remix Icons |
| **Database** | PostgreSQL 15 + pgvector |
| **Cache** | Redis 7 |
| **Message Queue** | RabbitMQ 3, Apache Kafka |
| **Object Storage** | MinIO |
| **Search** | OpenSearch |
| **Observability** | Loki, Prometheus, Grafana, Jaeger |
| **Secrets** | HashiCorp Vault |
| **Batch Processing** | Apache Airflow |
| **MLOps** | MLflow |

### Architecture Principles

- **Modular Design**: Plugin-based architecture for easy extension
- **Type Safety**: Full TypeScript coverage
- **Performance**: Server-side rendering, code splitting, lazy loading
- **Security**: Role-based access control, encrypted data, secure APIs
- **Scalability**: Multi-tenant, horizontal scaling ready

---

## 📋 Features

### Core Modules

#### Warehouse Operations
- **Inbound Operations**: ASN processing, receiving, quality gates
- **Outbound Operations**: Order fulfillment, shipping, POD
- **Putaway**: Intelligent storage location assignment
- **Picking**: Multiple strategies (FIFO, FEFO, LIFO)
- **Cross-Docking**: Direct transfer operations

#### Performance & Analytics
- **Unified SLA/KPI Service** ⭐ NEW: World-class SLA/KPI tracking across all modules
  - Real-time compliance monitoring
  - Predictive breach detection
  - Multi-party supply chain support
  - Global standards compliant (SCOR, ISO, APICS/ASCM)
  - See: `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md`

#### Inventory Management
- **Stock Overview**: Real-time inventory tracking
- **Batch Management**: Expiry tracking, FEFO/LIFO
- **Serial Numbers**: Individual item tracking
- **ABC Analysis**: Automated classification
- **Cycle Counting**: Inventory accuracy

#### Order Management
- **Purchase Orders**: Full PO lifecycle
- **Sales Orders**: Order processing and fulfillment
- **Wave Planning**: Intelligent order batching
- **Load Planning**: Vehicle optimization

#### Quality Management
- **Inspection Lots**: Quality control workflows
- **NCR Management**: Non-conformance tracking
- **Certificates**: Document management
- **Damage Reports**: Incident tracking

#### Transportation
- **Shipment Tracking**: Real-time location tracking
- **Route Optimization**: AI-powered routing
- **Carrier Management**: Multi-carrier support
- **POD Management**: Proof of delivery

#### Intelligent Orchestration
- **Process Mining**: Real-time process discovery
- **Root Cause Analysis**: AI-powered problem diagnosis
- **Predictive Analytics**: ML-based forecasting
- **Automated Insights**: AI-generated recommendations
- **Compliance Monitoring**: Autonomous compliance checking

### AI Features

- 🤖 **AI Copilot**: Natural language interface for all operations
- 🔮 **Predictive Analytics**: ML models for demand forecasting
- 🎯 **Anomaly Detection**: Automatic issue identification
- 🔍 **Root Cause Analysis**: AI-powered problem solving
- 💡 **Automated Insights**: Intelligent recommendations
- 📊 **Smart Analytics**: Context-aware data analysis

---

## 🛠️ Development

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Git**: Latest version

### Quick Start

**New to this?** 
- **No Programming Experience?** → [FIRST_STEPS.md](./FIRST_STEPS.md) ⭐
- **Have Experience?** → [START_HERE.md](./START_HERE.md)
- **Just Want Commands?** → [README_QUICK_START.md](./README_QUICK_START.md)

**Or follow these steps:**

1. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR-ORG/hazalyze-platform.git
   cd hazalyze-platform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**

   This repo includes a starter template at `env.example` (note: **no leading dot**).

   If you prefer an even smaller local-only template, you can use `env.local.template`.

   **macOS/Linux:**
   ```bash
   cp env.example .env.local
   ```

   **Windows PowerShell:**
   ```powershell
   Copy-Item env.example .env.local
   ```

   **Windows PowerShell (using `env.local.template`):**
   ```powershell
   Copy-Item env.local.template .env.local
   ```

   Then edit `.env.local` and paste your API keys and configuration values.

4. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

5. **Run Database Migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Initialize Services**
   ```bash
   npm run init:services
   ```

7. **Run Development Server**
   ```bash
   npm run dev
   ```

8. **Open Browser**
   Navigate to `http://localhost:3002`
   
   **Service URLs:**
   - Application: http://localhost:3002
   - Grafana: http://localhost:3001
   - Prometheus: http://localhost:9090
   - Jaeger: http://localhost:16686
   - OpenSearch Dashboards: http://localhost:5601
   - MinIO Console: http://localhost:9001

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3002) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run init:services` | Initialize all infrastructure services |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

### Project Structure

```
hazalyze-platform/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Role-based dashboards
│   ├── inventory/         # Inventory management
│   ├── orders/           # Order management
│   └── ...
├── components/            # React components
│   ├── business-intelligence/
│   ├── intelligent-orchestration/
│   └── ...
├── contexts/              # React contexts
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
│   ├── aiClient.ts      # AI integration
│   ├── mlModels.ts      # ML models
│   └── ...
├── data/                 # Mock data and generators
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## 🔒 Security

### Security Features

- ✅ **Environment Variables**: All secrets in `.env.local` (never committed)
- ✅ **API Key Protection**: Secure storage and validation
- ✅ **Authentication**: Role-based access control (RBAC)
- ✅ **Data Encryption**: Encrypted data transmission
- ✅ **Input Validation**: All user inputs validated
- ✅ **Dependency Scanning**: Regular security audits

### Security Best Practices

1. **Never commit secrets** - Use `.env.local` for all API keys
2. **Enable 2FA** - On GitHub and all service accounts
3. **Regular updates** - Keep dependencies updated
4. **Code reviews** - All code reviewed before merge
5. **Access control** - Limit repository access

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

---

## 🌍 Localization

### Supported Languages

- 🇬🇧 **English** (Primary)
- 🇸🇦 **Arabic** (Full RTL support)
- 🇵🇰 **Urdu**
- 🇦🇫 **Pashto**

### Regional Features

- **Currency**: SAR (Saudi Riyal) default
- **Date Format**: Regional preferences
- **Compliance**: Saudi Arabia regulations
- **Time Zones**: Middle East time zones

---

## 📦 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker (Coming Soon)

```bash
docker-compose up --build
```

### Kubernetes (Enterprise)

See `docs/deployment/kubernetes.md` for K8s deployment guides.

---

## 📚 Documentation

### Core Documentation

**Getting Started:**
- [START_HERE.md](./START_HERE.md) - **Start here!** Complete getting started guide
- [QUICK_START.md](./QUICK_START.md) - 5-minute quick start guide
- [docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md) - Complete documentation index
- [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) - Quick reference guide

**Infrastructure & Deployment:**
- [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) - Complete infrastructure overview
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Production deployment guide
- [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) - Deployment checklist

**API & Integration:**
- [docs/API.md](./docs/API.md) - Complete API documentation
- [docs/API_EXAMPLES.md](./docs/API_EXAMPLES.md) - API usage examples
- [docs/INTEGRATION_EXAMPLES.md](./docs/INTEGRATION_EXAMPLES.md) - Service integration examples

**Operations & Compliance:**
- [docs/MONITORING.md](./docs/MONITORING.md) - Monitoring and observability
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Testing procedures
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Troubleshooting guide
- [docs/SAUDI_COMPLIANCE.md](./docs/SAUDI_COMPLIANCE.md) - Saudi Arabia compliance

**Configuration & Architecture:**
- [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) - Environment variables reference
- [docs/ARCHITECTURE_DECISIONS.md](./docs/ARCHITECTURE_DECISIONS.md) - Architecture decision records

**Other:**
- [Security Guidelines](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)

### Module Documentation

- [Intelligent Orchestration](./docs/modules/INTELLIGENT_ORCHESTRATION.md)
- [Multi-Tenant Architecture](./docs/modules/MULTI_TENANT.md)
- [AI Integration](./docs/modules/AI_INTEGRATION.md)

---

## 🤝 Contributing

This is an enterprise repository. For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Development Workflow

1. Create feature branch from `main`
2. Make changes with proper tests
3. Submit pull request
4. Code review required
5. Merge after approval

---

## 📊 Project Status

- ✅ **Core WMS**: 97+ pages implemented
- ✅ **AI Copilot**: Integrated and functional
- ✅ **Multi-Tenant**: Architecture complete
- ✅ **Database**: PostgreSQL + pgvector fully integrated
- ✅ **Infrastructure**: 30+ services fully implemented
- ✅ **Observability**: Complete monitoring stack (Loki, Prometheus, Grafana, Jaeger)
- ✅ **Saudi Compliance**: All 17 government APIs integrated
- ✅ **DevOps**: CI/CD, Terraform, Helm charts ready
- ✅ **Deployment**: Docker & Kubernetes ready

---

## 📄 License

Proprietary - All Rights Reserved

© 2025 BlueDXP. Confidential and Proprietary.

---

## 🔗 Links

- **Platform**: [Hazalyze.com](https://hazalyze.com) (Coming Soon)
- **Documentation**: `/docs` folder
- **Support**: support@hazalyze.com

---

<div align="center">

**Built with ❤️ for intelligent warehouse management**

*Enterprise-Grade • AI-Powered • Future-Ready*

</div>
