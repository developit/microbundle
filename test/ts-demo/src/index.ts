interface Driveable {
	drive(distance: number): boolean;
}

export default class Car implements Driveable {
	public drive(distance: number): boolean {
		return true;
	}
}

let ferrari = new Car();
ferrari.drive(100);
