import { exec } from 'child_process';

export function runCommand(cmd) {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			}

			resolve(stdout || stderr);
		});
	});
}
