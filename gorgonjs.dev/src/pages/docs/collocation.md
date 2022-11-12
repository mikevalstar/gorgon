---
layout: ../../layouts/Docs.astro
title: Query Collocation
selectedNav: collocation
---

# Query Collocation

Query collocation can be a controversial topic and although we believe that collocating your queries/requests and other expensive calls to either be in the same file as the a component that calls it or next to it in the file system can greatly improve the developer experience.

[Apollo](https://apollographql-jp.com/resources/graphql-glossary/#query-colocation) describes the benefit as _"Jumping directly to the query and keeping the component in sync with its data dependencies is a pleasure."_

Gorgon can simplify this strategy of collocation by overall reducing the amount of code required to cache, invalidate, and retrieve your cache into a single command.

```typescript
import Gorgon from '@mikevalstar/gorgon';

const getTODO = async (id: number) => {
  return Gorgon.get(`todo/${id}`, async () => {
    return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
      .then(response => response.json());
  }, 60 * 1000); // 1 minute
};
```
