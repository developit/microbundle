export default async function foo() {
	const out = [];
	for await (const item of [1, 2]) {
		out.push(item);
	}

	return out;
}

foo().then(console.log);
