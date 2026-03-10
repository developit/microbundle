/**
 * Fixture for minify.format options in package.json:
 * - ascii_only: true  → Unicode (你好👋) escaped as \uXXXX
 * - quote_style: 1    → single quotes in output
 * - safari10: true   → Safari 10/11 compatible output
 */
console.log("你好👋");

export default function add(a, b) {
	return a + b;
}
