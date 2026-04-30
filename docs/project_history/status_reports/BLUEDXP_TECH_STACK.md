# 🔧 BlueDXP Platform - Detailed Tech Stack

**Platform:** BlueDXP (Enterprise Intelligence Operating System)  
**Module:** Hazalyze ASN Module  
**Last Updated:** January 2025

---

## 📊 **TECH STACK OVERVIEW**

### **Core Framework & Runtime**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.3 | Full-stack React framework with App Router |
| **React** | 18.2.0 | UI library for building components |
| **TypeScript** | 5.2.0 | Type-safe JavaScript |
| **Node.js** | 20.x+ | Runtime environment |
| **npm** | 9.x+ | Package manager |

---

## 🎨 **FRONTEND LAYER**

### **UI Framework & Styling**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.3.5 | Utility-first CSS framework |
| **PostCSS** | 8.4.31 | CSS processor |
| **Autoprefixer** | 10.4.16 | CSS vendor prefixing |
| **@tailwindcss/postcss** | 4.1.17 | Tailwind PostCSS plugin |

### **Animation & Motion**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Framer Motion** | 10.16.0 | Animation library for React |
| **GSAP** | 3.13.0 | Advanced animation library |
| **Lottie React** | 2.4.1 | Lottie animations for React |

### **3D Graphics & Visualization**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | 0.182.0 | 3D graphics library |
| **@react-three/fiber** | 9.4.2 | React renderer for Three.js |
| **@react-three/drei** | 10.7.7 | Useful helpers for React Three Fiber |

### **Data Visualization & Charts**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.10.0 | Composable charting library |
| **Chart.js** | 4.5.1 | Chart library |
| **react-chartjs-2** | 5.3.1 | React wrapper for Chart.js |
| **D3** | 7.9.0 | Data visualization library |
| **@types/d3** | 7.4.3 | TypeScript types for D3 |

### **Icons & UI Components**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Remix Icons** | 3.5.0 | Icon library |
| **remixicon-react** | 1.0.0 | React components for Remix Icons |
| **clsx** | 2.0.0 | Utility for constructing className strings |

### **File Handling & Media**

| Technology | Version | Purpose |
|------------|---------|---------|
| **react-dropzone** | 14.3.8 | File upload with drag & drop |
| **react-player** | 2.13.0 | Video player component |
| **pdf-parse** | 2.4.5 | PDF parsing library |
| **jsPDF** | 3.0.3 | PDF generation |
| **jspdf-autotable** | 5.0.2 | Table plugin for jsPDF |

### **Utilities**

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 2.30.0 | Date utility library |
| **uuid** | 9.0.0 | UUID generation |
| **@types/uuid** | 10.0.0 | TypeScript types for UUID |
| **react-error-boundary** | 4.0.0 | Error boundary component |

---

## 🔧 **BACKEND LAYER**

### **API & Server**

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Server-side API endpoints |
| **Next.js Middleware** | Request/response middleware |
| **Custom API Gateway** | API routing and versioning |

### **State Management**

| Technology | Purpose |
|------------|---------|
| **React Context API** | Global state management |
| **Custom Hooks** | Reusable state logic |
| **View Context Provider** | Multi-tenant view filtering |

### **Authentication & Authorization**

| Technology | Purpose |
|------------|---------|
| **Custom AuthContext** | Authentication system |
| **Role-Based Access Control (RBAC)** | 11 different user roles |
| **Multi-Tenant Isolation** | Tenant-level data segregation |

---

## 🤖 **AI & MACHINE LEARNING**

### **AI Services**

| Service | Provider | Purpose |
|---------|----------|---------|
| **OpenAI GPT-4** | OpenAI | Primary LLM for AI Copilot |
| **Anthropic Claude 3.5** | Anthropic | Alternative LLM provider |
| **AI Vision Service** | Custom | Document/image analysis |
| **Chemical Vision Service** | Custom | Chemical safety document analysis |
| **Video Analysis Service** | Custom | Video content analysis |

### **ML Services**

| Service | Location | Purpose |
|---------|----------|---------|
| **SDS Parser** | `lib/services/ml/sds-parser.ts` | Safety Data Sheet parsing |
| **Risk Assessment** | `lib/services/ml/risk-assessment.ts` | Risk calculation |
| **Hazard Prediction** | `lib/services/ml/hazard-prediction.ts` | Hazard forecasting |
| **Chemical Compatibility** | `lib/services/ml/chemical-compatibility.ts` | Compatibility analysis |
| **Predictive Maintenance** | `lib/services/ml/predictive-maintenance.ts` | Maintenance forecasting |

### **AI Infrastructure**

| Component | Purpose |
|-----------|---------|
| **AI Client** (`utils/aiClient.ts`) | Unified LLM interface |
| **Agent Orchestrator** | Multi-agent workflow management |
| **Knowledge Base** | Vector embeddings & semantic search |
| **ML Model Registry** | Model versioning & management |
| **Agent Memory** | Learning from patterns |

---

## 🗄️ **DATA & STORAGE**

### **Database (To Be Integrated)**

| Technology | Status | Purpose |
|------------|--------|---------|
| **Firebase** | ✅ Configured | Real-time database & storage |
| **PostgreSQL** | 🚧 Planned | Primary relational database |
| **MongoDB** | 🚧 Planned | Document storage |

### **Data Services**

| Service | Purpose |
|---------|---------|
| **Event Store** | CQRS & Event Sourcing |
| **Event Bus** | Microservices communication |
| **Evidence Service** | Document/file evidence management |
| **Entity Graph Service** | Relationship management |

---

## 🔗 **INTEGRATION & CONNECTIVITY**

### **External Integrations**

| Integration | Status | Purpose |
|-------------|--------|---------|
| **ERPNext API** | ✅ Integrated | ERP system integration |
| **EDI (Electronic Data Interchange)** | ✅ Supported | Standard data exchange |
| **Webhook Support** | ✅ Implemented | Real-time notifications |
| **API Gateway** | ✅ Implemented | API routing & versioning |
| **IoT Manager** | ✅ Implemented | IoT device connectivity |

### **Integration Patterns**

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter Pattern** | `lib/adapters/` | External system adapters |
| **Transportation Adapters** | `lib/adapters/transportation/` | Carrier integrations |
| **ERP Adapters** | `lib/adapters/erpnext/` | ERP system connectors |

---

## 🏗️ **ARCHITECTURE PATTERNS**

### **Design Patterns**

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Module Registry** | `lib/modules/registry.ts` | Plugin-based architecture |
| **CQRS** | `lib/services/event-store/` | Command/Query separation |
| **Event Sourcing** | `lib/services/event-store/` | Event-driven architecture |
| **Adapter Pattern** | `lib/adapters/` | Integration abstraction |
| **Service Layer** | `lib/services/` | Business logic separation |
| **Agent Orchestration** | `lib/services/agents/` | Multi-agent workflows |

### **Architecture Layers**

```
┌─────────────────────────────────────┐
│  PRESENTATION LAYER                 │
│  • Next.js Pages (App Router)      │
│  • React Components                 │
│  • UI/UX Components                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  BUSINESS LOGIC LAYER               │
│  • Service Layer (lib/services/)    │
│  • Agent Orchestration              │
│  • Process Lifecycle Management     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  DATA LAYER                         │
│  • Type Definitions (types/)        │
│  • Data Processors                  │
│  • Event Store                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  INFRASTRUCTURE LAYER                │
│  • Adapters (lib/adapters/)         │
│  • Event Bus                        │
│  • Integration Layer                │
└─────────────────────────────────────┘
```

---

## 🛠️ **DEVELOPMENT TOOLS**

### **Build & Compilation**

| Tool | Purpose |
|------|---------|
| **Next.js Build System** | Production builds |
| **TypeScript Compiler** | Type checking & compilation |
| **Webpack** (via Next.js) | Module bundling |

### **Code Quality**

| Tool | Purpose |
|------|---------|
| **ESLint** (Next.js) | Code linting |
| **TypeScript** | Static type checking |
| **Prettier** (implied) | Code formatting |

### **Development Server**

| Command | Port | Purpose |
|---------|------|---------|
| `npm run dev` | 3002 | Development server |
| `npm run build` | - | Production build |
| `npm run start` | 3002 | Production server |
| `npm run lint` | - | Run linter |

---

## 📦 **KEY DEPENDENCIES SUMMARY**

### **Production Dependencies (25 packages)**

```json
{
  "@react-three/drei": "^10.7.7",
  "@react-three/fiber": "^9.4.2",
  "@tailwindcss/postcss": "^4.1.17",
  "chart.js": "^4.5.1",
  "clsx": "^2.0.0",
  "d3": "^7.9.0",
  "date-fns": "^2.30.0",
  "framer-motion": "^10.16.0",
  "gsap": "^3.13.0",
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "lottie-react": "^2.4.1",
  "next": "14.2.3",
  "pdf-parse": "^2.4.5",
  "react": "18.2.0",
  "react-chartjs-2": "^5.3.1",
  "react-dom": "18.2.0",
  "react-dropzone": "^14.3.8",
  "react-error-boundary": "^4.0.0",
  "react-player": "^2.13.0",
  "recharts": "^2.10.0",
  "remixicon": "^3.5.0",
  "remixicon-react": "^1.0.0",
  "three": "^0.182.0",
  "typescript": "^5.2.0",
  "uuid": "^9.0.0"
}
```

### **Development Dependencies (6 packages)**

```json
{
  "@types/node": "^20.8.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.31",
  "tailwindcss": "^3.3.5"
}
```

---

## 🌐 **DEPLOYMENT & HOSTING**

### **Deployment Options**

| Platform | Status | Notes |
|----------|--------|-------|
| **Vercel** | ✅ Ready | Next.js optimized |
| **Docker** | 🚧 Planned | Containerization |
| **Kubernetes** | 🚧 Planned | Enterprise deployment |
| **AWS/Azure/GCP** | 🚧 Planned | Cloud deployment |

### **Environment Configuration**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | Anthropic API key |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase configuration |
| `NEXT_PUBLIC_API_URL` | API endpoint URL |

---

## 🔒 **SECURITY STACK**

### **Security Features**

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Custom AuthContext |
| **Authorization** | RBAC (11 roles) |
| **Data Encryption** | At rest & in transit |
| **API Security** | Rate limiting, versioning |
| **Input Validation** | TypeScript + runtime checks |
| **Tenant Isolation** | Multi-tenant architecture |
| **Audit Logging** | Activity tracking |

---

## 📊 **PERFORMANCE OPTIMIZATIONS**

### **Optimization Techniques**

| Technique | Implementation |
|-----------|----------------|
| **Server-Side Rendering** | Next.js App Router |
| **Code Splitting** | Automatic (Next.js) |
| **Lazy Loading** | Dynamic imports |
| **Image Optimization** | Next.js Image component |
| **Caching** | React Context + localStorage |
| **Memoization** | React.memo, useMemo |

---

## 🎯 **4IR & 5IR ALIGNMENT**

### **4IR Technologies**

| Technology | Implementation |
|------------|----------------|
| **IoT Integration** | IoT Manager service |
| **AI/ML** | Multiple ML services |
| **Big Data** | Event Store, Analytics |
| **Cloud Computing** | Cloud-native architecture |
| **Automation** | Agent Orchestration |

### **5IR Technologies**

| Technology | Implementation |
|------------|----------------|
| **Human-AI Collaboration** | Hazalyze Copilot |
| **Explainable AI** | AI insights with reasoning |
| **Sustainability** | ESG compliance features |
| **Edge Computing** | IoT device support |
| **Quantum-Ready** | Future-proof architecture |

---

## 📈 **SCALABILITY FEATURES**

### **Scalability Patterns**

| Pattern | Purpose |
|---------|---------|
| **Multi-Tenant Architecture** | Horizontal scaling |
| **Microservices Ready** | Event Bus architecture |
| **Stateless Components** | Easy horizontal scaling |
| **API-First Design** | External integration ready |
| **CQRS** | Read/write separation |

---

## 🔄 **MODULE ARCHITECTURE**

### **Registered Modules**

| Module | Status | Purpose |
|--------|--------|---------|
| **WMS** | ✅ Active | Warehouse Management |
| **ISO-IMS** | ✅ Active | ISO Integrated Management |
| **Compliance** | ✅ Active | Compliance management |
| **Trade Compliance** | ✅ Active | Trade regulations |
| **TMS** | ✅ Active | Transportation Management |
| **Proposals/RFQ** | ✅ Active | Proposal generation |
| **MaaS** | ✅ Active | Manufacturing as a Service |
| **Hazalyze** | 🚧 In Development | ASN Module |

---

## 📚 **DOCUMENTATION & STANDARDS**

### **Code Standards**

| Standard | File |
|----------|------|
| **Architecture** | `ARCHITECTURE_MINDMAP.md` |
| **Security** | `SECURITY.md` |
| **UI/UX** | `UI_UX_STANDARDS.md` |
| **Contributing** | `CONTRIBUTING.md` |
| **Vision Alignment** | `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md` |

---

## 🎨 **DESIGN SYSTEM**

### **Styling Standards**

| Element | Specification |
|---------|---------------|
| **Primary Color** | Cyan-500 (#06b6d4) |
| **Background** | Black (#000000) |
| **Cards** | Glassmorphism (white/5 with backdrop blur) |
| **Typography** | System defaults |
| **Spacing** | Tailwind spacing scale |
| **Animations** | Framer Motion |

---

## 🚀 **QUICK REFERENCE**

### **Tech Stack Summary**

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.2
- **UI Library:** React 18.2
- **Styling:** Tailwind CSS 3.3
- **Animations:** Framer Motion 10.16
- **3D Graphics:** Three.js + React Three Fiber
- **Charts:** Recharts 2.10
- **AI:** OpenAI GPT-4, Anthropic Claude 3.5
- **Icons:** Remix Icons 3.5
- **PDF:** jsPDF 3.0
- **Video:** React Player 2.13

### **Key Metrics**

- **Total Pages:** 97+ pages
- **Components:** 47+ dashboard components
- **User Roles:** 11 different roles
- **Modules:** 8+ registered modules
- **Services:** 50+ service files
- **Type Definitions:** 12+ type files

---

## 📝 **NOTES**

- All API keys should be stored in environment variables (`.env.local`)
- The platform is designed for multi-tenant, enterprise-grade deployment
- Architecture follows 4IR & 5IR principles for future-proofing
- Integration-first design enables connectivity with external systems
- Security is built-in at every layer

---

**Last Updated:** January 2025  
**Platform Version:** 1.0.0  
**Maintained By:** BlueDXP Development Team











