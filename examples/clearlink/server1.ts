import Gorgon from '@gorgonjs/gorgon';
import { client } from '@gorgonjs/clearlink';

console.log('Path: examples/clearlink/server1.ts');
client.connect('ws://127.0.0.1:8686');
client.apply(Gorgon);

setInterval(() => {
  Gorgon.clear('hithere');
}, 8000);
