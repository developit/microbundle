export class MyClass {
	myFields = ['foo', 'bar'];
	async foo() {
		return this.myFields.find(item => item === 'bar');
	}
}
