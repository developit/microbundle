import { bar } from './bar';

declare const self: Worker;

self.onmessage = message => self.postMessage(message.data + bar());
