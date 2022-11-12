---
layout: ../../layouts/Docs.astro
title: Getting Started
selectedNav: getting-started
---

# Getting Started

## What is Gorgon.js?

Gorgon is a lightweight _9.1kb (2.8kb gzipped)_ and simple caching library focused on simplifying your caching system and reduce overall load in your application both on the frontend and the backend.

Gorgon will cache the result of any Async function or Promise in memory out of the box while also preventing concurrent calls from fast requests.

## Key Features

* **[Automated Expiry](/docs/usage/policies)** - Have your cached functions auto expire after some amount of time or on a specific date
* **[Concurrency Protection](/docs/concurrency-protection)** - Your calls will only happen once even if requested many times repeatedly
* **Promise & Async Function Support** - No need to get the data before storing the result, just await a [Gorgon.get](/docs/usage/get)
* **Frontend / Backend Support** - Works in the browser or on the server
* **[Customizable Storage Providers](/docs/custom-storage)** - Create your own storage provider to store your data somewhere other then memory
* **Typescript Support** - Type safety on your returns so you always know what you're getting back from your Gorgon.get


## Example

```typescript
import Gorgon from '@mikevalstar/gorgon';

const getTODO = async (id: number) => {
  return Gorgon.get(`todo/${id}`, async () => {
    return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
      .then(response => response.json());
  }, 60 * 1000); // 1 minute
};

const todo1 = await getTODO(1); // fetches from API
console.log(todo1);

const todo2 = await getTODO(2); // fetches from API
console.log(todo2);

const todo3 = await getTODO(1); // fetches from cache
console.log(todo3);
```
