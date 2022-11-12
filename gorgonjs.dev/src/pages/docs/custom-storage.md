---
layout: ../../layouts/Docs.astro
title: Custom Storage Providers
selectedNav: custom-storage
---

# Custom Storage Providers

You can write your own storage provider by implementing the following interface: 

```typescript
interface IGorgonCacheProvider {
  init: () => Promise<void>;
  get: (key: string) => Promise<any>;
  set: <R>(key: string, value: R, policy: GorgonPolicySanitized) => Promise<R>;
  clear: (key?: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
}

export type GorgonPolicySanitized = {
  expiry: number | false; // time from now in ms or cache forever
  provider: string;
};
```

After you have implemented your cache provider you can add it using the [addProvider](/docs/usage/addprovider) call then either setting it as the default provider with [settings](/docs/usage/settings) or including it in your [policy](/docs/usage/policies).

```typescript
import Gorgon from '@gorgonjs/gorgon';
import myProvider from './myAwesomeProvider';

Gorgon.addProvider('my-awesome-provider', myProvider);
Gorgon.settings({defaultProvider: 'my-awesome-provider'});
```
