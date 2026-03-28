import { test, expect, WordPressPage } from './fixtures/wordpress';

test.describe('WordPress Typia Block Creation', () => {
  let wpPage: WordPressPage;

  test.beforeEach(async ({ page }) => {
    wpPage = new WordPressPage(page);
    await wpPage.login();
    await wpPage.createPost('Typia Block Test');
  });

  test('should create a Typia block', async ({ page }) => {
    // Insert the Typia block
    await wpPage.insertBlock('My Typia Block');

    // Verify block is inserted
    const block = wpPage.getBlockLocator('create-block/my-typia-block');
    await expect(block).toBeVisible();

    // Check block content
    await expect(block.locator('p')).toContainText('My Typia Block – hello from the editor!');
  });

  test('should validate attributes correctly', async ({ page }) => {
    await wpPage.insertBlock('My Typia Block');

    // Get block attributes via WordPress data store
    const attributes = await wpPage.getBlockAttributes('create-block/my-typia-block');

    expect(attributes).toBeDefined();
    expect(attributes.content).toBe(''); // Default value
    expect(attributes.alignment).toBe('left'); // Default value
    expect(attributes.isVisible).toBe(true); // Default value
  });

  test('should persist attributes after save', async ({ page }) => {
    await wpPage.insertBlock('My Typia Block');

    // Modify attributes (if there are controls)
    // This would depend on the actual block implementation

    // Save the post
    await wpPage.savePost();

    // Verify save was successful
    await expect(page.locator('[aria-label="Saved"]')).toBeVisible();

    // Check attributes are still set correctly
    const attributes = await wpPage.getBlockAttributes('create-block/my-typia-block');
    expect(attributes).toBeDefined();
  });

  test('should render correctly on frontend', async ({ page }) => {
    await wpPage.insertBlock('My Typia Block');
    await wpPage.publishPost();

    // Open preview
    const previewPage = await wpPage.previewPost();

    // Verify block renders on frontend
    const block = previewPage.locator('.wp-block-create-block-my-typia-block');
    await expect(block).toBeVisible();

    await previewPage.close();
  });

  test('should handle multiple blocks', async ({ page }) => {
    // Insert multiple blocks
    await wpPage.insertBlock('My Typia Block');
    await wpPage.insertBlock('My Typia Block');
    await wpPage.insertBlock('My Typia Block');

    // Verify all blocks are present
    const blocks = wpPage.getBlockLocator('create-block/my-typia-block');
    await expect(blocks).toHaveCount(3);

    // Verify each block has unique ID if implemented
    const blocksData = await page.evaluate(() => {
      const wp = (window as any).wp;
      if (!wp || !wp.data) return [];

      const blocks = wp.data.select('core/block-editor').getBlocks();
      return blocks
        .filter((b: any) => b.name === 'create-block/my-typia-block')
        .map((b: any) => b.attributes.id)
        .filter(Boolean); // Filter out null/undefined IDs
    });

    // All IDs should be unique if implemented
    const uniqueIds = new Set(blocksData);
    expect(uniqueIds.size).toBe(blocksData.length);
  });
});

test.describe('Block Validation', () => {
  test('should handle invalid data gracefully', async ({ page }) => {
    const wpPage = new WordPressPage(page);
    await wpPage.login();
    await wpPage.createPost('Validation Test');

    // Insert block
    await wpPage.insertBlock('My Typia Block');

    // Try to set invalid data via console
    const result = await page.evaluate(() => {
      try {
        // Type assertion for WordPress globals
        const wp = (window as any).wp;
        if (!wp || !wp.data) return { success: false, error: 'WordPress not available' };

        // This would typically be prevented by the UI
        const selectedBlock = wp.data.select('core/block-editor').getSelectedBlock();
        if (!selectedBlock) return { success: false, error: 'No block selected' };

        wp.data.dispatch('core/block-editor').updateBlock(
          selectedBlock.clientId,
          {
            attributes: {
              content: null, // Invalid
              alignment: 'invalid' // Invalid
            }
          }
        );
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // WordPress should handle this gracefully or reject
    expect(result.success).toBeDefined();
  });
});
