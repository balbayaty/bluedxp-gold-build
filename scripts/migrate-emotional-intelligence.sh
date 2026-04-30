#!/bin/bash

# Emotional Intelligence Database Migration Script
# Run this after adding Prisma models

echo "🔄 Running Prisma migration for Emotional Intelligence..."

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_emotional_intelligence_models

echo "✅ Migration complete!"
echo ""
echo "📋 Models created:"
echo "  - EmotionalState"
echo "  - RelationshipHealth"
echo "  - BehavioralPrediction"
echo "  - EmotionalInsight"
echo ""
echo "🚀 Next steps:"
echo "  1. Review the migration file"
echo "  2. Test the database connection"
echo "  3. Verify indexes are created"


