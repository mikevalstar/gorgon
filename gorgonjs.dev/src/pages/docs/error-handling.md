---
layout: ../../layouts/Docs.astro
title: Error Handling
selectedNav: error-handling
---

# Error Handling

When you're caching an async function an error can of course happen inside the function, 
a HTTPS call fails, a database call times out, or maybe you've just decided to throw an error?

When an error happens the call will only happen once but all instances will receive a thrown copy of the error.

## Why Not Retry on Error?

When requesting from a api, a database or most other sources if it returns an error it is often broken or experiencing high load.
By not retrying requests this effectively backs off the connection and reduces load on the service.

## Example
In the example below the async function will only be called 3 times, once for each id passed to main.

```typescript
import Gorgon from './index';

const getTODO = async (id: number) => {
  return Gorgon.get(`todo/${id}`, async () => {
    console.info('Looking up todo: ' + id);
    // Wait {id} seconds to simulate a slow & broken API
    await new Promise(resolve => setTimeout(resolve, 1000 * id));
    throw new Error('API is down for ' + id);
  }, 60 * 1000); // 1 minute
};

const main = async (id: number) => {

  try{
    const todo1 = await getTODO(id);
    console.info('TODO returned successfully', todo1);
  }catch(e){
    console.error(e.message);
  }

};

main(3);
main(1);
main(2);
main(2);
main(1);

/* Output:
Looking up todo: 3
Looking up todo: 1
Looking up todo: 2
API is down for 1 // after 1 seconds
API is down for 1 // after 1 seconds
API is down for 2 // after 2 seconds
API is down for 2 // after 2 seconds
API is down for 3 // after 3 seconds
*/
```
