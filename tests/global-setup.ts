import { chromium, FullConfig } from '@playwright/test';

async function waitForAdminReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    return (
      window.location.pathname.startsWith('/wp-admin') ||
      Boolean(document.querySelector('#wpadminbar')) ||
      document.body.classList.contains('wp-admin')
    );
  });
}

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up WordPress test environment...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for WordPress to be ready
    await page.goto(config.projects![0].use.baseURL!);

    // Check if WordPress is installed
    const pageTitle = await page.title();
    if (pageTitle.includes('WordPress') && pageTitle.includes('Installation')) {
      console.log('⚠️ WordPress not installed. Please run wp-env first.');
      console.log('Run: bun run wp-env:start');
      process.exit(1);
    }

    // Login to WordPress
    await page.goto(`${config.projects![0].use.baseURL}/wp-login.php`);
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');

    // Wait for login to complete
    await waitForAdminReady(page);
    console.log('✅ WordPress environment ready');

  } catch (error) {
    console.error('❌ Failed to setup WordPress environment:', error);
    console.log('Please ensure wp-env is running: bun run wp-env:start');
    process.exit(1);
  }

  await browser.close();
}

export default globalSetup;
