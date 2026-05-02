---
npm/@wp-typia/rest: patch
---

Ensure React query cache invalidation uses monotonic cache revisions so same-millisecond invalidations refetch reliably without skewing stale-time timestamps.
