declare module 'worker-loader:*' {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}
