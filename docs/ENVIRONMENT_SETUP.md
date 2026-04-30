# 🔧 Environment Setup Guide

## Required Environment Variables

### Database
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hazalyze?schema=public"
```

### Application
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional: Authentication
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Optional: API Keys
```env
KNOWLEDGE_BASE_API_KEY=your-api-key-here
AI_SERVICE_API_KEY=your-api-key-here
```

### Optional: Feature Flags
```env
ENABLE_QHSE_MODULE=true
ENABLE_ISO_IMS_MODULE=true
ENABLE_AI_FEATURES=true
```

### Optional: Rate Limiting
```env
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000
```

---

## Setup Instructions

1. Copy `.env.example` to `.env` (if it exists)
2. Update `DATABASE_URL` with your PostgreSQL connection string
3. Set other variables as needed
4. Restart the application

---

*See API_DOCUMENTATION.md for more details.*















