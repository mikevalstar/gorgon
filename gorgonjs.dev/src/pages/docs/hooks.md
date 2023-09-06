---
layout: ../../layouts/Docs.astro
title: Hooks
selectedNav: hooks
---

# Hooks

If you would like to hook into the caching process you can do so by adding hooks to tge Gorgon instance.

```javascript
Gorgon.addHook('clear', (input, output) => {
  console.log('Clearing cache', input);
});
```

You can use the following hooks:

- `settings`
- `addProvider`
- `put`
- `clear`
- `clearAll`
- `overwrite`
- `get`
- `valueError`

## Notes

You can add multiple hooks to a single event. They will be executed in the order they were added.
