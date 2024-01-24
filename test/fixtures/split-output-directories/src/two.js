export async function two(...args) {
	return args.reduce((total, value) => total + value, 0);
}
