# PowerShell script to replace all .substr() calls with .substring()
# This fixes deprecated .substr() method usage across the codebase
# Run with: .\scripts\fix-substr.ps1

Write-Host "🔍 Finding and fixing .substr() calls..." -ForegroundColor Cyan

$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse -File | Where-Object { 
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -match '\.substr\('
}

Write-Host "📝 Found $($files.Count) files to check" -ForegroundColor Yellow

$fixedCount = 0
$totalReplacements = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        $fileReplacements = 0
        
        # Replace common patterns
        # .substr(2, 9) -> .substring(2, 11) (produces same 9 chars)
        if ($content -match '\.substr\(2,\s*9\)') {
            $content = $content -replace '\.substr\(2,\s*9\)', '.substring(2, 11)'
            $fileReplacements += ([regex]::Matches($originalContent, '\.substr\(2,\s*9\)')).Count
        }
        
        # .substr(2, 16) -> .substring(2, 18) (produces same 16 chars)
        if ($content -match '\.substr\(2,\s*16\)') {
            $content = $content -replace '\.substr\(2,\s*16\)', '.substring(2, 18)'
            $fileReplacements += ([regex]::Matches($originalContent, '\.substr\(2,\s*16\)')).Count
        }
        
        # Fix double substr bug: .substr(36).substr(2, 9) -> .substring(2, 11)
        if ($content -match '\.substr\(36\)\.substr\(2,\s*9\)') {
            $content = $content -replace '\.substr\(36\)\.substr\(2,\s*9\)', '.substring(2, 11)'
            $fileReplacements += ([regex]::Matches($originalContent, '\.substr\(36\)\.substr\(2,\s*9\)')).Count
        }
        
        # Generic pattern: .substr(start, length) -> .substring(start, start + length)
        # This handles other cases like .substr(0, 5) -> .substring(0, 5)
        if ($content -match '\.substr\((\d+),\s*(\d+)\)') {
            $content = [regex]::Replace($content, '\.substr\((\d+),\s*(\d+)\)', {
                param($match)
                $start = [int]$match.Groups[1].Value
                $length = [int]$match.Groups[2].Value
                $end = $start + $length
                ".substring($start, $end)"
            })
            $fileReplacements += ([regex]::Matches($originalContent, '\.substr\(\d+,\s*\d+\)')).Count
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✅ Fixed: $($file.FullName) ($fileReplacements replacements)" -ForegroundColor Green
            $fixedCount++
            $totalReplacements += $fileReplacements
        }
    }
    catch {
        Write-Host "❌ Error fixing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`n✨ Done! Fixed $fixedCount files with $totalReplacements total replacements" -ForegroundColor Green






