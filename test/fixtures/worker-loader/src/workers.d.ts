// https://github.com/darionco/rollup-typescript-webworkers/blob/master/workers.d.ts
declare module 'web-worker:*' {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}
