import {
	parseMappingArgument,
	toReplacementExpression,
} from '../src/lib/option-normalization';

describe('mapping arguments', () => {
	it.each([
		['TOKEN=abc==', { TOKEN: 'abc==' }],
		[
			'URL=https://example.test/?key=value=tail',
			{ URL: 'https://example.test/?key=value=tail' },
		],
		['VALUE==', { VALUE: '=' }],
		[
			'VALUE=first=second\nthird=fourth',
			{ VALUE: 'first=second\nthird=fourth' },
		],
	])('preserves equals signs in %s', (input, expected) => {
		expect(parseMappingArgument(input)).toEqual(expected);
	});

	it.each([
		['TOKEN=abc==', { TOKEN: '"abc=="' }],
		["TOKEN='abc=='", { TOKEN: '"abc=="' }],
		['TOKEN="abc=="', { TOKEN: '"abc=="' }],
		['@IS_EQUAL=1===1', { IS_EQUAL: '1===1' }],
		['@INCREMENT=value=>value+1', { INCREMENT: 'value=>value+1' }],
	])('preserves define values in %s', (input, expected) => {
		expect(parseMappingArgument(input, toReplacementExpression)).toEqual(
			expected,
		);
	});

	it('keeps neighboring definitions and literal conversion', () => {
		expect(
			parseMappingArgument(
				'A=true,TOKEN=abc==,B=42,C=false',
				toReplacementExpression,
			),
		).toEqual({ A: 'true', TOKEN: '"abc=="', B: '42', C: 'false' });
	});

	it('keeps empty and missing values distinct', () => {
		expect(parseMappingArgument('EMPTY=,MISSING')).toEqual({
			EMPTY: '',
			MISSING: undefined,
		});
	});

	it('passes the complete value and key to the processor', () => {
		const process = jest.fn((value, key) => [
			value.toUpperCase(),
			key.toLowerCase(),
		]);
		expect(parseMappingArgument('TOKEN=abc==', process)).toEqual({
			token: 'ABC==',
		});
		expect(process).toHaveBeenCalledWith('abc==', 'TOKEN');
	});
});
