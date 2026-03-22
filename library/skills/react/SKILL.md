---
name: react
description: >
  React integration for @gorgonjs/gorgon via @gorgonjs/react: useGorgon hook
  with data/error/loading/refetch state, clearGorgon helper for cache
  invalidation from components, cache key management tied to component
  lifecycle, and DIY hook patterns. Use when building React components
  that need cached async data fetching.
type: framework
library: gorgon
framework: react
library_version: "1.6.0"
requires:
  - core
sources:
  - "mikevalstar/gorgon:clients/react/index.ts"
  - "mikevalstar/gorgon:gorgonjs.dev/src/pages/docs/ui/react.md"
---

This skill builds on `core/SKILL.md`. Read the core skill first for cache key naming, policies, and clearing patterns.

# Gorgon.js — React

## Setup

```bash
npm install @gorgonjs/react @gorgonjs/gorgon
```

```typescript
import { useGorgon, clearGorgon } from '@gorgonjs/react';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, loading, refetch } = useGorgon(
    `user/${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    60 * 1000
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## Hooks and Components

### useGorgon hook

```typescript
const { data, error, loading, refetch } = useGorgon<R>(
  key: string,
  asyncFunc: () => Promise<R>,
  policy?: GorgonPolicyInput,
  options?: { debug?: boolean }
);
```

Returns:
- `data: R | null` — resolved data, null while loading
- `error: Error | null` — error if the async function threw
- `loading: boolean` — true while fetching
- `refetch(opts?: { clearKey?: string }): void` — clears cache key and re-fetches

The hook re-fetches when `key` changes. Include all dynamic parameters in the key.

### clearGorgon helper

```typescript
import { clearGorgon } from '@gorgonjs/react';

clearGorgon('user/*');  // clear keys matching pattern
clearGorgon();          // clear all cached data
```

### Refetch with wildcard clearing

```typescript
const { data, refetch } = useGorgon(
  `user/${userId}`,
  () => fetchUser(userId),
  60000
);

// Clear just this key and re-fetch
const handleRefresh = () => refetch();

// Clear all user keys and re-fetch this one
const handleClearAll = () => refetch({ clearKey: 'user/*' });
```

## React-Specific Patterns

### Typed data fetching in components

```typescript
import { useGorgon } from '@gorgonjs/react';

interface Todo { id: number; title: string; completed: boolean; }

function TodoItem({ id }: { id: number }) {
  const { data, loading } = useGorgon<Todo>(
    `todo/${id}`,
    () => fetch(`/api/todos/${id}`).then(r => r.json()),
    30000
  );

  if (loading || !data) return <span>Loading...</span>;
  return <span>{data.title}</span>;
}
```

### Invalidate on mutation

```typescript
function EditUser({ userId }: { userId: string }) {
  const { data, refetch } = useGorgon(
    `user/${userId}`,
    () => fetchUser(userId),
    60000
  );

  const handleSave = async (formData: UserUpdate) => {
    await updateUser(userId, formData);
    refetch(); // clears cache and re-renders with fresh data
  };

  return <UserForm data={data} onSave={handleSave} />;
}
```

### DIY minimal hook (without @gorgonjs/react)

```typescript
import { useState, useEffect } from 'react';
import Gorgon, { GorgonPolicyInput } from '@gorgonjs/gorgon';

function useGorgon<R>(
  key: string,
  asyncFunc: () => Promise<R>,
  policy?: GorgonPolicyInput
): R | null {
  const [data, setData] = useState<R | null>(null);

  useEffect(() => {
    let mounted = true;
    Gorgon.get(key, asyncFunc, policy)
      .then(result => { if (mounted) setData(result); })
      .catch(err => console.error('Gorgon error', err));
    return () => { mounted = false; };
  }, [key]);

  return data;
}
```

## Common Mistakes

### CRITICAL Not including all dynamic params in the cache key

Wrong:

```typescript
const { data } = useGorgon('user-profile', () => fetchUser(userId), 60000);
```

Correct:

```typescript
const { data } = useGorgon(`user/${userId}`, () => fetchUser(userId), 60000);
```

`useGorgon` re-fetches when the key changes. If dynamic parameters are not in the key, changing `userId` returns stale data from the previous user.

Source: documentation — react

### HIGH Using Gorgon.clear directly instead of refetch

Wrong:

```typescript
const { data } = useGorgon('user/1', fetchUser, 60000);
const handleUpdate = async () => {
  await updateUser(1, newData);
  Gorgon.clear('user/1'); // cache is cleared but component doesn't re-render
};
```

Correct:

```typescript
const { data, refetch } = useGorgon('user/1', fetchUser, 60000);
const handleUpdate = async () => {
  await updateUser(1, newData);
  refetch(); // clears cache AND triggers re-render
};
```

`Gorgon.clear()` removes the cached value but does not trigger a React re-render. Use `refetch()` from the hook to clear and re-fetch in one step.

Source: documentation — react

### HIGH Missing cleanup in DIY hooks

Wrong:

```typescript
useEffect(() => {
  Gorgon.get(key, asyncFunc, policy).then(setData);
}, [key]);
```

Correct:

```typescript
useEffect(() => {
  let mounted = true;
  Gorgon.get(key, asyncFunc, policy)
    .then(result => { if (mounted) setData(result); });
  return () => { mounted = false; };
}, [key]);
```

Without the mounted guard, setting state after unmount causes React warnings and potential bugs with rapid navigation.

Source: documentation — react

### HIGH Tension: Cache duration vs data freshness

When using `useGorgon`, the same tension from core caching applies in the UI: long TTLs show stale data to users, short TTLs cause excessive re-fetching and loading spinners. Pair appropriate TTLs with explicit `refetch()` calls on user-initiated mutations.

See also: `core/SKILL.md` § Common Mistakes

## Version

Targets @gorgonjs/react with @gorgonjs/gorgon v1.6.0.
