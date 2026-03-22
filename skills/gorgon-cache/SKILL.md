---
name: gorgon-cache
description: How to use the @gorgonjs/gorgon caching library for async functions in TypeScript/JavaScript. Use this skill whenever the user wants to cache API calls, database queries, or any async operation; when they mention Gorgon, @gorgonjs, or ask about caching promises/async functions; when they need help with cache invalidation, expiry policies, custom storage providers, or React cache hooks; or when they're building a Node.js or browser app that would benefit from request deduplication or caching. Also trigger when the user is working in a project that already imports @gorgonjs/gorgon and needs guidance.
---

# Gorgon.js Caching Library

Gorgon is a lightweight (~4kb, ~1.3kb gzipped) TypeScript caching library for async functions. It works in both Node.js and browsers. Its key differentiator is **automatic concurrency protection** — multiple simultaneous requests for the same cache key are deduplicated, with all callers receiving the same result.

## Installation

```bash
npm install @gorgonjs/gorgon
# or: pnpm add @gorgonjs/gorgon / yarn add @gorgonjs/gorgon
```

## Core Concepts

1. **Cache key naming**: Use the format `cachetype/{id}/{sub-id}` — this enables wildcard clearing (e.g. `Gorgon.clear('user/*')`)
2. **Concurrency protection**: If 10 requests hit `Gorgon.get('key', fn)` simultaneously, `fn` only executes once. The other 9 wait and share the result.
3. **Errors are never cached**: If the async function throws, all waiting callers get the error, but the next request retries fresh.
4. **Expiry options**: milliseconds (`60000`), a `Date` object, `false` (cache forever), or omit for no expiry.

## API Reference

### `Gorgon.get<R>(key, asyncFunc, policy?): Promise<R>`

The primary method — fetches from cache or executes the function and caches the result.

```typescript
import Gorgon from '@gorgonjs/gorgon';

const user = await Gorgon.get(`user/${id}`, async () => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}, 60 * 1000); // cache for 1 minute
```

### `Gorgon.put<R>(key, value, policy?): Promise<R>`

Directly insert a value into cache.

```typescript
await Gorgon.put(`user/${id}`, userData, 60 * 1000);
```

### `Gorgon.clear(key, provider?): Promise<boolean | boolean[]>`

Clear a cache key. Supports wildcard patterns with `*`.

```typescript
Gorgon.clear(`user/${id}`);     // single key
Gorgon.clear(`user/*`);         // all user keys
```

### `Gorgon.clearAll(provider?): Promise<boolean>`

Clear all cached data.

### `Gorgon.overwrite<R>(key, asyncFunc, policy?): Promise<R>`

Force-refresh a cache key. Unlike `get`, this always executes the function. Does NOT have concurrency protection.

```typescript
const updated = await Gorgon.overwrite(`user/${id}`, async () => {
  return fetch(`/api/users/${id}`).then(r => r.json());
}, 60 * 1000);
```

### `Gorgon.settings(newSettings?): GorgonSettings`

Configure global defaults.

```typescript
Gorgon.settings({
  debug: true,           // log cache hits/misses
  defaultProvider: 'memory', // which provider to use
  retry: 5000            // ms before a "stuck" request is retried (default: 5000)
});
```

### `Gorgon.addProvider(name, provider): void`

Register a custom storage backend.

```typescript
import Gorgon from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

const fileCache = FileProvider('./cache', { createSubfolder: false });
Gorgon.addProvider('file', fileCache);
Gorgon.settings({ defaultProvider: 'file' });
```

### `Gorgon.addHook(event, callback): void`

Listen to cache lifecycle events. Events: `settings`, `addProvider`, `put`, `clear`, `clearAll`, `overwrite`, `get`, `valueError`.

```typescript
Gorgon.addHook('clear', (key, input, output) => {
  console.log('Cache cleared:', input);
});
```

## Policies

Policies control expiry and which provider to use:

```typescript
// Milliseconds
Gorgon.get('key', fn, 60000);

// Date object
Gorgon.get('key', fn, new Date('2026-12-31'));

// Cache forever (use with caution — see Common Mistakes)
Gorgon.get('key', fn, false);

// Full policy object (specify provider)
Gorgon.get('key', fn, { expiry: 60000, provider: 'file' });
```

## Common Patterns

### Query collocation — keep fetch logic next to where it's used

```typescript
// queries/todos.ts
import Gorgon from '@gorgonjs/gorgon';

export const getTodo = (id: number) =>
  Gorgon.get(`todo/${id}`, async () => {
    const res = await fetch(`https://api.example.com/todos/${id}`);
    return res.json();
  }, 60 * 1000);
```

### Cache with file persistence (server-side)

```typescript
import Gorgon from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

const fileCache = FileProvider('./cache', { createSubfolder: false });
Gorgon.addProvider('perm', fileCache);

const movie = await Gorgon.get(`movie/${id}`, async () => {
  return fetch(`https://api.themoviedb.org/3/movie/${id}`).then(r => r.json());
}, { provider: 'perm', expiry: false });
```

### Error handling

```typescript
try {
  const data = await Gorgon.get('flaky-api', async () => {
    const res = await fetch('/api/flaky');
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, 30000);
} catch (e) {
  // Error is NOT cached — next call will retry
  console.error(e);
}
```

## Common Mistakes

### CRITICAL: Not clearing cache after mutating underlying data

```typescript
// Wrong — forgets to clear after mutation
const user = await Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
await updateUser(id, newData);

// Correct — clear the cache key after mutation
const user = await Gorgon.get(`user/${id}`, () => fetchUser(id), 60000);
await updateUser(id, newData);
Gorgon.clear(`user/${id}`);
```

Gorgon does not know when the underlying data changes. Always clear the relevant cache key after any mutation that affects cached data.

### CRITICAL: Cache keys not specific enough to input parameters

```typescript
// Wrong — same key regardless of varying inputs
const results = await Gorgon.get('search-results', () =>
  searchAPI(query, page, filters), 60000);

// Correct — serialize all input params into the key
const results = await Gorgon.get(
  `search/${query}/${page}/${JSON.stringify(filters)}`,
  () => searchAPI(query, page, filters), 60000);
```

If the cache key does not include all varying parameters, different requests share the same cached result, returning wrong data silently.

### HIGH: Caching forever without expiry in production

```typescript
// Wrong — data becomes permanently stale
await Gorgon.get('config', fetchConfig, false);

// Correct — always set an expiry, even if long
await Gorgon.get('config', fetchConfig, 24 * 60 * 60 * 1000); // 1 day
```

Even rarely-changing data should have an expiry. Permanent caches become stale silently and are hard to debug.

### MEDIUM: Aligned cache expiry causing thundering herd

```typescript
// Wrong — all items expire simultaneously
for (const id of popularIds) {
  await Gorgon.get(`item/${id}`, () => fetchItem(id), 3600000);
}

// Correct — fuzz expiry to spread out cache refreshes
for (const id of popularIds) {
  const fuzz = Math.random() * 600000; // up to 10 min variance
  await Gorgon.get(`item/${id}`, () => fetchItem(id), 3600000 + fuzz);
}
```

When warming caches for many popular items, fuzz the expiry times so they don't all expire at once causing a burst of requests.

### HIGH: Using a plain Map instead of Gorgon

A hand-rolled `Map`-based cache misses concurrency deduplication (10 simultaneous calls hit the API 10 times), has no expiry management, no wildcard clearing, and no type safety on cached returns. Use `Gorgon.get` instead.

### MEDIUM: Wrapping Gorgon.get in custom deduplication

Gorgon already deduplicates concurrent requests for the same key. Adding external dedup logic is redundant and can introduce bugs.

## Reference Files

- `references/react.md` — React hooks (useGorgon) and integration patterns
- `references/providers-and-plugins.md` — Custom provider interface, file provider, ClearLink plugin

Read the appropriate reference file when the user's question involves those topics.
