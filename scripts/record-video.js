const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Use existing Chrome installation
const findChrome = () => {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  return null;
};

async function recordVideo() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('Chrome not found. Please install Google Chrome.');
    process.exit(1);
  }

  console.log('🚀 Starting video recording...');
  
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Navigate to the site
  console.log('📱 Navigating to localhost:3000...');
  await page.goto('http://localhost:3000/settings/parameters', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Wait for page to fully load
  await page.waitForTimeout(3000);

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '../video-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('📸 Capturing screenshots...');
  const screenshots = [];
  const duration = 30; // 30 seconds
  const fps = 2; // 2 frames per second
  const totalFrames = duration * fps;

  // Scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  for (let i = 0; i < totalFrames; i++) {
    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, `frame-${String(i).padStart(4, '0')}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    screenshots.push(screenshotPath);

    // Scroll down gradually to show animations
    const scrollAmount = (i / totalFrames) * 2000;
    await page.evaluate((scroll) => {
      window.scrollTo(0, scroll);
    }, scrollAmount);

    // Wait for animations
    await page.waitForTimeout(1000 / fps);

    // Interact with elements to trigger animations
    if (i % 5 === 0) {
      try {
        // Try to hover over cards to trigger hover animations
        const cards = await page.$$('[class*="card"], [class*="Card"]');
        if (cards.length > 0) {
          const randomCard = cards[Math.floor(Math.random() * cards.length)];
          await randomCard.hover();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    process.stdout.write(`\r📸 Captured ${i + 1}/${totalFrames} frames...`);
  }

  console.log('\n✅ Screenshots captured!');
  console.log('🎬 Creating video...');

  // Close browser
  await browser.close();

  console.log(`\n✨ Done! Screenshots saved to: ${screenshotsDir}`);
  console.log('📝 To create a video, install ffmpeg and run:');
  console.log(`   ffmpeg -framerate ${fps} -i ${screenshotsDir}/frame-%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4`);
}

recordVideo().catch(console.error);


