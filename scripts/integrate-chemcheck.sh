#!/bin/bash
# Integration Script: Copy ChemCheck & ChemCollab modules to Hazalyze
# Run from hazalyze-asn-module root directory

set -e

CHEMCHECK_DIR="C:/Users/balba/chemcheck-ai"
CHEMCOLLAB_DIR="C:/Users/balba/ChemCollab"
HAZALYZE_DIR="."

echo "🚀 Starting ChemCheck & ChemCollab Integration..."
echo ""

# Phase 1: Copy Services (100% copy-paste ready)
echo "📦 Phase 1: Copying Services..."
mkdir -p lib/adapters/erpnext
mkdir -p lib/services/ml
mkdir -p lib/services/ai
mkdir -p lib/services/firebase
mkdir -p lib/services/event-bus

# Copy ERPNext API
if [ -f "$CHEMCHECK_DIR/lib/erpnext-api.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/erpnext-api.ts" lib/adapters/erpnext/api.ts
  echo "✅ Copied ERPNext API"
fi

# Copy ML Services
if [ -d "$CHEMCHECK_DIR/lib/ml-services" ]; then
  cp -r "$CHEMCHECK_DIR/lib/ml-services"/* lib/services/ml/
  echo "✅ Copied ML Services (5 services)"
fi

# Copy AI Service
if [ -f "$CHEMCHECK_DIR/lib/ai-service.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/ai-service.ts" lib/services/ai/service.ts
  echo "✅ Copied AI Service"
fi

# Copy Firebase Services
if [ -f "$CHEMCHECK_DIR/lib/firebase.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/firebase.ts" lib/services/firebase/
fi
if [ -f "$CHEMCHECK_DIR/lib/firebase-db.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/firebase-db.ts" lib/services/firebase/
fi
if [ -f "$CHEMCHECK_DIR/lib/firebase-storage.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/firebase-storage.ts" lib/services/firebase/
fi
echo "✅ Copied Firebase Services"

# Copy Event Bus
if [ -d "$CHEMCOLLAB_DIR/core/event-bus" ]; then
  cp -r "$CHEMCOLLAB_DIR/core/event-bus"/* lib/services/event-bus/
  echo "✅ Copied Event Bus"
fi

echo ""
echo "✅ Phase 1 Complete: All services copied"
echo ""

# Phase 2: Copy Components
echo "📦 Phase 2: Copying Components..."
mkdir -p components/ims
mkdir -p components/ui-chemcheck

# Copy IMS Components
if [ -d "$CHEMCHECK_DIR/components/IMS" ]; then
  cp -r "$CHEMCHECK_DIR/components/IMS"/* components/ims/
  echo "✅ Copied IMS Components"
fi

# Copy Specialized Components
if [ -f "$CHEMCHECK_DIR/components/StorageLocationForm.tsx" ]; then
  cp "$CHEMCHECK_DIR/components/StorageLocationForm.tsx" components/
fi
if [ -f "$CHEMCHECK_DIR/components/WarehouseAreasManager.tsx" ]; then
  cp "$CHEMCHECK_DIR/components/WarehouseAreasManager.tsx" components/
fi
if [ -f "$CHEMCHECK_DIR/components/MSDSUpload.tsx" ]; then
  cp "$CHEMCHECK_DIR/components/MSDSUpload.tsx" components/
fi
if [ -f "$CHEMCHECK_DIR/components/NFPADiamond.tsx" ]; then
  cp "$CHEMCHECK_DIR/components/NFPADiamond.tsx" components/
fi
echo "✅ Copied Specialized Components"

# Copy UI Components (optional - check for duplicates)
if [ -d "$CHEMCHECK_DIR/components/ui" ]; then
  cp -r "$CHEMCHECK_DIR/components/ui" components/ui-chemcheck/
  echo "✅ Copied UI Components (check for duplicates)"
fi

echo ""
echo "✅ Phase 2 Complete: All components copied"
echo "⚠️  Note: Update imports and icons in components"
echo ""

# Phase 3: Copy Types
echo "📦 Phase 3: Copying Types..."
if [ -f "$CHEMCHECK_DIR/lib/types.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/types.ts" types/chemcheck.ts
  echo "✅ Copied Type Definitions"
fi

if [ -f "$CHEMCHECK_DIR/lib/utils.ts" ]; then
  cp "$CHEMCHECK_DIR/lib/utils.ts" utils/chemcheckUtils.ts
  echo "✅ Copied Utilities"
fi

echo ""
echo "🎉 Integration Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update import paths in copied files"
echo "2. Update icon imports (react-icons/fi → remixicon)"
echo "3. Convert pages from Pages Router to App Router"
echo "4. Install dependencies: npm install"
echo ""
echo "See docs/integrations/CHEMCHECK_CHEMCOLLAB_INTEGRATION.md for details"



