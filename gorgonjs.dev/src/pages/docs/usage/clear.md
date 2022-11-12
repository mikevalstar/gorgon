---
layout: ../../../layouts/Docs.astro
title: Clear
selectedNav: usage-clear
---

# Clear `async(key, provider?)`
Clears the cache for a given key for teh given provider. Supports wildcards.

## key `string`
A string representation of your cache key. Supports wildcards `*`.

## provider? `string`
The name of the provider. By default it will use the default provider.

## returns `boolean | boolean[]`
Returns true if found and removed, false if not found or there was an error clearing the item. 

Will only return an array if a wildcard is supplied to the clear statement.

## Example `boolean`

```typescript
Gorgon.put(`todo/${id}/*`);
```
