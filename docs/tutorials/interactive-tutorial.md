# Interactive Tutorial: Building Your First Typia Block

Welcome to the interactive tutorial for WordPress Typia Boilerplate! This hands-on guide will walk you through creating a fully functional, type-safe WordPress block with runtime validation.

## Prerequisites

- Node.js 16+ installed
- WordPress development environment
- Basic knowledge of TypeScript and React

## Step 1: Create Your Block

Let's start by creating a new block using the Basic template:

```bash
npx @wordpress/create-block my-typia-block --template=@wp-typia/basic
cd my-typia-block
npm install
```

## Step 2: Define Your Block Types

Open `src/types.ts` and define your block attributes:

```typescript
import { tags } from "typia";

export interface MyTypiaBlockAttributes {
  /**
   * The main heading text
   */
  title: string &
    tags.MinLength<1> &
    tags.MaxLength<100> &
    tags.Default<"Hello World">;

  /**
   * Subtitle text (optional)
   */
  subtitle?: string &
    tags.MaxLength<200> &
    tags.Default<"">;

  /**
   * Color theme
   */
  theme: ("light" | "dark" | "colorful") &
    tags.Default<"light">;

  /**
   * Animation enabled
   */
  animate: boolean &
    tags.Default<true>;

  /**
   * Number of items to display
   */
  itemCount: number &
    tags.Type<"uint32"> &
    tags.Minimum<1> &
    tags.Maximum<10> &
    tags.Default<3>;
}
```

## Step 3: Generate block.json

Run the sync script to generate WordPress attributes:

```bash
npm run sync-types
```

Check `src/block.json` - it should contain all your attributes with proper types and defaults!

## Step 4: Build the Edit Component

Modify `src/edit.tsx` to create your block editor:

```typescript
import { BlockEditProps } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
  PanelBody,
  TextControl,
  ToggleControl,
  RangeControl,
  SelectControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { MyTypiaBlockAttributes } from './types';
import { createValidators, createAttributeUpdater } from './validators';

type EditProps = BlockEditProps<MyTypiaBlockAttributes>;

const validators = createValidators<MyTypiaBlockAttributes>();

function Edit({ attributes, setAttributes }: EditProps) {
  const blockProps = useBlockProps();
  const updateAttribute = createAttributeUpdater(
    attributes,
    setAttributes,
    validators.validate
  );

  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Block Settings', 'my-typia-block')}>
          <TextControl
            label={__('Title', 'my-typia-block')}
            value={attributes.title || ''}
            onChange={(value) => updateAttribute('title', value)}
          />

          <TextControl
            label={__('Subtitle', 'my-typia-block')}
            value={attributes.subtitle || ''}
            onChange={(value) => updateAttribute('subtitle', value)}
          />

          <SelectControl
            label={__('Theme', 'my-typia-block')}
            value={attributes.theme}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Colorful', value: 'colorful' },
            ]}
            onChange={(value) => updateAttribute('theme', value as any)}
          />

          <ToggleControl
            label={__('Enable Animation', 'my-typia-block')}
            checked={attributes.animate}
            onChange={(value) => updateAttribute('animate', value)}
          />

          <RangeControl
            label={__('Number of Items', 'my-typia-block')}
            value={attributes.itemCount}
            min={1}
            max={10}
            onChange={(value) => updateAttribute('itemCount', value || 1)}
          />
        </PanelBody>
      </InspectorControls>

      <div {...blockProps}>
        <div className={`my-typia-block theme-${attributes.theme}`}>
          <h2 className="my-typia-block__title">
            {attributes.title}
          </h2>
          {attributes.subtitle && (
            <p className="my-typia-block__subtitle">
              {attributes.subtitle}
            </p>
          )}
          <div className="my-typia-block__content">
            {Array.from({ length: attributes.itemCount }, (_, i) => (
              <div
                key={i}
                className={`my-typia-block__item ${
                  attributes.animate ? 'animate' : ''
                }`}
              >
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Edit;
```

## Step 5: Build the Save Component

Modify `src/save.tsx` for frontend rendering:

```typescript
import { useBlockProps } from '@wordpress/block-editor';
import { MyTypiaBlockAttributes } from './types';

interface SaveProps {
  attributes: MyTypiaBlockAttributes;
}

export default function Save({ attributes }: SaveProps) {
  const blockProps = useBlockProps.save();

  return (
    <div {...blockProps}>
      <div className={`my-typia-block theme-${attributes.theme}`}>
        <h2 className="my-typia-block__title">
          {attributes.title}
        </h2>
        {attributes.subtitle && (
          <p className="my-typia-block__subtitle">
            {attributes.subtitle}
          </p>
        )}
        <div className="my-typia-block__content">
          {Array.from({ length: attributes.itemCount }, (_, i) => (
            <div
              key={i}
              className={`my-typia-block__item ${
                attributes.animate ? 'animate' : ''
              }`}
            >
              Item {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Step 6: Add Styles

Update `src/style.scss`:

```scss
.wp-block-my-typia-block {
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &.theme-light {
    background: #ffffff;
    color: #333333;
    border: 1px solid #e0e0e0;
  }

  &.theme-dark {
    background: #1a1a1a;
    color: #ffffff;
    border: 1px solid #333333;
  }

  &.theme-colorful {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border: none;
  }

  &__title {
    margin: 0 0 10px 0;
    font-size: 2em;
    font-weight: bold;
  }

  &__subtitle {
    margin: 0 0 20px 0;
    opacity: 0.8;
  }

  &__content {
    display: grid;
    gap: 10px;
  }

  &__item {
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;

    &.animate {
      animation: fadeIn 0.5s ease forwards;
      opacity: 0;

      @for $i from 1 through 10 {
        &:nth-child(#{$i}) {
          animation-delay: #{$i * 0.1}s;
        }
      }
    }
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
```

## Step 7: Test Your Block

1. Start development:
   ```bash
   npm start
   ```

2. Go to WordPress admin and create a new post

3. Add your block and test:
   - Try entering an invalid title (too long or empty)
   - Change settings in the inspector
   - Verify the block saves and loads correctly

## Step 8: Add Unit Tests

Create `src/__tests__/block.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyTypiaBlockAttributes } from '../types';
import { createValidators } from '../validators';

describe('MyTypiaBlock', () => {
  const validators = createValidators<MyTypiaBlockAttributes>();

  test('should validate correct attributes', () => {
    const validAttrs: MyTypiaBlockAttributes = {
      title: 'Test Title',
      subtitle: 'Test Subtitle',
      theme: 'dark',
      animate: true,
      itemCount: 5,
    };

    const result = validators.validate(validAttrs);
    expect(result.success).toBe(true);
  });

  test('should reject invalid title length', () => {
    const invalidAttrs: MyTypiaBlockAttributes = {
      title: '', // Too short
      theme: 'light',
      animate: false,
      itemCount: 1,
    };

    const result = validators.validate(invalidAttrs);
    expect(result.success).toBe(false);
  });

  test('should generate valid random attributes', () => {
    const randomAttrs = validators.random();
    const result = validators.validate(randomAttrs);
    expect(result.success).toBe(true);
  });
});
```

## Step 9: Add E2E Tests

Create `tests/e2e/my-block.spec.ts`:

```typescript
import { test, expect } from './fixtures/wordpress';

test.describe('My Typia Block', () => {
  test('should create and configure block', async ({ adminPage }) => {
    await adminPage.goto('/wp-admin/post-new.php');
    await adminPage.insertBlock('My Typia Block');

    // Configure block
    await adminPage.fill('label="Title"', 'E2E Test Title');
    await adminPage.fill('label="Subtitle"', 'E2E Subtitle');
    await adminPage.selectOption('label="Theme"', 'Dark');
    await adminPage.check('label="Enable Animation"');

    // Save post
    await adminPage.savePost();

    // Verify block content
    await expect(adminPage.locator('.my-typia-block__title')).toContainText('E2E Test Title');
    await expect(adminPage.locator('.my-typia-block')).toHaveClass(/theme-dark/);
  });

  test('should validate input', async ({ adminPage }) => {
    await adminPage.goto('/wp-admin/post-new.php');
    await adminPage.insertBlock('My Typia Block');

    // Try to clear required title
    await adminPage.fill('label="Title"', '');

    // Should show validation error
    await expect(adminPage.locator('.components-notice__content')).toBeVisible();
  });
});
```

## What's Next?

Congratulations! You've built a type-safe WordPress block with runtime validation. Here's what you can explore next:

1. **Add Interactivity API**: Upgrade to the Interactivity template
2. **Add Migrations**: Use the Advanced template for version management
3. **Custom Validators**: Create custom validation logic
4. **Block Variations**: Add multiple block variations
5. **Nested Blocks**: Support inner blocks

## Additional Resources

- [Typia Documentation](https://typia.io/)
- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Interactivity API Guide](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)

---

Happy coding! 🚀