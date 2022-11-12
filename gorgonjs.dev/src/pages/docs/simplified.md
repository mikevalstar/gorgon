---
layout: ../../layouts/Docs.astro
title: Caching Simplified
selectedNav: simplified
---

# Caching Simplified
Most projects with even a moderate amount of load can benefit from caching, many libraries already build this in for you or provide an additional package. Apollo, React Query, Prisma and many others have their own forms of caching you can use with those solutions. 

However these solutions tend to be tied into an ecosystem you may not be using and/or are tightly coupled to the system they are interacting with. 

e.g. prisma-redis-middleware does not offer a way to manually invalidate a cache should your database be updated externally. Apollo requires that you're using a graphql backend. 

> There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors.
> <cite>Phil Karlton</cite>

## Standard Approaches
A standard approach to writing a simple cache for your application be something like this:

```javascript
// file concerts.ts
let concertCache = {} as Record<string, any>;

const concertsGet = async (artist: string) => {
  if(concertCache[artist]){
    return concertCache[artist];
  }

  const concertDetails = await fetch(`https://example.com/concerts/${artist}`);
  concertCache[artist] = concertDetails;
  return concertDetails;
};

const concertsAdd = async (artist: string, concerts: any[]) => {
  const concertDetails = await getConcerts(artist);
  concertDetails.push(...concerts);
  const newConcertDetails = await fetch(`https://example.com/concerts/${artist}`, {
    method: 'POST',
    body: JSON.stringify(concertDetails),
  });
  delete concertCache[artist];
}

const concertsInvalidate = async (artist?: string) => {
  if(artist){
    delete concertCache[artist];
  }else{
    concertCache = {};
  }
};

export { concertsGet, concertsAdd, concertsInvalidate };
```

The above solution will work in many situations but it will have issues scaling, if a single artist is super popular and gets a sudden spike of requests you can end up with a concurrency problem overwhelming the server. Additionally this cache doesn't expire until the application is restarted (frontend or backend) so may become stale if the API updates without your knowledge.

So lets fix that with a standard lock and a cache expiry: (_note: we dont properly case in for error or edge cases in this example, please don't use this example_)

```javascript
// file concerts.ts
let concertCache = {} as Record<string, {expiryTimeout:number, data: any}>;
let concertCacheLocks = {} as Record<string, boolean>;

const concertsGet = async (artist: string) => {
  if(concertCache[artist]){
    return concertCache[artist].data;
  }

  // Standard lock pattern
  if(concertCacheLocks[artist]){
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if(!concertCacheLocks[artist]){
          clearInterval(interval);
          resolve(concertsGet(artist));
        }
      }, 100); // expected time for the lock to be released so we dont overwhelm the loop
    });
  }

  concertCacheLocks[artist] = true;
  const concertDetails = await fetch(`https://example.com/concerts/${artist}`).then(r => r.json());;
  concertCacheLocks[artist] = false;
  concertCache[artist] = {
    data: concertDetails,
    expiryTimeout: setTimeout(() => {
      delete concertCache[artist];
    }, 1000 * 60 * 60) // 1 hour
  };
  return concertDetails;
};

const concertsAdd = async (artist: string, concerts: any[]) => {
  const concertDetails = await concertsGet(artist);
  concertDetails.push(...concerts);
  await fetch(`https://example.com/concerts/${artist}`, {
    method: 'POST',
    body: JSON.stringify(concertDetails),
  });

  if(concertCache[artist]){
    clearTimeout(concertCache[artist].expiryTimeout);
    concertCacheLocks[artist] = false;
  }
  delete concertCache[artist];
}

const concertsInvalidate = async (artist?: string) => {
  if(artist){
    if(concertCache[artist]){
      clearTimeout(concertCache[artist].expiryTimeout);
    }
    delete concertCache[artist];
  }else{
    concertCache = {};
    concertCacheLocks = {};
  }
};

export { concertsGet, concertsAdd, concertsInvalidate };
```

Thats a lot of boilerplate for every object you want to cache!

## Gorgon

Lets see how we can simplify this with Gorgon: 

```javascript
// file concerts.ts
import Gorgon from '@mikevalstar/gorgon';

const concertsGet = async (artist: string) => {
  return Gorgon.get(`concerts/${artist}`, async ():Promise<Array<any>> => {
    return fetch(`https://example.com/concerts/${artist}`)
      .then(r => r.json());
  }, 1000 * 60 * 60) // 1 hour
};

const concertsAdd = async (artist: string, concerts: any[]) => {
  const concertDetails = await concertsGet(artist);
  concertDetails.push(...concerts);

  await fetch(`https://example.com/concerts/${artist}`, {
    method: 'POST',
    body: JSON.stringify(concertDetails),
  });

  Gorgon.clear(`concerts/${artist}`);
}

const concertsInvalidate = async (artist?: string) => {
  if (artist) {
    Gorgon.clear(`concerts/${artist}`);
  } else {
    Gorgon.clear(`concerts/*`);
  }
};

export { concertsGet, concertsAdd, concertsInvalidate };
```

And with this example you get: Built in error handling, concurrency protection, and a centralized caching solution for your application.

### Additional Notes

The above standard approach is just one of many e.g. another possibility is to prefill the cache with all the data on application boot, then replace the data on a timer.

Most of the approaches we have used over the years can work but each has it's pros and cons. Gorgon attempts to provide you with all of the tools needed to simplify both real-time and pre-caching, as well as distributed caching and local caching. 
