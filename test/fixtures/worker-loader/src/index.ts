import WebWorker from 'web-worker:./worker';

const webWorker = new WebWorker();

webWorker.onmessage = message => message.data === 'foobar';
webWorker.postMessage('foo');
