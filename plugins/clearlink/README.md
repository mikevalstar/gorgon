# Gorgon ClearLink Plugin

This library implements a link between multiple servers using [@gorgonjs/gorgon](https://www.npmjs.com/package/@gorgonjs/gorgon), please refer to the documentation on https://gorgonjs.dev for full documentation.

Once linked clear commands from one server will be sent to all other servers. Cache invalidation across multiple servers allows you to load balance your application across multiple servers without having to worry about complicated cache invalidation.

WARNING: items are only cleared when manually cleared, auto cleared items (reaching their timeout) or manually replaced items are not cleared.

_Check out a simple example here: https://github.com/mikevalstar/gorgon/tree/main/examples/clearlink_

## Installation

    npm install @gorgonjs/file-clearlink @gorgonjs/gorgon

    yarn add @gorgonjs/file-clearlink @gorgonjs/gorgon

    pnpm add @gorgonjs/file-clearlink @gorgonjs/gorgon

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

## Limitations

This plugin does not currently queue up requests when the server is offline. It will simply fail to send the request. This is a planned feature, along with supporting multiple servers for additional redundancy.

Items are only cleared when manually cleared, auto cleared items (reaching their timeout) or manually replaced items (put) are not cleared. put clearing is a planned optional feature.
