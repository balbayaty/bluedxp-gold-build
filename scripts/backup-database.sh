#!/bin/bash

# BlueDXP Platform - Database Backup Script
# Creates a backup of the PostgreSQL database

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bluedxp_backup_$TIMESTAMP.sql"

echo "🗄️  BlueDXP Platform - Database Backup"
echo "======================================"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ PostgreSQL container is not running"
    exit 1
fi

echo "📦 Creating backup..."
docker-compose exec -T postgres pg_dump -U bluedxp bluedxp > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress backup
    echo "📦 Compressing backup..."
    gzip "$BACKUP_FILE"
    
    echo "✅ Backup created successfully: ${BACKUP_FILE}.gz"
    echo ""
    echo "📊 Backup size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
    echo ""
    echo "To restore this backup:"
    echo "  gunzip -c ${BACKUP_FILE}.gz | docker-compose exec -T postgres psql -U bluedxp bluedxp"
else
    echo "❌ Backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

