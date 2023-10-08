import WebSocket, { WebSocketServer, ServerOptions } from 'ws';

const server = {
  init: (options: ServerOptions) => {
    const wss = new WebSocketServer(options);

    wss.on('connection', function connection(ws) {
      ws.on('error', console.error);

      ws.on('message', function message(data) {
        console.log('received: %s', data);

        wss.clients.forEach(function each(client) {
          // Send to all open connections except itself
          if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(data);
          }
        });
      });
    });
  },
};

export default server;
