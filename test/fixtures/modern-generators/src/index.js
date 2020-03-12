import { idMaker } from './two';

export default async function() {
	const gen = idMaker();
	return [gen.next().value, gen.next().value];
}
