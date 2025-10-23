// Test debug format with meaningful variable names and modern syntax
export async function fetchUserData(userId) {
	const response = await fetch(`/api/users/${userId}`);
	const userData = await response.json();
	return userData;
}

export const createGreeting = (name, age) => {
	const greeting = `Hello, ${name}! You are ${age} years old.`;
	return greeting;
};

export class UserManager {
	constructor(initialUsers = []) {
		this.users = initialUsers;
		this.count = initialUsers.length;
	}

	addUser(user) {
		this.users.push(user);
		this.count++;
	}

	async loadUsers() {
		const allUsers = await Promise.all(
			this.users.map(u => fetchUserData(u.id)),
		);
		return allUsers;
	}
}
