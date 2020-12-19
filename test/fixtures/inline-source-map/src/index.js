import { two } from './two';

export default async function(...args) {
	return [await two(...args), await two(...args)];
}
