import { test as base, expect, Page, FrameLocator } from '@playwright/test';

async function waitForAdminReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    return (
      window.location.pathname.startsWith('/wp-admin') ||
      Boolean(document.querySelector('#wpadminbar')) ||
      document.body.classList.contains('wp-admin')
    );
  });
}

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
    await waitForAdminReady(adminPage);

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
    await waitForAdminReady(editorPage);

    // Create new post
    await editorPage.goto('/wp-admin/post-new.php');
    const closeButton = editorPage.getByRole('button', { name: 'Close' });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
    await editorPage.frameLocator('iframe').first().getByRole('textbox', { name: 'Add title' }).waitFor();

    await use(editorPage);
    await editorPage.close();
  },
});

// Custom WordPress helper methods
export class WordPressPage {
  constructor(public page: Page) {}

  getEditorCanvas(): FrameLocator {
    return this.page.frameLocator('iframe').first();
  }

  getBlockLocator(blockType: string) {
    return this.getEditorCanvas().locator(`[data-type="${blockType}"]`);
  }

  async login(username = 'admin', password = 'password') {
    await this.page.goto('/wp-admin/');

    if (this.page.url().includes('/wp-login.php')) {
      await this.page.fill('#user_login', username);
      await this.page.fill('#user_pass', password);
      await this.page.click('#wp-submit');
    }

    await waitForAdminReady(this.page);
  }

  async createPost(title = 'Test Post') {
    await this.page.goto('/wp-admin/post-new.php');
    await this.dismissWelcomeGuideIfPresent();

    const titleInput = this.getEditorCanvas().getByRole('textbox', { name: 'Add title' });
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill(title);
  }

  async insertBlock(blockName: string) {
    await this.dismissWelcomeGuideIfPresent();

    const blockType = await this.resolveBlockTypeName(blockName);

    try {
      const inserterButton = this.page
        .getByRole('button', { name: /Block Inserter|Toggle block inserter/i })
        .first();

      await inserterButton.click({ timeout: 5_000 });

      const searchInputCandidates = [
        this.page.getByRole('searchbox').first(),
        this.page.getByRole('textbox', { name: /Search/i }).first(),
        this.page.getByPlaceholder(/Search/i).first(),
      ];

      let searchInput = null;
      for (const candidate of searchInputCandidates) {
        if (await candidate.isVisible().catch(() => false)) {
          searchInput = candidate;
          break;
        }
      }

      if (!searchInput) {
        throw new Error('Block inserter search input is not visible');
      }

      await searchInput.fill(blockName);
      await this.page.getByRole('option', { name: blockName }).first().click({ timeout: 5_000 });
    } catch {
      await this.insertBlockViaStore(blockType);
    }

    await expect(this.getBlockLocator(blockType).first()).toBeVisible();
  }

  async savePost() {
    await this.page.evaluate(async () => {
      const wp = (window as any).wp;
      const editor = wp?.data?.dispatch('core/editor');
      if (!editor?.savePost) {
        throw new Error('WordPress editor save action is unavailable');
      }

      await editor.savePost();
    });
    await this.waitForEditorIdle();
  }

  async publishPost() {
    await this.page.evaluate(async () => {
      const wp = (window as any).wp;
      const dispatch = wp?.data?.dispatch('core/editor');
      if (!dispatch?.editPost || !dispatch?.savePost) {
        throw new Error('WordPress editor publish actions are unavailable');
      }

      dispatch.editPost({ status: 'publish' });
      await dispatch.savePost();
    });
    await this.waitForEditorIdle();

    await this.page.waitForFunction(() => {
      const wp = (window as any).wp;
      return wp?.data?.select('core/editor')?.getEditedPostAttribute('status') === 'publish';
    });
  }

  async previewPost(): Promise<Page> {
    const previewUrl = await this.page.evaluate(async () => {
      const wp = (window as any).wp;
      const postId = wp?.data?.select('core/editor')?.getCurrentPostId?.();
      if (!postId) {
        throw new Error('Current post id is unavailable');
      }

      const response = await fetch(`/wp-json/wp/v2/posts/${postId}?context=edit`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch post preview URL: ${response.status}`);
      }

      const post = await response.json();
      return post.link as string;
    });

    const newPage = await this.page.context().newPage();
    await newPage.goto(previewUrl, { waitUntil: 'domcontentloaded' });
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

  private async dismissWelcomeGuideIfPresent() {
    const closeButton = this.page.getByRole('button', { name: 'Close' });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }

  private async resolveBlockTypeName(blockName: string): Promise<string> {
    return this.page.evaluate((name) => {
      const wp = (window as any).wp;
      const blockType = wp?.blocks
        ?.getBlockTypes?.()
        ?.find((candidate: any) => candidate.title === name || candidate.name === name);

      if (!blockType?.name) {
        throw new Error(`Unable to resolve block type for "${name}"`);
      }

      return blockType.name as string;
    }, blockName);
  }

  private async insertBlockViaStore(blockType: string) {
    await this.page.evaluate((name) => {
      const wp = (window as any).wp;
      const createBlock = wp?.blocks?.createBlock;
      const dispatch = wp?.data?.dispatch('core/block-editor');

      if (!createBlock || !dispatch?.insertBlocks || !dispatch?.selectBlock) {
        throw new Error('WordPress block editor insertion APIs are unavailable');
      }

      const block = createBlock(name);
      dispatch.insertBlocks(block);
      dispatch.selectBlock(block.clientId);
    }, blockType);
  }

  private async waitForEditorIdle() {
    await this.page.waitForFunction(() => {
      const wp = (window as any).wp;
      const editor = wp?.data?.select('core/editor');
      return Boolean(editor) && !editor.isSavingPost?.() && !editor.isAutosavingPost?.();
    });
  }
}

// Expect with custom matchers
export { expect };
