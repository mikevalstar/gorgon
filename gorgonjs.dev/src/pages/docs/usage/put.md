---
layout: ../../../layouts/Docs.astro
title: Put
selectedNav: usage-put
---

# Put `async(key, value, policy?)`
Inserts an object into the cache

## key `string`
A string representation of your cache key. 

We recommend a format of `cachetype/{id}/{sub-id}` to assist when [clearing](/docs/usage/clear) the cache using wild cards

## value `R`
The value to store

## policy? `GorgonPolicyInput`
_see [policies](/docs/usage/policies)_

Optionally pass in a Date, a number of ms or a GorgonPolicy to set an expiry for your cached object. If nothing is passed the result will be cached indefinitely. 

## return `Promise<R>`
Returns a thenable of the inserted object. Useful for waiting for the cache to fill if it's an async storage medium.

## Example

```typescript
Gorgon.put(`todo/${id}/${currentUserId}`, [
  {item: 'something'}
], 60 * 1000); // 1 minute
```
