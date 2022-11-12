---
layout: ../../layouts/Docs.astro
title: Retry Thresholds
selectedNav: retry
---

# Retry Thresholds

Both globally and on a per request basis you can set a retry threshold that once a function/promise has reached that threshold the next request will run the promise again. You can set the default value with [settings](/docs/usage/settings) or including it in your [policy](/docs/usage/policies).

```typescript
import Gorgon from '@gorgonjs/gorgon';

Gorgon.settings({retry: 5000}); // 5 Seconds (default)
```
