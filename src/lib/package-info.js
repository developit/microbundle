import { resolve, basename } from 'path';
import { red, yellow } from 'kleur';
import { readFile, stderr, safeVariableName } from '../utils';

/** */
export async function getConfigFromPkgJson(cwd) {
	let hasPackageJson = false;
	let pkg;
	try {
		const packageJson = await readFile(resolve(cwd, 'package.json'), 'utf8');
		pkg = JSON.parse(packageJson);
		hasPackageJson = true;
	} catch (err) {
		const pkgName = basename(cwd);

		stderr(
			yellow().inverse('WARN'),
			yellow(` no package.json, assuming package name is "${pkgName}".`),
		);

		let msg = String(err.message || err);
		if (!msg.match(/ENOENT/)) stderr(`  ${red().dim(msg)}`);

		pkg = { name: pkgName };
	}

	return { hasPackageJson, pkg };
}
export function getName({ name, pkgName, amdName, cwd, hasPackageJson }) {
	if (!pkgName) {
		pkgName = basename(cwd);
		if (hasPackageJson) {
			stderr(
				yellow().inverse('WARN'),
				yellow(` missing package.json "name" field. Assuming "${pkgName}".`),
			);
		}
	}

	const finalName = name || amdName || safeVariableName(pkgName);

	return { finalName, pkgName };
}
