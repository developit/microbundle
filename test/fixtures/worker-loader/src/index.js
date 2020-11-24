const webWorker = new Worker('./worker.js', { type: 'module' });

webWorker.onmessage = message => message.data === 'foobar';
webWorker.postMessage('foo');
