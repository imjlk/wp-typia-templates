import { test as base, expect, Page, FrameLocator } from '@playwright/test';

export const EXAMPLE_BLOCK = {
  name: 'create-block/my-typia-block',
  title: 'My Typia Block',
  editorText: 'My Typia Block - Editor View',
  defaultAttributes: {
    content: '',
    alignment: 'left',
    isVisible: true,
    version: 1,
  },
  updatedAttributes: {
    content: 'Persisted content',
    alignment: 'center',
    isVisible: false,
  },
  frontend: {
    selector: '.my-typia-block-frontend',
    text: 'My Typia Block - Frontend View',
  },
} as const;

export const test = base;

async function waitForAdminReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    return (
      window.location.pathname.startsWith('/wp-admin') ||
      Boolean(document.querySelector('#wpadminbar')) ||
      document.body.classList.contains('wp-admin')
    );
  }, { timeout: 60_000 });
}

export class WordPressPage {
  constructor(public page: Page) {}

  getEditorCanvas(): FrameLocator {
    return this.page.frameLocator('iframe').first();
  }

  getBlockLocator(blockType = EXAMPLE_BLOCK.name) {
    if (blockType === EXAMPLE_BLOCK.name) {
      return this.getEditorCanvas().getByText(EXAMPLE_BLOCK.editorText);
    }

    return this.getEditorCanvas().locator(`[data-type="${blockType}"]`);
  }

  async login(username = 'admin', password = 'password') {
    await this.page.goto('/wp-admin/', { waitUntil: 'domcontentloaded' });

    if (this.page.url().includes('/wp-login.php')) {
      await this.page.fill('#user_login', username);
      await this.page.fill('#user_pass', password);
      await Promise.allSettled([
        this.page.waitForURL((url) => {
          return url.pathname.startsWith('/wp-admin') || url.pathname.startsWith('/wp-login.php');
        }, { timeout: 60_000 }),
        this.page.click('#wp-submit'),
      ]);

      const loginErrors = await this.page.locator('#login_error').allTextContents();
      if (loginErrors.length > 0) {
        throw new Error(`WordPress login failed: ${loginErrors.join(' ')}`);
      }

      await this.page.goto('/wp-admin/', { waitUntil: 'domcontentloaded' });
    }

    await waitForAdminReady(this.page);
  }

  async createPost(title = 'Typia Block Test') {
    await this.page.goto('/wp-admin/post-new.php');
    await this.waitForEditorReady();

    const titleInput = this.getEditorCanvas().getByRole('textbox', { name: 'Add title' });
    await titleInput.fill(title);
  }

  async openPostEditor(postId: number) {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`);
    await this.waitForEditorReady();
  }

  async insertBlock(block = EXAMPLE_BLOCK) {
    await this.dismissWelcomeGuideIfPresent();

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

      await searchInput.fill(block.title);
      await this.page.getByRole('option', { name: block.title }).first().click({ timeout: 5_000 });
    } catch {
      await this.insertBlockViaStore(block.name);
    }

    await this.waitForBlockInEditor(block.name);
    await this.selectLatestBlock(block.name);
    await expect(this.getBlockLocator(block.name).first()).toBeVisible();
  }

  async openBlockSettingsSidebar() {
    const closeInserterButton = this.page.getByRole('button', { name: /Close Block Inserter/i });
    if (await closeInserterButton.isVisible().catch(() => false)) {
      await closeInserterButton.click();
    }

    const isSidebarOpen = await this.page.evaluate(() => {
      const wp = (window as any).wp;
      return wp?.data?.select('core/edit-post')?.isEditorSidebarOpened?.() === true;
    });

    if (isSidebarOpen) {
      return;
    }

    const settingsButton = this.page.getByRole('button', { name: /^Settings$/i });
    await settingsButton.click();

    await this.page.waitForFunction(() => {
      const wp = (window as any).wp;
      return wp?.data?.select('core/edit-post')?.isEditorSidebarOpened?.() === true;
    });
  }

  async updateSelectedBlockAttributes(attributes: Record<string, unknown>) {
    await this.page.evaluate((nextAttributes) => {
      const wp = (window as any).wp;
      const selectedBlock = wp?.data?.select('core/block-editor')?.getSelectedBlock?.();
      const dispatch = wp?.data?.dispatch('core/block-editor');

      if (!selectedBlock?.clientId || !dispatch?.updateBlockAttributes) {
        throw new Error('Unable to update selected block attributes');
      }

      dispatch.updateBlockAttributes(selectedBlock.clientId, nextAttributes);
    }, attributes);

    await this.waitForBlockAttributes(attributes);
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
    const previewUrl = await this.page.evaluate(() => {
      const wp = (window as any).wp;
      const postId = wp?.data?.select('core/editor')?.getCurrentPostId?.();
      if (!postId) {
        throw new Error('Current post id is unavailable');
      }

      const previewUrl = new URL('/', window.location.origin);
      previewUrl.searchParams.set('p', String(postId));
      return previewUrl.toString();
    });

    const previewPage = await this.page.context().newPage();
    await previewPage.goto(previewUrl, { waitUntil: 'domcontentloaded' });
    return previewPage;
  }

  async getBlockAttributes(blockType = EXAMPLE_BLOCK.name): Promise<Record<string, unknown> | null> {
    return this.page.evaluate((type) => {
      const wp = (window as any).wp;
      if (!wp?.data) {
        return null;
      }

      const blocks = wp.data.select('core/block-editor').getBlocks();
      const block = blocks.find((candidate: any) => candidate.name === type);
      return block ? block.attributes : null;
    }, blockType);
  }

  async getCurrentPostId(): Promise<number> {
    return this.page.evaluate(() => {
      const wp = (window as any).wp;
      const postId = wp?.data?.select('core/editor')?.getCurrentPostId?.();
      if (!postId) {
        throw new Error('Current post id is unavailable');
      }

      return postId as number;
    });
  }

  private async waitForEditorReady() {
    await this.dismissWelcomeGuideIfPresent();
    await this.getEditorCanvas().getByRole('textbox', { name: 'Add title' }).waitFor({ state: 'visible' });
  }

  private async dismissWelcomeGuideIfPresent() {
    const welcomeGuideDialog = this.page.getByRole('dialog').filter({
      has: this.page.getByRole('button', { name: 'Close' }),
    }).first();

    if (await welcomeGuideDialog.isVisible().catch(() => false)) {
      await welcomeGuideDialog.getByRole('button', { name: 'Close' }).click();
    }
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

  private async selectLatestBlock(blockType: string) {
    await this.page.evaluate((type) => {
      const wp = (window as any).wp;
      const select = wp?.data?.select('core/block-editor');
      const dispatch = wp?.data?.dispatch('core/block-editor');
      const blocks = select?.getBlocks?.() ?? [];
      const matchingBlocks = blocks.filter((block: any) => block.name === type);
      const latestBlock = matchingBlocks[matchingBlocks.length - 1];

      if (!latestBlock?.clientId || !dispatch?.selectBlock) {
        throw new Error(`Unable to select latest "${type}" block`);
      }

      dispatch.selectBlock(latestBlock.clientId);
    }, blockType);
  }

  private async waitForBlockAttributes(
    expectedAttributes: Record<string, unknown>,
    blockType = EXAMPLE_BLOCK.name,
  ) {
    await this.page.waitForFunction(
      ([type, expected]) => {
        const wp = (window as any).wp;
        const block = wp?.data
          ?.select('core/block-editor')
          ?.getBlocks?.()
          ?.find((candidate: any) => candidate.name === type);

        if (!block?.attributes) {
          return false;
        }

        return Object.entries(expected as Record<string, unknown>).every(
          ([key, value]) => block.attributes[key] === value,
        );
      },
      [blockType, expectedAttributes],
    );
  }

  private async waitForEditorIdle() {
    await this.page.waitForFunction(() => {
      const wp = (window as any).wp;
      const editor = wp?.data?.select('core/editor');
      return Boolean(editor) && !editor.isSavingPost?.() && !editor.isAutosavingPost?.();
    });
  }

  private async waitForBlockInEditor(blockType: string) {
    await this.page.waitForFunction((type) => {
      const wp = (window as any).wp;
      const blocks = wp?.data?.select('core/block-editor')?.getBlocks?.() ?? [];
      return blocks.some((block: any) => block.name === type);
    }, blockType);
  }
}

export { expect };
