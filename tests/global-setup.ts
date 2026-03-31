import { chromium, FullConfig } from '@playwright/test';

async function waitForAdminReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    return (
      window.location.pathname.startsWith('/wp-admin') ||
      Boolean(document.querySelector('#wpadminbar')) ||
      document.body.classList.contains('wp-admin')
    );
  }, { timeout: 60_000 });
}

async function waitForWordPressLogin(
	page: import('@playwright/test').Page,
	baseURL: string,
) {
	const startedAt = Date.now();
	const timeoutMs = 60_000;

	while (Date.now() - startedAt < timeoutMs) {
		await page.goto(`${baseURL}/wp-login.php`, { waitUntil: 'domcontentloaded' });

		const currentUrl = page.url();
		const pageTitle = await page.title();
		const hasLoginForm = await page.locator('#loginform').isVisible().catch(() => false);
		const hasAdminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);

		if (hasLoginForm || hasAdminBar) {
			return;
		}

		const looksLikeInstall =
			currentUrl.includes('/wp-admin/install.php') ||
			(pageTitle.includes('WordPress') && pageTitle.includes('Installation'));
		if (!looksLikeInstall) {
			await page.waitForTimeout(2_000);
			continue;
		}

		await page.waitForTimeout(2_000);
	}

	throw new Error(
		'WordPress test environment did not finish booting before timeout.',
	);
}

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up WordPress test environment...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const baseURL = config.projects![0].use.baseURL!;

  try {
    await waitForWordPressLogin(page, baseURL);

    // Login to WordPress
    await page.goto(`${baseURL}/wp-login.php`, { waitUntil: 'domcontentloaded' });
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await Promise.allSettled([
      page.waitForURL((url) => {
        return url.pathname.startsWith('/wp-admin') || url.pathname.startsWith('/wp-login.php');
      }, { timeout: 60_000 }),
      page.click('#wp-submit'),
    ]);

      const loginErrors = await page.locator('#login_error').allTextContents();
      if (loginErrors.length > 0) {
        throw new Error(`WordPress login failed: ${loginErrors.join(' ')}`);
      }

    await page.goto(`${baseURL}/wp-admin/`, { waitUntil: 'domcontentloaded' });

    // Wait for login to complete
    await waitForAdminReady(page);
    console.log('✅ WordPress environment ready');

  } catch (error) {
    console.error('❌ Failed to setup WordPress environment:', error);
    console.log('Please ensure wp-env is running: bun run examples:wp-env:start:test');
    process.exit(1);
  }

  await browser.close();
}

export default globalSetup;
