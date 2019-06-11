function test(param = throw new Error('required!')) {
	return param === true || throw new Error('Falsey!');
}

test(true);
test(false);
