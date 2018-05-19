import { two } from './two';

export default async function (...args) {
	/*!
	 * a comment
	 */
	return [await two(...args), await two(...args)];
}
