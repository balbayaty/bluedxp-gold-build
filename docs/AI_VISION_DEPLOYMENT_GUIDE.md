# 🚀 AI Vision Module - Deployment Guide

**Date:** January 2025  
**Status:** ✅ **Ready for Production Deployment**

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables**
Ensure these are set in your production environment:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/bluedxp

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Storage
STORAGE_PROVIDER=local|s3|azure
STORAGE_BUCKET=...
STORAGE_REGION=...
```

### **2. Database Migration**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### **3. Build Verification**
```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Build
npm run build
```

---

## 🚀 **DEPLOYMENT OPTIONS**

### **Option 1: Docker (Recommended)**

```bash
# Build Docker image
docker build -t bluedxp-ai-vision:latest .

# Run container
docker run -d \
  --name bluedxp-ai-vision \
  -p 3002:3002 \
  -e DATABASE_URL=$DATABASE_URL \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e NODE_ENV=production \
  bluedxp-ai-vision:latest
```

### **Option 2: Docker Compose**

```bash
# Update .env.local with production values
# Then:
docker-compose up -d
```

### **Option 3: Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Option 4: Kubernetes**

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Or use Helm
helm install bluedxp ./helm/bluedxp
```

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### **1. Health Check**
```bash
curl https://your-domain.com/api/health
curl https://your-domain.com/api/ai/vision/health
```

### **2. Test Vision Analysis**
```bash
# Test image analysis
curl -X POST https://your-domain.com/api/ai/vision \
  -F "image=@test-image.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **3. Verify Database**
```bash
# Check vision tables exist
npx prisma studio
```

---

## 📊 **MONITORING**

### **Key Metrics to Monitor:**
- API response times
- Error rates
- Database connection pool
- AI API usage/quotas
- Storage usage

### **Logs:**
- Application logs: `/var/log/bluedxp/app.log`
- Error logs: `/var/log/bluedxp/errors.log`

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

1. **Database Connection Failed**
   - Check DATABASE_URL
   - Verify PostgreSQL is running
   - Check network connectivity

2. **AI API Errors**
   - Verify API keys
   - Check API quotas
   - Verify network access

3. **Build Failures**
   - Clear .next folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check Node.js version: `node --version` (should be 20.x)

---

**Last Updated:** January 2025  
**Version:** 2.0.0













