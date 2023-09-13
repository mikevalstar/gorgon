import type Gorgon from '@gorgonjs/gorgon';
import WebSocket from 'ws';

let connection = null as WebSocket | null;
let gorg = null as typeof Gorgon | null;

const client = {
  connect: (connectionString: string, options?: WebSocket.ClientOptions) => {
    connection = new WebSocket(connectionString, options);
    connection.on('error', console.error);
    connection.on('close', () => {
      console.log('server closed reconnecting in 10 seconds...');
      setTimeout(() => {
        client.connect(connectionString, options);
      }, 10000);
    });
    connection.on('message', (data: string) => {
      console.log('received: %s %s', data);
      if (data.slice(0, 6).toString() === 'clear:') {
        gorg.clear(data.slice(6), undefined, 'clearlink');
      } else if (data.toString() === 'clearAll') {
        gorg.clearAll(undefined, 'clearlink');
      }
    });
  },
  apply: (gorgon: typeof Gorgon) => {
    gorg = gorgon;

    gorgon.addHook('clear', (key, input, output) => {
      if (connection && input.identifier !== 'clearlink') {
        connection.send('clear:' + input.key);
      }
    });

    gorgon.addHook('clearAll', (key, input, output) => {
      if (connection && input.identifier !== 'clearlink') {
        connection.send('clearAll');
      }
    });
  },
};

export default client;
