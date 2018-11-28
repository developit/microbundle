function sealed(constructor: Function) {
	Object.seal(constructor);
	Object.seal(constructor.prototype);
}

@sealed
class Greeter {
	greeting: string;
	constructor(message: string) {
		this.greeting = message;
	}
	greet() {
		return 'Hello, ' + this.greeting;
	}
}

export default new Greeter('Hello World');
