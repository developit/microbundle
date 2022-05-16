import { obj } from './a_prop';

export default function () {
	console.log(obj.prop1);
	console.log(obj._prop2);
	console.log(obj._prop4);
	return obj;
}
