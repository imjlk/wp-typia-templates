import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Define WordPress fixtures
export interface WordPressFixtures {
  page: Page;
  adminPage: Page;
  editorPage: Page;
}

// Extend base test with WordPress-specific fixtures
export const test = base.extend<WordPressFixtures>({
  page: async ({ page }, use) => {
    // Common page setup
    await use(page);
  },

  adminPage: async ({ browser }, use) => {
    const adminPage = await browser.newPage();

    // Login to admin
    await adminPage.goto('/wp-login.php');
    await adminPage.fill('#user_login', 'admin');
    await adminPage.fill('#user_pass', 'password');
    await adminPage.click('#wp-submit');
    await adminPage.waitForURL('**/wp-admin/**');

    await use(adminPage);
    await adminPage.close();
  },

  editorPage: async ({ browser }, use) => {
    const editorPage = await browser.newPage();

    // Login and go to editor
    await editorPage.goto('/wp-login.php');
    await editorPage.fill('#user_login', 'admin');
    await editorPage.fill('#user_pass', 'password');
    await editorPage.click('#wp-submit');
    await editorPage.waitForURL('**/wp-admin/**');

    // Create new post
    await editorPage.goto('/wp-admin/post-new.php');
    await editorPage.waitForSelector('.editor-post-title__input');

    await use(editorPage);
    await editorPage.close();
  },
});

// Custom WordPress helper methods
export class WordPressPage {
  constructor(public page: Page) {}

  async login(username = 'admin', password = 'password') {
    await this.page.goto('/wp-login.php');
    await this.page.fill('#user_login', username);
    await this.page.fill('#user_pass', password);
    await this.page.click('#wp-submit');
    await this.page.waitForURL('**/wp-admin/**');
  }

  async createPost(title = 'Test Post') {
    await this.page.goto('/wp-admin/post-new.php');
    await this.page.waitForSelector('.editor-post-title__input');
    await this.page.fill('.editor-post-title__input', title);
  }

  async insertBlock(blockName: string) {
    // Open block inserter
    await this.page.getByLabel('Toggle block inserter').click();

    // Search for block
    await this.page.getByPlaceholder('Search').fill(blockName);

    // Wait for search results and click on block
    await this.page.getByLabel(blockName).first().click();

    // Wait for block to be inserted
    await this.page.waitForTimeout(500);
  }

  async savePost() {
    await this.page.getByLabel('Save draft').click();
    await this.page.getByLabel('Saved').waitFor({ state: 'visible' });
  }

  async publishPost() {
    await this.page.getByLabel('Publish').click();
    await this.page.getByLabel('Publish', { exact: true }).waitFor({ state: 'hidden' });
    await this.page.getByLabel('Published').waitFor({ state: 'visible' });
  }

  async previewPost(): Promise<Page> {
    await this.page.getByLabel('Preview').click();

    // Click the preview in new tab option
    await this.page.getByText('Preview in new tab').click();

    // Wait for and return the new page
    const newPage = await this.page.context().waitForEvent('page');
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  async getBlockAttributes(blockType: string): Promise<any> {
    return await this.page.evaluate((type) => {
      // Type assertion for WordPress global
      const wp = (window as any).wp;
      if (!wp || !wp.data) return null;

      const blocks = wp.data.select('core/block-editor').getBlocks();
      const block = blocks.find((b: any) => b.name === type);
      return block ? block.attributes : null;
    }, blockType);
  }
}

// Expect with custom matchers
export { expect };
