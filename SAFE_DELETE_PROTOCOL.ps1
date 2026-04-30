<#
.SYNOPSIS
    SAFE DELETE PROTOCOL - BLUE DXP CONSOLIDATION
    This script safely archives legacy projects before marking them for deletion.

.DESCRIPTION
    1. Crates a 'Legacy_Archive_[Date]' folder.
    2. Moves old repositories into it.
    3. DOES NOT DELETE - It moves them to a staging area for manual deletion.
    This ensures safety.
#>

$ArchiveDate = Get-Date -Format "yyyy-MM-dd"
$ArchiveDir = "C:\Users\balba\Legacy_Archive_$ArchiveDate"

Write-Host "STARTING SAFE CLEANUP PROTOCOL..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $ArchiveDir | Out-Null

$LegacyPaths = @(
    "C:\Users\balba\chemcheck-ai",
    "C:\Users\balba\ChemCollab",
    "C:\Users\balba\chemcheck-analysis",
    "C:\Users\balba\flex-vision-erpnext",
    "C:\Users\balba\temp_cloud_audit"
)

foreach ($Path in $LegacyPaths) {
    if (Test-Path $Path) {
        $FolderName = Split-Path $Path -Leaf
        $DestPath = "$ArchiveDir\$FolderName"
        
        Write-Host "MOVING: $FolderName -> Archive" -ForegroundColor Yellow
        try {
            Move-Item -Path $Path -Destination $DestPath -ErrorAction Stop
            Write-Host "SUCCESS: Archived $FolderName" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Could not move $FolderName. $_" -ForegroundColor Red
        }
    } else {
        Write-Host "SKIPPING: $Path (Not Found)" -ForegroundColor Gray
    }
}

Write-Host "`nCLEANUP COMPLETE." -ForegroundColor Cyan
Write-Host "All legacy buckets are now in: $ArchiveDir"
Write-Host "You may manually delete that folder when you are ready."
