# 🔐 Login Configuration Guide

## Current Status
✅ **Basic Email/Password Login**: ENABLED (Default)  
❌ **OAuth Login (Google, Microsoft, etc.)**: DISABLED (Not Configured)  
❌ **Magic Link Login**: DISABLED (Requires Email Service)  
❌ **Authenticator Apps**: DISABLED (Requires Setup)

---

## Quick Start (Current Setup)

You can login immediately using **Email & Password** method:

### Test Credentials
- **Email**: superadmin@hazalyze.com
- **Password**: (Your configured password)

The login page will only show the email/password form by default.

---

## Advanced Features (Optional Setup)

### 1. Enable OAuth Providers (Google, Microsoft, LinkedIn, GitHub)

To enable the OAuth buttons on the login page:

#### Step 1: Get OAuth Credentials

**For Google:**
1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set redirect URI: `http://localhost:3002/api/auth/oauth/google/callback`
6. Copy Client ID and Client Secret

**For Microsoft:**
1. Go to: https://portal.azure.com/
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Set redirect URI: `http://localhost:3002/api/auth/oauth/microsoft/callback`
5. Copy Application (client) ID and create a Client Secret

**For LinkedIn:**
1. Go to: https://www.linkedin.com/developers/apps
2. Create a new app
3. Set redirect URI: `http://localhost:3002/api/auth/oauth/linkedin/callback`
4. Copy Client ID and Client Secret

**For GitHub:**
1. Go to: https://github.com/settings/developers
2. Create new OAuth App
3. Set redirect URI: `http://localhost:3002/api/auth/oauth/github/callback`
4. Copy Client ID and Client Secret

#### Step 2: Add to Environment File

Open `.env.local` and add:

```bash
# OAuth Configuration
NEXT_PUBLIC_OAUTH_ENABLED=true

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

#### Step 3: Restart Dev Server

```bash
npm run dev
```

---

### 2. Enable Magic Link & Authenticator

To enable Magic Link (email-based) and Authenticator app login:

#### Step 1: Configure Email Service

You need to set up an email service (like SendGrid, Mailgun, or AWS SES).

Add to `.env.local`:

```bash
# Advanced Authentication Methods
NEXT_PUBLIC_ADVANCED_AUTH_ENABLED=true

# Email Service (Choose one)
EMAIL_SERVICE=sendgrid  # or "mailgun" or "ses"
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

#### Step 2: Restart Dev Server

```bash
npm run dev
```

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.local` to git** - It contains sensitive credentials
2. **Use different OAuth apps for development vs production**
3. **Restrict OAuth redirect URIs** to your actual domains
4. **Enable 2FA on all OAuth provider accounts**
5. **Rotate credentials regularly**

---

## Troubleshooting

### Issue: "signal is aborted without reason"
**Solution**: This was caused by OAuth providers not being configured. We've hidden the OAuth buttons by default. Use email/password login instead.

### Issue: Can't login with email/password
**Solution**: 
1. Check if the database is running
2. Verify user exists in database
3. Check console logs for detailed error messages
4. Ensure `.env.local` has correct `DATABASE_URL`

### Issue: OAuth buttons not showing
**Solution**: Set `NEXT_PUBLIC_OAUTH_ENABLED=true` in `.env.local` after configuring OAuth credentials (see Step 2 above)

---

## What Changed?

We've updated the login page to:

1. ✅ **Hide OAuth buttons** until you configure them (`NEXT_PUBLIC_OAUTH_ENABLED=true`)
2. ✅ **Hide Magic Link & Authenticator tabs** until you set them up (`NEXT_PUBLIC_ADVANCED_AUTH_ENABLED=true`)
3. ✅ **Show only email/password login** by default (works immediately)
4. ✅ **Prevent "signal is aborted" errors** by not attempting OAuth without credentials

---

## Next Steps

1. **Test the login** with email/password (should work now)
2. **Optional**: Set up OAuth providers if you want social login
3. **Optional**: Configure email service for Magic Link
4. **Optional**: Set up MFA/Authenticator apps for enhanced security

---

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Check the terminal where `npm run dev` is running
3. Verify `.env.local` has all required variables
4. Make sure the database is running and accessible

---

**BlueDXP Platform** - Enterprise Intelligence Operating System
