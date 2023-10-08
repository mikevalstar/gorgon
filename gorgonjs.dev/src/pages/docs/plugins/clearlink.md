---
layout: ../../../layouts/Docs.astro
title: Linked Cache Clearing
selectedNav: clearlink
---

# Linked Cache Clearing

When you're using Gorgon on multiple servers you may run into issues with cache invalidation. This plugin allows you to link multiple servers together and clear the cache on all servers when a cache item is cleared on one server.

This plugin can be applied multiple instances of Gorgon, allowing for a simple way to keep multiple servers in sync.

_This plugin uses the [hooks system](/docs/hooks)_

## Example Usage (Client application)

```ts
import Gorgon from '@gorgonjs/gorgon';
import { client } from '@gorgonjs/clearlink';

client.connect('ws://127.0.0.1:8686');
client.apply(Gorgon, true); // debug logging on

setInterval(() => {
  Gorgon.clear('clearthis');
}, 8000);
```

In this example `clearthis` will be cleared on all servers every 8 seconds.

## Example Usage (Server)

The server is designed to run standalone and to simply relay the messages to the clients. It is best if created simply and setup to auto restart.

```ts
import { server } from '@gorgonjs/clearlink';
server.init({ port: 8686 });
```

## Caveats & Limitations

This plugin does not currently queue up requests when the server is offline. It will simply fail to send the request. This is a planned feature, along with supporting multiple servers for additional redundancy.

Items are only cleared when manually cleared, auto cleared items (reaching their timeout) or manually replaced items (put) are not cleared. put clearing is a planned optional feature.
