import { bar } from './bar';

self.onmessage = message => self.postMessage(message.data + bar());
