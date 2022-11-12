---
layout: ../../../layouts/Docs.astro
title: AddProvider
selectedNav: usage-addprovider
---

# AddProvider `(name, provider)`
Adds anew provider to the Gorgon for use with caching

## name `string`
Name of the provider

## provider `IGorgonCacheProvider`
Your storage provider, see [Custom Storage Providers](/docs/custom-storage) for further instructions.

## return
void

## Example
```typescript
import Gorgon from '@mikevalstar/gorgon';
import myProvider from './myAwesomeProvider';

Gorgon.addProvider('my-awesome-provider', myProvider);
Gorgon.settings({defaultProvider: 'my-awesome-provider'});
```

## IGorgonCacheProvider Type
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
