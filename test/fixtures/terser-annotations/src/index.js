function shouldBeInlined(a, b) {
	return a + b;
}

function shouldBePreserved(a, b) {
	return a - b;
}

export default function main(a, b) {
	const inlined = /*@__INLINE__*/ shouldBeInlined(a, b);
	const preserved = /*@__NOINLINE__*/ shouldBePreserved(a, b);
	return { inlined, preserved };
}
