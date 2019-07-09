import { createMacro } from 'babel-plugin-macros';

function myMacro({ references, state, babel }) {
	const { types: t } = babel;

	references.macro.forEach(referencePath => {
		const parentPath = referencePath.findParent(t.isCallExpression);
		let variableName = referencePath.findParent(t.isVariableDeclarator).node.id
			.name;
		if (
			parentPath.node.arguments.length > 0 &&
			parentPath.node.arguments[0] !== ''
		) {
			variableName = parentPath.node.arguments[0].value;
		}
		parentPath.replaceWith(t.stringLiteral(`${variableName}-macro`));
	});
}

module.exports = createMacro(myMacro);
