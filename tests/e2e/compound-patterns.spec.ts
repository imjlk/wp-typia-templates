import {
  test,
  expect,
  COMPOUND_PATTERNS_BLOCK,
  COMPOUND_PATTERNS_ITEM_BLOCK,
  WordPressPage,
} from './fixtures/wordpress';

async function getInnerChildCount(
  wpPage: WordPressPage,
  parentType: string,
  childType: string,
): Promise<number> {
  return wpPage.page.evaluate(([parentName, childName]) => {
    const wp = (window as any).wp;
    const blocks = wp?.data?.select('core/block-editor')?.getBlocks?.() ?? [];
    const parent = blocks.find((candidate: any) => candidate.name === parentName);
    return parent?.innerBlocks?.filter((candidate: any) => candidate.name === childName).length ?? 0;
  }, [parentType, childType]);
}

test.describe('Compound patterns example', () => {
  test.describe.configure({ mode: 'serial' });

  let wpPage: WordPressPage;

  test.beforeEach(async ({ page }) => {
    wpPage = new WordPressPage(page);
    await wpPage.login();
    await wpPage.createPost('Compound Patterns Example');
  });

  test('compound parent seeds hidden children, survives save/reopen, and renders on the frontend', async () => {
    await wpPage.insertBlock(COMPOUND_PATTERNS_BLOCK);

    await expect
      .poll(async () =>
        getInnerChildCount(wpPage, COMPOUND_PATTERNS_BLOCK.name, COMPOUND_PATTERNS_ITEM_BLOCK.name),
      )
      .toBe(2);

    const inserterButton = wpPage.page
      .getByRole('button', { name: /Block Inserter|Toggle block inserter/i })
      .first();
    await inserterButton.click();
    const searchInput = wpPage.page.getByRole('searchbox').first();
    await searchInput.fill(COMPOUND_PATTERNS_ITEM_BLOCK.title);
    await expect(
      wpPage.page.getByRole('option', { name: COMPOUND_PATTERNS_ITEM_BLOCK.title }),
    ).toHaveCount(0);

    await wpPage.savePost();
    const postId = await wpPage.getCurrentPostId();
    await wpPage.openPostEditor(postId);

    await expect
      .poll(async () =>
        getInnerChildCount(wpPage, COMPOUND_PATTERNS_BLOCK.name, COMPOUND_PATTERNS_ITEM_BLOCK.name),
      )
      .toBe(2);
    await expect(wpPage.getBlockLocator(COMPOUND_PATTERNS_BLOCK.name).first()).toBeVisible();

    await wpPage.publishPost();
    const previewPage = await wpPage.previewPost();

    await expect(previewPage.locator('.wp-block-compound-patterns')).toBeVisible();
    await expect(previewPage.locator('.wp-block-compound-patterns__heading')).toHaveText('Compound Patterns');
    await expect(previewPage.getByText('First Item')).toBeVisible();
    await expect(previewPage.getByText('Second Item')).toBeVisible();

    await previewPage.close();
  });
});
