<#
.SYNOPSIS
  Safely clean and de-noise the Hazalyze repo workspace to prevent Cursor freezes.

.DESCRIPTION
  This script is intentionally conservative:
  - Deletes only regeneratable build/cache folders (e.g. .next/) when requested
  - Archives untracked, root-level "report noise" (mostly *.md) OUTSIDE the repo by default
  - Defaults to DryRun so you can see exactly what would happen

.PARAMETER DryRun
  If set (default), only prints what it would do.

.PARAMETER PurgeBuildArtifacts
  If set, removes regeneratable build/cache output such as .next/, dist/, out/, coverage/.

.PARAMETER PurgeNodeModules
  If set, removes node_modules/ (safe but slow to restore; requires npm install after).

.PARAMETER ArchiveUntrackedRootReports
  If set, moves untracked root-level *.md/*.json/*.txt reports into an archive folder (outside repo).

.PARAMETER ArchivePath
  Where to put archived files (defaults to a sibling folder next to the repo).

.EXAMPLE
  # Preview (recommended first):
  powershell -ExecutionPolicy Bypass -File scripts/cleanup-workspace.ps1 -DryRun -PurgeBuildArtifacts -ArchiveUntrackedRootReports

.EXAMPLE
  # Actually do it:
  powershell -ExecutionPolicy Bypass -File scripts/cleanup-workspace.ps1 -PurgeBuildArtifacts -ArchiveUntrackedRootReports
#>

[CmdletBinding()]
param(
  [switch]$DryRun = $true,
  [switch]$PurgeBuildArtifacts,
  [switch]$PurgeNodeModules,
  [switch]$ArchiveUntrackedRootReports,
  [string]$ArchivePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Plan([string]$msg) { Write-Host $msg }

function Ensure-GitRepo {
  $inside = (git rev-parse --is-inside-work-tree 2>$null)
  if ($inside -ne 'true') {
    throw 'Not inside a git repository. Run this from the repo root.'
  }
}

function Get-RepoRoot {
  return (git rev-parse --show-toplevel).Trim()
}

function Invoke-DeletePath([string]$path) {
  if (!(Test-Path -LiteralPath $path)) { return }
  if ($DryRun) {
    Write-Plan "DRY RUN: Would delete: $path"
    return
  }
  Write-Plan "Deleting: $path"
  Remove-Item -LiteralPath $path -Recurse -Force
}

function Ensure-Directory([string]$path) {
  if (Test-Path -LiteralPath $path) { return }
  if ($DryRun) {
    Write-Plan "DRY RUN: Would create directory: $path"
    return
  }
  New-Item -ItemType Directory -Path $path | Out-Null
}

function Invoke-MoveFile([string]$from, [string]$toDir) {
  if (!(Test-Path -LiteralPath $from)) { return }
  $leaf = Split-Path -Leaf $from
  $dest = Join-Path $toDir $leaf

  if ($DryRun) {
    Write-Plan "DRY RUN: Would move: $from -> $dest"
    return
  }
  Move-Item -LiteralPath $from -Destination $dest -Force
}

Ensure-GitRepo
$repoRoot = Get-RepoRoot
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($ArchivePath)) {
  # Default: keep archives OUTSIDE repo so the workspace stays small
  $ArchivePath = Join-Path (Split-Path -Parent $repoRoot) 'hazalyze-asn-archive'
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$archiveSession = Join-Path $ArchivePath ("cleanup_" + $stamp)

Write-Plan ""
Write-Plan "Repo: $repoRoot"
Write-Plan "DryRun: $DryRun"
Write-Plan "Archive session: $archiveSession"
Write-Plan ""

# 1) Purge regeneratable build artifacts
if ($PurgeBuildArtifacts) {
  Write-Plan "== Purging build artifacts =="
  Invoke-DeletePath (Join-Path $repoRoot '.next')
  Invoke-DeletePath (Join-Path $repoRoot 'dist')
  Invoke-DeletePath (Join-Path $repoRoot 'out')
  Invoke-DeletePath (Join-Path $repoRoot 'build')
  Invoke-DeletePath (Join-Path $repoRoot 'coverage')
}

# 2) Purge node_modules (optional)
if ($PurgeNodeModules) {
  Write-Plan "== Purging node_modules (you will need npm install) =="
  Invoke-DeletePath (Join-Path $repoRoot 'node_modules')
}

# 3) Archive untracked root-level reports
if ($ArchiveUntrackedRootReports) {
  Write-Plan "== Archiving untracked root-level reports (safe) =="
  Ensure-Directory $archiveSession

  # Allowlist: never archive these, even if untracked
  $keep = @(
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'UI_UX_STANDARDS.md',
    'ARCHITECTURE_MINDMAP.md',
    'VISUAL_ARCHITECTURE_DIAGRAM.md',
    'CONSOLIDATION_SUMMARY.md',
    'QUICK_START.md'
  )

  # Get untracked files ONLY (no deletions)
  $untracked = git ls-files --others --exclude-standard
  $rootUntracked = $untracked | Where-Object {
    ($_ -notmatch '[/\\\\]') -and
    ($_ -match '\\.(md|json|txt)$')
  } | Where-Object { $keep -notcontains $_ }

  if (!$rootUntracked -or $rootUntracked.Count -eq 0) {
    Write-Plan "No untracked root-level report files found."
  } else {
    Write-Plan ("Found " + $rootUntracked.Count + " untracked root-level report files to archive.")
    foreach ($f in $rootUntracked) {
      Invoke-MoveFile (Join-Path $repoRoot $f) $archiveSession
    }
  }
}

Write-Plan ""
Write-Plan "Done."
Write-Plan "If you purged node_modules, run: npm install"
Write-Plan "If Cursor was open, close/reopen the workspace for best results."


