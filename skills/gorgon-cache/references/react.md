# Gorgon React Integration

## Official Package: @gorgonjs/react

```bash
npm install @gorgonjs/react @gorgonjs/gorgon
```

## useGorgon Hook

The official hook provides `data`, `error`, `loading`, and `refetch`:

```typescript
import { useGorgon, clearGorgon } from '@gorgonjs/react';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, loading, refetch } = useGorgon(
    `user/${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    60 * 1000, // 1 minute cache
    { debug: false }
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => refetch()}>Refresh</button>
      <button onClick={() => refetch({ clearKey: 'user/*' })}>
        Clear all users & refresh
      </button>
    </div>
  );
}
```

### API

```typescript
const { data, error, loading, refetch } = useGorgon<R>(
  key: string,
  asyncFunc: () => Promise<R>,
  policy?: GorgonPolicyInput,
  options?: { debug?: boolean }
)
```

**Returns:**
- `data: R | null` — resolved data (null while loading)
- `error: Error | null` — error if the async function threw
- `loading: boolean` — true while fetching
- `refetch(opts?: { clearKey?: string }): void` — clears the cache key (or a custom key with wildcards) and re-fetches

### clearGorgon helper

```typescript
import { clearGorgon } from '@gorgonjs/react';

clearGorgon('user/*');  // clear specific keys
clearGorgon();          // clear all
```

## DIY: Simple useGorgon Hook

If you don't need the full package, here's a minimal version:

```typescript
import { useState, useEffect } from 'react';
import Gorgon, { GorgonPolicyInput } from '@gorgonjs/gorgon';

function useGorgon<R>(key: string, asyncFunc: () => Promise<R>, policy?: GorgonPolicyInput): R | null {
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

## Basic useEffect Pattern

For one-off usage without a custom hook:

```typescript
import { useState, useEffect } from 'react';
import Gorgon from '@gorgonjs/gorgon';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    Gorgon.get('my-key', () => fetch('/api/data').then(r => r.json()), 10000)
      .then(result => { if (mounted) setData(result); });
    return () => { mounted = false; };
  }, []);

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
```

## Common Mistakes

### CRITICAL: Not including all dynamic params in the cache key

```typescript
// Wrong — changing userId won't refetch
const { data } = useGorgon('user-profile', () => fetchUser(userId), 60000);

// Correct — key changes when userId changes, triggering refetch
const { data } = useGorgon(`user/${userId}`, () => fetchUser(userId), 60000);
```

### HIGH: Using Gorgon.clear instead of refetch

```typescript
// Wrong — cache clears but component doesn't re-render
Gorgon.clear('user/1');

// Correct — clears cache AND triggers re-render
refetch();
```

Use `refetch()` from useGorgon to clear and re-fetch in one step. `Gorgon.clear()` alone does not trigger a React re-render.

### HIGH: Missing cleanup in DIY hooks

```typescript
// Wrong — can set state after unmount
useEffect(() => {
  Gorgon.get(key, asyncFunc, policy).then(setData);
}, [key]);

// Correct — guard against unmounted state updates
useEffect(() => {
  let mounted = true;
  Gorgon.get(key, asyncFunc, policy)
    .then(result => { if (mounted) setData(result); });
  return () => { mounted = false; };
}, [key]);
```
