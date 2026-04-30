# Pulse Module - Quick Start Guide

## 🚀 **Get Started in 3 Steps**

### **Step 1: Run Database Migration**
```bash
npx prisma migrate dev --name add_pulse_module
npx prisma generate
```

### **Step 2: Seed Default Data**
```bash
node -e "require('./prisma/seed/pulse.ts').seedPulseModule('default')"
```

### **Step 3: Access Pulse Module**
Navigate to `/pulse` in your browser!

---

## 📋 **What You Get**

### **For Employees:**
- **Overview Dashboard** (`/pulse`) - See your balance, today's progress, active missions
- **Missions** (`/pulse/missions`) - Complete daily/weekly missions to earn points
- **Leaderboards** (`/pulse/leaderboards`) - See how you rank
- **Rewards** (`/pulse/rewards`) - Redeem Pulse Points for rewards
- **Recognition** (`/pulse/recognition`) - Give recognition to colleagues
- **Profile** (`/pulse/profile`) - Manage privacy & consent settings

### **For Managers/Admins:**
- **Admin Dashboard** (`/pulse/admin`) - Manage Pulse module
- **Rulesets** (`/pulse/admin/rulesets`) - Configure scoring rules
- **Redemptions** (`/pulse/admin/redemptions`) - Approve reward redemptions
- **Benchmark** (`/pulse/benchmark`) - View industry benchmarks

---

## 🎮 **How It Works**

### **Earning Points:**
1. **Execute Pillar** (40% weight): Complete tasks on-time
2. **Safe Pillar** (25% weight): Submit safety observations, close CAPAs/NCRs
3. **Grow Pillar** (10% weight): Complete training
4. **Move Pillar** (25% weight): Log wellness data (optional, opt-in)

### **Using Points:**
- **Pulse Points (PP)**: Redeemable for rewards
- **Impact Credits (IC)**: Evaluation-grade evidence (not redeemable)

### **Missions:**
- **Daily Missions**: Generated automatically each day
- **Weekly Boss Battles**: Team/site/company objectives

### **Rewards:**
- Browse catalog
- Redeem with Pulse Points
- Some require approval (handled by managers)

---

## 🔧 **Configuration**

### **Rulesets**
Configure scoring rules per role cluster:
- Weights (Move/Execute/Safe/Grow percentages)
- Caps (daily/weekly/monthly limits)
- Anti-gaming (spike detection, event limits)

### **Rewards**
Add rewards to catalog:
- Set cost in Pulse Points
- Configure monthly limits
- Set approval requirements

### **Missions**
Create custom missions:
- Daily or weekly
- Individual, team, site, or company scope
- Define requirements and rewards

---

## 📊 **Features**

### **4 Pillars:**
- **Move**: Wellness (steps, active minutes) - Optional, opt-in
- **Execute**: Task completion, on-time performance
- **Safe**: Safety observations, CAPA/NCR participation
- **Grow**: Training completion, micro-learning

### **Dual Currency:**
- **Pulse Points (PP)**: For motivation & rewards
- **Impact Credits (IC)**: For evaluation evidence

### **Scoreboards:**
- Individual leaderboards
- Team/Shift/Site/Company scoreboards
- Cross-company benchmarks (anonymized, opt-in)

### **Privacy:**
- Wellness data stored as daily aggregates only
- No GPS traces
- Opt-in consent required
- Configurable data retention

---

## 🎯 **Next Steps**

1. **Run migration** (see Step 1 above)
2. **Seed data** (see Step 2 above)
3. **Configure rulesets** (adjust weights/caps as needed)
4. **Add rewards** (customize catalog for your organization)
5. **Test integration** (complete tasks/training to see points awarded)
6. **Set up background jobs** (for automatic mission generation)

---

## 📚 **Documentation**

- **Architecture**: `docs/PULSE_MODULE_ARCHITECTURE_MAP.md`
- **Implementation**: `docs/PULSE_MODULE_IMPLEMENTATION_SUMMARY.md`
- **Technical Notes**: `docs/PULSE_MODULE_TECH_NOTES.md`
- **Integration**: `docs/PULSE_MODULE_COMPLETE_INTEGRATION_GUIDE.md`
- **No Duplication**: `docs/PULSE_MODULE_NO_DUPLICATION_REPORT.md`

---

## ✅ **Ready to Use!**

The Pulse module is **fully functional** and ready for your team to start using!

**Questions?** Check the documentation files or review the code in `lib/services/pulse/`.













