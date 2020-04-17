// @flow
export type Fruit = 'cherry' | 'banana' | 'raspberry';

export function mixFruits(fruit1: Fruit, fruit2: Fruit): Array<Fruit> {
	return [fruit1, fruit2];
}
