const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple script to combine screenshots into video using ffmpeg
// If ffmpeg is not available, it will provide instructions

const screenshotsDir = path.join(__dirname, '../video-screenshots');
const outputVideo = path.join(__dirname, '../animation-demo.mp4');

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function createVideo() {
  if (!fs.existsSync(screenshotsDir)) {
    console.error('❌ Screenshots directory not found!');
    console.log('Please run the screenshot capture first.');
    return;
  }

  const files = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('❌ No screenshots found!');
    return;
  }

  console.log(`📸 Found ${files.length} screenshots`);

  if (checkFFmpeg()) {
    console.log('🎬 Creating video with ffmpeg...');
    try {
      const fps = 2;
      execSync(
        `ffmpeg -y -framerate ${fps} -i "${screenshotsDir}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 "${outputVideo}"`,
        { stdio: 'inherit' }
      );
      console.log(`\n✅ Video created successfully: ${outputVideo}`);
    } catch (error) {
      console.error('❌ Error creating video:', error.message);
    }
  } else {
    console.log('\n📝 FFmpeg not found. Here are your options:');
    console.log('\n1. Install FFmpeg:');
    console.log('   - Download from: https://ffmpeg.org/download.html');
    console.log('   - Or use: winget install ffmpeg');
    console.log('\n2. Use online tools:');
    console.log('   - Upload screenshots to: https://ezgif.com/images-to-video');
    console.log(`   - Screenshots are in: ${screenshotsDir}`);
    console.log('\n3. Use Windows Photos app:');
    console.log('   - Select all screenshots');
    console.log('   - Right-click > Create video');
  }
}

createVideo();


