import t from 'some_pkg';
import custom from 'some_pkg/foo.custom';
import express from 'express';
import handlebars from 'handlebars';

export function bar() {
	return t(custom(express(handlebars())));
}
