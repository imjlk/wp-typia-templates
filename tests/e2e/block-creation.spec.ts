import { test, expect, EXAMPLE_BLOCK, WordPressPage } from './fixtures/wordpress';

test.describe('WordPress Typia block smoke', () => {
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

  test('publish + frontend render', async () => {
    await wpPage.insertBlock();
    await wpPage.publishPost();

    const previewPage = await wpPage.previewPost();
    const frontendBlock = previewPage.locator(EXAMPLE_BLOCK.frontend.selector);

    await expect(frontendBlock).toBeVisible();
    await expect(frontendBlock).toContainText(/My Typia Block [–-] Frontend View/);

    await previewPage.close();
  });
});
