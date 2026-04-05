---
npm/@wp-typia/api-client: minor
npm/@wp-typia/create: minor
---

Add first-class mixed `{ query, body }` request support to generated portable
endpoint clients so `syncEndpointClient(...)` and `@wp-typia/api-client` can
handle endpoints that define both `queryContract` and `bodyContract`.
