// @flow
import { mixFruits, type Fruit } from './fruits';

const banana: Fruit = 'banana';

let milkshake = mixFruits(banana, 'raspberry');

export default milkshake;
