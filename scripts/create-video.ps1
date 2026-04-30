# PowerShell script to create video from screenshots
$screenshotsDir = Join-Path $PSScriptRoot "..\video-screenshots"
$outputVideo = Join-Path $PSScriptRoot "..\animation-demo.mp4"

Write-Host "🎬 Creating Video from Screenshots..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $screenshotsDir)) {
    Write-Host "❌ Screenshots directory not found: $screenshotsDir" -ForegroundColor Red
    exit 1
}

$screenshots = Get-ChildItem -Path $screenshotsDir -Filter "*.png" | Sort-Object Name

if ($screenshots.Count -eq 0) {
    Write-Host "❌ No screenshots found in: $screenshotsDir" -ForegroundColor Red
    exit 1
}

Write-Host "📸 Found $($screenshots.Count) screenshots" -ForegroundColor Green
Write-Host ""

$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

if ($ffmpegPath) {
    Write-Host "✅ FFmpeg found! Creating video..." -ForegroundColor Green
    Write-Host ""
    
    $fps = 2
    $ffmpegCmd = "ffmpeg -y -framerate $fps -i `"$screenshotsDir\frame-%04d.png`" -c:v libx264 -pix_fmt yuv420p -crf 23 `"$outputVideo`""
    
    Write-Host "Running: $ffmpegCmd" -ForegroundColor Yellow
    Write-Host ""
    
    Invoke-Expression $ffmpegCmd
    
    if (Test-Path $outputVideo) {
        Write-Host ""
        Write-Host "✅ Video created successfully!" -ForegroundColor Green
        Write-Host "📁 Location: $outputVideo" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🎉 Your animation video is ready!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ Video creation failed. Check ffmpeg output above." -ForegroundColor Red
    }
}
else {
    Write-Host "⚠️  FFmpeg not found. Here are your options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPTION 1: Install FFmpeg (Recommended)" -ForegroundColor Cyan
    Write-Host "   Using winget: winget install ffmpeg" -ForegroundColor White
    Write-Host "   Or download from: https://ffmpeg.org/download.html" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 2: Use Online Tool" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://ezgif.com/images-to-video" -ForegroundColor White
    Write-Host "   2. Upload all screenshots from: $screenshotsDir" -ForegroundColor White
    Write-Host "   3. Set frame rate to 2 fps" -ForegroundColor White
    Write-Host "   4. Download the video" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 3: Use Windows Photos App" -ForegroundColor Cyan
    Write-Host "   1. Open File Explorer and navigate to: $screenshotsDir" -ForegroundColor White
    Write-Host "   2. Select all PNG files (Ctrl+A)" -ForegroundColor White
    Write-Host "   3. Right-click > Create video" -ForegroundColor White
    Write-Host ""
    Write-Host "Screenshots are ready in: $screenshotsDir" -ForegroundColor Green
}
