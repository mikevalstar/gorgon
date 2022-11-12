---
layout: ../../../layouts/Docs.astro
title: Policies
selectedNav: usage-policies
---

# Policies
Policies let you set which provider to use and the cache length of your cached item. 

## GorgonPolicyInput Type

``` typescript
type GorgonPolicy = {
  expiry: number | Date | false;
  provider: string;
};
type GorgonPolicyInput = GorgonPolicy | number | Date;
```
