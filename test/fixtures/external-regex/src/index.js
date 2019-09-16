import custom from 'foo.custom';
import express from 'express';
import handlebars from 'handlebars';

export function bar() {
	return custom(express(handlebars()));
}
