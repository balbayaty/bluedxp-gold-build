# BlueDXP Platform - Database Backup Script (PowerShell)
# Creates a backup of the PostgreSQL database

$ErrorActionPreference = "Stop"

$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\bluedxp_backup_$Timestamp.sql"

Write-Host "🗄️  BlueDXP Platform - Database Backup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Check if PostgreSQL container is running
$postgresStatus = docker-compose ps postgres 2>&1
if (-not ($postgresStatus -match "Up")) {
    Write-Host "❌ PostgreSQL container is not running" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Creating backup..." -ForegroundColor Yellow
docker-compose exec -T postgres pg_dump -U bluedxp bluedxp | Out-File -FilePath $BackupFile -Encoding utf8

if ($LASTEXITCODE -eq 0) {
    # Compress backup
    Write-Host "📦 Compressing backup..." -ForegroundColor Yellow
    Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
    Remove-Item $BackupFile
    
    $backupSize = (Get-Item "$BackupFile.zip").Length / 1MB
    Write-Host "✅ Backup created successfully: ${BackupFile}.zip" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Backup size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To restore this backup:" -ForegroundColor Yellow
    Write-Host "  Expand-Archive -Path ${BackupFile}.zip -DestinationPath ."
    Write-Host "  Get-Content $BackupFile | docker-compose exec -T postgres psql -U bluedxp bluedxp"
} else {
    Write-Host "❌ Backup failed" -ForegroundColor Red
    if (Test-Path $BackupFile) {
        Remove-Item $BackupFile
    }
    exit 1
}

