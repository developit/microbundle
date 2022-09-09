import { obj } from './b_prop';

export default function () {
	console.log(obj.prop1);
	console.log(obj._prop2);
	return obj;
}
