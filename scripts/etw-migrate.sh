#!/bin/bash
# ETW Database Migration Script
# Run this to set up the ETW database tables

echo "🚀 Starting ETW Database Migration..."

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Error: Prisma client generation failed."
    echo "💡 Tip: Close your dev server and try again."
    exit 1
fi

# Create Migration
echo "🗄️  Creating database migration..."
npx prisma migrate dev --name add_etw_module

if [ $? -ne 0 ]; then
    echo "❌ Error: Migration failed."
    echo "💡 Tip: Check your database connection and try again."
    exit 1
fi

echo "✅ ETW Database Migration Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Start your dev server: npm run dev"
echo "2. Navigate to /etw in your browser"
echo "3. Create your first ETW"
echo ""
echo "🎉 Happy coding!"




