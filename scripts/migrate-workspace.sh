#!/bin/bash
# Workspace Module Database Migration Script
# Run this to set up the Workspace database tables

echo "🚀 Starting Workspace Module Database Migration..."
echo ""

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "⚠️  Prisma client generation had issues. Continuing anyway..."
    echo "💡 Tip: Close your dev server and try again if you see file lock errors."
fi
echo ""

# Step 2: Create Migration
echo "🗄️  Step 2: Creating database migration..."
echo "   Migration name: add_workspace_module"
echo "   This will create:"
echo "   - widget_categories"
echo "   - widget_definitions"
echo "   - workspace_layouts"
echo "   - user_widgets"
echo "   - google_workspace_integrations"
echo "   - email_integrations"
echo "   - workspace_analytics"
echo ""

npx prisma migrate dev --name add_workspace_module

if [ $? -ne 0 ]; then
    echo "❌ Error: Migration failed."
    echo "💡 Tip: Check your database connection and try again."
    exit 1
fi
echo ""

# Step 3: Seed Default Categories
echo "🌱 Step 3: Seeding default widget categories..."
npx ts-node prisma/seed/workspaceCategories.ts

if [ $? -ne 0 ]; then
    echo "⚠️  Category seeding had issues. You can run it manually later."
fi
echo ""

# Step 4: Seed Default Widgets
echo "🌱 Step 4: Seeding default widgets..."
npx ts-node prisma/seed/workspaceWidgets.ts

if [ $? -ne 0 ]; then
    echo "⚠️  Widget seeding had issues. You can run it manually later."
fi
echo ""

# Step 5: Verification
echo "✅ Step 5: Verifying migration..."
echo "   Checking migration status..."
npx prisma migrate status
echo ""

# Summary
echo "════════════════════════════════════════════════════════"
echo "✅ WORKSPACE MODULE MIGRATION COMPLETE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo "   1. Start your dev server: npm run dev"
echo "   2. Navigate to /workspace in your browser"
echo "   3. Start customizing your workspace!"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: docs/workspace/QUICK_START.md"
echo "   - User Guide: docs/workspace/USER_GUIDE.md"
echo "   - Setup Guide: docs/workspace/SETUP_GUIDE.md"
echo ""
echo "🎉 Happy workspace building!"
echo ""












