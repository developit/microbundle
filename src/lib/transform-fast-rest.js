/**
 * @type {import('@babel/core')}
 */

/**
 * Transform ...rest parameters to [].slice.call(arguments,offset).
 * Demo: https://astexplorer.net/#/gist/70aaa0306db9a642171ef3e2f35df2e0/576c150f647e4936fa6960e0453a11cdc5d81f21
 * Benchmark: https://jsperf.com/rest-arguments-babel-pr-9152/4
 * @param {object} opts
 * @param {babel.template} opts.template
 * @param {babel.types} opts.types
 * @returns {babel.PluginObj}
 */
export default function fastRestTransform({ template, types: t }) {
	const slice = template`var IDENT = Array.prototype.slice;`;

	const VISITOR = {
		RestElement(path, state) {
			if (path.parentKey !== 'params') return;

			// Create a global _slice alias
			let slice = state.get('slice');
			if (!slice) {
				slice = path.scope.generateUidIdentifier('slice');
				state.set('slice', slice);
			}

			// _slice.call(arguments) or _slice.call(arguments, 1)
			const args = [t.identifier('arguments')];
			if (path.key) args.push(t.numericLiteral(path.key));
			const sliced = t.callExpression(
				t.memberExpression(t.clone(slice), t.identifier('call')),
				args,
			);

			const ident = path.node.argument;
			const binding = path.scope.getBinding(ident.name);

			if (binding.referencePaths.length !== 0) {
				// arguments access requires a non-Arrow function:
				const func = path.parentPath;
				if (t.isArrowFunctionExpression(func)) {
					func.arrowFunctionToExpression();
				}

				if (
					binding.constant &&
					binding.referencePaths.length === 1 &&
					sameArgumentsObject(binding.referencePaths[0], func, t)
				) {
					// one usage, never assigned - replace usage inline
					binding.referencePaths[0].replaceWith(sliced);
				} else {
					// unknown usage, create a binding
					const decl = t.variableDeclaration('var', [
						t.variableDeclarator(t.clone(ident), sliced),
					]);
					func.get('body').unshiftContainer('body', decl);
				}
			}

			path.remove();
		},
	};

	return {
		name: 'transform-fast-rest',
		visitor: {
			Program(path, state) {
				const childState = new Map();
				const useHelper = state.opts.helper === true; // defaults to false

				if (!useHelper) {
					let inlineHelper;
					if (state.opts.literal === false) {
						inlineHelper = template.expression.ast`Array.prototype.slice`;
					} else {
						inlineHelper = template.expression.ast`[].slice`;
					}
					childState.set('slice', inlineHelper);
				}

				path.traverse(VISITOR, childState);

				const name = childState.get('slice');
				if (name && useHelper) {
					const helper = slice({ IDENT: name });
					t.addComment(helper.declarations[0].init, 'leading', '#__PURE__');
					path.unshiftContainer('body', helper);
				}
			},
		},
	};
}

function sameArgumentsObject(node, func, t) {
	while ((node = node.parentPath)) {
		if (node === func) {
			return true;
		}

		if (t.isFunction(node) && !t.isArrowFunctionExpression(node)) {
			return false;
		}
	}

	return false;
}
