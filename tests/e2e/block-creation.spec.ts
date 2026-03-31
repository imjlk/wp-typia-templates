import { test, expect, EXAMPLE_BLOCK, WordPressPage } from './fixtures/wordpress';

interface CounterRouteContext {
  postId: number;
  resourceKey: string;
  restUrl: string;
}

async function getCounterRouteContext(previewPage: Awaited<ReturnType<WordPressPage['previewPost']>>): Promise<CounterRouteContext> {
  return previewPage.evaluate(() => {
    const interactiveRoot = document.querySelector('[data-wp-interactive="my-typia-block"]');
    if (!(interactiveRoot instanceof HTMLElement)) {
      throw new Error('Unable to locate the frontend interactive root.');
    }

    const rawContext = interactiveRoot.getAttribute('data-wp-context');
    if (!rawContext) {
      throw new Error('Missing frontend block context.');
    }

    const context = JSON.parse(rawContext) as { id?: unknown; postId?: unknown };
    if (typeof context.id !== 'string' || context.id.length === 0) {
      throw new Error('Missing frontend resource key.');
    }
    if (typeof context.postId !== 'number' || context.postId <= 0) {
      throw new Error('Missing frontend post id.');
    }

    return {
      postId: context.postId,
      resourceKey: context.id,
      restUrl: `${window.location.origin}/?rest_route=/my-typia-block/v1/counter`,
    };
  });
}

async function readPersistedCounter(
  previewPage: Awaited<ReturnType<WordPressPage['previewPost']>>,
  context: CounterRouteContext,
): Promise<{ count: number | null; status: number; contentType: string | null; body: string | null }> {
  return previewPage.evaluate(async (routeContext) => {
    const url = new URL(routeContext.restUrl);
    url.searchParams.set('postId', String(routeContext.postId));
    url.searchParams.set('resourceKey', routeContext.resourceKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });
    const contentType = response.headers.get('content-type');
    const rawBody = await response.text();

    if (!response.ok) {
      return {
        body: rawBody,
        contentType,
        count: null,
        status: response.status,
      };
    }

    try {
      const body = JSON.parse(rawBody) as { count?: unknown };
      return {
        body: rawBody,
        contentType,
        count: typeof body.count === 'number' ? body.count : null,
        status: response.status,
      };
    } catch {
      return {
        body: rawBody,
        contentType,
        count: null,
        status: response.status,
      };
    }
  }, context);
}

test.describe('WordPress Typia block smoke', () => {
  test.describe.configure({ mode: 'serial' });

  let wpPage: WordPressPage;

  test.beforeEach(async ({ page }) => {
    wpPage = new WordPressPage(page);
    await wpPage.login();
    await wpPage.createPost('Typia Block Test');
  });

  test('insert + default attributes', async () => {
    await wpPage.insertBlock();

    const block = wpPage.getBlockLocator();
    await expect(block).toBeVisible();

    const attributes = await wpPage.getBlockAttributes();
    expect(attributes).toMatchObject(EXAMPLE_BLOCK.defaultAttributes);
  });

  test('valid update + save + reopen persists attributes', async () => {
    await wpPage.insertBlock();
    await wpPage.updateSelectedBlockAttributes(EXAMPLE_BLOCK.updatedAttributes);
    await wpPage.savePost();

    const postId = await wpPage.getCurrentPostId();
    await wpPage.openPostEditor(postId);

    const attributes = await wpPage.getBlockAttributes();
    expect(attributes).toMatchObject(EXAMPLE_BLOCK.updatedAttributes);
  });

  test('helper-driven inspector controls update manifest-backed attributes', async () => {
    await wpPage.insertBlock();
    await wpPage.openBlockSettingsSidebar();

    await wpPage.page.getByRole('combobox', { name: 'Font Size' }).selectOption('xlarge');
    await wpPage.page.getByRole('combobox', { name: 'Text Color' }).selectOption('inherit');
    await wpPage.page.getByRole('combobox', { name: 'Background Color' }).selectOption('unset');
    await wpPage.page.getByRole('combobox', { name: 'Aspect Ratio' }).selectOption('1/1');
    await wpPage.page.getByRole('spinbutton', { name: 'Border Radius' }).fill('12');
    await wpPage.page.getByRole('checkbox', { name: 'Visible' }).uncheck();

    const attributes = await wpPage.getBlockAttributes();
    expect(attributes).toMatchObject({
      aspectRatio: '1/1',
      backgroundColor: 'unset',
      borderRadius: 12,
      fontSize: 'xlarge',
      isVisible: false,
      textColor: 'inherit',
    });
  });

  test('publish + frontend render', async () => {
    await wpPage.insertBlock();
    await wpPage.publishPost();

    const previewPage = await wpPage.previewPost();
    const frontendBlock = previewPage.locator(EXAMPLE_BLOCK.frontend.selector);

    await expect(frontendBlock).toBeVisible();
    await expect(frontendBlock).toContainText(/My Typia Block [–-] Frontend View/);

    await previewPage.close();
  });

  test('frontend counter persists through the typed REST client', async () => {
    await wpPage.insertBlock();
    await wpPage.publishPost();

    const previewPage = await wpPage.previewPost();
    let counterValue = previewPage.locator('.my-typia-block-counter span');
    const persistButton = previewPage.getByRole('button', { name: 'Persist Count' });
    const counterContext = await getCounterRouteContext(previewPage);

    await expect(persistButton).toBeVisible();
    await previewPage.waitForFunction(
      () => document.documentElement.dataset.myTypiaBlockHydrated === 'true',
      undefined,
      { timeout: 30000 },
    );
    await expect
      .poll(
        async () => {
          const result = await readPersistedCounter(previewPage, counterContext);
          return result.status;
        },
        { timeout: 15000 },
      )
      .toBe(200);

    await persistButton.click();
    await expect
      .poll(
        async () => {
          const result = await readPersistedCounter(previewPage, counterContext);
          return result.count;
        },
        { timeout: 10000 },
      )
      .toBe(1);
    await expect(counterValue).toHaveText('1', { timeout: 10000 });

    await persistButton.click();
    await expect
      .poll(
        async () => {
          const result = await readPersistedCounter(previewPage, counterContext);
          return result.count;
        },
        { timeout: 10000 },
      )
      .toBe(2);
    await expect(counterValue).toHaveText('2', { timeout: 10000 });

    await previewPage.reload({ waitUntil: 'domcontentloaded' });
    counterValue = previewPage.locator('.my-typia-block-counter span');
    await previewPage.waitForFunction(
      () => document.documentElement.dataset.myTypiaBlockHydrated === 'true',
      undefined,
      { timeout: 30000 },
    );
    await expect
      .poll(
        async () => {
          const result = await readPersistedCounter(previewPage, counterContext);
          return result.count;
        },
        { timeout: 10000 },
      )
      .toBe(2);
    await expect(counterValue).toHaveText('2', { timeout: 10000 });

    await previewPage.close();
  });

  test('invalid attributes surface validation errors in the editor', async () => {
    await wpPage.insertBlock();
    await wpPage.updateSelectedBlockAttributes({ alignment: 123 as unknown as string });

    const validationNotice = wpPage.page
      .locator('.components-notice')
      .filter({ hasText: 'Validation Errors:' })
      .first();

    await expect(validationNotice).toBeVisible();
    await expect(validationNotice.getByText(/alignment:/).first()).toBeVisible();
  });
});
