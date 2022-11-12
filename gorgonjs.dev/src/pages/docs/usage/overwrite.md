---
layout: ../../../layouts/Docs.astro
title: Overwrite
selectedNav: usage-overwrite
---

# Overwrite `async(key, asyncFunc, policy?)`
Overwrites the current key with the result of a function. Useful when the function used in this function is not the same as the get function e.g. a write to the database.

This does not have retry protection.

**Note:** if the function for your overwrite does not match your get you may experience issues if you do not save the same type of object data into the key.

## key `string`
The key to overwrite.

## asyncFunc `() => R`
An async function that will return a value. This function may throw an error if required.

## policy? `GorgonPolicyInput`
_see [policies](./policies)_

Optionally pass in a Date, a number of ms or a GorgonPolicy to set an expiry for your cached object. If nothing is passed the result will be cached indefinitely. 

## return `Promise<R>`
The function will return the result of the supplied async function.

## Example
```typescript
Gorgon.overwrite(`todo/${id}`, async () => {
  return fetch(`https://jsonplaceholder.typicode.com/todos/${id}?setCompleted=true`)
    .then(response => response.json());
}, 60 * 1000); // 1 minute
```
