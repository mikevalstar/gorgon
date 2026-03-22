# Custom Providers & Plugins

## Custom Storage Provider Interface

Implement `IGorgonCacheProvider` to create your own backend (e.g. Redis, IndexedDB, localStorage):

```typescript
interface IGorgonCacheProvider {
  init: () => Promise<void>;
  get: (key: string) => Promise<any>;
  set: <R>(key: string, value: R, policy: GorgonPolicySanitized) => Promise<R>;
  clear: (key?: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
}

type GorgonPolicySanitized = {
  expiry: number | false; // milliseconds from now, or false for forever
  provider: string;
};
```

### Registering a provider

```typescript
import Gorgon from '@gorgonjs/gorgon';
import myProvider from './myProvider';

Gorgon.addProvider('my-provider', myProvider);

// Use for specific keys:
Gorgon.get('key', fn, { expiry: 60000, provider: 'my-provider' });

// Or set as default:
Gorgon.settings({ defaultProvider: 'my-provider' });
```

---

## File Provider (@gorgonjs/file-provider)

Persists cache to disk as JSON files. Server-side only.

```bash
npm install @gorgonjs/file-provider @gorgonjs/gorgon
```

### Usage

```typescript
import Gorgon from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

const fileCache = FileProvider('./cache', {
  createSubfolder: true,  // creates a dated subfolder (default: true)
  clearFolder: false       // clear the cache dir on init (default: false)
});

Gorgon.addProvider('file', fileCache);

// Cache API response permanently to disk
const movie = await Gorgon.get(`movie/${id}`, async () => {
  return fetch(`https://api.example.com/movie/${id}`).then(r => r.json());
}, { provider: 'file', expiry: false });
```

### Caveats

- Uses `JSON.stringify` — only works with serializable data. For `Date`, `Set`, `Map`, etc., consider using the `superjson` library.
- Cache expiry timers are lost on process restart (the files remain but won't auto-expire). Use `createSubfolder: false` if you want persistent expiry-less caching.
- Keys are sanitized to valid filenames (non-alphanumeric chars except `-` and `/` become `_`).
- If a file write fails, the cached value is still returned in memory.

---

## ClearLink Plugin (@gorgonjs/clearlink)

Synchronizes cache clearing across multiple server instances via WebSocket.

```bash
npm install @gorgonjs/clearlink
```

### Server

```typescript
import { server } from '@gorgonjs/clearlink';

server.init({ port: 8686 });
```

### Client (on each app instance)

```typescript
import Gorgon from '@gorgonjs/gorgon';
import { client } from '@gorgonjs/clearlink';

client.connect('ws://127.0.0.1:8686');
client.apply(Gorgon, true); // second arg enables debug logging

// Now when any instance calls Gorgon.clear(), all connected instances clear too
Gorgon.clear('user/123'); // broadcasts to all instances
```

### How it works

- Hooks into Gorgon's `clear` and `clearAll` events
- Broadcasts clear messages to all connected WebSocket clients
- Prevents echo loops (the originating instance doesn't re-clear)
- Auto-reconnects after 10 seconds on disconnect

### Limitations

- Only `clear` and `clearAll` are synced (not `put` or auto-expiry)
- No message queuing when the server is offline — clears during downtime are lost
