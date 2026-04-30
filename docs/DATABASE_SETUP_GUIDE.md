# 🗄️ Database Setup Guide - Fix Authentication Errors

## Current Database Errors (from Terminal)

You're seeing these errors:
```
Authentication failed against database server at `localhost`, 
the provided database credentials for `user` are not valid.
```

This means the database password is wrong or the database isn't running.

---

## 🎯 Quick Fix Options

### Option 1: Update Database Password (Easiest)

If your database IS running but the password is wrong:

1. **Open** `.env.local` file
2. **Find** this line:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bluedxp"
   ```
3. **Change** `user:password` to your actual database username and password
4. **Save** the file
5. **Restart** the server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

---

### Option 2: Start PostgreSQL Database

If the database isn't running:

#### On Windows:

**Using Docker (Recommended):**
```bash
# Start PostgreSQL with Docker
docker run -d `
  --name bluedxp-db `
  -e POSTGRES_USER=bluedxp `
  -e POSTGRES_PASSWORD=change_me_in_production `
  -e POSTGRES_DB=bluedxp `
  -p 5432:5432 `
  postgres:15-alpine
```

**Using Local PostgreSQL:**
1. Open **Services** (Windows + R, type `services.msc`)
2. Find **PostgreSQL** service
3. Right-click → **Start**

**Check if it's running:**
```bash
# Test database connection
psql -U bluedxp -d bluedxp -h localhost
```

---

### Option 3: Use Default Credentials

Your `.env` file has these default credentials:
```
DATABASE_URL="postgresql://bluedxp:change_me_in_production@127.0.0.1:5432/bluedxp?schema=public"
```

To use these:

1. **Open** `.env.local`
2. **Replace** the DATABASE_URL line with:
   ```
   DATABASE_URL="postgresql://bluedxp:change_me_in_production@127.0.0.1:5432/bluedxp?schema=public"
   ```
3. **Create the database** (if it doesn't exist):
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create user
   CREATE USER bluedxp WITH PASSWORD 'change_me_in_production';
   
   # Create database
   CREATE DATABASE bluedxp OWNER bluedxp;
   
   # Exit
   \q
   ```

4. **Run migrations** to create tables:
   ```bash
   npx prisma migrate dev
   ```

5. **Seed database** with initial data (if available):
   ```bash
   npx prisma db seed
   ```

---

## 🔍 Troubleshooting

### Error: "database does not exist"

**Solution**: Create the database
```bash
# Connect to PostgreSQL as admin
psql -U postgres

# Create database
CREATE DATABASE bluedxp;

# Exit
\q
```

### Error: "role does not exist"

**Solution**: Create the user
```bash
# Connect to PostgreSQL as admin
psql -U postgres

# Create user with password
CREATE USER bluedxp WITH PASSWORD 'change_me_in_production';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE bluedxp TO bluedxp;

# Exit
\q
```

### Error: "password authentication failed"

**Solution**: Update password in `.env.local` to match your database password

### Error: "could not connect to server"

**Solution**: Database server is not running. Start PostgreSQL service (see Option 2 above)

---

## 📊 Verify Database Setup

Once you've configured the database, verify it's working:

### Step 1: Check Connection
```bash
# Test if database is accessible
npx prisma db pull
```

### Step 2: Run Migrations
```bash
# Create tables
npx prisma migrate dev
```

### Step 3: Check Tables
```bash
# Open Prisma Studio to view data
npx prisma studio
```

This will open a browser window where you can see all your database tables.

---

## 👤 Create Initial User (if needed)

If you don't have a user account yet:

### Option A: Using Prisma Studio
1. Run: `npx prisma studio`
2. Click on **User** table
3. Click **Add record**
4. Fill in:
   - email: `superadmin@hazalyze.com`
   - password: (hashed - see Option B for creating hashed password)
   - role: `SYSTEM_ADMIN`
   - status: `ACTIVE`
   - tenantId: `tenant-1`

### Option B: Using a Seed Script
Create a file `prisma/seed.ts` with initial user data, then run:
```bash
npx prisma db seed
```

### Option C: Using Direct SQL
```bash
# Connect to database
psql -U bluedxp -d bluedxp

# Insert user (replace with actual hashed password)
INSERT INTO "User" (id, email, password, name, role, status, "tenantId", "createdAt", "updatedAt")
VALUES (
  'user-1',
  'superadmin@hazalyze.com',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'Super Admin',
  'SYSTEM_ADMIN',
  'ACTIVE',
  'tenant-1',
  NOW(),
  NOW()
);
```

---

## 🚨 Important Notes

1. **Password Hashing**: Passwords must be hashed using bcrypt before storing
2. **Never use plain passwords** in the database
3. **Default password in examples** should be changed immediately
4. **In production**, use strong passwords and environment variables

---

## ✅ Quick Checklist

- [ ] PostgreSQL is running
- [ ] Database `bluedxp` exists
- [ ] User `bluedxp` exists with correct password
- [ ] `.env.local` has correct DATABASE_URL
- [ ] Migrations have been run (`npx prisma migrate dev`)
- [ ] At least one user exists in the database
- [ ] Server restarted after changes

---

## 🆘 Still Having Database Issues?

If none of the above work:

1. **Check PostgreSQL logs** for detailed errors
2. **Verify PostgreSQL version** (should be 12+)
3. **Check firewall** isn't blocking port 5432
4. **Try connecting** with a database GUI tool (pgAdmin, DBeaver)
5. **Share error messages** for more specific help

---

**Once database is configured, the login should work!**
