import { two } from './two';

export default async function(...args) {
	return [await two(...args), await two(...args)];
}

// function one() { return 'one'; }
// export default { one, two };
// export { one, two };
