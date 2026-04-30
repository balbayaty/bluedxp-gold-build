# Quick Testing Guide

## 🚀 Fastest Way to Test

### Option 1: Quick Connection Test (30 seconds)

```bash
npx tsx scripts/test-quick.ts
```

This tests if all APIs are accessible and credentials work.

### Option 2: Full Test Suite (2-5 minutes)

```bash
npx tsx scripts/test-rabet-integrations.ts
```

This runs comprehensive tests for all APIs.

### Option 3: Via Browser/API

Start your dev server:
```bash
npm run dev
```

Then visit:
```
http://localhost:3000/api/test/rabet
```

## 📋 Before Testing

1. **Set Environment Variables** in `.env`:

```env
# WASL/Bayan/Athr Naql (same credentials)
WASL_APP_ID=YOUR_APP_ID
WASL_APP_KEY=YOUR_APP_KEY

# Daleel (different - username/password)
DALEEL_USERNAME=your_username
DALEEL_PASSWORD=your_password
```

2. **Install Dependencies** (if needed):

```bash
npm install
```

## ✅ Expected Results

### Quick Test Output:
```
🚀 Quick Connection Test for Rabet.sa APIs...

✅ Athr Naql: Athr Naql API connection successful
✅ WASL: WASL API connection successful
✅ Bayan: Bayan API connection successful
✅ Daleel: Daleel API connection successful

============================================================
Results: 4/4 passed
============================================================
```

### Full Test Output:
```
🚀 Starting Rabet.sa Integration Tests...

📋 Testing Athr Naql (Pre-Validation)...
✅ Athr Naql - Connection (250ms)
✅ Athr Naql - Operation Card Verification (300ms)
✅ Athr Naql - Driver Card Verification (280ms)
...

📊 TEST SUMMARY
============================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
Success Rate: 100.0%
============================================================
```

## 🐛 Troubleshooting

### "Credentials not found"
- Check `.env` file exists
- Verify variable names are correct
- Restart your terminal/IDE

### "Connection failed"
- Check internet connection
- Verify API base URL
- Check if credentials are correct
- Verify account has API access

### "Module not found"
- Run `npm install`
- Check if you're in the project root
- Verify file paths are correct

## 📚 More Details

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.



