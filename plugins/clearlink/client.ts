import type Gorgon from '@gorgonjs/gorgon';
import WebSocket from 'ws';

let connection = null as WebSocket | null;
let gorg = null as typeof Gorgon | null;
let debug = false;

const client = {
  connect: (connectionString: string, options?: WebSocket.ClientOptions) => {
    connection = new WebSocket(connectionString, options);
    connection.on('error', (...args) => {
      console.error('Gorgon ClearLink: lost connection: ', ...args);
    });
    connection.on('close', () => {
      console.warn('Gorgon ClearLink: server closed reconnecting in 10 seconds...');
      setTimeout(() => {
        client.connect(connectionString, options);
      }, 10000);
    });
    connection.on('open', () => {
      console.info('Gorgon ClearLink: connected so server: ', connectionString);
    });
    connection.on('message', (data: string) => {
      if (debug) {
        console.info('Gorgon ClearLink: received: %s %s', data);
      }

      if (!gorg) {
        // Not applied yet
        return;
      }
      if (data.slice(0, 6).toString() === 'clear:') {
        gorg.clear(data.slice(6), undefined, 'clearlink');
      } else if (data.toString() === 'clearAll') {
        gorg.clearAll(undefined, 'clearlink');
      }
    });
  },
  apply: (gorgon: typeof Gorgon, debugLogging = false) => {
    gorg = gorgon;
    debug = debugLogging;

    if (debug) {
      console.info('Gorgon ClearLink: applied');
      console.info('Gorgon ClearLink: debug logging enabled');
    }

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
