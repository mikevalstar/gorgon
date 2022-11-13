---
layout: ../../../layouts/Docs.astro
title: React
selectedNav: ui-react
---

# React
_[View examples on github](https://github.com/mikevalstar/gorgon/tree/main/examples/react)_

With react you can often use the same components on different pages and you may reload those pages many times while the user is moving around your app or website. This will often mean that you either need to use Context or Redux to store your state. This is not always necessary and can be a bit of a hassle to setup. Gorgon provides a simple way to store your state in a global store that can be accessed from anywhere in your app.

This allows you to [collocate](../collocation.md) your queries and mutations within your components and use them without having to worry about passing props around.

Below we have:
- [Official Package](#official-package)
- [Basic Usage](#basic-usage)
- [Simple Custom Hook Example](#simple-custom-hook-example)
- [Fully Featured useGorgon Hook](#fully-featured-usegorgon-hook)

## Official Package
The official package for react is [`@gorgonjs/react`](https://www.npmjs.com/package/@gorgonjs/react) and can be installed with `npm i @gorgonjs/react`, `yarn add @gorgonjs/react` or `pnpm add @gorgonjs/react`.

The package works the same as is defined in the below [useGorgon Hook](#fully-featured-usegorgon-hook)

Additional documentation will be coming soon.

## Basic Usage

Given a simple aysnc function that calls a remote API:

```tsx
// This is your function you want to cache
const getDetails = async ():Promise<{title: string, fetchedDate: Date}> => {
  // wait 3 seconds to simulate a slow request
  await new Promise(resolve => setTimeout(resolve, 3000));
  // this function fetched the API data, we dont want to spam this API
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await response.json();
  data.fetchedDate = new Date();
  // Helper for debugging purposes
  console.info('Fetched from API');
  return data;
};
```

We can build a simple useEffect hook to call this function and cache the result:

```tsx
export default function SimpleExample() {

  const [jsonData, setJsonData] = useState<any>(false);

  useEffect( () => {
    let isStillMounted = true;

    Gorgon.get('todos_simpleexample', getDetails, 10000)
      .then(async (data) => {
        if(isStillMounted){
          console.log('Gorgon returned the json data', data);
          setJsonData(await data);
        }
      });

    return () => {
      isStillMounted = false;
    }
  }, []);

  return <div>
    <h2>Simple Example</h2>
    <div className='example-containers'>
      <ul>
        <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
        <li>🕰️ Fetched data at: {jsonData && jsonData.fetchedDate.toString()}</li>
        <li>⏲️ Rendered at: {(new Date()).toString()}</li>
      </ul>
    </div>
  </div>;
};
```
## Simple Custom Hook Example

However the above is a lot of boilerplate code, so we can create a custom hook to simplify this:

```typescript
import { useState, useEffect } from "react";
import Gorgon, {GorgonPolicyInput} from '@gorgonjs/gorgon';

export default function useGorgon <R>(key: string, asyncFunc: () => Promise<R>, policy?: GorgonPolicyInput ): R | null {
  const [jsonData, setJsonData] = useState<null | R>(null);

  useEffect( () => {
    let isStillMounted = true;

    Gorgon.get(key, asyncFunc, policy)
      .then(async (data) => {
        if(isStillMounted){
          console.info('Gorgon returned the json data', data);
          setJsonData(await data);
        }
      }).catch(
        (err) => {
          console.error('Gorgon error', err);
        }
      );

    return () => {
      isStillMounted = false;
    }
  }, [key]);

  return jsonData;
}
```

And use it in our component:

```tsx
// A simple component that fetches data from an API and displays it
export default function SimpleExample() {

  const jsonData = useGorgonSimple('todos_usesimpleexample', getDetails, 10000);

  return <div>
    <h2>Simple useGorgon Example</h2>
    <div className='example-containers'>
      <ul>
        <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
        <li>🕰️ Fetched data at: {jsonData && jsonData.fetchedDate.toString()}</li>
        <li>⏲️ Rendered at: {(new Date()).toString()}</li>
      </ul>
    </div>
  </div>;
};
```

##  Fully Featured useGorgon Hook

```typescript
import { useState, useEffect } from "react";
import Gorgon, {GorgonPolicyInput} from '@gorgonjs/gorgon';

type UseGorgonOptions = {
  debug?: boolean;
};

const defaultOptions = {
  debug: false
} as UseGorgonOptions;

export default function useGorgon <R>(key: string, asyncFunc: () => Promise<R>, policy?: GorgonPolicyInput, options?:UseGorgonOptions) {
  const [data, setData] = useState<null | R>(null);
  const [error, setError] = useState<null | Error>(null);
  const [loading, setLoading] = useState(false);
  const [refetchCount, setRefetchCount] = useState(0);

  const opts = Object.assign({}, defaultOptions, options);

  useEffect(() => {
    let isStillMounted = true;
    setLoading(true);

    Gorgon.get(key, asyncFunc, policy)
      .then(async (returnedData) => {
        if(isStillMounted){
          if(opts.debug) console.info('Gorgon returned the data from the function', returnedData);
          setData(await returnedData);
          setError(null);
          setLoading(false);
        }
      }).catch(
        (err) => {
          if(opts.debug) console.error('Gorgon error', err);
          if(isStillMounted){
            setError(err);
            setLoading(false);
          }
        }
      );

    return () => {
      isStillMounted = false;
    }
  }, [key, refetchCount]);

  const refetch = ({clearKey}:{clearKey?: string} = {}) => {
    Gorgon.clear(clearKey || key);
    setRefetchCount(refetchCount + 1);
  }

  return {data, error, loading, refetch};
}
```

And use it in your components like so:

```tsx
import { useEffect, useState } from 'react';
import useGorgon from '../lib/useGorgon';

// A simple component that fetches data from an API and displays it
export default function UseGorgonExample() {

  const [fetchUrl , setFetchUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');

  const {data: jsonData, error, loading, refetch} = useGorgon(
    'todos_useGorgon' + fetchUrl,
    () => { return getDetails(fetchUrl); },
    10000,
    {debug: true}
  );

  if(loading) return <div>Loading...</div>;

  return <div>
    <h2>Fully built useGorgon Example</h2>
    <div className='example-containers'>
      {error && <div>Error: {error.message}</div>}
      <ul>
        <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
        <li>🕰️ Fetched data at: {jsonData && jsonData.fetchedDate.toString()}</li>
        <li>⏲️ Rendered at: {(new Date()).toString()}</li>
      </ul>
      <button onClick={() => {setFetchUrl('http://badurl.cccccc')}}>Force error state</button>
      <button onClick={() => {setFetchUrl('https://jsonplaceholder.typicode.com/todos/1')}}>Good Url</button>
      <button onClick={() => { refetch(); } }>Force refetch</button>
    </div>
  </div>;
};
```
