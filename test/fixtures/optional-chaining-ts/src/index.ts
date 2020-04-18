export function chain(test: { maybeVar?: { thing: string } }): string | undefined {
	return test.maybeVar?.thing;
}
