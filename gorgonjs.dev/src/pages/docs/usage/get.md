---
layout: ../../../layouts/Docs.astro
title: Get
selectedNav: usage-get
---

# Get `async(key, asyncFunc, policy?)`

Both gets and sets the cache for a given key.

## key `string`
A string representation of your cache key. 

We recommend a format of `cachetype/{id}/{sub-id}` to assist when [clearing](./clear) the cache using wild cards

## asyncFunc `() => R`
An async function that will return a value. This function may throw an error if required and Gorgon will rethrow it to all requesters.

## policy? `GorgonPolicyInput`
_see [policies](./policies)_

Optionally pass in a Date, a number of ms or a GorgonPolicy to set an expiry for your cached object. If nothing is passed the result will be cached indefinitely. 

## return `Promise<R>`
The function will return the result of the supplied async function.

## Example

```typescript
Gorgon.get(`todo/${id}/${currentUserId}`, async () => {
  return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
    .then(response => response.json());
}, 60 * 1000); // 1 minute
```
