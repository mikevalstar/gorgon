---
layout: ../../../layouts/Docs.astro
title: Settings
selectedNav: usage-settings
---

# Settings `(newSettings?)`
Updates the default settings 

## settings? `GorgonSettingsInput`
Optionally send in the updated settings you want Gorgon to adhere to

## return `GorgonSettings`
Returns either the current settings or if a new settings object was supplied the updated settings.

## Example
```typescript
Gorgon.settings({retry: 10000}); // set retry to 10 seconds
```

## GorgonSettingsInput Type
```typescript
type GorgonSettingsInput = {
  debug?: boolean;
  defaultProvider?: string;
  retry?: number;
}
```

## GorgonSettings Type
```typescript
type GorgonSettingsInput = {
  debug: boolean;
  defaultProvider: string;
  retry: number;
}
```
