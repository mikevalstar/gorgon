---
name: core
description: >
  Core caching with @gorgonjs/gorgon: Gorgon.get, Gorgon.put, Gorgon.clear
  (with wildcards), Gorgon.overwrite, expiry policies, cache key naming,
  concurrency deduplication, hooks, settings, custom storage providers via
  IGorgonCacheProvider, @gorgonjs/file-provider for disk persistence, and
  @gorgonjs/clearlink for distributed cache invalidation via WebSocket.
  Use when caching API calls, database queries, or any async operation in
  TypeScript/JavaScript.
type: core
library: gorgon
library_version: "1.6.0"
sources:
  - "mikevalstar/gorgon:library/index.ts"
  - "mikevalstar/gorgon:gorgonjs.dev/src/pages/docs/usage/get.md"
  - "mikevalstar/gorgon:gorgonjs.dev/src/pages/docs/usage/policies.md"
  - "mikevalstar/gorgon:gorgonjs.dev/src/pages/docs/concurrency.md"
  - "mikevalstar/gorgon:gorgonjs.dev/src/pages/docs/custom-storage.md"
---

# Gorgon.js — Core Caching

Gorgon is a lightweight (~4kb, ~1.3kb gzipped) TypeScript caching library for async functions. It works in Node.js and browsers. Its key feature is automatic concurrency protection — multiple simultaneous requests for the same cache key are deduplicated, with all callers sharing the same result. Errors are never cached.

## Setup

```typescript
import Gorgon from '@gorgonjs/gorgon';

const user = await Gorgon.get(`user/${id}`, async () => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}, 60 * 1000); // cache for 1 minute
```

For React usage, see `react/SKILL.md`.

## Core Patterns

### Cache an async function with typed return

```typescript
import Gorgon from '@gorgonjs/gorgon';

interface User { id: number; name: string; email: string; }

const getUser = (id: number): Promise<User> =>
  Gorgon.get(`user/${id}`, async () => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  }, 60 * 1000);
```

The return type flows through — `getUser` returns `Promise<User>` with full type safety.

### Cache key naming for wildcard invalidation

Use the format `type/id/sub-id` so you can clear groups with wildcards:

```typescript
await Gorgon.get(`user/${id}/profile`, fetchProfile, 60000);
await Gorgon.get(`user/${id}/posts`, fetchPosts, 60000);
await Gorgon.get(`user/${id}/settings`, fetchSettings, 60000);

// Clear everything for a user at once
Gorgon.clear(`user/${id}/*`);
```

### Directly insert or force-refresh cached data

```typescript
// Insert a value directly
await Gorgon.put(`user/${id}`, userData, 60000);

// Force-refresh (always executes the function, no dedup)
const updated = await Gorgon.overwrite(`user/${id}`, async () => {
  return fetch(`/api/users/${id}`).then(r => r.json());
}, 60000);
```

### Expiry policies

```typescript
// Milliseconds from now
Gorgon.get('key', fn, 60000);

// Specific date
Gorgon.get('key', fn, new Date('2026-12-31'));

// Cache forever (use with caution — see Common Mistakes)
Gorgon.get('key', fn, false);

// No policy — cached until manually cleared
Gorgon.get('key', fn);

// Full policy object — specify provider and expiry
Gorgon.get('key', fn, { expiry: 60000, provider: 'file' });
```

### Configure global settings

```typescript
Gorgon.settings({
  debug: true,               // log cache hits/misses to console
  defaultProvider: 'memory', // which storage provider to use
  retry: 5000                // ms before a "stuck" request retries (default: 5000)
});
```

### Hook into cache lifecycle events

```typescript
Gorgon.addHook('clear', (key, input, output) => {
  console.log('Cache cleared:', input);
});

Gorgon.addHook('valueError', (key, input, output) => {
  console.error('Cache function threw:', output);
});
```

Available events: `settings`, `addProvider`, `put`, `clear`, `clearAll`, `overwrite`, `get`, `valueError`.

### Custom storage providers

Implement `IGorgonCacheProvider` for Redis, IndexedDB, localStorage, etc.:

```typescript
import Gorgon, { IGorgonCacheProvider, GorgonPolicySanitized } from '@gorgonjs/gorgon';

const myProvider: IGorgonCacheProvider = {
  init: async () => {},
  get: async (key: string) => { /* return cached value or undefined */ },
  set: async <R>(key: string, value: R, policy: GorgonPolicySanitized): Promise<R> => {
    /* store value, policy.expiry is ms or false */
    return value;
  },
  clear: async (key?: string) => { /* clear key or all */ return true; },
  keys: async () => { /* return all keys */ return []; },
};

Gorgon.addProvider('my-provider', myProvider);
Gorgon.settings({ defaultProvider: 'my-provider' });
```

### File provider — persist cache to disk (server-side)

```typescript
import Gorgon from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

const fileCache = FileProvider('./cache', {
  createSubfolder: false, // true creates a dated subfolder
  clearFolder: false       // true clears the directory on init
});
Gorgon.addProvider('file', fileCache);

const movie = await Gorgon.get(`movie/${id}`, async () => {
  return fetch(`https://api.example.com/movie/${id}`).then(r => r.json());
}, { provider: 'file', expiry: false });
```

File provider uses `JSON.stringify` — only serializable data. For `Date`, `Set`, `Map`, use the `superjson` library.

### ClearLink — sync cache clearing across servers

```typescript
// Server
import { server } from '@gorgonjs/clearlink';
server.init({ port: 8686 });

// Client (on each app instance)
import Gorgon from '@gorgonjs/gorgon';
import { client } from '@gorgonjs/clearlink';

client.connect('ws://127.0.0.1:8686');
client.apply(Gorgon); // hooks into clear and clearAll events

// Now Gorgon.clear() on any instance broadcasts to all others
```

Only `clear` and `clearAll` are synced (not `put` or auto-expiry). Auto-reconnects after 10 seconds on disconnect.

## Common Mistakes

### CRITICAL Not clearing cache after mutating underlying data

Wrong:

```typescript
const user = await Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
await updateUser(id, newData);
// Forgot to clear — subsequent reads return stale data
```

Correct:

```typescript
const user = await Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
await updateUser(id, newData);
Gorgon.clear(`user/${id}`);
```

Gorgon does not know when the underlying data changes. Always clear the relevant cache key after any mutation (POST, PUT, DELETE) that affects cached data.

Source: maintainer interview

### CRITICAL Cache keys not specific enough to input parameters

Wrong:

```typescript
const results = await Gorgon.get('search-results', () =>
  searchAPI(query, page, filters), 60000);
```

Correct:

```typescript
const results = await Gorgon.get(
  `search/${query}/${page}/${JSON.stringify(filters)}`,
  () => searchAPI(query, page, filters), 60000);
```

If the cache key does not include all varying parameters, different requests share the same cached result, returning wrong data silently.

Source: maintainer interview

### HIGH Caching forever without expiry in production

Wrong:

```typescript
await Gorgon.get('config', fetchConfig, false);
```

Correct:

```typescript
await Gorgon.get('config', fetchConfig, 24 * 60 * 60 * 1000); // 1 day
```

Even rarely-changing data should have an expiry. Permanent caches become stale silently and are hard to debug in production.

Source: maintainer interview

### MEDIUM Aligned cache expiry causing thundering herd

Wrong:

```typescript
for (const id of popularIds) {
  await Gorgon.get(`item/${id}`, () => fetchItem(id), 3600000);
}
```

Correct:

```typescript
for (const id of popularIds) {
  const fuzz = Math.random() * 600000; // up to 10 min variance
  await Gorgon.get(`item/${id}`, () => fetchItem(id), 3600000 + fuzz);
}
```

When many items share the same TTL, they all expire simultaneously causing a burst of requests. Fuzz the expiry to spread cache refreshes over time.

Source: maintainer interview

### HIGH Using a plain Map or global object instead of Gorgon

Wrong:

```typescript
const cache = new Map();
async function getUser(id: number) {
  if (cache.has(id)) return cache.get(id);
  const user = await fetchUser(id);
  cache.set(id, user);
  return user;
}
```

Correct:

```typescript
import Gorgon from '@gorgonjs/gorgon';

const getUser = (id: number) =>
  Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
```

A hand-rolled cache misses concurrency deduplication (10 simultaneous calls hit the API 10 times), has no expiry management, no wildcard clearing, and no type safety on cached returns.

Source: documentation — concurrency

### MEDIUM Wrapping Gorgon.get in custom deduplication logic

Wrong:

```typescript
const pending = new Map<string, Promise<any>>();
async function getUser(id: number) {
  const key = `user/${id}`;
  if (pending.has(key)) return pending.get(key);
  const promise = Gorgon.get(key, () => fetchUser(id), 60000);
  pending.set(key, promise);
  const result = await promise;
  pending.delete(key);
  return result;
}
```

Correct:

```typescript
import Gorgon from '@gorgonjs/gorgon';

const getUser = (id: number) =>
  Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
```

Gorgon already deduplicates concurrent requests for the same key. External dedup is redundant and can introduce bugs with stale promise references.

Source: documentation — concurrency

### HIGH Tension: Cache duration vs data freshness

Longer cache times improve performance but increase risk of stale data. Agents optimizing for performance tend to set very long TTLs without an invalidation strategy; agents optimizing for correctness set very short TTLs, defeating the purpose of caching. Choose a TTL appropriate for the data's change frequency and always pair it with explicit `Gorgon.clear()` calls on mutation.

See also: `react/SKILL.md` § Common Mistakes

## Version

Targets @gorgonjs/gorgon v1.6.0.
