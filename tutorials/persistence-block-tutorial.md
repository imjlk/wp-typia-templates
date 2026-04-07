# Persistence Block Tutorial: Building Data-Backed Blocks with `@wp-typia/create`

This tutorial walks through creating a WordPress block with server-side persistence using the `persistence` template. You'll learn how to build blocks that store and retrieve data via the WordPress REST API with type-safe validation.

## Prerequisites

- Node.js 24+ installed
- WordPress development environment (wp-env or local server)
- Basic knowledge of TypeScript, React, and WordPress REST API
- Familiarity with the [Basic Block Tutorial](./basic-block-tutorial.md)

## What is the Persistence Template?

The `persistence` template extends the basic block pattern with:

- **REST API Integration**: Typed client-side helpers via `@wp-typia/rest`
- **Server-Side Storage**: Choose between `post-meta` or `custom-table` storage
- **Access Policies**: `authenticated` (logged-in users) or `public` (anonymous with tokens)
- **Schema Generation**: Automatic OpenAPI and JSON Schema for your REST contracts

## Step 1: Create Your Block

```bash
npx @wp-typia/create my-counter --template persistence --package-manager npm --yes --no-install
cd my-counter
npm install
```

### Template Options

The persistence template accepts additional CLI flags:

| Flag | Values | Description |
|------|--------|-------------|
| `--data-storage` | `post-meta`, `custom-table` (default) | Where to persist data |
| `--persistence-policy` | `authenticated` (default), `public` | Who can write data |
| `--with-wp-env` | flag | Add local `wp-env` scripts and `.wp-env.json` |
| `--with-test-preset` | flag | Add a test-only `wp-env` config and minimal Playwright smoke test |

Example with custom options:

```bash
npx @wp-typia/create my-counter \
  --template persistence \
  --data-storage custom-table \
  --persistence-policy public \
  --package-manager npm \
  --yes \
  --no-install
```

## Step 2: Understand the Generated Structure

The persistence template scaffolds the same editor/runtime foundation as the other built-ins, plus persistence-specific source files:

```text
my-counter/
├── src/
│   ├── api-types.ts
│   ├── api-validators.ts
│   ├── api.ts
│   ├── block.json
│   ├── edit.tsx
│   ├── hooks.ts
│   ├── index.tsx
│   ├── interactivity.ts
│   ├── render.php
│   ├── save.tsx
│   ├── style.scss
│   ├── types.ts
│   └── validators.ts
├── scripts/
│   ├── sync-rest-contracts.ts
│   └── sync-types-to-block-json.ts
├── my-counter.php
├── package.json
├── tsconfig.json
└── webpack.config.js
```

Fresh scaffolds already include a starter `src/typia.manifest.json` so editor/runtime imports resolve before the first sync. After you run `npm run sync-types`, `npm run dev`, or `npm run start`, the scaffold also generates:

- `src/typia.manifest.json`
- `src/typia.schema.json`
- `src/typia.openapi.json`
- `src/typia-validator.php`

After you run `npm run sync-rest`, `npm run dev`, or `npm run start`, it also generates:

- `src/api.openapi.json`
- `src/api-schemas/*.schema.json`
- `src/api-schemas/*.openapi.json`

## Step 3: Define Your Block Types

Open `src/types.ts` to see the generated types:

```typescript
import type { TextAlignment } from '@wp-typia/block-types/block-editor/alignment';
import { tags } from 'typia';

export interface MyCounterAttributes {
  content: string &
    tags.MinLength<1> &
    tags.MaxLength<250> &
    tags.Default<'My Counter persistence block'>;
  alignment?: TextAlignment & tags.Default<'left'>;
  isVisible?: boolean & tags.Default<true>;
  showCount?: boolean & tags.Default<true>;
  buttonLabel?: string &
    tags.MinLength<1> &
    tags.MaxLength<40> &
    tags.Default<'Persist Count'>;
  resourceKey?: string &
    tags.MinLength<1> &
    tags.MaxLength<100> &
    tags.Default<'primary'>;
}

// Context passed from server to client
export interface MyCounterContext {
  buttonLabel: string;
  canWrite: boolean;
  count: number;
  persistencePolicy: 'authenticated' | 'public';
  postId: number;
  publicWriteExpiresAt?: number;
  publicWriteToken?: string;
  resourceKey: string;
  restNonce?: string;
  storage: 'post-meta' | 'custom-table';
  isVisible: boolean;
}

// Client-side state
export interface MyCounterState {
  canWrite: boolean;
  count: number;
  error?: string;
  isHydrated: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isVisible: boolean;
}
```

## Step 4: Define REST API Types

Open `src/api-types.ts` to define your REST contracts:

```typescript
import { tags } from 'typia';

export interface MyCounterStateQuery {
  postId: number & tags.Type<'uint32'>;
  resourceKey: string & tags.MinLength<1> & tags.MaxLength<100>;
}

export interface MyCounterWriteStateRequest {
  postId: number & tags.Type<'uint32'>;
  publicWriteRequestId: string & tags.MinLength<1> & tags.MaxLength<128>;
  publicWriteToken?: string & tags.MinLength<1> & tags.MaxLength<512>;
  resourceKey: string & tags.MinLength<1> & tags.MaxLength<100>;
  delta?: number & tags.Minimum<1> & tags.Type<'uint32'> & tags.Default<1>;
}

export interface MyCounterStateResponse {
  postId: number & tags.Type<'uint32'>;
  resourceKey: string & tags.MinLength<1> & tags.MaxLength<100>;
  count: number & tags.Minimum<0> & tags.Type<'uint32'>;
  storage: 'post-meta' | 'custom-table';
}
```

## Step 5: Use the REST Client

The generated `src/api.ts` provides typed helpers:

```typescript
import {
  callEndpoint,
  createEndpoint,
  resolveRestRouteUrl,
} from '@wp-typia/rest';
import { apiValidators } from './api-validators';
import type {
  MyCounterStateQuery,
  MyCounterStateResponse,
  MyCounterWriteStateRequest,
} from './api-types';

const STATE_PATH = '/my-counter/v1/my-counter/state';

export const stateEndpoint = createEndpoint<
  MyCounterStateQuery,
  MyCounterStateResponse
>({
  buildRequestOptions: () => ({
    url: resolveRestRouteUrl(STATE_PATH),
  }),
  method: 'GET',
  path: STATE_PATH,
  validateRequest: apiValidators.stateQuery,
  validateResponse: apiValidators.stateResponse,
});

export const writeStateEndpoint = createEndpoint<
  MyCounterWriteStateRequest,
  MyCounterStateResponse
>({
  buildRequestOptions: () => ({
    url: resolveRestRouteUrl(STATE_PATH),
  }),
  method: 'POST',
  path: STATE_PATH,
  validateRequest: apiValidators.writeStateRequest,
  validateResponse: apiValidators.stateResponse,
});

export function fetchState(request: MyCounterStateQuery) {
  return callEndpoint(stateEndpoint, request);
}

export function writeState(
  request: MyCounterWriteStateRequest,
  restNonce?: string
) {
  return callEndpoint(writeStateEndpoint, request, {
    requestOptions: restNonce
      ? {
          headers: {
            'X-WP-Nonce': restNonce,
          },
        }
      : undefined,
  });
}
```

By default, the namespace follows the normalized project slug, so a scaffolded `my-counter` project generates `/my-counter/v1/my-counter/state` unless you change the namespace during scaffolding.

## Step 6: Implement Frontend Interactivity

The `src/interactivity.ts` file uses the WordPress Interactivity API:

```typescript
import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';
import { fetchState, writeState } from './api';
import type { MyCounterContext, MyCounterState } from './types';

function hasExpiredPublicWriteToken(context: MyCounterContext): boolean {
  return (
    context.persistencePolicy === 'public' &&
    typeof context.publicWriteExpiresAt === 'number' &&
    context.publicWriteExpiresAt > 0 &&
    Date.now() >= context.publicWriteExpiresAt * 1000
  );
}

function getWriteBlockedMessage(context: MyCounterContext): string {
  return context.persistencePolicy === 'authenticated'
    ? 'Sign in to persist this counter.'
    : 'Reload the page to refresh this write token.';
}

const { actions, state } = store('my-counter', {
  state: {
    canWrite: false,
    count: 0,
    error: undefined,
    isHydrated: false,
    isLoading: false,
    isSaving: false,
    isVisible: true,
  } as MyCounterState,

  actions: {
    async loadCounter() {
      const context = getContext<MyCounterContext>();
      if (context.postId <= 0 || !context.resourceKey) {
        return;
      }

      state.isLoading = true;
      state.error = undefined;

      try {
        const result = await fetchState({
          postId: context.postId,
          resourceKey: context.resourceKey,
        });

        if (!result.isValid || !result.data) {
          state.error = result.errors[0]?.expected ?? 'Unable to load counter';
          return;
        }

        context.count = result.data.count;
        context.storage = result.data.storage;
        state.count = result.data.count;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        state.isLoading = false;
      }
    },

    async increment() {
      const context = getContext<MyCounterContext>();
      if (context.postId <= 0 || !context.resourceKey) {
        return;
      }
      if (hasExpiredPublicWriteToken(context)) {
        context.canWrite = false;
        state.canWrite = false;
        state.error = getWriteBlockedMessage(context);
        return;
      }
      if (!context.canWrite || !state.canWrite) {
        state.error = getWriteBlockedMessage(context);
        return;
      }

      state.isSaving = true;
      state.error = undefined;

      try {
        const result = await writeState(
          {
            delta: 1,
            postId: context.postId,
            publicWriteRequestId:
              context.persistencePolicy === 'public'
                ? generatePublicWriteRequestId()
                : undefined,
            publicWriteToken:
              context.persistencePolicy === 'public'
                ? context.publicWriteToken
                : undefined,
            resourceKey: context.resourceKey,
          },
          context.restNonce
        );

        if (!result.isValid || !result.data) {
          state.error = result.errors[0]?.expected ?? 'Unable to update counter';
          return;
        }

        context.count = result.data.count;
        context.storage = result.data.storage;
        state.count = result.data.count;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        state.isSaving = false;
      }
    },
  },

  callbacks: {
    init() {
      const context = getContext<MyCounterContext>();
      context.canWrite = context.canWrite && !hasExpiredPublicWriteToken(context);
      state.canWrite = context.canWrite;
      state.isVisible = context.isVisible;
      state.count = context.count;
    },
    mounted() {
      state.isHydrated = true;
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.myCounterHydrated = 'true';
      }
      void actions.loadCounter();
    },
  },
});
```

## Step 7: Server-Side Render

The `render.php` file provides the initial SSR output with context:

```php
<?php
$validator = require __DIR__ . '/typia-validator.php';
$normalized = $validator->apply_defaults($attributes);
$validation = $validator->validate($normalized);

if (empty($validation['valid'])) {
    return '';
}

$resourceKey = (string) $normalized['resourceKey'];
$post_id = $block->context['postId'] ?? get_queried_object_id();
$persistence_policy = 'authenticated'; // scaffold replaces this with the selected policy
$storage_mode = 'custom-table'; // scaffold replaces this with the selected storage mode
$can_write = false;

$context = [
    'buttonLabel' => (string) $normalized['buttonLabel'],
    'canWrite' => false,
    'count' => 0,
    'isVisible' => ! empty($normalized['isVisible']),
    'persistencePolicy' => $persistence_policy,
    'postId' => (int) $post_id,
    'resourceKey' => $resourceKey,
    'storage' => $storage_mode,
];

if ('authenticated' === $persistence_policy) {
    $can_write = $post_id > 0 && is_user_logged_in();
    if ($can_write) {
        $context['restNonce'] = wp_create_nonce('wp_rest');
    }
} elseif ($post_id > 0 && function_exists('my_counter_create_public_write_token')) {
    $public_write = my_counter_create_public_write_token((int) $post_id, $resourceKey);
    if (is_array($public_write) && ! empty($public_write['token'])) {
        $context['publicWriteToken'] = (string) $public_write['token'];
        $context['publicWriteExpiresAt'] = (int) ($public_write['expiresAt'] ?? 0);
        $can_write = true;
    }
}

$context['canWrite'] = $can_write;

$wrapper_attributes = get_block_wrapper_attributes([
    'data-wp-context' => wp_json_encode($context),
    'data-wp-interactive' => 'my-counter',
    'data-wp-init' => 'callbacks.init',
    'data-wp-run--mounted' => 'callbacks.mounted',
]);
?>

<div <?php echo $wrapper_attributes; ?>>
    <span data-wp-text="state.count">0</span>
    <button
        type="button"
        <?php echo $can_write ? '' : 'disabled'; ?>
        data-wp-bind--disabled="!context.canWrite"
        data-wp-on--click="actions.increment"
    >
        <?php echo esc_html($normalized['buttonLabel']); ?>
    </button>
</div>
```

## Step 8: Generate REST Schemas

Run the sync script to generate OpenAPI and JSON Schema files:

```bash
npm run sync-rest
```

This creates:
- `src/api.openapi.json` - endpoint-aware REST documentation for the scaffolded routes
- `src/api-schemas/*.schema.json` - JSON Schema files
- `src/api-schemas/*.openapi.json` - per-contract OpenAPI compatibility fragments

You only need to run `npm run sync-types` / `npm run sync-rest` manually when you want generated metadata and REST schemas refreshed before `npm run build`, `npm run typecheck`, or commit. The generated `dev` workflow watches both sync commands for persistence scaffolds, `npm run start` still runs them as one-shot syncs, and both `npm run build` and `npm run typecheck` verify that the checked-in artifacts are already current. `npm run sync-types` stays warn-only by default, `npm run sync-types -- --fail-on-lossy` fails only on lossy WordPress projection warnings, and `npm run sync-types -- --strict --report json` emits a CI-friendly JSON report while failing on every warning. They do not create migration history.

For persistence scaffolds, `src/api.openapi.json` is the canonical REST document because it includes the actual route paths, methods, and auth policy metadata. The files in `src/api-schemas/` remain useful per-contract artifacts for validation and compatibility.

For actual customization work:

- edit `my-counter.php` when you need to change storage helpers, route handlers, response shaping, or route registration
- edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to change the write permission policy
- keep `src/api-types.ts` as the source of truth for contracts and regenerate `src/api-schemas/*` plus `src/api.openapi.json` instead of hand-maintaining those generated artifacts

These schemas can be used for:
- API documentation
- Client SDK generation
- Contract testing

## Step 9: Test Your Block

### Local Development

```bash
npm run dev
```

### Mount the Plugin Into WordPress

By default, load the generated plugin into your existing WordPress development environment and activate it there. If you scaffold with `--with-wp-env`, the generated project also includes local `wp-env:start`, `wp-env:stop`, and `wp-env:reset` scripts. If you scaffold with `--with-test-preset`, it additionally includes `.wp-env.test.json`, a minimal Playwright smoke test, and `wp-env:start:test` / `test:e2e` scripts.

Typical flow:

1. Keep the scaffold running with `npm run dev`
2. Mount or symlink the generated plugin into a WordPress install
3. Activate the plugin in `wp-admin`
4. Insert the block into a post or page

### Test the REST API

```bash
# Get counter value
curl "http://localhost:8888/wp-json/my-counter/v1/my-counter/state?postId=1&resourceKey=primary"

# Increment counter (default authenticated policy)
curl -X POST \
  -H "X-WP-Nonce: <wp-rest-nonce>" \
  -H "Content-Type: application/json" \
  -d '{"postId":1,"resourceKey":"primary","delta":1}' \
  "http://localhost:8888/wp-json/my-counter/v1/my-counter/state"
```

If you scaffold with `--persistence-policy public`, send the `publicWriteToken` that the block render embeds in its frontend context plus a fresh `publicWriteRequestId` for each write attempt instead of a REST nonce.

Scaffolded validators and interactivity modules now use
`@wp-typia/block-runtime/identifiers` as the shared source of truth for
generated `resourceKey` and `publicWriteRequestId` values instead of carrying
local inline generator helpers.

## Understanding Storage Modes

### Post Meta (`post-meta`)

Data stored in WordPress post meta:
- Simple setup, no additional tables
- Good for per-post counters
- Limited scalability for high-volume writes

### Custom Table (`custom-table`)

Data stored in a dedicated table:
- Better performance at scale
- Requires migration on plugin activation
- Supports aggregated counters across posts

## Understanding Access Policies

### Authenticated

- Requires logged-in user
- Uses WordPress REST nonce for CSRF protection
- User context available in handlers

### Public

- Anonymous writes allowed
- Uses signed short-lived tokens
- Requires a fresh request id per write attempt
- Applies coarse rate limiting before the write handler runs
- Token embedded in render output, validated on write

For experiments, impressions, or other high-value metrics, treat those defaults as a starting point and add application-specific abuse controls.

## Generated Plugin Bootstrap

The main PHP file (`my-counter.php`) includes:

- REST route registration
- Storage backend initialization
- Public token signing (for `public` policy)
- Custom table migrations (for `custom-table` storage)

## What's Next?

1. **Add Custom Endpoints**: Extend the REST API with additional routes
2. **Tune Rate Limiting**: Adjust the default public write guardrails for your traffic profile
3. **Add Caching**: Cache counter values for better performance
4. **Extend Validation**: Add custom validation rules in `api-validators.ts`
5. **Move to Compound Parent/Child Blocks**: Start from the [Compound Block Tutorial](./compound-block-tutorial.md) when the persisted behavior belongs on a top-level container block with internal children

## Additional Resources

- [Basic Block Tutorial](./basic-block-tutorial.md)
- [Compound Block Tutorial](./compound-block-tutorial.md)
- [API Reference](../API.md)
- [@wp-typia/rest Documentation](../../packages/wp-typia-rest/README.md)
- [WordPress Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)

---

Happy coding! 🚀
